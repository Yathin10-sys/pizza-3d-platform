import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addToCart } from '../redux/slices/cartSlice';
import api from '../utils/api';
import PizzaCanvas from '../components/Pizza3D/PizzaCanvas';

// Icons
import { Layers, Flame, Compass, ChevronRight, ChevronLeft, ShoppingBag, RotateCcw } from 'lucide-react';

export default function Customizer() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // 1. Ingredients lookup data (from DB or default backup)
  const [ingredientCatalog, setIngredientCatalog] = useState(null);
  const [loading, setLoading] = useState(true);

  // 2. Custom Pizza State
  const [step, setStep] = useState(1); // 1: Base, 2: Sauce, 3: Cheese, 4: Veggies, 5: Meats
  const [size, setSize] = useState('Medium');
  const [base, setBase] = useState('Thin Crust');
  const [sauce, setSauce] = useState('Tomato Basil');
  const [cheese, setCheese] = useState('Mozzarella');
  const [veggies, setVeggies] = useState([]);
  const [meats, setMeats] = useState([]);

  // 3. Animation visual states
  const [isMelting, setIsMelting] = useState(false);
  const [sauceProgress, setSauceProgress] = useState(1);

  // Load ingredients
  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        const { data } = await api.get('/products/ingredients');
        setIngredientCatalog(data);
      } catch (err) {
        console.error('Error fetching customizer ingredients:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchIngredients();
  }, []);

  // Hydrate preconfigured recipe if navigated from dashboard
  useEffect(() => {
    if (location.state && location.state.preconfiguredRecipe) {
      const rec = location.state.preconfiguredRecipe;
      if (rec.base) setBase(rec.base);
      if (rec.sauce) setSauce(rec.sauce);
      if (rec.cheese) setCheese(rec.cheese);
      if (rec.veggies) setVeggies(rec.veggies);
      if (rec.meats) setMeats(rec.meats);
    }
  }, [location.state]);

  // Trigger Sauce Spreading Animation when sauce changes
  const handleSauceChange = (sauceName) => {
    setSauce(sauceName);
    setSauceProgress(0.1);
    let start = 0.1;
    const interval = setInterval(() => {
      start += 0.1;
      if (start >= 1.0) {
        setSauceProgress(1.0);
        clearInterval(interval);
      } else {
        setSauceProgress(start);
      }
    }, 60);
  };

  // Trigger Cheese melting bubble puff on cheese update
  const handleCheeseChange = (cheeseName) => {
    setCheese(cheeseName);
    setIsMelting(true);
    setTimeout(() => {
      setIsMelting(false);
    }, 1500); // melt simulation for 1.5 seconds
  };

  // Handle Multi-selects
  const handleToggleVeggie = (veg) => {
    setVeggies((prev) => 
      prev.includes(veg) ? prev.filter(v => v !== veg) : [...prev, veg]
    );
  };

  const handleToggleMeat = (meat) => {
    setMeats((prev) => 
      prev.includes(meat) ? prev.filter(m => m !== meat) : [...prev, meat]
    );
  };

  // Calculate pricing mapping
  const calculatePrice = () => {
    if (!ingredientCatalog) return 150;
    
    let subtotal = 150; // base price

    // Extract pricing
    const ingMap = new Map();
    Object.keys(ingredientCatalog).forEach(type => {
      ingredientCatalog[type].forEach(item => {
        ingMap.set(item.name, item.price);
      });
    });

    subtotal += ingMap.get(base) || 0;
    subtotal += ingMap.get(sauce) || 0;
    subtotal += ingMap.get(cheese) || 0;
    veggies.forEach(v => {
      subtotal += ingMap.get(v) || 0;
    });
    meats.forEach(m => {
      subtotal += ingMap.get(m) || 0;
    });

    // Size multiplier
    if (size === 'Personal') subtotal *= 0.8;
    if (size === 'Large') subtotal *= 1.3;

    return Math.round(subtotal);
  };

  const handleAddToCart = () => {
    const currentPrice = calculatePrice();
    const cartItem = {
      name: 'Custom 3D Pizza',
      isCustom: true,
      size,
      base,
      sauce,
      cheese,
      veggies,
      meats,
      quantity: 1,
      price: currentPrice
    };
    dispatch(addToCart(cartItem));
    navigate('/cart');
  };

  const handleReset = () => {
    setBase('Thin Crust');
    setSauce('Tomato Basil');
    setCheese('Mozzarella');
    setVeggies([]);
    setMeats([]);
    setSize('Medium');
    setStep(1);
  };

  if (loading || !ingredientCatalog) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <span className="h-10 w-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></span>
          <p className="text-sm text-slate-400">Loading customizer engine...</p>
        </div>
      </div>
    );
  }

  const stepsDetails = [
    { title: 'Bases', desc: 'Choose a crust base texture' },
    { title: 'Sauces', desc: 'Select spread sauce layer' },
    { title: 'Cheese', desc: 'Pick melting dairy blends' },
    { title: 'Veg Toppings', desc: 'Scatter garden greens' },
    { title: 'Meat Toppings', desc: 'Select meats (Optional)' }
  ];

  return (
    <div className="flex-grow flex flex-col md:flex-row h-[calc(100vh-64px)] sm:h-[calc(100vh-80px)] overflow-hidden">
      
      {/* LEFT PANEL: 3D Render Viewport */}
      <div className="w-full md:w-3/5 h-1/2 md:h-full relative bg-[#05070c] border-r border-white/5">
        <PizzaCanvas 
          base={base}
          sauce={sauce}
          cheese={cheese}
          veggies={veggies}
          meats={meats}
          isMelting={isMelting}
          sauceProgress={sauceProgress}
        />

        {/* Live Overlay Pricing */}
        <div className="absolute top-4 left-4 glass-panel p-4 rounded-xl text-xs space-y-1 z-10 border border-white/10 select-none">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Custom Pizza Price</div>
          <div className="text-3xl font-extrabold text-orange-500 font-heading">₹{calculatePrice()}</div>
          <div className="text-slate-400 font-semibold">{size} size</div>
        </div>

        {/* Floating Reset controls */}
        <button 
          onClick={handleReset}
          className="absolute top-4 right-4 p-2.5 rounded-full glass-panel hover:bg-white/5 transition-all text-slate-400 hover:text-white"
          title="Reset Customizer"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      {/* RIGHT PANEL: Customizer Selection Wizard */}
      <div className="w-full md:w-2/5 h-1/2 md:h-full flex flex-col justify-between glass-panel border-t md:border-t-0 md:border-l border-white/5 py-6 px-8 overflow-y-auto">
        <div>
          {/* Step indicator header */}
          <div className="flex justify-between items-center mb-6">
            <span className="text-[10px] font-extrabold bg-orange-500/10 border border-orange-500/20 text-orange-400 px-2 py-1 rounded uppercase tracking-wider">
              Step {step} of 5
            </span>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map(s => (
                <div key={s} className={`h-1.5 w-6 rounded-full transition-all duration-300 ${s === step ? 'bg-orange-500' : s < step ? 'bg-orange-900/60' : 'bg-white/5'}`}></div>
              ))}
            </div>
          </div>

          <h2 className="text-2xl font-bold font-heading theme-text-heading">{stepsDetails[step-1].title}</h2>
          <p className="text-xs text-slate-500 mt-1 mb-6">{stepsDetails[step-1].desc}</p>

          {/* Size Selectors (Shown only in Base step) */}
          {step === 1 && (
            <div className="mb-6">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Pizza Size</label>
              <div className="grid grid-cols-3 gap-3">
                {['Personal', 'Medium', 'Large'].map(sz => (
                  <button
                    key={sz}
                    onClick={() => setSize(sz)}
                    className={`py-2.5 rounded-xl border text-xs font-semibold tracking-wide transition-all ${
                      size === sz ? 'theme-selected' : 'glass-panel hover:theme-surface theme-border'
                    }`}
                  >
                    {sz === 'Personal' ? 'Personal (8")' : sz === 'Medium' ? 'Medium (10")' : 'Large (12")'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Dynamic Selection Content */}
          <div className="space-y-3 max-h-[25vh] md:max-h-[50vh] overflow-y-auto pr-1">
            {/* Step 1: Bases */}
            {step === 1 && ingredientCatalog.base.map(item => (
              <div 
                key={item._id}
                onClick={() => setBase(item.name)}
                className={`p-4 rounded-xl border cursor-pointer flex justify-between items-center transition-all ${
                  base === item.name ? 'theme-selected-subtle shadow-md shadow-orange-500/5' : 'glass-panel hover:theme-surface theme-border'
                }`}
              >
                <div>
                  <h4 className="font-bold text-sm">{item.name}</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Classic crust base option</p>
                </div>
                <span className="font-bold text-xs text-slate-400">+{item.price > 0 ? `₹${item.price}` : 'Free'}</span>
              </div>
            ))}

            {/* Step 2: Sauces */}
            {step === 2 && ingredientCatalog.sauce.map(item => (
              <div 
                key={item._id}
                onClick={() => handleSauceChange(item.name)}
                className={`p-4 rounded-xl border cursor-pointer flex justify-between items-center transition-all ${
                  sauce === item.name ? 'theme-selected-subtle shadow-md shadow-orange-500/5' : 'glass-panel hover:theme-surface theme-border'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <h4 className="font-bold text-sm">{item.name}</h4>
                </div>
                <span className="font-bold text-xs text-slate-400">+{item.price > 0 ? `₹${item.price}` : 'Free'}</span>
              </div>
            ))}

            {/* Step 3: Cheeses */}
            {step === 3 && ingredientCatalog.cheese.map(item => (
              <div 
                key={item._id}
                onClick={() => handleCheeseChange(item.name)}
                className={`p-4 rounded-xl border cursor-pointer flex justify-between items-center transition-all ${
                  cheese === item.name ? 'theme-selected-subtle shadow-md shadow-orange-500/5' : 'glass-panel hover:theme-surface theme-border'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="h-3 w-3 rounded-full border border-white/10" style={{ backgroundColor: item.color }}></div>
                  <h4 className="font-bold text-sm">{item.name}</h4>
                </div>
                <span className="font-bold text-xs text-slate-400">+{item.price > 0 ? `₹${item.price}` : 'Free'}</span>
              </div>
            ))}

            {/* Step 4: Veggies (Multi-select) */}
            {step === 4 && ingredientCatalog.veggie.map(item => (
              <div 
                key={item._id}
                onClick={() => handleToggleVeggie(item.name)}
                className={`p-4 rounded-xl border cursor-pointer flex justify-between items-center transition-all ${
                  veggies.includes(item.name) ? 'theme-selected-subtle shadow-md shadow-orange-500/5' : 'glass-panel hover:theme-surface theme-border'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="h-3.5 w-3.5 rounded border border-slate-700 bg-slate-900 flex items-center justify-center">
                    {veggies.includes(item.name) && <span className="h-2 w-2 bg-orange-500 rounded-sm"></span>}
                  </div>
                  <div className="h-3 w-3 rounded-full border border-white/10" style={{ backgroundColor: item.color }}></div>
                  <h4 className="font-bold text-sm">{item.name}</h4>
                </div>
                <span className="font-bold text-xs text-slate-400">+₹{item.price}</span>
              </div>
            ))}

            {/* Step 5: Meats (Multi-select) */}
            {step === 5 && ingredientCatalog.meat.map(item => (
              <div 
                key={item._id}
                onClick={() => handleToggleMeat(item.name)}
                className={`p-4 rounded-xl border cursor-pointer flex justify-between items-center transition-all ${
                  meats.includes(item.name) ? 'theme-selected-subtle shadow-md shadow-orange-500/5' : 'glass-panel hover:theme-surface theme-border'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="h-3.5 w-3.5 rounded border border-slate-700 bg-slate-900 flex items-center justify-center">
                    {meats.includes(item.name) && <span className="h-2 w-2 bg-orange-500 rounded-sm"></span>}
                  </div>
                  <div className="h-3 w-3 rounded-full border border-white/10" style={{ backgroundColor: item.color }}></div>
                  <h4 className="font-bold text-sm">{item.name}</h4>
                </div>
                <span className="font-bold text-xs text-slate-400">+₹{item.price}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Wizard Footer Navigation Actions */}
        <div className="pt-6 border-t border-white/5 flex items-center justify-between mt-auto">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-5 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-xs font-bold flex items-center space-x-1"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
          ) : (
            <div></div> // empty spacer
          )}

          {step < 5 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="glass-btn px-6 py-3 rounded-xl text-xs font-bold flex items-center space-x-1"
            >
              <span>Next Step</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleAddToCart}
              className="glass-btn px-6 py-3.5 rounded-xl text-xs font-bold flex items-center space-x-1 bg-gradient-to-r from-emerald-500 to-green-600 shadow-emerald-500/20"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Add to Basket</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
