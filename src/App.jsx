import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  Waves, 
  RefreshCw, 
  Layers, 
  Sun,
  Eye
} from 'lucide-react';

export default function App() {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const mixerRef = useRef(null);
  const actionRef = useRef(null);
  const modelRef = useRef(null);

  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [animProgress, setAnimProgress] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [wireframe, setWireframe] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [modelStats, setModelStats] = useState({
    name: 'City - Medellín - Apocalyptic Flood',
    meshes: 99,
    triangles: 0,
    dimensions: { x: '180', y: '254', z: '300' }
  });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // 1. SCENE SETUP (Clean Studio Daylight - NO blinding blue fog)
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x1e293b); // Elegant dark slate studio background

    // 2. CAMERA
    const camera = new THREE.PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 0.1, 5000);
    camera.position.set(220, 160, 240);
    cameraRef.current = camera;

    // 3. RENDERER
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35; // Bright, vibrant exposure
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. ORBIT CONTROLS
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2;
    controls.maxDistance = 2500;
    controlsRef.current = controls;

    // 5. COMPREHENSIVE 360-DEGREE ILLUMINATION
    // Ambient fill light for vivid textures
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    // Primary Sun Light
    const sunLight = new THREE.DirectionalLight(0xfffbeb, 2.4);
    sunLight.position.set(300, 500, 250);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    scene.add(sunLight);

    // Secondary Fill Light (opposite side)
    const fillLight = new THREE.DirectionalLight(0x93c5fd, 1.2);
    fillLight.position.set(-300, 300, -250);
    scene.add(fillLight);

    // Front soft light
    const frontLight = new THREE.DirectionalLight(0xffffff, 0.8);
    frontLight.position.set(0, 150, 400);
    scene.add(frontLight);

    // Hemisphere sky bounce
    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x334155, 0.8);
    scene.add(hemiLight);

    // 6. LOAD MEDELLÍN GLB MODEL
    const loader = new GLTFLoader();
    loader.load(
      '/models/medellin_flood.glb',
      (gltf) => {
        const model = gltf.scene;
        modelRef.current = model;

        // Compute Bounding Box of the model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);

        // Perfectly center the model at (0, 0, 0)
        model.position.x = -center.x;
        model.position.y = -center.y;
        model.position.z = -center.z;

        let totalTriangles = 0;

        // Traverse meshes to configure materials & water plane
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            if (child.name === 'Plane_SEA_1') {
              // Enhance Sea/Water material so it looks like realistic azure floodwater
              if (child.material) {
                child.material.color = new THREE.Color(0x0284c7);
                child.material.transparent = true;
                child.material.opacity = 0.85;
                child.material.roughness = 0.1;
                child.material.metalness = 0.8;
                child.material.side = THREE.DoubleSide;
              }
            } else {
              // Ensure all building textures render double-sided and bright
              if (child.material) {
                child.material.side = THREE.DoubleSide;
                child.material.roughness = Math.min(child.material.roughness || 0.5, 0.75);
                if (child.material.map) {
                  child.material.map.colorSpace = THREE.SRGBColorSpace;
                }
              }
            }

            if (child.geometry?.index) {
              totalTriangles += child.geometry.index.count / 3;
            } else if (child.geometry?.attributes?.position) {
              totalTriangles += child.geometry.attributes.position.count / 3;
            }
          }
        });

        scene.add(model);

        // Adjust Camera distance dynamically to fit the model perfectly in view
        const fov = camera.fov * (Math.PI / 180);
        let camDist = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.35;
        camera.position.set(camDist * 0.75, camDist * 0.5, camDist * 0.75);
        camera.lookAt(0, 0, 0);
        camera.near = maxDim / 200;
        camera.far = maxDim * 20;
        camera.updateProjectionMatrix();

        controls.target.set(0, 0, 0);
        controls.update();

        setModelStats({
          name: 'City - Medellín - Apocalyptic Flood',
          meshes: 99,
          triangles: Math.round(totalTriangles),
          dimensions: { x: size.x.toFixed(0), y: size.y.toFixed(0), z: size.z.toFixed(0) }
        });

        // 7. CONFIGURE EMBEDDED FLOOD SURGE ANIMATION MIXER
        if (gltf.animations && gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(model);
          mixerRef.current = mixer;

          const clip = gltf.animations[0];
          const action = mixer.clipAction(clip);
          action.setLoop(THREE.LoopPingPong);
          action.play();
          actionRef.current = action;
        }

        setIsLoading(false);
      },
      (xhr) => {
        if (xhr.total > 0) {
          setLoadProgress(Math.round((xhr.loaded / xhr.total) * 100));
        }
      },
      (err) => {
        console.error('Error loading Medellín GLB:', err);
        setIsLoading(false);
      }
    );

    // 8. ANIMATION LOOP
    const clock = new THREE.Clock();
    let animId;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      if (controlsRef.current) {
        if (controlsRef.current.autoRotate !== autoRotate) {
          controlsRef.current.autoRotate = autoRotate;
          controlsRef.current.autoRotateSpeed = 0.8;
        }
        controlsRef.current.update();
      }

      // Update Animation Mixer for Flood Sea Plane
      if (mixerRef.current && isPlaying) {
        mixerRef.current.update(delta);
        if (actionRef.current) {
          const dur = actionRef.current.getClip().duration || 1;
          const curr = actionRef.current.time % dur;
          setAnimProgress(parseFloat((curr / dur).toFixed(3)));
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (mount && renderer.domElement) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update autoRotate
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
      controlsRef.current.autoRotateSpeed = 0.8;
    }
  }, [autoRotate]);

  // Update wireframe
  useEffect(() => {
    if (!modelRef.current) return;
    modelRef.current.traverse((child) => {
      if (child.isMesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.wireframe = wireframe);
        } else {
          child.material.wireframe = wireframe;
        }
      }
    });
  }, [wireframe]);

  // Scrubber drag handler
  const handleScrubberChange = (val) => {
    setAnimProgress(val);
    if (actionRef.current && mixerRef.current) {
      const dur = actionRef.current.getClip().duration || 1;
      actionRef.current.time = val * dur;
      mixerRef.current.update(0);
    }
  };

  const resetCamera = () => {
    if (cameraRef.current && controlsRef.current && modelRef.current) {
      const box = new THREE.Box3().setFromObject(modelRef.current);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = cameraRef.current.fov * (Math.PI / 180);
      let camDist = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.35;
      cameraRef.current.position.set(camDist * 0.75, camDist * 0.5, camDist * 0.75);
      cameraRef.current.lookAt(0, 0, 0);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  return (
    <div className="relative w-screen h-screen bg-slate-900 text-slate-100 overflow-hidden select-none font-sans">
      
      {/* 1. MAIN FULLSCREEN 3D CANVAS */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* 2. LOADING SCREEN OVERLAY */}
      {isLoading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-xl">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-cyan-500 to-sky-400 p-0.5 animate-spin shadow-2xl mb-4">
            <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center">
              <Waves className="w-8 h-8 text-cyan-400" />
            </div>
          </div>
          <h2 className="text-base font-bold text-white tracking-wider uppercase mb-1">
            Loading Medellín 3D Model
          </h2>
          <p className="text-xs text-slate-400 font-mono mb-3">
            Loading {loadProgress}% (98 Textures & Geometry)
          </p>
          <div className="w-56 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 to-sky-400 transition-all duration-200"
              style={{ width: `${loadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* 3. MINIMAL TOP-LEFT MODEL STATUS BADGE */}
      <div className="absolute top-5 left-5 z-20 pointer-events-none flex items-center gap-3 bg-slate-900/80 backdrop-blur-xl border border-white/10 px-4 py-2.5 rounded-2xl shadow-2xl">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xs font-black tracking-wider uppercase text-white">
              {modelStats.name}
            </h1>
            <span className="px-2 py-0.5 text-[9px] font-mono font-bold rounded bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
              GLB 3D MODEL
            </span>
          </div>
          <p className="text-[10px] text-slate-300 font-mono mt-0.5">
            {modelStats.meshes} Meshes • {modelStats.triangles.toLocaleString()} Polygons • {modelStats.dimensions.x}m × {modelStats.dimensions.y}m × {modelStats.dimensions.z}m
          </p>
        </div>
      </div>

      {/* 4. SLEEK MINIMAL FLOATING CONTROLLER (BOTTOM CENTER) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-slate-900/85 backdrop-blur-2xl border border-white/15 px-5 py-3 rounded-3xl shadow-2xl max-w-[94vw] transition-all">
        
        {/* Play/Pause Embedded Flood Surge Animation */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
            isPlaying
              ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/40'
              : 'bg-white/10 hover:bg-white/20 text-slate-100'
          }`}
          title={isPlaying ? 'Pause Flood Animation' : 'Play Flood Animation'}
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
        </button>

        {/* Flood Surge Scrubber */}
        <div className="flex items-center gap-3 border-l border-r border-white/15 px-4">
          <div className="flex items-center gap-1.5 text-cyan-300 font-mono text-xs font-bold whitespace-nowrap">
            <Waves className="w-4 h-4" />
            <span>Flood Surge {Math.round(animProgress * 100)}%</span>
          </div>

          <input
            type="range"
            min="0"
            max="1.0"
            step="0.005"
            value={animProgress}
            onChange={(e) => {
              setIsPlaying(false);
              handleScrubberChange(parseFloat(e.target.value));
            }}
            className="w-36 sm:w-56 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
          />

          <button
            onClick={() => handleScrubberChange(0)}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            title="Rewind Flood to Start"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Reset Camera View */}
        <button
          onClick={resetCamera}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-all border border-white/10"
          title="Reset Camera Framing"
        >
          Reset View
        </button>

        {/* Wireframe Toggle */}
        <button
          onClick={() => setWireframe(!wireframe)}
          className={`p-2 rounded-2xl border transition-all ${
            wireframe
              ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-200'
              : 'border-transparent text-slate-300 hover:text-white hover:bg-white/10'
          }`}
          title="Toggle Wireframe Mesh"
        >
          <Layers className="w-4 h-4" />
        </button>

        {/* Auto-Rotate Toggle */}
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`p-2 rounded-2xl border transition-all ${
            autoRotate
              ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-200'
              : 'border-transparent text-slate-300 hover:text-white hover:bg-white/10'
          }`}
          title="Toggle Cinematic Auto-Rotation"
        >
          <RefreshCw className={`w-4 h-4 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-2xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

      </div>

    </div>
  );
}
