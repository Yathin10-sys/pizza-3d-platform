import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Pizza, Sparkles, Truck, Layers, BarChart3, Settings } from 'lucide-react';

export default function Landing() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
    }
  };

  const features = [
    {
      icon: <Layers className="h-6 w-6 text-orange-500" />,
      title: "Interactive 3D Builder",
      desc: "Customize crusts, sauces, cheese volumes, and scattered toppings in real-time within a fluid 3D viewport."
    },
    {
      icon: <Truck className="h-6 w-6 text-emerald-500" />,
      title: "Live Socket.io Tracking",
      desc: "Watch your order move from preparation and baking in the kitchen to packaging and shipping in real-time."
    },
    {
      icon: <BarChart3 className="h-6 w-6 text-blue-500" />,
      title: "Inventory Syncing",
      desc: "Stock quantities decrement dynamically with every checkout. Automated cron checks alert admins on low levels."
    },
    {
      icon: <Sparkles className="h-6 w-6 text-amber-500" />,
      title: "Cinematic Transitions",
      desc: "Smooth glassmorphism interfaces layered with micro-animations and floating culinary particle backdrops."
    }
  ];

  return (
    <div className="relative overflow-hidden w-full flex-grow flex flex-col justify-center py-10 md:py-20">
      
      {/* Background Decorative Blobs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-orange-600/10 rounded-full blur-[100px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-red-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        <motion.div 
          className="text-center max-w-4xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Badge */}
          <motion.div 
            variants={itemVariants}
            className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold uppercase tracking-wider mb-6"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Premium 3D Experience</span>
          </motion.div>

          {/* Heading */}
          <motion.h1 
            variants={itemVariants}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold font-heading tracking-tight leading-none mb-6"
          >
            Craft Your Pizza in <br/>
            <span className="bg-gradient-to-r from-orange-500 via-red-500 to-amber-500 bg-clip-text text-transparent">
              Immersive 3D
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p 
            variants={itemVariants}
            className="text-base sm:text-xl theme-text-secondary max-w-2xl mx-auto leading-relaxed mb-10"
          >
            Welcome to the future of gourmet ordering. Build your perfect recipe procedurally in 3D, verify real-time ingredient pricing, and track kitchen updates instantly.
          </motion.p>

          {/* Action Buttons */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-16"
          >
            <Link 
              to="/customize" 
              className="w-full sm:w-auto glass-btn px-8 py-4 rounded-xl text-lg font-bold flex items-center justify-center space-x-2"
            >
              <Pizza className="h-5 w-5" />
              <span>Design Your Pizza</span>
            </Link>
            <Link 
              to="/dashboard" 
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-lg font-bold border hover:bg-[var(--surface-hover)] transition-all flex items-center justify-center"
              style={{ background: 'var(--surface)', borderColor: 'var(--border-medium)' }}
            >
              <span>Explore Catalog Menu</span>
            </Link>
          </motion.div>

          {/* Features Grid */}
          <motion.div 
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left"
          >
            {features.map((feat, index) => (
              <div 
                key={index} 
                className="glass-panel glass-panel-hover p-6 rounded-2xl flex flex-col justify-between"
              >
                <div className="p-3 rounded-xl w-fit mb-5 border" style={{ background: 'var(--surface)', borderColor: 'var(--border-subtle)' }}>
                  {feat.icon}
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold theme-text-heading mb-2">{feat.title}</h3>
                  <p className="text-xs theme-text-muted leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
