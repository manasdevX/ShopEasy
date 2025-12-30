import User from "../models/User.js";
import Cart from "../models/Cart.js";

/* ======================================================
   1. GET USER PROFILE (Info + Addresses + Wishlist)
   Route: GET /api/user/profile
====================================================== */
export const getUserProfile = async (req, res) => {
  try {
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

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profilePicture: user.profilePicture,

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
    });
  } catch (error) {
    console.error("GET PROFILE ERROR:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

/* ======================================================
   2. UPDATE USER PROFILE (Main Info + Primary Address)
   Route: PUT /api/user/profile
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
    if (req.body.profilePicture) user.profilePicture = req.body.profilePicture;

    // 2. Update Shipping Address (Strict Logic)
    if (req.body.address) {
      const { street, city, pincode, state, name, phone, type } =
        req.body.address;

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

    // 3. Return Response (Re-fetch primary address for consistency)
    const primaryAddr =
      user.addresses.find((a) => a.isDefault) || user.addresses[0] || {};

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      profilePicture: user.profilePicture,
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
    res.json(user.addresses);
  } catch (error) {
    console.error("SET DEFAULT ERROR:", error);
    res.status(500).json({ message: "Failed to set default address" });
  }
};

/* ======================================================
   7. WISHLIST: ADD ITEM
   Route: POST /api/user/wishlist/:id
====================================================== */
export const addToWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const productId = req.params.id;

    // Check duplicates
    if (user.wishlist.includes(productId)) {
      return res.status(400).json({ message: "Product already in wishlist" });
    }

    user.wishlist.push(productId);
    await user.save();

    // Return populated wishlist for immediate UI update
    const updatedUser = await User.findById(req.user._id).populate({
      path: "wishlist",
      select: "name price thumbnail category stock",
    });

    res.json(updatedUser.wishlist);
  } catch (error) {
    console.error("ADD WISHLIST ERROR:", error);
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
   Route: DELETE /api/user/delete
====================================================== */
export const deleteUserAccount = async (req, res) => {
  try {
    const userId = req.user._id;

    // Cleanup: Delete cart first
    await Cart.findOneAndDelete({ user: userId });

    // Delete user
    const deletedUser = await User.findByIdAndDelete(userId);

    if (deletedUser) {
      res.json({ message: "Account deleted successfully" });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("DELETE ACCOUNT ERROR:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
