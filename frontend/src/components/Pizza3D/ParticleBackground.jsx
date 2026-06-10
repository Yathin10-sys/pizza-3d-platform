import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function ParticleBackground({ count = 80 }) {
  const pointsRef = useRef();

  // Generate random positions, velocities, and scales
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 6;
      const y = Math.random() * 4 - 1; // start from -1 to 3
      const z = (Math.random() - 0.5) * 6;
      
      const speedY = 0.005 + Math.random() * 0.01;
      const speedX = (Math.random() - 0.5) * 0.005;
      const speedZ = (Math.random() - 0.5) * 0.005;

      const size = 0.01 + Math.random() * 0.02;

      temp.push({ x, y, z, speedX, speedY, speedZ, size });
    }
    return temp;
  }, [count]);

  // Dummy ref list to update coordinates inside useFrame
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(() => {
    if (!pointsRef.current) return;

    particles.forEach((p, idx) => {
      // Move particle upwards
      p.y += p.speedY;
      p.x += p.speedX;
      p.z += p.speedZ;

      // Wrap-around if particles drift too high/far
      if (p.y > 3) p.y = -1;
      if (Math.abs(p.x) > 3) p.x = (Math.random() - 0.5) * 6;
      if (Math.abs(p.z) > 3) p.z = (Math.random() - 0.5) * 6;

      dummy.position.set(p.x, p.y, p.z);
      dummy.scale.set(p.size, p.size, p.size);
      dummy.updateMatrix();
      
      pointsRef.current.setMatrixAt(idx, dummy.matrix);
    });

    pointsRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={pointsRef} args={[null, null, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.2} />
    </instancedMesh>
  );
}
