import { body, validationResult } from 'express-validator';


export const validate = (type) => {
  return (req, res, next) => {
    // Basic validation - you can extend this with Joi or similar
    try {
      switch (type) {
        case 'register':
          if (!req.body.email || !req.body.password || !req.body.name) {
            return res.status(400).json({
              success: false,
              message: 'Email, password, and name are required'
            });
          }
          break;

        case 'login':
          if (!req.body.email || !req.body.password) {
            return res.status(400).json({
              success: false,
              message: 'Email and password are required'
            });
          }
          break;

        case 'product':
          if (!req.body.name || !req.body.normalPrice || !req.body.categoryId) {
            return res.status(400).json({
              success: false,
              message: 'Name, price, and category are required'
            });
          }
          break;

        default:
          break;
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};


// Contact form validation
export const validateContact = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Valid phone number is required'),
  
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Message must be between 10 and 2000 characters'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];


// Rating validation
export const validateRating = [
  body('productId')
    .notEmpty()
    .withMessage('Product ID is required'),
  
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5'),
  
  body('title')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Title must be less than 200 characters'),
  
  body('review')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Review must be less than 1000 characters'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];


// Order validation
export const validateOrder = [
  body('orderData.name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('orderData.email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  
  body('orderData.phone')
    .isMobilePhone()
    .withMessage('Valid phone number is required'),
  
  body('orderData.address')
    .notEmpty()
    .withMessage('Address is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Address must be between 10 and 500 characters'),
  
  body('orderData.city')
    .notEmpty()
    .withMessage('City is required'),
  
  body('orderData.state')
    .notEmpty()
    .withMessage('State is required'),
  
  body('orderData.pincode')
    .isPostalCode('IN')
    .withMessage('Valid pincode is required'),
  
  body('orderData.orderItems')
    .isArray({ min: 1 })
    .withMessage('At least one order item is required'),
  
  body('orderData.orderItems.*.productId')
    .notEmpty()
    .withMessage('Product ID is required'),
  
  body('orderData.orderItems.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  
  body('razorpay_order_id')
    .notEmpty()
    .withMessage('Razorpay order ID is required'),
  
  body('razorpay_payment_id')
    .notEmpty()
    .withMessage('Razorpay payment ID is required'),
  
  body('razorpay_signature')
    .notEmpty()
    .withMessage('Razorpay signature is required'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];


export const validateSlider = (req, res, next) => {
  const {
    title,
    bgImage,
    image,
    layout
  } = req.body;

  const errors = [];

  if (!title || title.trim() === '') {
    errors.push('Title is required');
  }

  if (!bgImage || bgImage.trim() === '') {
    errors.push('Background image is required');
  }

  if (!image || image.trim() === '') {
    errors.push('Image is required');
  }

  if (layout && !['left', 'right', 'center'].includes(layout)) {
    errors.push('Layout must be one of: left, right, center');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};


export const validateProduct = [
  // Check if required fields exist
  body('name')
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Product name must be between 2 and 200 characters'),

  body('productCode')
    .notEmpty()
    .withMessage('Product code is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Product code must be between 2 and 50 characters')
    .matches(/^[A-Za-z0-9\-_]+$/)
    .withMessage('Product code can only contain letters, numbers, hyphens, and underscores'),

  body('normalPrice')
    .notEmpty()
    .withMessage('Normal price is required')
    .isFloat({ min: 0 })
    .withMessage('Normal price must be a valid number greater than or equal to 0'),

  body('categoryId')
    .notEmpty()
    .withMessage('Category ID is required'),

  body('variants')
    .custom((value, { req }) => {
      if (!value) {
        throw new Error('Variants field is required');
      }
      
      // Value should already be parsed from FormData
      if (!Array.isArray(value)) {
        throw new Error('Variants must be an array');
      }

      if (value.length === 0) {
        throw new Error('At least one variant is required');
      }

      // Validate each variant
      value.forEach((variant, index) => {
        if (!variant.color || typeof variant.color !== 'string' || variant.color.trim() === '') {
          throw new Error(`Variant ${index}: Color is required and must be a non-empty string`);
        }

        if (!Array.isArray(variant.sizes)) {
          throw new Error(`Variant ${index}: Sizes must be an array`);
        }

        if (variant.sizes.length === 0) {
          throw new Error(`Variant ${index}: At least one size is required`);
        }

        // Validate each size
        variant.sizes.forEach((sizeObj, sizeIndex) => {
          if (!sizeObj.size || typeof sizeObj.size !== 'string' || sizeObj.size.trim() === '') {
            throw new Error(`Variant ${index}, Size ${sizeIndex}: Size value is required`);
          }

          if (sizeObj.stock !== undefined && sizeObj.stock !== null) {
            const stock = parseInt(sizeObj.stock);
            if (isNaN(stock) || stock < 0) {
              throw new Error(`Variant ${index}, Size ${sizeIndex}: Stock must be a non-negative integer`);
            }
          }
        });
      });

      return true;
    }),

  body('productDetails')
    .optional()
    .custom((value) => {
      if (!value) return true;
      
      if (!Array.isArray(value)) {
        throw new Error('Product details must be an array');
      }

      value.forEach((detail, index) => {
        if (!detail.title || typeof detail.title !== 'string' || detail.title.trim() === '') {
          throw new Error(`Product detail ${index}: Title is required`);
        }

        if (!detail.description || typeof detail.description !== 'string' || detail.description.trim() === '') {
          throw new Error(`Product detail ${index}: Description is required`);
        }
      });

      return true;
    }),

  // Validation result middleware
  (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {

      
      return res.status(400).json({
        success: false,
        message: 'Product validation failed',
        errors: errors.array()
      });
    }

    next();
  }
];


// Product update validation (similar but with optional fields)
export const validateProductUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Product name must be between 2 and 200 characters'),

  body('productCode')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Product code must be between 2 and 50 characters')
    .matches(/^[A-Za-z0-9\-_]+$/)
    .withMessage('Product code can only contain letters, numbers, hyphens, and underscores'),

  body('normalPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Normal price must be a valid number greater than or equal to 0'),

  body('offerPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Offer price must be a valid number greater than or equal to 0'),

  body('wholesalePrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Wholesale price must be a valid number greater than or equal to 0'),

  body('description')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Description must be less than 2000 characters'),

  body('variants')
    .optional()
    .custom((value) => {
      // Similar validation as create but optional
      let variants = value;
      if (typeof value === 'string') {
        try {
          variants = JSON.parse(value);
        } catch (error) {
          throw new Error('Invalid JSON format in variants field');
        }
      }

      if (!Array.isArray(variants)) {
        throw new Error('Variants must be an array');
      }

      // Rest of variant validation similar to create...
      return true;
    }),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Product update validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];


// Category validation
export const validateCategory = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-&]+$/)
    .withMessage('Category name can only contain letters, numbers, spaces, hyphens, and ampersands'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Category description is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value'),

  // Validation result middleware
  (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Category validation failed',
        errors: errors.array()
      });
    }

    next();
  }
];

// Category update validation
export const validateCategoryUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-&]+$/)
    .withMessage('Category name can only contain letters, numbers, spaces, hyphens, and ampersands'),

  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Category update validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

