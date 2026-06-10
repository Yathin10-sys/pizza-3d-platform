// backend/models/Sauce.js
const mongoose = require('mongoose');

const sauceSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true, min: 0 },
  lowStockThreshold: { type: Number, default: 20 },
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Sauce', sauceSchema);
