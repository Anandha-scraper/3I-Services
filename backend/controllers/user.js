const userService = require('../services/user');

// Get all users (admin)
exports.getAll = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get user by ID (admin)
exports.getById = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ message: 'User ID required' });

    const user = await userService.findByUserId(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    delete user.password;
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete user (admin)
exports.delete = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ message: 'User ID required' });

    await userService.deleteUser(userId);
    res.status(200).json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await userService.findByUserId(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    delete user.password;
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
