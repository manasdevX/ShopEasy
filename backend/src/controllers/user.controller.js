import User from "../models/User.js";
import Cart from "../models/Cart.js";
import redisClient from "../config/redis.js"; // <--- IMPORT REDIS
import mongoose from "mongoose";

/**
 * Helper: Clear User Profile Cache
 * Call this whenever user data (info, address, wishlist) is modified.
 */
const clearUserCache = async (userId) => {
  try {
    await redisClient.del(`user_profile:${userId}`);
    console.log(`🧹 Cache Cleared for User: ${userId}`);
  } catch (error) {
    console.error("Cache Clear Error:", error);
  }
};

/**
 * 🟢 NEW EXPORT: Track User Interest (Called by Route)
 */
export const trackUserInterestRoute = async (req, res) => {
  try {
    const { category, productId } = req.body;
    const userId = req.user._id;

    if (!category) return res.status(400).json({ message: "Category is required" });

    // Call the logic below
    await trackUserInterest(userId, category, productId);

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Tracking failed" });
  }
};

/**
 * Helper: AI Interest Tracker (Level 1)
 * MODIFIED: Increased weights and added recency shuffling for instant impact
 */
const trackUserInterest = async (userId, category, productId) => {
  try {
    const user = await User.findById(userId);
    if (!user || !category) return;

    if (!user.recentlyViewed) user.recentlyViewed = [];
    if (!user.interests) user.interests = [];

    // 1. Update Recently Viewed (Limit to 10)
    if (productId && !user.recentlyViewed.map(id => id.toString()).includes(productId.toString())) {
      user.recentlyViewed.unshift(productId);
      if (user.recentlyViewed.length > 10) user.recentlyViewed.pop();
    }

    // 2. Update Category Weights
    const interestIndex = user.interests.findIndex(
      (i) => i.category.toLowerCase() === category.toLowerCase()
    );

    if (interestIndex > -1) {
      // ✅ INCREASED WEIGHT: Set to 3.0 for strong impact
      user.interests[interestIndex].weight += 3.0; 
      user.interests[interestIndex].lastInteracted = Date.now();
      
      // ✅ RECENCY BIAS: Move to the front of the array so getAiRecommendations sees it first
      const updatedInterest = user.interests.splice(interestIndex, 1)[0];
      user.interests.unshift(updatedInterest);
    } else {
      // ✅ HIGH INITIAL WEIGHT for new discovery
      user.interests.unshift({ 
        category, 
        weight: 3.0, 
        lastInteracted: Date.now() 
      });
    }

    // 3. Keep interests array lean
    if (user.interests.length > 15) user.interests.pop();

    await user.save();
    
    // Invalidate caches
    await redisClient.del(`user_profile:${userId}`);
    await redisClient.del(`recommendations:${userId}`); 
    
    console.log(`🚀 AI Updated: Boosted category "${category}" for User ${userId}`);
  } catch (error) {
    console.error("AI Tracking Error:", error);
  }
};

