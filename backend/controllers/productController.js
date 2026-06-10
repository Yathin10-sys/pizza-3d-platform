const Product = require('../models/Product');
const Ingredient = require('../models/Ingredient');
const Review = require('../models/Review');

exports.getProducts = async (req, res) => {
  try {
    const { category, tag, priceMin, priceMax, search } = req.query;
    let query = { isAvailable: true };

    if (category) {
      query.category = category;
    }
    if (tag) {
      query.tags = tag;
    }
    if (priceMin || priceMax) {
      query.basePrice = {};
      if (priceMin) query.basePrice.$gte = parseFloat(priceMin);
      if (priceMax) query.basePrice.$lte = parseFloat(priceMax);
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(query);
    res.status(200).json(products);
  } catch (error) {
    console.error('Fetch products error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Pizza not found' });
    }

    // Get reviews for this product
    const reviews = await Review.find({ product: product._id })
      .populate('user', 'name')
      .sort('-createdAt');

    res.status(200).json({ product, reviews });
  } catch (error) {
    console.error('Fetch product by ID error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.getIngredients = async (req, res) => {
  try {
    const ingredients = await Ingredient.find({ isAvailable: true });
    
    // Group ingredients by type for frontend ease-of-use
    const grouped = {
      base: [],
      sauce: [],
      cheese: [],
      veggie: [],
      meat: []
    };

    ingredients.forEach(item => {
      if (grouped[item.type]) {
        grouped[item.type].push(item);
      }
    });

    res.status(200).json(grouped);
  } catch (error) {
    console.error('Fetch ingredients error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.addProductReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const productId = req.params.id;

    if (!rating || !comment) {
      return res.status(400).json({ message: 'Rating and comment are required' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Pizza not found' });
    }

    // Upsert review (user can only review once per pizza)
    const review = await Review.findOneAndUpdate(
      { user: req.user.id, product: productId },
      { rating, comment },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // Re-calculate average rating for product
    const stats = await Review.aggregate([
      { $match: { product: product._id } },
      { $group: { _id: '$product', averageRating: { $avg: '$rating' } } }
    ]);

    if (stats.length > 0) {
      product.rating = parseFloat(stats[0].averageRating.toFixed(1));
      await product.save();
    }

    res.status(200).json({ message: 'Review added successfully', review });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
