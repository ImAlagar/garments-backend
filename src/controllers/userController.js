// controllers/userController.js
import { userService } from '../services/index.js';
import { asyncHandler } from '../utils/helpers.js';
import logger from '../utils/logger.js';

// Get all users (Admin only)
export const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, role, search } = req.query;
  
  const result = await userService.getAllUsers({
    page: parseInt(page),
    limit: parseInt(limit),
    role,
    search
  });
  
  res.status(200).json({
    success: true,
    data: result
  });
});

// Get user by ID
export const getUserById = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  const user = await userService.getUserById(userId);
  
  res.status(200).json({
    success: true,
    data: user
  });
});

// Update user profile
export const updateProfile = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const updateData = req.body;
  
  // Users can only update their own profile unless they're admin
  if (req.user.role !== 'ADMIN' && req.user.id !== userId) {
    return res.status(403).json({
      success: false,
      message: 'You can only update your own profile'
    });
  }
  
  const updatedUser = await userService.updateProfile(userId, updateData);
  
  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: updatedUser
  });
});

// Update wholesaler profile
export const updateWholesalerProfile = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const updateData = req.body;
  const files = req.files || [];
  
  // Users can only update their own profile unless they're admin
  if (req.user.role !== 'ADMIN' && req.user.id !== userId) {
    return res.status(403).json({
      success: false,
      message: 'You can only update your own profile'
    });
  }
  
  const updatedProfile = await userService.updateWholesalerProfile(userId, updateData, files);
  
  res.status(200).json({
    success: true,
    message: 'Wholesaler profile updated successfully',
    data: updatedProfile
  });
});

// Delete user (Admin only)
export const deleteUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  // Prevent admin from deleting themselves
  if (req.user.id === userId) {
    return res.status(400).json({
      success: false,
      message: 'You cannot delete your own account'
    });
  }
  
  try {
    await userService.deleteUser(userId);
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete user'
    });
  }
});

// Deactivate/Activate user (Admin only)
export const toggleUserStatus = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { isActive } = req.body;
  
  // Validate request body
  if (isActive === undefined || isActive === null) {
    return res.status(400).json({
      success: false,
      message: 'isActive field is required in request body'
    });
  }
  
  // Prevent admin from deactivating themselves
  if (req.user.id === userId) {
    return res.status(400).json({
      success: false,
      message: 'You cannot change your own account status'
    });
  }
  
  const updatedUser = await userService.toggleUserStatus(userId, isActive);
  
  res.status(200).json({
    success: true,
    message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
    data: updatedUser
  });
});

// Change user role (Admin only)
export const changeUserRole = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;
  
  // Validate user ID format if using a specific pattern
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Valid user ID is required'
    });
  }
  
  // Prevent admin from changing their own role
  if (req.user.id === userId) {
    return res.status(400).json({
      success: false,
      message: 'You cannot change your own role'
    });
  }
  
  const validRoles = ['ADMIN', 'CUSTOMER', 'WHOLESALER'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({
      success: false,
      message: `Invalid role. Must be one of: ${validRoles.join(', ')}`
    });
  }
  
  try {
    const updatedUser = await userService.changeUserRole(userId, role);
    
    res.status(200).json({
      success: true,
      message: `User role changed to ${role} successfully`,
      data: updatedUser
    });
  } catch (error) {
    logger.error('Error changing user role:', { 
      userId, 
      role, 
      error: error.message 
    });
    
    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to change user role'
    });
  }
});
// Update user avatar
export const updateAvatar = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const file = req.file;
  
  // Users can only update their own avatar unless they're admin
  if (req.user.role !== 'ADMIN' && req.user.id !== userId) {
    return res.status(403).json({
      success: false,
      message: 'You can only update your own avatar'
    });
  }
  
  if (!file) {
    return res.status(400).json({
      success: false,
      message: 'Avatar image is required'
    });
  }
  
  const updatedUser = await userService.updateAvatar(userId, file);
  
  res.status(200).json({
    success: true,
    message: 'Avatar updated successfully',
    data: updatedUser
  });
});

// Get user statistics (Admin only)
export const getUserStats = asyncHandler(async (req, res) => {
  const stats = await userService.getUserStats();
  
  res.status(200).json({
    success: true,
    data: stats
  });
});


// Remove user avatar
export const removeAvatar = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  // Users can only remove their own avatar unless they're admin
  if (req.user.role !== 'ADMIN' && req.user.id !== userId) {
    return res.status(403).json({
      success: false,
      message: 'You can only remove your own avatar'
    });
  }
  
  const updatedUser = await userService.removeAvatar(userId);
  
  res.status(200).json({
    success: true,
    message: 'Avatar removed successfully',
    data: updatedUser
  });
});

// Delete specific shop photo (Wholesaler only)
export const deleteShopPhoto = asyncHandler(async (req, res) => {
  const { userId, photoUrl } = req.params;
  
  // Users can only delete their own shop photos unless they're admin
  if (req.user.role !== 'ADMIN' && req.user.id !== userId) {
    return res.status(403).json({
      success: false,
      message: 'You can only delete your own shop photos'
    });
  }
  
  // URL decode the photoUrl since it might contain special characters
  const decodedPhotoUrl = decodeURIComponent(photoUrl);
  
  const updatedProfile = await userService.deleteShopPhoto(userId, decodedPhotoUrl);
  
  res.status(200).json({
    success: true,
    message: 'Shop photo deleted successfully',
    data: updatedProfile
  });
});