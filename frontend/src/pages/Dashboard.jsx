import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addToCart } from '../redux/slices/cartSlice';
import api from '../utils/api';

// Icons
import { Search, SlidersHorizontal, Star, ShoppingCart, Sparkles, Filter, Pizza } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // State
  const [pizzas, setPizzas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(''); // Veg, Non-Veg, or empty
  const [tag, setTag] = useState(''); // Popular, New, or empty
  const [priceMax, setPriceMax] = useState(500);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);

  // Fetch products
  useEffect(() => {
    const fetchPizzas = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (category) queryParams.append('category', category);
        if (tag) queryParams.append('tag', tag);
        if (search) queryParams.append('search', search);
        if (priceMax) queryParams.append('priceMax', priceMax);

        const { data } = await api.get(`/products?${queryParams.toString()}`);
        setPizzas(data);
      } catch (err) {
        console.error('Error fetching catalog:', err);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      fetchPizzas();
    }, 300); // 300ms debounce for search inputs

    return () => clearTimeout(delayDebounce);
  }, [category, tag, search, priceMax]);

  const handleQuickAdd = (pizza) => {
    // Add default catalog recipe to cart
    const cartItem = {
      name: pizza.name,
      isCustom: false,
      size: 'Medium',
      base: pizza.recipe.base,
      sauce: pizza.recipe.sauce,
      cheese: pizza.recipe.cheese,
      veggies: pizza.recipe.veggies,
      meats: pizza.recipe.meats,
      quantity: 1,
      price: pizza.basePrice
    };
    dispatch(addToCart(cartItem));
  };

  const handleCustomizeClick = (pizza) => {
    // Pass custom recipe config in state
    navigate('/customize', { 
      state: { 
        preconfiguredRecipe: pizza.recipe,
        preconfiguredName: pizza.name,
        preconfiguredPrice: pizza.basePrice
      } 
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow w-full">
      {/* Catalog Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-heading tracking-tight">Our Pizza Menu</h1>
          <p className="text-xs text-slate-400 mt-1">Select from our signature recipes or customize in interactive 3D.</p>
        </div>

        {/* Search & Filter Buttons */}
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="relative flex-grow md:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="glass-input pl-10 pr-4 py-2.5 rounded-xl text-xs w-full"
              placeholder="Search pizza name..."
            />
          </div>
          <button 
            onClick={() => setFilterPanelOpen(!filterPanelOpen)}
            className={`p-2.5 rounded-xl border border-white/5 flex items-center space-x-1.5 transition-all text-xs ${
              filterPanelOpen ? 'bg-orange-500/20 border-orange-500/40 text-orange-500' : 'glass-panel hover:bg-white/5'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {filterPanelOpen && (
        <div className="glass-panel p-5 rounded-2xl mb-8 border border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
          {/* Categories */}
          <div>
            <label className="block font-bold text-slate-400 uppercase tracking-wider mb-2">Dietary Category</label>
            <div className="flex space-x-2">
              <button 
                onClick={() => setCategory('')} 
                className={`px-3 py-2 rounded-lg border text-[11px] font-semibold transition-all ${
                  category === '' ? 'theme-selected' : 'theme-border hover:theme-surface'
                }`}
              >
                All
              </button>
              <button 
                onClick={() => setCategory('Veg')} 
                className={`px-3 py-2 rounded-lg border text-[11px] font-semibold transition-all ${
                  category === 'Veg' ? 'bg-emerald-500 border-emerald-500 text-white' : 'theme-border hover:theme-surface'
                }`}
              >
                Veg
              </button>
              <button 
                onClick={() => setCategory('Non-Veg')} 
                className={`px-3 py-2 rounded-lg border text-[11px] font-semibold transition-all ${
                  category === 'Non-Veg' ? 'bg-red-500 border-red-500 text-white' : 'theme-border hover:theme-surface'
                }`}
              >
                Non-Veg
              </button>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block font-bold text-slate-400 uppercase tracking-wider mb-2">Status / Tag</label>
            <div className="flex space-x-2">
              <button 
                onClick={() => setTag('')} 
                className={`px-3 py-2 rounded-lg border text-[11px] font-semibold transition-all ${
                  tag === '' ? 'theme-selected' : 'theme-border hover:theme-surface'
                }`}
              >
                All
              </button>
              <button 
                onClick={() => setTag('Popular')} 
                className={`px-3 py-2 rounded-lg border text-[11px] font-semibold transition-all ${
                  tag === 'Popular' ? 'bg-amber-500 border-amber-500 text-white' : 'theme-border hover:theme-surface'
                }`}
              >
                Popular
              </button>
              <button 
                onClick={() => setTag('New')} 
                className={`px-3 py-2 rounded-lg border text-[11px] font-semibold transition-all ${
                  tag === 'New' ? 'bg-blue-500 border-blue-500 text-white' : 'theme-border hover:theme-surface'
                }`}
              >
                New
              </button>
            </div>
          </div>

          {/* Price Range */}
          <div className="sm:col-span-2">
            <div className="flex justify-between items-center mb-2">
              <label className="font-bold text-slate-400 uppercase tracking-wider">Max Price</label>
              <span className="font-bold text-orange-500">₹{priceMax}</span>
            </div>
            <input
              type="range"
              min={200}
              max={600}
              step={20}
              value={priceMax}
              onChange={(e) => setPriceMax(parseInt(e.target.value))}
              className="w-full accent-orange-500 bg-slate-900 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Pizzas List Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((n) => (
            <div key={n} className="glass-panel h-96 rounded-2xl animate-pulse flex flex-col justify-between p-6">
              <div className="bg-white/5 w-full h-44 rounded-xl"></div>
              <div className="space-y-3 pt-4">
                <div className="bg-white/5 w-2/3 h-5 rounded"></div>
                <div className="bg-white/5 w-full h-10 rounded"></div>
                <div className="bg-white/5 w-1/3 h-4 rounded"></div>
              </div>
              <div className="bg-white/5 w-full h-12 rounded-xl mt-4"></div>
            </div>
          ))}
        </div>
      ) : pizzas.length === 0 ? (
        <div className="text-center py-20 glass-panel rounded-2xl border border-white/5 max-w-md mx-auto">
          <Filter className="h-12 w-12 text-slate-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold theme-text-heading">No Pizza Found</h3>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or search keywords.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {pizzas.map((pizza) => (
            <div 
              key={pizza._id} 
              className="glass-panel glass-panel-hover rounded-2xl overflow-hidden flex flex-col relative"
            >
              {/* Pizza Image / visual placeholder */}
              <div className="h-44 w-full bg-slate-900 flex items-center justify-center relative overflow-hidden border-b border-white/5">
                {pizza.image ? (
                  <img 
                    src={pizza.image} 
                    alt={pizza.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to placeholder if image fails to load
                      e.target.style.display = 'none';
                      e.target.parentElement.querySelector('.placeholder-content').style.display = 'flex';
                    }}
                  />
                ) : null}
                
                {/* Placeholder fallback */}
                <div className={`placeholder-content absolute inset-0 flex items-center justify-center ${pizza.image ? 'hidden' : 'flex'}`}>
                  <div className="absolute h-32 w-32 rounded-full border border-orange-500/10 bg-gradient-to-tr from-amber-500/20 to-red-500/10 blur-sm animate-pulse-slow"></div>
                  <Pizza className="h-20 w-20 text-orange-500/70 relative z-10 animate-spin-slow" />
                </div>
                
                {/* Veg/Non-Veg Dot Icon */}
                <div className="absolute top-4 left-4 flex space-x-2 z-20">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border backdrop-blur-sm ${
                    pizza.category === 'Veg' ? 'bg-emerald-500/90 border-emerald-500/35 text-white' : 'bg-red-500/90 border-red-500/35 text-white'
                  }`}>
                    {pizza.category === 'Veg' ? '🟢 Veg' : '🔴 Non-Veg'}
                  </span>
                </div>

                {/* Rating */}
                <div className="absolute bottom-4 right-4 bg-slate-950/90 backdrop-blur-sm border border-white/10 px-2 py-0.5 rounded-lg flex items-center space-x-1 text-[11px] font-bold z-20">
                  <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                  <span>{pizza.rating}</span>
                </div>
              </div>

              {/* Pizza Details */}
              <div className="p-6 flex-grow flex flex-col justify-between">
                <div className="mb-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-heading font-extrabold text-xl">{pizza.name}</h3>
                    {pizza.tags && pizza.tags.map(t => (
                      <span key={t} className="bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ml-1.5 mt-1">{t}</span>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed h-12 overflow-hidden text-ellipsis line-clamp-3">
                    {pizza.description}
                  </p>
                  
                  {/* Recipe summary */}
                  <div className="mt-3 flex flex-wrap gap-1 text-[10px] text-slate-500 leading-none">
                    <span className="bg-white/5 border border-white/5 px-2 py-1 rounded">Base: {pizza.recipe.base}</span>
                    <span className="bg-white/5 border border-white/5 px-2 py-1 rounded">Sauce: {pizza.recipe.sauce}</span>
                    <span className="bg-white/5 border border-white/5 px-2 py-1 rounded">Cheese: {pizza.recipe.cheese}</span>
                  </div>
                </div>

                {/* Price & Actions */}
                <div className="pt-4 border-t border-white/5 flex items-center justify-between mt-auto">
                  <div>
                    <span className="text-[10px] block uppercase text-slate-500 font-bold tracking-wider">Starts at</span>
                    <span className="text-2xl font-extrabold text-orange-500 font-heading">₹{pizza.basePrice}</span>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleCustomizeClick(pizza)}
                      className="px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold transition-all"
                    >
                      Customize
                    </button>
                    <button 
                      onClick={() => handleQuickAdd(pizza)}
                      className="glass-btn px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-1"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
