"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createGlowCanvas } from "@/lib/three-utils";

type Phase = "wave" | "observing" | "particle" | "resetting";

export default function WaveParticleShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rafRef = useRef<number>(0);
  const clockRef = useRef(new THREE.Clock());
  const phaseRef = useRef<Phase>("wave");
  const collapseTimeRef = useRef(0);

  const isDraggingRef = useRef(false);
  const didDragRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const cameraAngleRef = useRef({ theta: Math.PI / 3, phi: 0 });
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

    // ── Double Slit Barrier ───────────────────────────────────
    const barrierMat = new THREE.MeshPhysicalMaterial({
      color: 0x334455, roughness: 0.4, metalness: 0.6, transparent: true, opacity: 0.8,
    });
    const barrierGeo = new THREE.BoxGeometry(0.15, 4, 0.5);
    const barrierTop = new THREE.Mesh(barrierGeo, barrierMat);
    barrierTop.position.set(0, 1.75, 0);
    scene.add(barrierTop);
    const barrierBottom = new THREE.Mesh(barrierGeo, barrierMat);
    barrierBottom.position.set(0, -1.75, 0);
    scene.add(barrierBottom);
    const midGeo = new THREE.BoxGeometry(0.15, 1.0, 0.5);
    const barrierMid = new THREE.Mesh(midGeo, barrierMat);
    barrierMid.position.set(0, 0, 0);
    barrierMid.name = "barrierMid";
    scene.add(barrierMid);

    // Slit glow
    const slitGlowMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4, transparent: true, opacity: 0.3,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false,
    });
    const slitTop = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.8), slitGlowMat);
    slitTop.position.set(0, 0.55, 0);
    slitTop.name = "slitTop";
    scene.add(slitTop);
    const slitBottom = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.8), slitGlowMat.clone());
    slitBottom.position.set(0, -0.55, 0);
    slitBottom.name = "slitBottom";
    scene.add(slitBottom);

    // ── Detection Screen ──────────────────────────────────────
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.1, 4),
      new THREE.MeshBasicMaterial({ color: 0x111122, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
    );
    screen.position.set(3.5, 0, 0);
    screen.name = "screen";
    scene.add(screen);

    // ── Interference pattern strip ────────────────────────────
    const pattern = new THREE.Mesh(
      new THREE.PlaneGeometry(0.05, 4),
      new THREE.MeshBasicMaterial({
        color: 0x06b6d4, transparent: true, opacity: 0.6,
        blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false,
      })
    );
    pattern.position.set(3.55, 0, 0);
    pattern.name = "pattern";
    scene.add(pattern);

    // ── Source ────────────────────────────────────────────────
    const source = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 16, 16),
      new THREE.MeshPhysicalMaterial({ color: 0xffffff, emissive: 0x06b6d4, emissiveIntensity: 2, roughness: 0.2 })
    );
    source.position.set(-3, 0, 0);
    source.name = "source";
    scene.add(source);

    const sourceGlow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(createGlowCanvas(0x06b6d4)),
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    sourceGlow.scale.set(1.5, 1.5, 1);
    sourceGlow.position.set(-3, 0, 0);
    sourceGlow.name = "sourceGlow";
    scene.add(sourceGlow);

    // ── Observer ──────────────────────────────────────────────
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff6644, transparent: true, opacity: 0 });
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), eyeMat);
    eye.position.set(1.5, 2.5, 0);
    eye.name = "observer";
    scene.add(eye);

    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xff6644, transparent: true, opacity: 0,
      side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const observerRing = new THREE.Mesh(new THREE.RingGeometry(0.35, 0.42, 32), ringMat);
    observerRing.position.set(1.5, 2.5, 0);
    observerRing.name = "observerRing";
    scene.add(observerRing);

    // ── Lights ────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x404060, 0.5));
    const pl1 = new THREE.PointLight(0x06b6d4, 2, 20);
    pl1.position.set(3, 4, 3);
    scene.add(pl1);
    const pl2 = new THREE.PointLight(0x8855ff, 1.5, 15);
    pl2.position.set(-3, -2, -3);
    scene.add(pl2);

    // ── Events ────────────────────────────────────────────────
    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true; didDragRef.current = false;
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
        isDraggingRef.current = true; didDragRef.current = false;
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
      if (phaseRef.current === "wave") {
        phaseRef.current = "observing"; collapseTimeRef.current = clockRef.current.getElapsedTime();
      } else if (phaseRef.current === "particle") {
        phaseRef.current = "resetting"; collapseTimeRef.current = clockRef.current.getElapsedTime();
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
      const w = container.clientWidth; const h = container.clientHeight;
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

  // ── Animation loop ──────────────────────────────────────────
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

      const ca = cameraAngleRef.current;
      camera.position.set(
        cameraDistance * Math.sin(ca.theta) * Math.cos(ca.phi),
        cameraDistance * Math.cos(ca.theta),
        cameraDistance * Math.sin(ca.theta) * Math.sin(ca.phi)
      );
      camera.lookAt(0.5, 0, 0);

      const source = scene.getObjectByName("source") as THREE.Mesh;
      const sourceGlow = scene.getObjectByName("sourceGlow") as THREE.Sprite;
      const slitTop = scene.getObjectByName("slitTop") as THREE.Mesh;
      const slitBottom = scene.getObjectByName("slitBottom") as THREE.Mesh;
      const pattern = scene.getObjectByName("pattern") as THREE.Mesh;
      const observer = scene.getObjectByName("observer") as THREE.Mesh;
      const observerRing = scene.getObjectByName("observerRing") as THREE.Mesh;

      if (phase === "wave") {
        if (source) {
          source.scale.setScalar(1 + Math.sin(time * 3) * 0.15);
          (source.material as THREE.MeshPhysicalMaterial).emissiveIntensity = 1.5 + Math.sin(time * 4) * 0.5;
        }
        if (sourceGlow) sourceGlow.position.copy(source.position);

        if (slitTop) (slitTop.material as THREE.MeshBasicMaterial).opacity = 0.2 + Math.sin(time * 2) * 0.15;
        if (slitBottom) (slitBottom.material as THREE.MeshBasicMaterial).opacity = 0.2 + Math.sin(time * 2 + Math.PI) * 0.15;

        if (pattern) {
          pattern.scale.x = 0.5 + Math.sin(time * 1.5) * 0.1;
          (pattern.material as THREE.MeshBasicMaterial).opacity = 0.5 + Math.sin(time * 1.5) * 0.15;
        }

        if (observer) (observer.material as THREE.MeshBasicMaterial).opacity = 0;
        if (observerRing) (observerRing.material as THREE.MeshBasicMaterial).opacity = 0;

        // Emit wave particles
        if (Math.floor(time * 10) % 4 === 0) {
          const p = new THREE.Mesh(
            new THREE.SphereGeometry(0.03, 8, 8),
            new THREE.MeshBasicMaterial({
              color: 0x06b6d4, transparent: true, opacity: 0.5,
              blending: THREE.AdditiveBlending, depthWrite: false,
            })
          );
          p.position.set(-3, 0, 0);
          p.userData.targetY = Math.random() > 0.5 ? 0.55 : -0.55;
          p.userData.phase = "toSlit";
          p.userData.life = 1.0;
          p.name = "waveP";
          scene.add(p);
        }

        for (let i = scene.children.length - 1; i >= 0; i--) {
          const child = scene.children[i];
          if (child.name !== "waveP") continue;
          const p = child as THREE.Mesh;
          if (p.userData.phase === "toSlit") {
            p.position.x += 0.04;
            p.position.y += ((p.userData.targetY as number) - p.position.y) * 0.05;
            if (p.position.x >= -0.1) { p.userData.phase = "throughSlit"; p.userData.slitY = p.userData.targetY; }
          } else if (p.userData.phase === "throughSlit") {
            p.position.x += 0.03;
            const slitY = p.userData.slitY as number;
            const spread = (p.position.x + 0.1) * 0.8;
            p.position.y = slitY + Math.sin(spread * 3 + slitY * 2) * 0.3 * spread;
            p.position.z = Math.sin(time * 5 + p.position.x * 2) * 0.1;
          }
          p.userData.life -= 0.005;
          (p.material as THREE.MeshBasicMaterial).opacity = p.userData.life * 0.5;
          if (p.position.x > 3.5 || p.userData.life <= 0) { scene.remove(p); (p.material as THREE.MeshBasicMaterial).dispose(); }
        }
      } else if (phase === "observing") {
        const progress = Math.min(1, (time - collapseTimeRef.current) * 1.5);
        if (observer) (observer.material as THREE.MeshBasicMaterial).opacity = progress * 0.8;
        if (observerRing) {
          (observerRing.material as THREE.MeshBasicMaterial).opacity = progress * 0.6;
          observerRing.rotation.z = time * 2;
        }
        if (source) { source.scale.setScalar(1 + Math.sin(time * 3) * 0.15); }
        if (sourceGlow) sourceGlow.position.copy(source.position);
        if (progress >= 1) { phaseRef.current = "particle"; collapseTimeRef.current = time; }
      } else if (phase === "particle") {
        if (observer) {
          (observer.material as THREE.MeshBasicMaterial).opacity = 0.8;
          (observer.material as THREE.MeshBasicMaterial).color.set(0xff6644);
        }
        if (observerRing) {
          (observerRing.material as THREE.MeshBasicMaterial).opacity = 0.6;
          observerRing.rotation.z = time * 2;
        }
        if (pattern) (pattern.material as THREE.MeshBasicMaterial).opacity = 0.3;
        if (source) { source.scale.setScalar(1 + Math.sin(time * 3) * 0.15); }
        if (sourceGlow) sourceGlow.position.copy(source.position);

        // Emit particle-mode particles (straight through one slit)
        if (Math.floor(time * 10) % 4 === 0) {
          const p = new THREE.Mesh(
            new THREE.SphereGeometry(0.03, 8, 8),
            new THREE.MeshBasicMaterial({
              color: 0xff6644, transparent: true, opacity: 0.7,
              blending: THREE.AdditiveBlending, depthWrite: false,
            })
          );
          p.position.set(-3, 0, 0);
          p.userData.targetY = Math.random() > 0.5 ? 0.55 : -0.55;
          p.userData.phase = "toSlit";
          p.userData.life = 1.0;
          p.name = "partP";
          scene.add(p);
        }

        for (let i = scene.children.length - 1; i >= 0; i--) {
          const child = scene.children[i];
          if (child.name !== "partP") continue;
          const p = child as THREE.Mesh;
          if (p.userData.phase === "toSlit") {
            p.position.x += 0.04;
            p.position.y += ((p.userData.targetY as number) - p.position.y) * 0.05;
            if (p.position.x >= -0.1) { p.userData.phase = "throughSlit"; p.userData.slitY = p.userData.targetY; }
          } else if (p.userData.phase === "throughSlit") {
            p.position.x += 0.03;
            const slitY = p.userData.slitY as number;
            p.position.y += (slitY - p.position.y) * 0.1;
            p.position.y += (Math.random() - 0.5) * 0.01;
          }
          p.userData.life -= 0.005;
          (p.material as THREE.MeshBasicMaterial).opacity = p.userData.life * 0.7;
          if (p.position.x > 3.5 || p.userData.life <= 0) { scene.remove(p); (p.material as THREE.MeshBasicMaterial).dispose(); }
        }

        if ((time - collapseTimeRef.current) > 3) {
          phaseRef.current = "resetting"; collapseTimeRef.current = time;
        }
      } else if (phase === "resetting") {
        const progress = Math.min(1, (time - collapseTimeRef.current) * 0.8);
        if (observer) (observer.material as THREE.MeshBasicMaterial).opacity = 0.8 * (1 - progress);
        if (observerRing) (observerRing.material as THREE.MeshBasicMaterial).opacity = 0.6 * (1 - progress);
        if (source) { source.scale.setScalar(1 + Math.sin(time * 3) * 0.15); (source.material as THREE.MeshPhysicalMaterial).emissiveIntensity = 1.5; }
        if (sourceGlow) sourceGlow.position.copy(source.position);
        if (progress >= 1) { phaseRef.current = "wave"; }
      }

      renderer.render(scene, camera);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div className="relative w-full h-[70vh] min-h-[500px] rounded-3xl overflow-hidden bg-black/40 border border-cyan-500/20">
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/50 border border-cyan-500/30 text-cyan-300/60 text-sm pointer-events-none select-none">
        Click to observe · Drag to orbit
      </div>
    </div>
  );
}