/* ======================================================
   1. GET USER PROFILE (Info + Addresses + Wishlist)
   Route: GET /api/user/profile
====================================================== */
export const getUserProfile = async (req, res) => {
  try {
    const cacheKey = `user_profile:${req.user._id}`;

    // 1. Check Redis Cache
    const cachedProfile = await redisClient.get(cacheKey);
    if (cachedProfile) {
      console.log("⚡ Serving User Profile from Redis");
      return res.status(200).json(JSON.parse(cachedProfile));
    }

    // 2. Fetch from DB if not in Cache
    // Populate wishlist with product details for the UI cards
    const user = await User.findById(req.user._id).populate({
      path: "wishlist",
      select: "name price thumbnail category stock rating numReviews",
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Logic: Find the default address, or grab the last added one
    const primaryAddress =
      user.addresses.find((addr) => addr.isDefault) ||
      user.addresses[user.addresses.length - 1] ||
      {};

    const responseData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profilePicture: user.profilePicture,
      passwordChangedAt: user.passwordChangedAt,

      // Full list for "Manage Addresses" tab
      addresses: user.addresses || [],

      // Formatted primary address for "Profile Settings" tab
      address: {
        name: primaryAddress.fullName || "",
        phone: primaryAddress.phone || "",
        street: primaryAddress.addressLine || "",
        city: primaryAddress.city || "",
        pincode: primaryAddress.pincode || "",
        state: primaryAddress.state || "",
        country: primaryAddress.country || "India",
        type: primaryAddress.type || "Home",
      },

      // Full product objects for "My Wishlist" tab
      wishlist: user.wishlist || [],
    };

    // 3. Save to Redis (Expires in 1 hour)
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(responseData));

    res.status(200).json(responseData);
  } catch (error) {
    console.error("GET PROFILE ERROR:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

/* ======================================================
   2. UPDATE USER PROFILE (Main Info + Primary Address)
   Route: PUT /api/user/profile
   NOTE: Handles Multipart/Form-Data now
====================================================== */
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 1. Update Account Info
    user.name = req.body.name || user.name;
    user.phone = req.body.phone || user.phone;

    // 1b. Handle Profile Picture (Upload OR Remove)
    if (req.file) {
      // Case A: New file uploaded (Cloudinary URL via Multer)
      user.profilePicture = req.file.path;
    } else if (req.body.removeProfilePicture === "true") {
      // Case B: Explicit removal request from Frontend
      user.profilePicture = "";
    }

    // 2. Update Shipping Address (Strict Logic)
    if (req.body.address) {
      // PARSING FIX: FormData sends objects as strings. We must parse it.
      let addressData;
      try {
        addressData =
          typeof req.body.address === "string"
            ? JSON.parse(req.body.address)
            : req.body.address;
      } catch (err) {
        addressData = {}; // Fallback if parsing fails
      }

      const { street, city, pincode, state, name, phone, type } = addressData;

      // Only proceed if at least the basic fields are present
      const hasValidAddress = street?.trim() && city?.trim() && pincode?.trim();

      if (hasValidAddress) {
        // A. Find the address to update (Default one, or fallback to first)
        let targetAddress = user.addresses.find((a) => a.isDefault);

        if (!targetAddress && user.addresses.length > 0) {
          targetAddress = user.addresses[0];
        }

        if (targetAddress) {
          // B. UPDATE EXISTING ADDRESS
          targetAddress.fullName = name || user.name;
          targetAddress.phone = phone || user.phone;
          targetAddress.addressLine = street;
          targetAddress.city = city;
          targetAddress.pincode = pincode;
          targetAddress.state = state || "";
          targetAddress.country = "India";
          targetAddress.type = type || "Home";

          // Ensure this stays/becomes default
          user.addresses.forEach((a) => (a.isDefault = false));
          targetAddress.isDefault = true;
        } else {
          // C. CREATE NEW (Only if list is empty)
          user.addresses.push({
            fullName: name || user.name,
            phone: phone || user.phone,
            addressLine: street,
            city,
            pincode,
            state,
            country: "India",
            type: type || "Home",
            isDefault: true,
          });
        }
      }
    }

    await user.save();

    // ✅ INVALIDATE CACHE
    await clearUserCache(user._id);

    // 3. Return Response (Re-fetch primary address for consistency)
    const primaryAddr =
      user.addresses.find((a) => a.isDefault) || user.addresses[0] || {};

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      profilePicture: user.profilePicture, // Will be new URL or "" string
      addresses: user.addresses,
      address: {
        name: primaryAddr.fullName || "",
        phone: primaryAddr.phone || "",
        street: primaryAddr.addressLine || "",
        city: primaryAddr.city || "",
        pincode: primaryAddr.pincode || "",
        state: primaryAddr.state || "",
        country: primaryAddr.country || "India",
        type: primaryAddr.type || "Home",
      },
    });
  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ======================================================
   3. ADD NEW ADDRESS
   Route: POST /api/user/address
====================================================== */
export const addAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { street, city, state, pincode, country, type, name, phone } =
      req.body;

    const newAddress = {
      fullName: name || user.name,
      phone: phone || user.phone,
      addressLine: street,
      city,
      state,
      pincode,
      country: country || "India",
      type: type || "Home",
      // Make default if it's the first address
      isDefault: user.addresses.length === 0,
    };

    user.addresses.push(newAddress);
    await user.save();

    // ✅ INVALIDATE CACHE
    await clearUserCache(user._id);

    res.status(201).json(user.addresses);
  } catch (error) {
    console.error("ADD ADDRESS ERROR:", error.message);
    res.status(500).json({ message: error.message });
  }
};

/* ======================================================
   4. DELETE ADDRESS
   Route: DELETE /api/user/address/:id
====================================================== */
export const deleteAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    user.addresses = user.addresses.filter(
      (addr) => addr._id.toString() !== req.params.id
    );

    // If we deleted the default address, make the first one default (if exists)
    if (user.addresses.length > 0 && !user.addresses.some((a) => a.isDefault)) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    // ✅ INVALIDATE CACHE
    await clearUserCache(user._id);

    res.json(user.addresses);
  } catch (error) {
    console.error("DELETE ADDRESS ERROR:", error);
    res.status(500).json({ message: "Failed to delete address" });
  }
};

