"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createGlowCanvas } from "@/lib/three-utils";

export default function WaveFunctionShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rafRef = useRef<number>(0);
  const clockRef = useRef(new THREE.Clock());

  const isDraggingRef = useRef(false);
  const didDragRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const cameraAngleRef = useRef({ theta: Math.PI / 4, phi: Math.PI / 6 });
  const cameraDistance = 8;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      45, container.clientWidth / container.clientHeight, 0.1, 100
    );
    cameraRef.current = camera;

    // ── Wave function surface (real part ψ) ─────────────────
    const waveResX = 80;
    const waveResZ = 40;
    const waveGeo = new THREE.PlaneGeometry(6, 3, waveResX - 1, waveResZ - 1);
    waveGeo.rotateX(-Math.PI / 2);
    const waveMat = new THREE.MeshPhysicalMaterial({
      color: 0xa855f7,
      emissive: 0xa855f7,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.6,
      roughness: 0.3,
      metalness: 0.2,
      side: THREE.DoubleSide,
      wireframe: false,
      depthWrite: false,
    });
    const waveMesh = new THREE.Mesh(waveGeo, waveMat);
    waveMesh.name = "wave";
    scene.add(waveMesh);



    // ── Probability density surface (|ψ|²) ─────────────────
    const probGeo = new THREE.PlaneGeometry(6, 3, waveResX - 1, waveResZ - 1);
    probGeo.rotateX(-Math.PI / 2);
    const probMat = new THREE.MeshPhysicalMaterial({
      color: 0xd8b4fe,
      emissive: 0xd8b4fe,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.4,
      roughness: 0.2,
      metalness: 0.1,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const probMesh = new THREE.Mesh(probGeo, probMat);
    probMesh.name = "prob";
    probMesh.position.y = -2;
    scene.add(probMesh);

    // ── Ground plane reference ───────────────────────────────
    const groundGeo = new THREE.PlaneGeometry(8, 5);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0.03, side: THREE.DoubleSide,
    });
    scene.add(new THREE.Mesh(groundGeo, groundMat));

    // Grid lines
    const gridHelper = new THREE.GridHelper(8, 20, 0x444444, 0x222222);
    gridHelper.material.transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.15;
    scene.add(gridHelper);

    // ── Labels ──────────────────────────────────────────────
    const createLabel = (text: string, color: number, pos: THREE.Vector3) => {
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 64;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "rgba(0,0,0,0)";
      ctx.fillRect(0, 0, 256, 64);
      ctx.font = "bold 32px sans-serif";
      ctx.fillStyle = `#${color.toString(16).padStart(6, "0")}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, 128, 32);
      const tex = new THREE.CanvasTexture(canvas);
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.set(2, 0.5, 1);
      sprite.position.copy(pos);
      return sprite;
    };

    scene.add(createLabel("ψ (wave function)", 0xa855f7, new THREE.Vector3(-3.5, 1.2, 0)));
    scene.add(createLabel("|ψ|² (probability)", 0xd8b4fe, new THREE.Vector3(-3.5, -1.2, 0)));

    // ── Axis lines ──────────────────────────────────────────
    const axisMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15 });
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-3.5, -2.5, 0), new THREE.Vector3(3.5, -2.5, 0)
    ]), axisMat));

    // ── Lights ──────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x404060, 0.5));
    const pl1 = new THREE.PointLight(0xa855f7, 2, 20);
    pl1.position.set(3, 5, 3);
    scene.add(pl1);
    const pl2 = new THREE.PointLight(0xd8b4fe, 1.5, 15);
    pl2.position.set(-3, -3, -3);
    scene.add(pl2);

    // ── Events ──────────────────────────────────────────────
    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      didDragRef.current = false;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) didDragRef.current = true;
      cameraAngleRef.current.phi -= dx * 0.005;
      cameraAngleRef.current.theta = Math.max(0.1, Math.min(Math.PI - 0.1, cameraAngleRef.current.theta - dy * 0.005));
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const onMouseUp = () => { isDraggingRef.current = false; };
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        didDragRef.current = false;
        lastMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - lastMouseRef.current.x;
      const dy = e.touches[0].clientY - lastMouseRef.current.y;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) didDragRef.current = true;
      cameraAngleRef.current.phi -= dx * 0.005;
      cameraAngleRef.current.theta = Math.max(0.1, Math.min(Math.PI - 0.1, cameraAngleRef.current.theta - dy * 0.005));
      lastMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchEnd = () => { isDraggingRef.current = false; };

    renderer.domElement.addEventListener("mousedown", onMouseDown);
    renderer.domElement.addEventListener("mousemove", onMouseMove);
    renderer.domElement.addEventListener("mouseup", onMouseUp);
    renderer.domElement.addEventListener("mouseleave", onMouseUp);
    renderer.domElement.addEventListener("touchstart", onTouchStart, { passive: true });
    renderer.domElement.addEventListener("touchmove", onTouchMove, { passive: true });
    renderer.domElement.addEventListener("touchend", onTouchEnd);

    const onResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      rendererRef.current.setSize(w, h);
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      renderer.domElement.removeEventListener("mousedown", onMouseDown);
      renderer.domElement.removeEventListener("mousemove", onMouseMove);
      renderer.domElement.removeEventListener("mouseup", onMouseUp);
      renderer.domElement.removeEventListener("mouseleave", onMouseUp);
      renderer.domElement.removeEventListener("touchstart", onTouchStart);
      renderer.domElement.removeEventListener("touchmove", onTouchMove);
      renderer.domElement.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("resize", onResize);
      container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  // ── Animation loop ──────────────────────────────────────
  useEffect(() => {
    const animate = () => {
      const scene = sceneRef.current;
      const camera = cameraRef.current;
      const renderer = rendererRef.current;
      if (!scene || !camera || !renderer) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      const time = clockRef.current.getElapsedTime();

      // Camera orbit
      const ca = cameraAngleRef.current;
      camera.position.set(
        cameraDistance * Math.sin(ca.theta) * Math.cos(ca.phi),
        cameraDistance * Math.cos(ca.theta),
        cameraDistance * Math.sin(ca.theta) * Math.sin(ca.phi)
      );
      camera.lookAt(0, -0.5, 0);

      const wave = scene.getObjectByName("wave") as THREE.Mesh;
      const prob = scene.getObjectByName("prob") as THREE.Mesh;
      const timeOffset = time * 2;

      if (wave) {
        const geo = wave.geometry;
        const posAttr = geo.attributes.position;

        for (let i = 0; i < posAttr.count; i++) {
          const x = posAttr.getX(i);
          const z = posAttr.getZ(i);

          // Gaussian envelope + sinusoidal wave
          const sigma = 1.2;
          const gaussian = Math.exp(-(x * x) / (2 * sigma * sigma));
          const amplitude = gaussian * Math.sin(x * 2 - timeOffset) * 1.2;

          // Add secondary wave for visual richness
          const secondary = Math.exp(-(x * x) / (2 * (sigma * 1.5) ** 2))
            * Math.sin(x * 3 - timeOffset * 1.3) * 0.3;

          posAttr.setY(i, amplitude + secondary);
        }
        posAttr.needsUpdate = true;
        geo.computeVertexNormals();
      }

      if (prob) {
        const geo = prob.geometry;
        const posAttr = geo.attributes.position;

        for (let i = 0; i < posAttr.count; i++) {
          const x = posAttr.getX(i);

          // |ψ|² = gaussian² * sin²
          const sigma = 1.2;
          const gaussian = Math.exp(-(x * x) / (2 * sigma * sigma));
          const psiVal = gaussian * Math.sin(x * 2 - timeOffset);
          const probVal = psiVal * psiVal * 2; // |ψ|²

          posAttr.setY(i, -probVal);
        }
        posAttr.needsUpdate = true;
        geo.computeVertexNormals();
      }

      renderer.render(scene, camera);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div className="relative w-full h-[70vh] min-h-[500px] rounded-3xl overflow-hidden bg-black/40 border border-purple-500/20">
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/50 border border-purple-500/30 text-purple-300/60 text-sm pointer-events-none select-none">
        Drag to orbit · Watch the wave function evolve
      </div>
    </div>
  );
}
