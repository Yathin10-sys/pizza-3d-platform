import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import PizzaModel from './PizzaModel';
import ParticleBackground from './ParticleBackground';

export default function PizzaCanvas({ base, sauce, cheese, veggies, meats, isMelting, sauceProgress }) {
  return (
    <div className="w-full h-full relative min-h-[350px] md:min-h-[500px]">
      {/* 3D Canvas */}
      <Canvas
        shadows
        camera={{ position: [0, 4, 5], fov: 45 }}
        className="w-full h-full"
      >
        <color attach="background" args={['#05070c']} />
        
        {/* Lights */}
        <ambientLight intensity={0.6} />
        <directionalLight
          castShadow
          position={[5, 10, 5]}
          intensity={1.2}
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0001}
        />
        <pointLight position={[-5, 5, -5]} intensity={0.5} />
        <spotLight 
          position={[0, 8, 2]} 
          intensity={1.5} 
          angle={0.6} 
          penumbra={1} 
          castShadow 
        />

        <Suspense fallback={null}>
          <group position={[0, -0.2, 0]}>
            {/* The Pizza Model */}
            <PizzaModel 
              base={base}
              sauce={sauce}
              cheese={cheese}
              veggies={veggies}
              meats={meats}
              isMelting={isMelting}
              sauceProgress={sauceProgress}
            />

            {/* Subtle floating flour particles in the scene */}
            <ParticleBackground count={100} />
          </group>
          
          {/* Ground Contact Shadows for realistic depth */}
          <ContactShadows 
            position={[0, -0.6, 0]} 
            opacity={0.6} 
            scale={10} 
            blur={2} 
            far={1.5} 
          />
        </Suspense>

        {/* Camera Controls */}
        <OrbitControls 
          enableZoom={true} 
          maxPolarAngle={Math.PI / 2.1} 
          minDistance={2} 
          maxDistance={8} 
          autoRotate={!isMelting} // Rotate when resting, stop when melting animation triggers
          autoRotateSpeed={0.5}
        />
      </Canvas>

      {/* Tip Banner Overlaid */}
      <div className="absolute bottom-4 left-4 glass-panel px-3 py-1.5 rounded-lg text-xs text-slate-400 select-none pointer-events-none">
        🖱️ Left-Click + Drag to rotate | Scroll to zoom
      </div>
    </div>
  );
}
