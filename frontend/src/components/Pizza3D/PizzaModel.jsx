import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Generate static scatter coordinates for toppings
// We create 16 points at different radiuses and angles so they scatter neatly and predictably.
const generateToppingsCoordinates = () => {
  const points = [];
  const rings = [
    { radius: 0.5, count: 4 },
    { radius: 1.0, count: 7 },
    { radius: 1.4, count: 9 }
  ];

  rings.forEach((ring, ringIdx) => {
    for (let i = 0; i < ring.count; i++) {
      const angle = (i / ring.count) * Math.PI * 2 + (ringIdx * 0.4); // add some offset per ring
      const x = Math.cos(angle) * ring.radius;
      const z = Math.sin(angle) * ring.radius;
      points.push({ x, z, rotationY: Math.random() * Math.PI * 2 });
    }
  });

  return points;
};

// Procedural Toppings Meshes
const ToppingElement = ({ type, position, index }) => {
  const [currentY, setCurrentY] = useState(2); // Start floating high
  
  // Slide-down animation when topping is spawned
  useEffect(() => {
    setCurrentY(3); // reset high
    let animationFrame;
    const animate = () => {
      setCurrentY((prev) => {
        if (prev <= 0.08) {
          return 0.08;
        }
        return prev - 0.15; // drop speed
      });
      animationFrame = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animationFrame);
  }, [type]);

  const targetPosition = [position.x, currentY, position.z];

  // Render specific mesh based on ingredient name
  switch (type) {
    case 'Pepperoni':
      return (
        <mesh position={targetPosition} rotation={[0, position.rotationY, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.16, 0.16, 0.02, 16]} />
          <meshStandardMaterial color="#c62828" roughness={0.6} metalness={0.1} />
        </mesh>
      );
    case 'Chicken':
      return (
        <mesh position={targetPosition} rotation={[Math.random() * 0.2, position.rotationY, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.18, 0.08, 0.12]} />
          <meshStandardMaterial color="#f6e3d4" roughness={0.8} />
        </mesh>
      );
    case 'Sausage':
      return (
        <mesh position={targetPosition} rotation={[0.5, position.rotationY, 0]} castShadow receiveShadow>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color="#795548" roughness={0.7} />
        </mesh>
      );
    case 'Bacon':
      return (
        <mesh position={targetPosition} rotation={[0, position.rotationY, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.22, 0.01, 0.06]} />
          <meshStandardMaterial color="#b71c1c" roughness={0.8} />
        </mesh>
      );
    case 'Ham':
      return (
        <mesh position={targetPosition} rotation={[0, position.rotationY, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.16, 0.015, 0.16]} />
          <meshStandardMaterial color="#ff8a80" roughness={0.7} />
        </mesh>
      );
    case 'Onion':
      return (
        <mesh position={targetPosition} rotation={[Math.PI / 2, 0, position.rotationY]} castShadow receiveShadow>
          <torusGeometry args={[0.15, 0.03, 8, 24, Math.PI]} />
          <meshStandardMaterial color="#c39bd3" roughness={0.5} />
        </mesh>
      );
    case 'Capsicum':
      return (
        <mesh position={targetPosition} rotation={[0.2, position.rotationY, 0.2]} castShadow receiveShadow>
          <boxGeometry args={[0.18, 0.04, 0.05]} />
          <meshStandardMaterial color="#1b5e20" roughness={0.4} />
        </mesh>
      );
    case 'Mushroom':
      return (
        <group position={targetPosition} rotation={[0, position.rotationY, 0]}>
          {/* Mushroom Cap */}
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.12, 0.12, 0.04, 12, 1, false, 0, Math.PI]} />
            <meshStandardMaterial color="#cfd8dc" roughness={0.8} />
          </mesh>
          {/* Stem */}
          <mesh position={[0, -0.05, 0]} castShadow>
            <boxGeometry args={[0.04, 0.1, 0.04]} />
            <meshStandardMaterial color="#eceff1" roughness={0.9} />
          </mesh>
        </group>
      );
    case 'Corn':
      return (
        <mesh position={targetPosition} castShadow receiveShadow>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial color="#fdd835" roughness={0.5} />
        </mesh>
      );
    case 'Jalapeño':
      return (
        <mesh position={targetPosition} rotation={[Math.PI / 2, 0, position.rotationY]} castShadow receiveShadow>
          <torusGeometry args={[0.12, 0.03, 6, 16]} />
          <meshStandardMaterial color="#2e7d32" roughness={0.4} />
        </mesh>
      );
    case 'Tomato':
      return (
        <mesh position={targetPosition} rotation={[0, position.rotationY, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.14, 0.14, 0.03, 16]} />
          <meshStandardMaterial color="#d32f2f" roughness={0.6} />
        </mesh>
      );
    case 'Olive':
      return (
        <mesh position={targetPosition} rotation={[Math.PI / 2, 0, position.rotationY]} castShadow receiveShadow>
          <torusGeometry args={[0.08, 0.035, 6, 16]} />
          <meshStandardMaterial color="#212121" roughness={0.8} />
        </mesh>
      );
    case 'Broccoli':
      return (
        <mesh position={targetPosition} rotation={[0.4, position.rotationY, 0]} castShadow receiveShadow>
          <sphereGeometry args={[0.11, 10, 10]} />
          <meshStandardMaterial color="#4caf50" roughness={0.9} />
        </mesh>
      );
    case 'Spinach':
      return (
        <mesh position={targetPosition} rotation={[0.1, position.rotationY, 0.1]} castShadow receiveShadow>
          <boxGeometry args={[0.2, 0.01, 0.15]} />
          <meshStandardMaterial color="#2e7d32" roughness={0.9} />
        </mesh>
      );
    case 'Paneer':
      return (
        <mesh position={targetPosition} rotation={[0, position.rotationY, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.14, 0.14, 0.14]} />
          <meshStandardMaterial color="#ffffff" roughness={0.7} />
        </mesh>
      );
    default:
      return null;
  }
};

