import User from "../models/User.js";

/* ======================================================
   1. GET USER PROFILE
   Route: GET /api/user/profile
   Description: Returns user info, formatted primary address, AND full address list
====================================================== */
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Logic: Find the default address, or grab the last added one (Most Recent)
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

      // 👇 Full list for "Manage Addresses" tab
      addresses: user.addresses || [],

      // 👇 Formatted primary address for "Profile Settings" tab
      address: {
        name: primaryAddress.fullName || "", // Specific Receiver Name
        phone: primaryAddress.phone || "", // Specific Receiver Phone
        street: primaryAddress.addressLine || "",
        city: primaryAddress.city || "",
        pincode: primaryAddress.pincode || "",
        state: primaryAddress.state || "",
        country: primaryAddress.country || "India",
        type: primaryAddress.type || "Home",
      },
    });
  } catch (error) {
    console.error("GET PROFILE ERROR:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

/* ======================================================
   2. UPDATE USER PROFILE (Main Profile Info)
   Route: PUT /api/user/profile
   Description: Updates Name, Phone, Picture, AND Primary Address
====================================================== */
/* ======================================================
   2. UPDATE USER PROFILE (Main Profile Info + Primary Address)
   Route: PUT /api/user/profile
====================================================== */
/* ======================================================
   2. UPDATE USER PROFILE
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
      const { street, city, pincode, state, name, phone, type } = req.body.address;

      const hasValidAddress = street?.trim() && city?.trim() && pincode?.trim();

      if (hasValidAddress) {
        // A. Find the address to update (The Default one, or the first one)
        let targetAddress = user.addresses.find((a) => a.isDefault);
        
        if (!targetAddress && user.addresses.length > 0) {
          targetAddress = user.addresses[0]; // Fallback to first if no default
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
          user.addresses.forEach(a => a.isDefault = false); // Reset others
          targetAddress.isDefault = true; // Set this one
          
        } else {
          // C. CREATE NEW (Only if list is empty)
          user.addresses.push({
            fullName: name || user.name,
            phone: phone || user.phone,
            addressLine: street,
            city, pincode, state,
            country: "India",
            type: type || "Home",
            isDefault: true
          });
        }
      }
    }

    await user.save();

    // 3. Return Response
    const primaryAddr = user.addresses.find((a) => a.isDefault) || user.addresses[0] || {};

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      profilePicture: user.profilePicture,
      addresses: user.addresses, // Returns updated list without duplicates
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

    // Extract specific Name/Phone for this address, plus address fields
    const { street, city, state, pincode, country, type, name, phone } =
      req.body;

    const newAddress = {
      // Use provided name/phone, otherwise fallback to main profile info
      fullName: name || user.name,
      phone: phone || user.phone,

      addressLine: street,
      city: city,
      state: state,
      pincode: pincode,
      country: country || "India",
      type: type || "Home",

      // If this is the only address, make it default automatically
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

    // Filter out the address that matches the ID
    user.addresses = user.addresses.filter(
      (addr) => addr._id.toString() !== req.params.id
    );

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

    // Find specific sub-document
    const address = user.addresses.id(req.params.id);

    if (address) {
      // Update Name & Phone specifically for this address
      address.fullName = req.body.name || address.fullName;
      address.phone = req.body.phone || address.phone;

      // Update Address Fields
      address.addressLine = req.body.street || address.addressLine;
      address.city = req.body.city || address.city;
      address.state = req.body.state || address.state;
      address.pincode = req.body.pincode || address.pincode;
      address.country = req.body.country || address.country;
      address.type = req.body.type || address.type;

      await user.save();
      res.json(user.addresses); // Return updated list
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

    // 1. Set ALL addresses to isDefault = false
    user.addresses.forEach((addr) => {
      addr.isDefault = false;
    });

    // 2. Set the TARGET address to isDefault = true
    addressToUpdate.isDefault = true;

    await user.save();
    res.json(user.addresses); // Return updated list
  } catch (error) {
    console.error("SET DEFAULT ERROR:", error);
    res.status(500).json({ message: "Failed to set default address" });
  }
};
