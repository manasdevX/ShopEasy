export const getUserProfile = async (req, res) => {
  res.json(req.user);
};

export const updateUserProfile = async (req, res) => {
  const user = req.user;

  user.name = req.body.name || user.name;
  user.phone = req.body.phone || user.phone;
  user.avatar = req.body.avatar || user.avatar;

  const updatedUser = await user.save();

  res.json({
    _id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    phone: updatedUser.phone,
    avatar: updatedUser.avatar,
    role: updatedUser.role,
  });
};