export default function PizzaModel({ base, sauce, cheese, veggies, meats, isMelting, sauceProgress }) {
  const cheeseRef = useRef();
  
  // Base details (crust color maps)
  const baseColorMap = {
    'Thin Crust': '#e5c185',
    'Hand Tossed': '#ddb36a',
    'Cheese Burst': '#ffd54f',
    'Stuffed Crust': '#e0b570',
    'Whole Wheat': '#b78b54'
  };

  const sauceColorMap = {
    'Tomato Basil': '#c62828',
    'BBQ Sauce': '#4e2710',
    'Garlic Parmesan': '#faf0d7',
    'Alfredo': '#fffdf5',
    'Spicy Arrabbiata': '#b71c1c'
  };

  const cheeseColorMap = {
    'Mozzarella': '#fffde7',
    'Cheddar': '#ffb74d',
    'Parmesan': '#fff9c4',
    'Provolone': '#fffee0',
    'Vegan Cheese': '#fbf6d9'
  };

  const crustColor = baseColorMap[base] || '#e5c185';
  const sauceColor = sauceColorMap[sauce] || '#c62828';
  const cheeseColor = cheeseColorMap[cheese] || '#fffde7';

  // Topping coordinates Memo
  const scatterPoints = useMemo(() => generateToppingsCoordinates(), []);

  // Cheese melting anim loops
  useFrame((state) => {
    if (!cheeseRef.current) return;
    
    if (isMelting) {
      // simulate melting swell and slight shift
      const time = state.clock.getElapsedTime();
      const meltScaleY = 0.08 + Math.sin(time * 5) * 0.015; // bubble puffing
      cheeseRef.current.scale.set(1, meltScaleY, 1);
    } else {
      // restore static size
      cheeseRef.current.scale.set(1, 0.06, 1);
    }
  });

  return (
    <group>
      {/* 1. CRUST BASE */}
      {/* The main pizza body crust ring */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.8, 1.85, 0.12, 40]} />
        <meshStandardMaterial color={crustColor} roughness={0.8} />
      </mesh>
      
      {/* Bumpy border crust lip (puffed bread ring) */}
      <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
        <torusGeometry args={[1.74, 0.1, 16, 48]} />
        <meshStandardMaterial color={crustColor} roughness={0.85} />
      </mesh>

      {/* 2. SAUCE LAYER */}
      {sauce && (
        <mesh position={[0, 0.07, 0]} receiveShadow>
          {/* Spreading radius animation (sauceProgress from 0 to 1) */}
          <cylinderGeometry args={[1.65 * sauceProgress, 1.65 * sauceProgress, 0.01, 32]} />
          <meshStandardMaterial color={sauceColor} roughness={0.5} />
        </mesh>
      )}

      {/* 3. CHEESE LAYER */}
      {cheese && (
        <mesh ref={cheeseRef} position={[0, 0.075, 0]} receiveShadow>
          <cylinderGeometry args={[1.6, 1.6, 1, 32]} />
          <meshStandardMaterial 
            color={isMelting ? '#ffe082' : cheeseColor} // yellow-melted tint
            roughness={isMelting ? 0.3 : 0.6} // glisten when melting
          />
        </mesh>
      )}

      {/* 4. VEGGIE TOPPINGS */}
      {veggies.map((vegType, vIdx) => {
        // filter positions: choose a subset offset per topping type to avoid perfect overlaps
        const subsetPoints = scatterPoints.filter((_, idx) => idx % veggies.length === vIdx);
        return subsetPoints.map((pt, pIdx) => (
          <ToppingElement 
            key={`veg-${vegType}-${pIdx}`} 
            type={vegType} 
            position={pt} 
            index={pIdx} 
          />
        ));
      })}

      {/* 5. MEAT TOPPINGS */}
      {meats.map((meatType, mIdx) => {
        // shift points index slightly to offset from veggies
        const subsetPoints = scatterPoints.filter((_, idx) => (idx + 3) % (meats.length + 1) === mIdx);
        return subsetPoints.map((pt, pIdx) => (
          <ToppingElement 
            key={`meat-${meatType}-${pIdx}`} 
            type={meatType} 
            position={pt} 
            index={pIdx} 
          />
        ));
      })}
    </group>
  );
}
