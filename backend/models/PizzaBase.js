// backend/models/PizzaBase.js
const mongoose = require('mongoose');

const pizzaBaseSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true, min: 0 },
  image: { type: String }, // URL to static asset
  lowStockThreshold: { type: Number, default: 20 },
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('PizzaBase', pizzaBaseSchema);
