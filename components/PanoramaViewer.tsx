import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface PanoramaViewerProps {
  imageUrl: string;
}

const PanoramaViewer: React.FC<PanoramaViewerProps> = ({ imageUrl }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [textureLoaded, setTextureLoaded] = useState(false);

  useEffect(() => {
    if (!mountRef.current) return;
    
    setTextureLoaded(false);

    // --- Scene Setup ---
    let width = mountRef.current.clientWidth;
    let height = mountRef.current.clientHeight;

    // Handle case where container might be 0 height initially
    if (width === 0 || height === 0) {
        width = 500; 
        height = 300;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    
    // Local target vector to avoid TS errors
    const target = new THREE.Vector3(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    // --- Sphere Geometry (Inside Out) ---
    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1);

    // --- Texture Loading ---
    const textureLoader = new THREE.TextureLoader();
    
    // We use a callback to ensure we know when it's ready
    const texture = textureLoader.load(
        imageUrl,
        () => {
            setTextureLoaded(true);
        },
        undefined,
        (err) => console.error("Texture load failed", err)
    );
    texture.colorSpace = THREE.SRGBColorSpace;

    const material = new THREE.MeshBasicMaterial({ map: texture });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    // --- Camera Control Logic ---
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

    const container = mountRef.current;
    container.addEventListener('mousedown', onPointerDown);
    document.addEventListener('mousemove', onPointerMove);
    document.addEventListener('mouseup', onPointerUp);

    // --- Resize Handler ---
    const handleResize = () => {
        if (!mountRef.current) return;
        const newWidth = mountRef.current.clientWidth;
        const newHeight = mountRef.current.clientHeight;
        
        if (newWidth && newHeight) {
            camera.aspect = newWidth / newHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(newWidth, newHeight);
        }
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(container);

    // --- Animation Loop ---
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      if (!isInteracting) {
        lon += 0.05; // Slow rotation
      }

      lat = Math.max(-85, Math.min(85, lat));
      phi = THREE.MathUtils.degToRad(90 - lat);
      theta = THREE.MathUtils.degToRad(lon);

      target.x = 500 * Math.sin(phi) * Math.cos(theta);
      target.y = 500 * Math.cos(phi);
      target.z = 500 * Math.sin(phi) * Math.sin(theta);

      camera.lookAt(target);
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      if (container) {
        container.removeEventListener('mousedown', onPointerDown);
        if (container.contains(renderer.domElement)) {
            container.removeChild(renderer.domElement);
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
    <div className="relative w-full h-full group cursor-move bg-black">
      <div ref={mountRef} className="w-full h-full rounded-xl overflow-hidden shadow-inner" />
      
      {!textureLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
            <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        </div>
      )}

      {textureLoaded && (
        <>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1 rounded-full pointer-events-none transition-opacity opacity-100 group-hover:opacity-0 backdrop-blur-md">
                Drag to look around
            </div>
            <div className="absolute top-2 right-2 bg-indigo-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg uppercase backdrop-blur-sm">
                3D View
            </div>
        </>
      )}
    </div>
  );
};

export default PanoramaViewer;
