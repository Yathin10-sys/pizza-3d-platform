const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  type: {
    type: String,
    enum: ['base', 'sauce', 'cheese', 'veggie', 'meat'],
    required: true
  },
  price: { type: Number, required: true, default: 0 },
  stock: { type: Number, required: true, default: 100 },
  threshold: { type: Number, default: 20 },
  color: { type: String, default: '#ffffff' }, // Used for procedural 3D representation
  isAvailable: { type: Boolean, default: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('Ingredient', ingredientSchema);
