import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, useSTLLoader } from '@react-three/drei';
import * as THREE from 'three';

function Model({ url }) {
  const geom = useSTLLoader(url);
  return (
    <mesh geometry={geom}>
      <meshStandardMaterial color="#8b5cf6" roughness={0.3} metalness={0.8} />
    </mesh>
  );
}

export default function ModelPreview({ url }) {
  if (!url) return null;

  return (
    <div className="model-preview-box">
      <Canvas shadows camera={{ position: [0, 0, 100], fov: 50 }} dpr={[1, 2]}>
        <Suspense fallback={null}>
          <Stage environment="city" intensity={0.5} contactShadow={false}>
            <Model url={url} />
          </Stage>
        </Suspense>
        <OrbitControls makeDefault enableZoom={false} autoRotate autoRotateSpeed={4} />
      </Canvas>
    </div>
  );
}
