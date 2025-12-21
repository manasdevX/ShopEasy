import User from "../models/User.js";

/* ======================================================
   1. GET USER PROFILE
   Route: GET /api/user/profile
   Description: Returns user info + formatted address for UI
====================================================== */
export const getUserProfile = async (req, res) => {
  try {
    // req.user is already populated by the 'protect' middleware
    // We re-fetch to ensure we have the latest data
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Logic: Find the default address, or grab the first one, or return empty
    const primaryAddress =
      user.addresses.find((addr) => addr.isDefault) || user.addresses[0] || {};

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profilePicture: user.profilePicture, // Matches your User Model

      // We flatten the address object so the Frontend form can read it easily
      address: {
        street: primaryAddress.addressLine || "",
        city: primaryAddress.city || "",
        pincode: primaryAddress.pincode || "",
        state: primaryAddress.state || "",
        country: primaryAddress.country || "India",
      },
    });
  } catch (error) {
    console.error("GET PROFILE ERROR:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

/* ======================================================
   2. UPDATE USER PROFILE
   Route: PUT /api/user/profile
   Description: Updates Name, Phone, Picture, AND Address
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

    // 1. Update Basic Info
    user.name = req.body.name || user.name;
    user.phone = req.body.phone || user.phone;

    // Update Profile Picture
    if (req.body.profilePicture) {
      user.profilePicture = req.body.profilePicture;
    }

    // 2. Update Address Logic (SMARTER CHECK)
    // Only attempt to update address if valid data is sent
    if (req.body.address) {
      const { street, city, pincode, state } = req.body.address;

      // Check if the user actually provided address data (not just empty strings)
      const hasValidAddress = street?.trim() && city?.trim() && pincode?.trim();

      if (hasValidAddress) {
        const newAddressData = {
          fullName: user.name,
          phone: user.phone,
          addressLine: street,
          city: city,
          pincode: pincode,
          state: state || "India",
          country: "India",
          isDefault: true,
        };

        if (user.addresses.length > 0) {
          // Update the existing first address
          user.addresses[0].addressLine = newAddressData.addressLine;
          user.addresses[0].city = newAddressData.city;
          user.addresses[0].pincode = newAddressData.pincode;
          user.addresses[0].state = newAddressData.state;
        } else {
          // Add new address
          user.addresses.push(newAddressData);
        }
      }
    }

    // 3. Save to Database
    const updatedUser = await user.save();

    // 4. Return Updated Data
    const updatedAddress = updatedUser.addresses[0] || {};

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      profilePicture: updatedUser.profilePicture,
      role: updatedUser.role,
      address: {
        street: updatedAddress.addressLine || "",
        city: updatedAddress.city || "",
        pincode: updatedAddress.pincode || "",
        state: updatedAddress.state || "",
      },
    });
  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};
