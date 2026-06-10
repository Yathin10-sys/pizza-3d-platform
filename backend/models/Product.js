const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, required: true },
  basePrice: { type: Number, required: true },
  image: { type: String, default: '' },
  rating: { type: Number, default: 4.5 },
  category: { type: String, enum: ['Veg', 'Non-Veg'], required: true },
  tags: [{ type: String, enum: ['Popular', 'New'] }],
  recipe: {
    base: { type: String, default: 'Hand Tossed' },
    sauce: { type: String, default: 'Tomato Basil' },
    cheese: { type: String, default: 'Mozzarella' },
    veggies: [{ type: String }],
    meats: [{ type: String }]
  },
  isAvailable: { type: Boolean, default: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);