/* ======================================================
   5. UPDATE EXISTING ADDRESS
   Route: PUT /api/user/address/:id
====================================================== */
export const updateAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const address = user.addresses.id(req.params.id);

    if (address) {
      address.fullName = req.body.name || address.fullName;
      address.phone = req.body.phone || address.phone;
      address.addressLine = req.body.street || address.addressLine;
      address.city = req.body.city || address.city;
      address.state = req.body.state || address.state;
      address.pincode = req.body.pincode || address.pincode;
      address.country = req.body.country || address.country;
      address.type = req.body.type || address.type;

      await user.save();

      // ✅ INVALIDATE CACHE
      await clearUserCache(user._id);

      res.json(user.addresses);
    } else {
      res.status(404).json({ message: "Address not found" });
    }
  } catch (error) {
    console.error("UPDATE ADDRESS ERROR:", error);
    res.status(500).json({ message: "Failed to update address" });
  }
};

/* ======================================================
   6. SET DEFAULT ADDRESS
   Route: PUT /api/user/address/:id/default
====================================================== */
export const setDefaultAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const addressToUpdate = user.addresses.id(req.params.id);

    if (!addressToUpdate) {
      return res.status(404).json({ message: "Address not found" });
    }

    // Reset all to false, set target to true
    user.addresses.forEach((addr) => (addr.isDefault = false));
    addressToUpdate.isDefault = true;

    await user.save();

    // ✅ INVALIDATE CACHE
    await clearUserCache(user._id);

    res.json(user.addresses);
  } catch (error) {
    console.error("SET DEFAULT ERROR:", error);
    res.status(500).json({ message: "Failed to set default address" });
  }
};

/* ======================================================
   7. WISHLIST: ADD ITEM
====================================================== */
export const addToWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const productId = req.params.id;

    if (user.wishlist.includes(productId)) {
      return res.status(400).json({ message: "Product already in wishlist" });
    }

    user.wishlist.push(productId);
    await user.save();

    // 🔥 AI TRIGGER: Track interest based on the product's category
    // We fetch the product briefly to get its category
    const Product = mongoose.model("Product");
    const product = await Product.findById(productId);
    if (product) {
      await trackUserInterest(req.user._id, product.category, productId);
    }

    await clearUserCache(user._id);

    const updatedUser = await User.findById(req.user._id).populate({
      path: "wishlist",
      select: "name price thumbnail category stock",
    });

    res.json(updatedUser.wishlist);
  } catch (error) {
    res.status(500).json({ message: "Failed to add to wishlist" });
  }
};

/* ======================================================
   8. WISHLIST: REMOVE ITEM
   Route: DELETE /api/user/wishlist/:id
====================================================== */
export const removeFromWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    user.wishlist = user.wishlist.filter(
      (id) => id.toString() !== req.params.id
    );

    await user.save();

    // ✅ INVALIDATE CACHE
    await clearUserCache(user._id);

    // Return populated wishlist
    const updatedUser = await User.findById(req.user._id).populate({
      path: "wishlist",
      select: "name price thumbnail category stock",
    });

    res.json(updatedUser.wishlist);
  } catch (error) {
    console.error("REMOVE WISHLIST ERROR:", error);
    res.status(500).json({ message: "Failed to remove from wishlist" });
  }
};