// Subcategory validation
export const validateSubcategory = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Subcategory name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Subcategory name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-&]+$/)
    .withMessage('Subcategory name can only contain letters, numbers, spaces, hyphens, and ampersands'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Subcategory description is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),

  body('category')
    .notEmpty()
    .withMessage('Category ID is required')
    .isMongoId()
    .withMessage('Invalid category ID format'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value'),

  // Validation result middleware
  (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Subcategory validation failed',
        errors: errors.array()
      });
    }

    next();
  }
];

// Subcategory update validation
export const validateSubcategoryUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Subcategory name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-&]+$/)
    .withMessage('Subcategory name can only contain letters, numbers, spaces, hyphens, and ampersands'),

  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),

  body('category')
    .optional()
    .isMongoId()
    .withMessage('Invalid category ID format'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Subcategory update validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

// Status toggle validation (for both category and subcategory)
export const validateStatusToggle = [
  body('isActive')
    .notEmpty()
    .withMessage('isActive field is required')
    .isBoolean()
    .withMessage('isActive must be a boolean value'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Status toggle validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

export const validateCreateUser = [
  // Name validation - make it simpler
  body('name')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),

  // Email validation
  body('email')
    .trim()
    .notEmpty().withMessage('Email address is required')
    .isEmail().withMessage('Please provide a valid email address'),

  // Password validation - make it simpler
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),

  // Role validation
  body('role')
    .notEmpty().withMessage('User role is required')
    .isIn(['ADMIN', 'CUSTOMER', 'WHOLESALER']).withMessage('Role must be one of: ADMIN, CUSTOMER, WHOLESALER'),

  // Phone validation (optional)
  body('phone')
    .optional()
    .trim()
    .isLength({ min: 10, max: 15 }).withMessage('Phone number must be between 10 and 15 characters'),

  (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      const formattedErrors = errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }));

      return res.status(400).json({
        success: false,
        message: 'User creation validation failed',
        errors: formattedErrors
      });
    }

    next();
  }
];

// Update user validation (similar but with optional fields)
export const validateUpdateUser = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s\u00C0-\u024F\u1E00-\u1EFF]+$/)
    .withMessage('Name can only contain letters and spaces'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
    .isLength({ max: 255 })
    .withMessage('Email must be less than 255 characters'),

  body('phone')
    .optional()
    .trim()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number')
    .isLength({ min: 10, max: 15 })
    .withMessage('Phone number must be between 10 and 15 characters'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value'),

  body('isApproved')
    .optional()
    .isBoolean()
    .withMessage('isApproved must be a boolean value'),

  // Business type validation for update (only for wholesalers)
  body('businessType')
    .optional()
    .isIn([
      'CLOTHING_STORE',
      'GST_BUSINESS',
      'WEBSITE', 
      'INSTAGRAM_PAGE',
      'STARTUP'
    ])
    .withMessage('Business type must be one of: CLOTHING_STORE, GST_BUSINESS, WEBSITE, INSTAGRAM_PAGE, STARTUP'),

  (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      const formattedErrors = errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }));

      return res.status(400).json({
        success: false,
        message: 'User update validation failed',
        errors: formattedErrors
      });
    }

    next();
  }
];

// Password validation (for password change)
export const validatePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),

  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .isLength({ max: 128 })
    .withMessage('New password must be less than 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number')
    .matches(/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/)
    .withMessage('New password contains invalid characters')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('New password must be different from current password');
      }
      return true;
    }),

  body('confirmPassword')
    .notEmpty()
    .withMessage('Confirm password is required')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),

  (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      const formattedErrors = errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }));

      return res.status(400).json({
        success: false,
        message: 'Password validation failed',
        errors: formattedErrors
      });
    }

    next();
  }
];