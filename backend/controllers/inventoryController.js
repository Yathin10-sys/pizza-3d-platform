const Ingredient = require('../models/Ingredient');
const { ingredientSchema } = require('../validators/schemas');
const { runStockCheck } = require('../services/cronService');

exports.getInventory = async (req, res) => {
  try {
    const items = await Ingredient.find().sort({ type: 1, name: 1 });
    res.status(200).json(items);
  } catch (error) {
    console.error('Fetch inventory error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.addInventoryItem = async (req, res) => {
  try {
    const { error } = ingredientSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { name, type, price, stock, threshold, color } = req.body;

    const itemExists = await Ingredient.findOne({ name });
    if (itemExists) {
      return res.status(400).json({ message: 'Item with this name already exists' });
    }

    const item = await Ingredient.create({
      name,
      type,
      price,
      stock,
      threshold,
      color,
      isAvailable: stock > 0
    });

    // Run a stock monitoring scan right away in case they added a low stock item
    runStockCheck();

    res.status(201).json({ message: 'Inventory item added successfully', item });
  } catch (error) {
    console.error('Add inventory item error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.updateInventoryItem = async (req, res) => {
  try {
    const { name, type, price, stock, threshold, color, isAvailable } = req.body;
    const item = await Ingredient.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    if (name) item.name = name;
    if (type) item.type = type;
    if (price !== undefined) item.price = price;
    if (stock !== undefined) {
      item.stock = stock;
      item.isAvailable = stock > 0;
    }
    if (threshold !== undefined) item.threshold = threshold;
    if (color) item.color = color;
    if (isAvailable !== undefined) item.isAvailable = isAvailable;

    await item.save();

    // Check thresholds
    runStockCheck();

    res.status(200).json({ message: 'Inventory item updated successfully', item });
  } catch (error) {
    console.error('Update inventory item error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.deleteInventoryItem = async (req, res) => {
  try {
    const item = await Ingredient.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    await item.deleteOne();
    res.status(200).json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    console.error('Delete inventory item error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.triggerManualStockCheck = async (req, res) => {
  try {
    await runStockCheck();
    res.status(200).json({ message: 'Manual stock and threshold check triggered successfully' });
  } catch (error) {
    console.error('Trigger manual check error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
