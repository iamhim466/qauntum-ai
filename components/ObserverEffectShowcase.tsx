"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createGlowCanvas } from "@/lib/three-utils";

type Phase = "superposition" | "observing" | "collapsed" | "resetting";

// Pre-create particles for the probability cloud
const CLOUD_COUNT = 80;

export default function ObserverEffectShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rafRef = useRef<number>(0);
  const clockRef = useRef(new THREE.Clock());
  const phaseRef = useRef<Phase>("superposition");
  const collapseTimeRef = useRef(0);

  const isDraggingRef = useRef(false);
  const didDragRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const cameraAngleRef = useRef({ theta: Math.PI / 3, phi: Math.PI / 6 });
  const cameraDistance = 7;

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

    // ── Probability cloud particles ─────────────────────────
    const cloudGroup = new THREE.Group();
    cloudGroup.name = "cloud";
    scene.add(cloudGroup);

    for (let i = 0; i < CLOUD_COUNT; i++) {
      // Random positions in a sphere
      const r = 1.5 + Math.random() * 1.5;
      const theta = Math.random() * Math.PI;
      const phi = Math.random() * Math.PI * 2;
      const x = r * Math.sin(theta) * Math.cos(phi);
      const y = r * Math.cos(theta);
      const z = r * Math.sin(theta) * Math.sin(phi);

      const dotGeo = new THREE.SphereGeometry(0.04 + Math.random() * 0.04, 8, 8);
      const dotMat = new THREE.MeshBasicMaterial({
        color: 0x6366f1,
        transparent: true,
        opacity: 0.4 + Math.random() * 0.3,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.set(x, y, z);
      dot.userData.targetPos = new THREE.Vector3(x, y, z);
      dot.userData.basePos = new THREE.Vector3(x, y, z);
      dot.userData.speed = 0.5 + Math.random() * 1.5;
      dot.userData.phase = Math.random() * Math.PI * 2;
      cloudGroup.add(dot);
    }

    // ── Central probability core (faint) ────────────────────
    const coreGeo = new THREE.SphereGeometry(0.3, 32, 32);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0x6366f1,
      emissive: 0x6366f1,
      emissiveIntensity: 1,
      transparent: true,
      opacity: 0.3,
      roughness: 0.2,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.name = "core";
    scene.add(core);

    // Core glow
    const coreGlow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(createGlowCanvas(0x6366f1)),
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    coreGlow.scale.set(2, 2, 1);
    coreGlow.name = "coreGlow";
    scene.add(coreGlow);

    // ── Observer eye (initially hidden) ─────────────────────
    const eyeMat = new THREE.MeshBasicMaterial({
      color: 0xff6644, transparent: true, opacity: 0,
    });
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 16), eyeMat);
    eye.position.set(0, 3, 0);
    eye.name = "observer";
    scene.add(eye);

    // Eye ring
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xff6644, transparent: true, opacity: 0,
      side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.38, 32), ringMat);
    ring.position.set(0, 3, 0);
    ring.name = "eyeRing";
    scene.add(ring);

    // Measurement beam (line from eye to center)
    const beamMat = new THREE.LineBasicMaterial({
      color: 0xff6644, transparent: true, opacity: 0,
    });
    const beam = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 3, 0), new THREE.Vector3(0, 0, 0)
      ]),
      beamMat
    );
    beam.name = "beam";
    scene.add(beam);

    // ── Collapsed state dot (initially hidden) ──────────────
    const collapsedMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      emissive: 0x6366f1,
      emissiveIntensity: 3,
      transparent: true,
      opacity: 0,
    });
    const collapsedDot = new THREE.Mesh(new THREE.SphereGeometry(0.2, 32, 32), collapsedMat);
    collapsedDot.name = "collapsedDot";
    scene.add(collapsedDot);

    const collapsedGlow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(createGlowCanvas(0x6366f1)),
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0,
    }));
    collapsedGlow.scale.set(2, 2, 1);
    collapsedGlow.name = "collapsedGlow";
    scene.add(collapsedGlow);

    // ── Lights ──────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x404060, 0.5));
    const pl1 = new THREE.PointLight(0x6366f1, 2, 20);
    pl1.position.set(3, 4, 3);
    scene.add(pl1);
    const pl2 = new THREE.PointLight(0xff6644, 1.5, 15);
    pl2.position.set(0, 4, 0);
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
      if (phaseRef.current === "superposition") {
        phaseRef.current = "observing";
        collapseTimeRef.current = clockRef.current.getElapsedTime();
      } else if (phaseRef.current === "collapsed") {
        phaseRef.current = "resetting";
        collapseTimeRef.current = clockRef.current.getElapsedTime();
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

      const cloud = scene.getObjectByName("cloud") as THREE.Group;
      const core = scene.getObjectByName("core") as THREE.Mesh;
      const coreGlow = scene.getObjectByName("coreGlow") as THREE.Sprite;
      const observer = scene.getObjectByName("observer") as THREE.Mesh;
      const eyeRing = scene.getObjectByName("eyeRing") as THREE.Mesh;
      const beam = scene.getObjectByName("beam") as THREE.Line;
      const collapsedDot = scene.getObjectByName("collapsedDot") as THREE.Mesh;
      const collapsedGlow = scene.getObjectByName("collapsedGlow") as THREE.Sprite;

      if (phase === "superposition") {
        // Cloud particles float and drift
        if (cloud) {
          cloud.children.forEach((child) => {
            const dot = child as THREE.Mesh;
            const base = dot.userData.basePos as THREE.Vector3;
            const speed = dot.userData.speed;
            const ph = dot.userData.phase;
            dot.position.x = base.x + Math.sin(time * speed + ph) * 0.3;
            dot.position.y = base.y + Math.cos(time * speed * 0.7 + ph) * 0.2;
            dot.position.z = base.z + Math.sin(time * speed * 0.5 + ph * 2) * 0.25;
            (dot.material as THREE.MeshBasicMaterial).opacity = 0.3 + Math.sin(time * 2 + ph) * 0.15;
          });
        }
        if (core) {
          const pulse = 1 + Math.sin(time * 2) * 0.2;
          core.scale.setScalar(pulse);
          (core.material as THREE.MeshPhysicalMaterial).opacity = 0.2 + Math.sin(time * 3) * 0.1;
        }
        if (coreGlow) {
          coreGlow.scale.setScalar(2 + Math.sin(time * 2) * 0.3);
        }
        // Hide observer
        if (observer) (observer.material as THREE.MeshBasicMaterial).opacity = 0;
        if (eyeRing) (eyeRing.material as THREE.MeshBasicMaterial).opacity = 0;
        if (beam) (beam.material as THREE.LineBasicMaterial).opacity = 0;
        if (collapsedDot) (collapsedDot.material as THREE.MeshPhysicalMaterial).opacity = 0;
        if (collapsedGlow) (collapsedGlow.material as THREE.SpriteMaterial).opacity = 0;
      } else if (phase === "observing") {
        const elapsed = time - collapseTimeRef.current;
        const progress = Math.min(1, elapsed * 1.2);

        // Show observer eye
        if (observer) {
          (observer.material as THREE.MeshBasicMaterial).opacity = progress;
          observer.position.y = 3 - progress * 0.5;
        }
        if (eyeRing) {
          (eyeRing.material as THREE.MeshBasicMaterial).opacity = progress * 0.7;
          eyeRing.position.y = observer.position.y;
          eyeRing.rotation.z = time * 2;
          eyeRing.scale.setScalar(1 + Math.sin(time * 4) * 0.1);
        }
        if (beam) {
          (beam.material as THREE.LineBasicMaterial).opacity = progress * 0.5;
        }

        // Collapse cloud toward center
        if (cloud) {
          cloud.children.forEach((child) => {
            const dot = child as THREE.Mesh;
            const base = dot.userData.basePos as THREE.Vector3;
            dot.position.lerp(new THREE.Vector3(0, 0, 0), progress * 0.08);
            (dot.material as THREE.MeshBasicMaterial).opacity = (1 - progress) * 0.4;
            const scale = 1 - progress * 0.5;
            dot.scale.setScalar(Math.max(0.1, scale));
          });
        }

        // Core shrinks and brightens
        if (core) {
          const s = 1 - progress * 0.7;
          core.scale.setScalar(Math.max(0.1, s));
          (core.material as THREE.MeshPhysicalMaterial).opacity = 0.3 + progress * 0.7;
          (core.material as THREE.MeshPhysicalMaterial).emissiveIntensity = 1 + progress * 3;
        }
        if (coreGlow) {
          coreGlow.scale.setScalar(2 - progress * 1.5);
        }

        if (progress >= 1) {
          phaseRef.current = "collapsed";
          collapseTimeRef.current = time;
        }
      } else if (phase === "collapsed") {
        // Hold collapsed state
        if (cloud) {
          cloud.children.forEach((child) => {
            const dot = child as THREE.Mesh;
            dot.position.lerp(new THREE.Vector3(0, 0, 0), 0.05);
            (dot.material as THREE.MeshBasicMaterial).opacity *= 0.98;
          });
        }

        if (core) {
          (core.material as THREE.MeshPhysicalMaterial).opacity = 0;
        }
        if (coreGlow) {
          (coreGlow.material as THREE.SpriteMaterial).opacity = 0;
        }

        // Show collapsed dot
        if (collapsedDot) {
          (collapsedDot.material as THREE.MeshPhysicalMaterial).opacity = 1;
          const pulse = 1 + Math.sin(time * 3) * 0.1;
          collapsedDot.scale.setScalar(pulse);
        }
        if (collapsedGlow) {
          (collapsedGlow.material as THREE.SpriteMaterial).opacity = 0.7;
          collapsedGlow.scale.setScalar(1.5 + Math.sin(time * 2) * 0.2);
        }

        // Keep observer visible
        if (observer) {
          (observer.material as THREE.MeshBasicMaterial).opacity = 0.8;
          observer.position.y = 2.5;
        }
        if (eyeRing) {
          (eyeRing.material as THREE.MeshBasicMaterial).opacity = 0.5;
          eyeRing.position.y = 2.5;
        }
        if (beam) {
          (beam.material as THREE.LineBasicMaterial).opacity = 0.3;
        }
      } else if (phase === "resetting") {
        const elapsed = time - collapseTimeRef.current;
        const progress = Math.min(1, elapsed * 0.8);

        // Fade out observer
        if (observer) {
          (observer.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.8 - progress * 0.8);
        }
        if (eyeRing) {
          (eyeRing.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.5 - progress * 0.5);
        }
        if (beam) {
          (beam.material as THREE.LineBasicMaterial).opacity = Math.max(0, 0.3 - progress * 0.3);
        }

        // Hide collapsed dot
        if (collapsedDot) {
          (collapsedDot.material as THREE.MeshPhysicalMaterial).opacity = Math.max(0, 1 - progress);
        }
        if (collapsedGlow) {
          (collapsedGlow.material as THREE.SpriteMaterial).opacity = Math.max(0, 0.7 - progress * 0.7);
        }

        // Expand cloud back
        if (cloud) {
          cloud.children.forEach((child) => {
            const dot = child as THREE.Mesh;
            const base = dot.userData.basePos as THREE.Vector3;
            dot.position.lerp(base, progress * 0.05);
            (dot.material as THREE.MeshBasicMaterial).opacity = progress * 0.4;
            dot.scale.setScalar(0.1 + progress * 0.9);
          });
        }

        // Restore core
        if (core) {
          (core.material as THREE.MeshPhysicalMaterial).opacity = progress * 0.3;
          (core.material as THREE.MeshPhysicalMaterial).emissiveIntensity = 1;
        }
        if (coreGlow) {
          (coreGlow.material as THREE.SpriteMaterial).opacity = progress;
          coreGlow.scale.setScalar(progress * 2);
        }

        if (progress >= 1) {
          phaseRef.current = "superposition";
        }
      }

      renderer.render(scene, camera);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div className="relative w-full h-[70vh] min-h-[500px] rounded-3xl overflow-hidden bg-black/40 border border-indigo-500/20">
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/50 border border-indigo-500/30 text-indigo-300/60 text-sm pointer-events-none select-none">
        Click to observe · Drag to orbit
      </div>
    </div>
  );
}
