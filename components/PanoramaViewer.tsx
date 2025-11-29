import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface PanoramaViewerProps {
  imageUrl: string;
}

const PanoramaViewer: React.FC<PanoramaViewerProps> = ({ imageUrl }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isInteracting, setIsInteracting] = useState(false);

  useEffect(() => {
    if (!mountRef.current) return;

    // --- Scene Setup ---
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    
    // Instead of attaching .target to the camera (which TS errors on), 
    // we use a local variable to track the look-at point.
    const target = new THREE.Vector3(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    // --- Sphere Geometry (Inside Out) ---
    // 500 radius, 60 width segments, 40 height segments
    const geometry = new THREE.SphereGeometry(500, 60, 40);
    // Invert geometry to see inside
    geometry.scale(-1, 1, 1);

    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(imageUrl);
    texture.colorSpace = THREE.SRGBColorSpace;

    const material = new THREE.MeshBasicMaterial({ map: texture });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    // --- Camera Control Logic (Manual) ---
    let lon = 0;
    let lat = 0;
    let phi = 0;
    let theta = 0;
    let onPointerDownPointerX = 0;
    let onPointerDownPointerY = 0;
    let onPointerDownLon = 0;
    let onPointerDownLat = 0;

    const onPointerDown = (event: MouseEvent) => {
      setIsInteracting(true);
      onPointerDownPointerX = event.clientX;
      onPointerDownPointerY = event.clientY;
      onPointerDownLon = lon;
      onPointerDownLat = lat;
    };

    const onPointerMove = (event: MouseEvent) => {
      if (!isInteracting) return;
      lon = (onPointerDownPointerX - event.clientX) * 0.1 + onPointerDownLon;
      lat = (event.clientY - onPointerDownPointerY) * 0.1 + onPointerDownLat;
    };

    const onPointerUp = () => {
      setIsInteracting(false);
    };

    // Attach events
    mountRef.current.addEventListener('mousedown', onPointerDown);
    document.addEventListener('mousemove', onPointerMove);
    document.addEventListener('mouseup', onPointerUp);

    // --- Animation Loop ---
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      // Auto rotation if not interacting
      if (!isInteracting) {
        lon += 0.05;
      }

      lat = Math.max(-85, Math.min(85, lat));
      phi = THREE.MathUtils.degToRad(90 - lat);
      theta = THREE.MathUtils.degToRad(lon);

      // Update the local target variable instead of camera.target
      target.x = 500 * Math.sin(phi) * Math.cos(theta);
      target.y = 500 * Math.cos(phi);
      target.z = 500 * Math.sin(phi) * Math.sin(theta);

      camera.lookAt(target);
      renderer.render(scene, camera);
    };

    animate();

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(animationId);
      if (mountRef.current) {
        mountRef.current.removeEventListener('mousedown', onPointerDown);
        if (mountRef.current.contains(renderer.domElement)) {
            mountRef.current.removeChild(renderer.domElement);
        }
      }
      document.removeEventListener('mousemove', onPointerMove);
      document.removeEventListener('mouseup', onPointerUp);
      geometry.dispose();
      material.dispose();
      texture.dispose();
      renderer.dispose();
    };
  }, [imageUrl, isInteracting]);

  return (
    <div className="relative w-full h-full group cursor-move">
      <div ref={mountRef} className="w-full h-full rounded-xl overflow-hidden shadow-inner" />
      
      {/* Overlay Hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1 rounded-full pointer-events-none transition-opacity opacity-100 group-hover:opacity-0">
        Drag to look around
      </div>
      
      <div className="absolute top-2 right-2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg uppercase">
        3D View
      </div>
    </div>
  );
};

export default PanoramaViewer;