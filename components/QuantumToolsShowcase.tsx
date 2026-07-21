"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

type Phase = "building" | "ready" | "running" | "done";

interface Gate {
  type: string;
  qubit: number;
  x: number;
}

const QUBIT_COUNT = 3;
const QUBIT_SPACING = 1.5;

const INITIAL_GATES: Gate[] = [
  { type: "H", qubit: 0, x: -3 },
  { type: "X", qubit: 1, x: -1.5 },
  { type: "CNOT", qubit: 0, x: 0 },
  { type: "Z", qubit: 2, x: 1.5 },
  { type: "H", qubit: 1, x: 3 },
];

export default function QuantumToolsShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rafRef = useRef<number>(0);
  const clockRef = useRef(new THREE.Clock());
  const phaseRef = useRef<Phase>("building");
  const gatesVisibleRef = useRef(0);
  const runStartTimeRef = useRef(0);

  const isDraggingRef = useRef(false);
  const didDragRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const cameraAngleRef = useRef({ theta: Math.PI / 4, phi: 0 });
  const cameraDistance = 10;

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

    // ── Qubit lines ─────────────────────────────────────────
    const lineMat = new THREE.LineBasicMaterial({ color: 0x14b8a6, transparent: true, opacity: 0.4 });
    for (let i = 0; i < QUBIT_COUNT; i++) {
      const y = (i - (QUBIT_COUNT - 1) / 2) * QUBIT_SPACING;
      const pts = [new THREE.Vector3(-5, y, 0), new THREE.Vector3(5, y, 0)];
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat.clone()));

      // Qubit label
      const canvas = document.createElement("canvas");
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext("2d")!;
      ctx.font = "bold 32px sans-serif";
      ctx.fillStyle = "#14b8a6";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`q${i}`, 32, 32);
      const tex = new THREE.CanvasTexture(canvas);
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: tex, transparent: true, depthWrite: false,
      }));
      sprite.scale.set(0.6, 0.6, 1);
      sprite.position.set(-5.5, y, 0);
      scene.add(sprite);
    }

    // ── Measurement dots at the end ─────────────────────────
    for (let i = 0; i < QUBIT_COUNT; i++) {
      const y = (i - (QUBIT_COUNT - 1) / 2) * QUBIT_SPACING;
      const meter = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 })
      );
      meter.position.set(4.5, y, 0);
      meter.name = `meter${i}`;
      scene.add(meter);
    }

    // ── Pulse particles (for running phase) ─────────────────
    // Will be created dynamically

    // ── Lights ──────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x404060, 0.5));
    const pl1 = new THREE.PointLight(0x14b8a6, 2, 25);
    pl1.position.set(3, 5, 5);
    scene.add(pl1);
    const pl2 = new THREE.PointLight(0x5eead4, 1.5, 20);
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

    const onClick = () => {
      if (didDragRef.current) return;
      if (phaseRef.current === "ready") {
        phaseRef.current = "running";
        runStartTimeRef.current = clockRef.current.getElapsedTime();
      } else if (phaseRef.current === "done") {
        // Reset
        gatesVisibleRef.current = 0;
        phaseRef.current = "building";
        // Remove old gates
        const toRemove: THREE.Object3D[] = [];
        scene.children.forEach((child) => {
          if (child.userData.isGate) toRemove.push(child);
        });
        toRemove.forEach((obj) => scene.remove(obj));
        // Reset meters
        for (let i = 0; i < QUBIT_COUNT; i++) {
          const meter = scene.getObjectByName(`meter${i}`) as THREE.Mesh;
          if (meter) {
            (meter.material as THREE.MeshBasicMaterial).opacity = 0.3;
            (meter.material as THREE.MeshBasicMaterial).color.set(0xffffff);
          }
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

      // Camera
      const ca = cameraAngleRef.current;
      camera.position.set(
        cameraDistance * Math.sin(ca.theta) * Math.cos(ca.phi),
        cameraDistance * Math.cos(ca.theta),
        cameraDistance * Math.sin(ca.theta) * Math.sin(ca.phi)
      );
      camera.lookAt(0, 0, 0);

      if (phase === "building") {
        // Progressively add gates
        const targetCount = Math.min(
          INITIAL_GATES.length,
          Math.floor(time * 1.5)
        );
        if (targetCount > gatesVisibleRef.current) {
          for (let i = gatesVisibleRef.current; i < targetCount; i++) {
            const gate = INITIAL_GATES[i];
            const group = new THREE.Group();
            group.userData.isGate = true;

            const y = (gate.qubit - (QUBIT_COUNT - 1) / 2) * QUBIT_SPACING;

            if (gate.type === "CNOT") {
              const dot = new THREE.Mesh(
                new THREE.SphereGeometry(0.1, 16, 16),
                new THREE.MeshBasicMaterial({ color: 0x14b8a6 })
              );
              dot.position.set(gate.x, y, 0);
              group.add(dot);

              const targetY = (1 - (QUBIT_COUNT - 1) / 2) * QUBIT_SPACING;
              const ring = new THREE.Mesh(
                new THREE.RingGeometry(0.2, 0.25, 32),
                new THREE.MeshBasicMaterial({ color: 0x14b8a6, side: THREE.DoubleSide })
              );
              ring.position.set(gate.x, targetY, 0);
              group.add(ring);

              const crossH = new THREE.Line(
                new THREE.BufferGeometry().setFromPoints([
                  new THREE.Vector3(gate.x - 0.2, targetY, 0),
                  new THREE.Vector3(gate.x + 0.2, targetY, 0),
                ]),
                new THREE.LineBasicMaterial({ color: 0x14b8a6 })
              );
              group.add(crossH);
              const crossV = new THREE.Line(
                new THREE.BufferGeometry().setFromPoints([
                  new THREE.Vector3(gate.x, targetY - 0.2, 0),
                  new THREE.Vector3(gate.x, targetY + 0.2, 0),
                ]),
                new THREE.LineBasicMaterial({ color: 0x14b8a6 })
              );
              group.add(crossV);

              const conn = new THREE.Line(
                new THREE.BufferGeometry().setFromPoints([
                  new THREE.Vector3(gate.x, y, 0),
                  new THREE.Vector3(gate.x, targetY, 0),
                ]),
                new THREE.LineBasicMaterial({ color: 0x14b8a6, transparent: true, opacity: 0.6 })
              );
              group.add(conn);
            } else {
              const box = new THREE.Mesh(
                new THREE.BoxGeometry(0.6, 0.6, 0.1),
                new THREE.MeshPhysicalMaterial({
                  color: 0x14b8a6,
                  emissive: 0x14b8a6,
                  emissiveIntensity: 0.5,
                  transparent: true,
                  opacity: 0.8,
                  roughness: 0.2,
                  metalness: 0.3,
                })
              );
              box.position.set(gate.x, y, 0);
              group.add(box);

              const canvas = document.createElement("canvas");
              canvas.width = 64;
              canvas.height = 64;
              const ctx = canvas.getContext("2d")!;
              ctx.font = "bold 40px sans-serif";
              ctx.fillStyle = "#ffffff";
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText(gate.type, 32, 32);
              const tex = new THREE.CanvasTexture(canvas);
              const label = new THREE.Sprite(new THREE.SpriteMaterial({
                map: tex, transparent: true, depthWrite: false,
              }));
              label.scale.set(0.5, 0.5, 1);
              label.position.set(gate.x, y, 0.1);
              group.add(label);
            }

            scene.add(group);
          }
          gatesVisibleRef.current = targetCount;
        }

        if (gatesVisibleRef.current >= INITIAL_GATES.length) {
          phaseRef.current = "ready";
        }
      } else if (phase === "ready") {
        // Pulse gates gently
        scene.children.forEach((child) => {
          if (child.userData.isGate) {
            child.children.forEach((c) => {
              if (c instanceof THREE.Mesh && c.material instanceof THREE.MeshPhysicalMaterial) {
                c.material.emissiveIntensity = 0.3 + Math.sin(time * 2) * 0.2;
              }
            });
          }
        });
      } else if (phase === "running") {
        const elapsed = time - runStartTimeRef.current;
        const progress = Math.min(1, elapsed / 3);

        // Send pulse particles along each qubit line
        for (let i = 0; i < QUBIT_COUNT; i++) {
          const y = (i - (QUBIT_COUNT - 1) / 2) * QUBIT_SPACING;
          const pulseX = -5 + progress * 10;

          // Create pulse particle
          if (Math.floor(elapsed * 10) % 2 === 0 && i === 0) {
            const pulseGeo = new THREE.SphereGeometry(0.08, 8, 8);
            const pulseMat = new THREE.MeshBasicMaterial({
              color: 0x5eead4, transparent: true, opacity: 0.8,
              blending: THREE.AdditiveBlending, depthWrite: false,
            });
            const pulse = new THREE.Mesh(pulseGeo, pulseMat);
            pulse.position.set(pulseX, y, 0);
            pulse.userData.life = 1.0;
            pulse.name = "runPulse";
            scene.add(pulse);
          }

          // Light up meter at the end
          if (progress > 0.8) {
            const meter = scene.getObjectByName(`meter${i}`) as THREE.Mesh;
            if (meter) {
              (meter.material as THREE.MeshBasicMaterial).opacity = 1;
              (meter.material as THREE.MeshBasicMaterial).color.set(
                Math.random() > 0.5 ? 0x22c55e : 0xef4444
              );
            }
          }
        }

        // Animate pulses
        for (let i = scene.children.length - 1; i >= 0; i--) {
          const child = scene.children[i];
          if (child.name !== "runPulse") continue;
          const p = child as THREE.Mesh;
          p.userData.life -= 0.02;
          (p.material as THREE.MeshBasicMaterial).opacity = p.userData.life * 0.8;
          p.position.x += 0.08;
          if (p.userData.life <= 0) {
            scene.remove(p);
            (p.material as THREE.MeshBasicMaterial).dispose();
          }
        }

        if (progress >= 1) {
          phaseRef.current = "done";
        }
      } else if (phase === "done") {
        // Hold final state with pulsing meters
        for (let i = 0; i < QUBIT_COUNT; i++) {
          const meter = scene.getObjectByName(`meter${i}`) as THREE.Mesh;
          if (meter) {
            const pulse = 0.8 + Math.sin(time * 3 + i) * 0.2;
            (meter.material as THREE.MeshBasicMaterial).opacity = pulse;
          }
        }
      }

      renderer.render(scene, camera);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div className="relative w-full h-[70vh] min-h-[500px] rounded-3xl overflow-hidden bg-black/40 border border-teal-500/20">
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/50 border border-teal-500/30 text-teal-300/60 text-sm pointer-events-none select-none">
        Click to run circuit · Drag to orbit
      </div>
    </div>
  );
}