/* ======================================================
   9. DELETE ACCOUNT
   Route: DELETE /api/user/profile
====================================================== */
export const deleteUserAccount = async (req, res) => {
  try {
    const userId = req.user._id;

    // Cleanup: Delete cart first
    await Cart.findOneAndDelete({ user: userId });

    // Delete user
    const deletedUser = await User.findByIdAndDelete(userId);

    if (deletedUser) {
      // ✅ INVALIDATE CACHE (Ensure no stale data remains)
      await clearUserCache(userId);
      res.json({ message: "Account deleted successfully" });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("DELETE ACCOUNT ERROR:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

/* ======================================================
   10. UPDATE PASSWORD
   Route: PUT /api/user/password
====================================================== */
export const updateUserPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Explicitly select password since 'select: false' in model
    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if current password matches using the model method
    if (await user.matchPassword(currentPassword)) {
      user.password = newPassword;
      user.passwordChangedAt = Date.now(); // Mark change time
      await user.save(); // Model hook handles hashing

      // ✅ INVALIDATE CACHE (To update passwordChangedAt timestamp)
      await clearUserCache(user._id);

      res.json({ message: "Password updated successfully" });
    } else {
      res.status(401).json({ message: "Invalid current password" });
    }
  } catch (error) {
    console.error("UPDATE PASSWORD ERROR:", error);
    res.status(500).json({ message: "Server error updating password" });
  }
};

/* ======================================================
   11. VERIFY PASSWORD (For Security Modal Step 1)
   Route: POST /api/user/verify-password
====================================================== */
export const verifyUserPassword = async (req, res) => {
  try {
    const { password } = req.body;

    // We need to explicitly select password because select:false is in the model
    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the provided password matches the DB hash
    const isMatch = await user.matchPassword(password);

    if (isMatch) {
      res.status(200).json({ message: "Password verified" });
    } else {
      res.status(401).json({ message: "Incorrect current password" });
    }
  } catch (error) {
    console.error("VERIFY PASSWORD ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ======================================================
   12. UPDATE EMAIL (Fixed & Safer)
   Route: PUT /api/user/update-email
====================================================== */
export const updateUserEmail = async (req, res) => {
  try {
    const { newEmail, password } = req.body;

    // 1. Validate Input Presence
    if (!newEmail || !password) {
      return res.status(400).json({
        message: "Please provide both new email and your current password.",
      });
    }

    // 2. Get user with password for verification
    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 3. Verify Password (Safe check)
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    // 4. Check if new email is already taken
    const emailExists = await User.findOne({ email: newEmail });
    if (emailExists) {
      return res.status(400).json({ message: "Email address already in use" });
    }

    // 5. Update Email
    user.email = newEmail;
    await user.save();

    // ✅ INVALIDATE CACHE
    await clearUserCache(user._id);

    // 6. Return updated user info
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      profilePicture: user.profilePicture,
    });
  } catch (error) {
    console.error("UPDATE EMAIL ERROR:", error);
    res.status(500).json({ message: "Server error updating email" });
  }
};
/* ======================================================
    13. AI RECOMMENDATIONS (Behavioral Only)
    Route: GET /api/user/recommendations
====================================================== */
export const getAiRecommendations = async (req, res) => {
  try {
    const user = await User.findById(req.user._id); 
    if (!user) return res.status(404).json({ message: "User not found" });

    const Product = mongoose.model("Product");

    // Recency Bias: prioritize what was just viewed or searched
    const recentCats = user.recentlyViewed?.slice(0, 3).map(p => p.category) || [];
    const interestCats = user.interests?.sort((a, b) => b.weight - a.weight).map(i => i.category) || [];

    const prioritizedCats = [...new Set([...recentCats, ...interestCats])];

    let finalSelection = [];

    if (prioritizedCats.length > 0) {
      const remainingSlots = 8;
      
      const similarProducts = await Product.find({
        category: { $in: prioritizedCats },
        _id: { $nin: user.recentlyViewed || [] },
        stock: { $gt: 0 }
      })
      .sort({ rating: -1 })
      .limit(remainingSlots + 5);

      const shuffledSimilar = similarProducts.sort(() => 0.5 - Math.random());
      finalSelection = [...shuffledSimilar].slice(0, 8);
    }

    if (finalSelection.length < 8) {
      const currentIds = finalSelection.map(p => p._id);
      const fallback = await Product.find({
        _id: { $nin: [...currentIds, ...(user.recentlyViewed || [])] },
        stock: { $gt: 0 }
      })
      .sort({ rating: -1 })
      .limit(8 - finalSelection.length);

      finalSelection = [...finalSelection, ...fallback];
    }

    res.json({
      products: finalSelection.slice(0, 8),
      personalized: prioritizedCats.length > 0
    });

  } catch (error) {
    console.error("Discovery Engine Error:", error);
    res.status(500).json({ message: "Error fetching recommendations" });
  }
};

/* ======================================================
    14. TRACK SEARCH INTENT (MODIFIED FOR INSTANT IMPACT)
    Route: POST /api/user/track-search-intent
====================================================== */
export const trackSearchIntent = async (req, res) => {
  try {
    const { query } = req.body;
    const userId = req.user._id;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({ message: "Valid search query required" });
    }

    const Product = mongoose.model("Product");

    // 1. Find the most relevant category based on the search term
    const matchingProduct = await Product.findOne({
      $or: [
        { category: { $regex: query, $options: "i" } },
        { name: { $regex: query, $options: "i" } },
      ],
    }).select("category");

    if (matchingProduct) {
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const category = matchingProduct.category;

      if (!user.interests) user.interests = [];

      const interestIndex = user.interests.findIndex(
        (i) => i.category.toLowerCase() === category.toLowerCase()
      );

      if (interestIndex > -1) {
        // ✅ INCREASED WEIGHT: Set to 3.0 (same as a click) for instant takeover
        user.interests[interestIndex].weight += 3.0;
        user.interests[interestIndex].lastInteracted = Date.now();
        
        // ✅ RECENCY SHUFFLE: Move this category to the front
        const updated = user.interests.splice(interestIndex, 1)[0];
        user.interests.unshift(updated);
      } else {
        // ✅ HIGH STARTING WEIGHT
        user.interests.unshift({
          category,
          weight: 3.0,
          lastInteracted: Date.now(),
        });
      }

      await user.save();
      
      // ✅ CLEAR CACHE: Ensure recommendations update immediately
      await clearUserCache(userId);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("SEARCH INTENT ERROR:", error);
    res.status(500).json({ message: "Failed to track search intent" });
  }
};