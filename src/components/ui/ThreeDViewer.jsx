import React, { Suspense, useMemo, useState, useEffect } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Stage, Center, Environment, PerspectiveCamera, Html } from '@react-three/drei';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import * as THREE from 'three';

const Model = ({ url }) => {
  const geometry = useLoader(STLLoader, url);
  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color="#8b5cf6" roughness={0.3} metalness={0.8} />
    </mesh>
  );
};

export default function ThreeDViewer({ url, onClose }) {
  if (!url) return null;

  return (
    <div className="three-d-viewer-overlay animate-in" onClick={onClose}>
      <div className="three-d-viewer-content" onClick={(e) => e.stopPropagation()}>
        <button className="viewer-close-btn" onClick={onClose}>×</button>
        
        <Canvas shadows camera={{ position: [200, 200, 200], fov: 45 }}>
          <color attach="background" args={['#0f1115']} />
          <Suspense fallback={<Html center><div className="loading-spinner">Loading Model...</div></Html>}>
            <Stage environment="city" intensity={0.5} contactShadow={{ opacity: 0.4, blur: 2 }}>
              <Center>
                <Model url={url} />
              </Center>
            </Stage>
          </Suspense>
          <OrbitControls makeDefault autoRotate autoRotateSpeed={0.5} />
        </Canvas>
        
        <div className="viewer-controls-hint">
            Drag to Rotate • Scroll to Zoom
        </div>
      </div>
    </div>
  );
}
