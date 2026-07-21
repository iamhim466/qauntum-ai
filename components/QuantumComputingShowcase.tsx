"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createGlowCanvas } from "@/lib/three-utils";  type Phase = "idle" | "applying";

const GATES = ["H", "X", "Z", "CNOT"] as const;

export default function QuantumComputingShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rafRef = useRef<number>(0);
  const clockRef = useRef(new THREE.Clock());
  const phaseRef = useRef<Phase>("idle");

  // Bloch sphere qubit state: theta (0..PI), phi (azimuthal)
  const thetaRef = useRef(Math.PI / 2);
  const phiRef = useRef(0);
  const targetThetaRef = useRef(Math.PI / 2);
  const targetPhiRef = useRef(0);
  const gateIndexRef = useRef(0);
  const applyTimeRef = useRef(0);

  // Camera orbit
  const isDraggingRef = useRef(false);
  const didDragRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const cameraAngleRef = useRef({ theta: Math.PI / 4, phi: Math.PI / 5 });
  const cameraDistance = 6;

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
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    cameraRef.current = camera;

    const R = 2;

    // ── Bloch Sphere (translucent wireframe) ────────────────
    const sphereGeo = new THREE.SphereGeometry(R, 64, 64);
    const sphereColors = new Float32Array(sphereGeo.attributes.position.count * 3);
    const posAttr = sphereGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const y = posAttr.getY(i);
      const t = (y / R + 1) / 2;
      sphereColors[i * 3] = 0.05 + t * 0.15;
      sphereColors[i * 3 + 1] = 0.85 * (1 - t) + 0.05;
      sphereColors[i * 3 + 2] = 0.3 + t * 0.5;
    }
    sphereGeo.setAttribute("color", new THREE.BufferAttribute(sphereColors, 3));
    const sphereMat = new THREE.MeshPhysicalMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.2,
      roughness: 0.3,
      metalness: 0.1,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    scene.add(new THREE.Mesh(sphereGeo, sphereMat));

    // Wireframe latitude rings
    for (let i = 1; i < 6; i++) {
      const latAngle = (i / 6) * Math.PI;
      const r = R * Math.sin(latAngle);
      const y = R * Math.cos(latAngle);
      const ringGeo = new THREE.BufferGeometry().setFromPoints(
        new THREE.Path().absarc(0, 0, r, 0, Math.PI * 2, false).getPoints(64)
          .map((p) => new THREE.Vector3(p.x, y, p.y))
      );
      scene.add(new THREE.Line(ringGeo, new THREE.LineBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.12 })));
    }

    // Meridian lines
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI;
      const pts: THREE.Vector3[] = [];
      for (let j = 0; j <= 64; j++) {
        const t = (j / 64) * Math.PI * 2;
        pts.push(new THREE.Vector3(
          R * Math.sin(t) * Math.cos(angle),
          R * Math.cos(t),
          R * Math.sin(t) * Math.sin(angle)
        ));
      }
      scene.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.08 })
      ));
    }

    // ── Axes ────────────────────────────────────────────────
    const axisMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15 });
    const axLen = R + 0.6;
    // Z
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -axLen, 0), new THREE.Vector3(0, axLen, 0)
    ]), axisMat));
    // X
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-axLen, 0, 0), new THREE.Vector3(axLen, 0, 0)
    ]), axisMat.clone()));
    // Y
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, -axLen), new THREE.Vector3(0, 0, axLen)
    ]), axisMat.clone()));

    // ── Qubit state vector (glowing sphere + line) ──────────
    const qubitMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      emissive: 0x10b981,
      emissiveIntensity: 2,
      roughness: 0.1,
      metalness: 0.3,
    });
    const qubit = new THREE.Mesh(new THREE.SphereGeometry(0.14, 32, 32), qubitMat);
    qubit.name = "qubit";
    scene.add(qubit);

    // Glow
    const glowTex = new THREE.CanvasTexture(createGlowCanvas(0x10b981));
    const glowMat = new THREE.SpriteMaterial({
      map: glowTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const glow = new THREE.Sprite(glowMat);
    glow.scale.set(1.4, 1.4, 1);
    glow.name = "glow";
    scene.add(glow);

    // Vector line from origin to qubit
    const vecLineMat = new THREE.LineBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.8 });
    const vecLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, R, 0)]),
      vecLineMat
    );
    vecLine.name = "vecLine";
    scene.add(vecLine);

    // North/South pole dots
    const poleGeo = new THREE.SphereGeometry(0.06, 16, 16);
    const north = new THREE.Mesh(poleGeo, new THREE.MeshBasicMaterial({ color: 0xff4466 }));
    north.position.set(0, R, 0);
    scene.add(north);
    const south = new THREE.Mesh(poleGeo, new THREE.MeshBasicMaterial({ color: 0x4488ff }));
    south.position.set(0, -R, 0);
    scene.add(south);

    // ── Gate label planes ───────────────────────────────────
    const createGateLabel = (text: string, color: number, pos: THREE.Vector3) => {
      const canvas = document.createElement("canvas");
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = `rgba(0,0,0,0)`;
      ctx.fillRect(0, 0, 128, 128);
      ctx.fillStyle = `#${color.toString(16).padStart(6, "0")}`;
      ctx.strokeStyle = `#${color.toString(16).padStart(6, "0")}`;
      ctx.lineWidth = 4;
      ctx.strokeRect(10, 10, 108, 108);
      ctx.font = "bold 64px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, 64, 64);

      const tex = new THREE.CanvasTexture(canvas);
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.7, depthWrite: false });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.set(0.8, 0.8, 1);
      sprite.position.copy(pos);
      return sprite;
    };

    const gatePositions = [
      new THREE.Vector3(-2.5, 2.2, 0),
      new THREE.Vector3(-0.8, 2.2, 0),
      new THREE.Vector3(0.9, 2.2, 0),
      new THREE.Vector3(2.5, 2.2, 0),
    ];
    GATES.forEach((g, i) => {
      const label = createGateLabel(g, 0x10b981, gatePositions[i]);
      label.name = `gateLabel${i}`;
      scene.add(label);
    });

    // ── Measurement flash ───────────────────────────────────
    const flashMat = new THREE.MeshBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0,
      side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const flash = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.18, 64), flashMat);
    flash.name = "flash";
    scene.add(flash);

    // ── Lights ──────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x404060, 0.5));
    const pl1 = new THREE.PointLight(0x10b981, 2, 20);
    pl1.position.set(3, 4, 3);
    scene.add(pl1);
    const pl2 = new THREE.PointLight(0xff6688, 1, 15);
    pl2.position.set(-3, -2, -3);
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

    const onClick = () => {
      if (didDragRef.current) return;
      if (phaseRef.current === "idle") {
        phaseRef.current = "applying";
        applyTimeRef.current = clockRef.current.getElapsedTime();
        gateIndexRef.current = (gateIndexRef.current + 1) % GATES.length;
        const gate = GATES[gateIndexRef.current];
        if (gate === "H") {
          targetThetaRef.current = Math.PI / 2 + (Math.random() - 0.5) * 1.5;
          targetPhiRef.current = phiRef.current + Math.PI / 2;
        } else if (gate === "X") {
          targetThetaRef.current = Math.PI - thetaRef.current;
        } else if (gate === "Z") {
          targetPhiRef.current = phiRef.current + Math.PI;
        } else {
          targetThetaRef.current = Math.random() < 0.5 ? 0.05 : Math.PI - 0.05;
        }
      }
    };

    renderer.domElement.addEventListener("mousedown", onMouseDown);
    renderer.domElement.addEventListener("mousemove", onMouseMove);
    renderer.domElement.addEventListener("mouseup", onMouseUp);
    renderer.domElement.addEventListener("mouseleave", onMouseUp);
    renderer.domElement.addEventListener("touchstart", onTouchStart, { passive: true });
    renderer.domElement.addEventListener("touchmove", onTouchMove, { passive: true });
    renderer.domElement.addEventListener("touchend", onTouchEnd);
    renderer.domElement.addEventListener("click", onClick);

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
      renderer.domElement.removeEventListener("click", onClick);
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
      const phase = phaseRef.current;
      const R = 2;

      // Camera orbit
      const ca = cameraAngleRef.current;
      camera.position.set(
        cameraDistance * Math.sin(ca.theta) * Math.cos(ca.phi),
        cameraDistance * Math.cos(ca.theta),
        cameraDistance * Math.sin(ca.theta) * Math.sin(ca.phi)
      );
      camera.lookAt(0, 0, 0);

      const qubit = scene.getObjectByName("qubit") as THREE.Mesh;
      const glow = scene.getObjectByName("glow") as THREE.Sprite;
      const vecLine = scene.getObjectByName("vecLine") as THREE.Line;
      const flash = scene.getObjectByName("flash") as THREE.Mesh;

      // Smooth interpolation
      thetaRef.current += (targetThetaRef.current - thetaRef.current) * 0.05;
      phiRef.current += (targetPhiRef.current - phiRef.current) * 0.05;

      const theta = thetaRef.current;
      const phi = phiRef.current;
      const x = R * Math.sin(theta) * Math.cos(phi);
      const y = R * Math.cos(theta);
      const z = R * Math.sin(theta) * Math.sin(phi);

      if (qubit) {
        qubit.position.set(x, y, z);
        const pulse = 1 + Math.sin(time * 3) * 0.12;
        qubit.scale.setScalar(pulse);
        (qubit.material as THREE.MeshPhysicalMaterial).emissiveIntensity =
          phase === "applying" ? 3 + Math.sin(time * 8) * 1 : 1.5 + Math.sin(time * 4) * 0.5;
      }
      if (glow) {
        glow.position.set(x, y, z);
        glow.scale.setScalar(1.4 + Math.sin(time * 2) * 0.15);
      }
      if (vecLine) {
        const positions = vecLine.geometry.attributes.position;
        if (positions) {
          positions.setXYZ(1, x, y, z);
          positions.needsUpdate = true;
        }
      }

      // Flash ring during gate application
      if (flash && phase === "applying") {
        const elapsed = time - applyTimeRef.current;
        const fMat = flash.material as THREE.MeshBasicMaterial;
        if (elapsed < 0.5) {
          fMat.opacity = Math.sin(elapsed * Math.PI * 4) * 0.8;
          flash.scale.setScalar(1 + elapsed * 3);
          flash.lookAt(camera.position);
        } else {
          fMat.opacity = 0;
          phaseRef.current = "idle";
        }
      }

      // Highlight active gate label
      GATES.forEach((_, i) => {
        const label = scene.getObjectByName(`gateLabel${i}`) as THREE.Sprite;
        if (label) {
          const isActive = (phase === "applying" || phase === "idle") && i === gateIndexRef.current;
          (label.material as THREE.SpriteMaterial).opacity = isActive ? 1 : 0.3;
          label.scale.setScalar(isActive ? 1.0 : 0.7);
        }
      });

      renderer.render(scene, camera);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div className="relative w-full h-[70vh] min-h-[500px] rounded-3xl overflow-hidden bg-black/40 border border-emerald-500/20">
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/50 border border-emerald-500/30 text-emerald-300/60 text-sm pointer-events-none select-none">
        Click to apply gate · Drag to orbit
      </div>
    </div>
  );
}
