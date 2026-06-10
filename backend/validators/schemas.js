const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^[0-9]{10}$/).required().messages({
    'string.pattern.base': 'Phone number must be a valid 10-digit number'
  }),
  password: Joi.string().min(6).required(),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Passwords must match'
  })
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  rememberMe: Joi.boolean().default(false)
});

const deliveryAddressSchema = Joi.object({
  street: Joi.string().required(),
  city: Joi.string().required(),
  pincode: Joi.string().pattern(/^[0-9]{6}$/).required().messages({
    'string.pattern.base': 'Pincode must be 6 digits'
  }),
  phone: Joi.string().pattern(/^[0-9]{10}$/).required().messages({
    'string.pattern.base': 'Phone number must be 10 digits'
  })
});

const orderItemSchema = Joi.object({
  name: Joi.string().required(),
  isCustom: Joi.boolean().required(),
  size: Joi.string().valid('Personal', 'Medium', 'Large').default('Medium'),
  base: Joi.string().required(),
  sauce: Joi.string().required(),
  cheese: Joi.string().required(),
  veggies: Joi.array().items(Joi.string()).default([]),
  meats: Joi.array().items(Joi.string()).default([]),
  quantity: Joi.number().integer().min(1).default(1),
  price: Joi.number().positive().required()
});

const createOrderSchema = Joi.object({
  items: Joi.array().items(orderItemSchema).min(1).required(),
  deliveryAddress: deliveryAddressSchema.required(),
  couponCode: Joi.string().allow('', null).optional()
});

const ingredientSchema = Joi.object({
  name: Joi.string().required(),
  type: Joi.string().valid('base', 'sauce', 'cheese', 'veggie', 'meat').required(),
  price: Joi.number().min(0).required(),
  stock: Joi.number().integer().min(0).required(),
  threshold: Joi.number().integer().min(0).default(20),
  color: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).default('#ffffff')
});

module.exports = {
  registerSchema,
  loginSchema,
  createOrderSchema,
  ingredientSchema
};
