"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createGlowCanvas } from "@/lib/three-utils";

type Phase = "entangled" | "measuring" | "collapsed" | "resetting";

// Satellite particle config
interface Satellite {
  name: string;
  glowName: string;
  orbitRadius: number;
  height: number;
  speed: number;
  startDelay: number; // seconds before it appears
  color: number;
}

const SATELLITES: Satellite[] = [
  { name: "sat1", glowName: "glowSat1", orbitRadius: 1.8, height: 1.2, speed: 0.55, startDelay: 1.0, color: 0xff6b9d },
  { name: "sat2", glowName: "glowSat2", orbitRadius: 3.2, height: -0.8, speed: 0.35, startDelay: 2.5, color: 0x9d6bff },
  { name: "sat3", glowName: "glowSat3", orbitRadius: 2.2, height: 0.5, speed: 0.7, startDelay: 4.0, color: 0x6bffd4 },
  { name: "sat4", glowName: "glowSat4", orbitRadius: 2.8, height: -1.5, speed: 0.45, startDelay: 5.5, color: 0xffd46b },
  { name: "sat5", glowName: "glowSat5", orbitRadius: 3.5, height: 0.0, speed: 0.3, startDelay: 7.0, color: 0x6bb8ff },
];

const CONNECTION_THRESHOLD = 5.0; // max distance to draw a web line
const ORBIT_RADIUS = 2.5;

export default function EntanglementShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rafRef = useRef<number>(0);
  const clockRef = useRef(new THREE.Clock());
  const phaseRef = useRef<Phase>("entangled");
  const collapseTimeRef = useRef(0);

  const isDraggingRef = useRef(false);
  const didDragRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const cameraAngleRef = useRef({ theta: Math.PI / 3, phi: Math.PI / 4 });
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
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    cameraRef.current = camera;

    // ── Helper: create particle with glow ─────────────────────
    function createParticle(
      name: string,
      glowName: string,
      color: number,
      size: number = 0.2,
      glowScale: number = 1.2
    ) {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(size, 32, 32),
        new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          emissive: color,
          emissiveIntensity: 1.5,
          roughness: 0.2,
          metalness: 0.3,
        })
      );
      mesh.name = name;
      scene.add(mesh);

      const glow = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: new THREE.CanvasTexture(createGlowCanvas(color)),
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      glow.scale.set(glowScale, glowScale, 1);
      glow.name = glowName;
      scene.add(glow);

      return { mesh, glow };
    }

    // ── Main particles A & B ──────────────────────────────────
    const { mesh: particleA, glow: glowA } = createParticle("particleA", "glowA", 0xec4899);
    const { mesh: particleB, glow: glowB } = createParticle("particleB", "glowB", 0xec4899);

    // ── Satellite particles ───────────────────────────────────
    const satellites = SATELLITES.map((s) => {
      const { mesh, glow } = createParticle(s.name, s.glowName, s.color, 0.15, 1.0);
      // Start far away (will drift in)
      mesh.position.set(
        (Math.random() - 0.5) * 10,
        s.height * 3,
        (Math.random() - 0.5) * 10
      );
      mesh.scale.setScalar(0);
      glow.scale.setScalar(0);
      return { ...s, mesh, glow, arrived: false };
    });

    // ── Spin arrows (for A & B only) ──────────────────────────
    const arrowGeo = new THREE.ConeGeometry(0.08, 0.4, 16);
    const shaftGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.6, 8);

    const arrowA = new THREE.Mesh(arrowGeo, new THREE.MeshBasicMaterial({ color: 0xff4466 }));
    arrowA.name = "arrowA";
    scene.add(arrowA);
    const shaftA = new THREE.Mesh(shaftGeo, new THREE.MeshBasicMaterial({ color: 0xff4466 }));
    shaftA.name = "shaftA";
    scene.add(shaftA);

    const arrowB = new THREE.Mesh(arrowGeo, new THREE.MeshBasicMaterial({ color: 0x4488ff }));
    arrowB.name = "arrowB";
    scene.add(arrowB);
    const shaftB = new THREE.Mesh(shaftGeo, new THREE.MeshBasicMaterial({ color: 0x4488ff }));
    shaftB.name = "shaftB";
    scene.add(shaftB);

    // ── Orbit rings (main + satellite) ────────────────────────
    const mainOrbit = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(
        new THREE.Path().absarc(0, 0, ORBIT_RADIUS, 0, Math.PI * 2, false)
          .getPoints(128).map((p) => new THREE.Vector3(p.x, 0, p.y))
      ),
      new THREE.LineBasicMaterial({ color: 0xec4899, transparent: true, opacity: 0.1 })
    );
    scene.add(mainOrbit);

    SATELLITES.forEach((s) => {
      const ring = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(
          new THREE.Path().absarc(0, s.height, s.orbitRadius, 0, Math.PI * 2, false)
            .getPoints(128).map((p) => new THREE.Vector3(p.x, s.height, p.y))
        ),
        new THREE.LineBasicMaterial({ color: s.color, transparent: true, opacity: 0.06 })
      );
      scene.add(ring);
    });

    // ── Lights ────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x404060, 0.5));
    const pl1 = new THREE.PointLight(0xec4899, 2, 25);
    pl1.position.set(3, 5, 3);
    scene.add(pl1);
    const pl2 = new THREE.PointLight(0x8855ff, 1.5, 20);
    pl2.position.set(-3, -3, -3);
    scene.add(pl2);
    const pl3 = new THREE.PointLight(0x6bffd4, 1, 15);
    pl3.position.set(0, 4, -3);
    scene.add(pl3);

    // ── Events ────────────────────────────────────────────────
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
      if (phaseRef.current !== "entangled" || didDragRef.current) return;
      phaseRef.current = "measuring";
      collapseTimeRef.current = clockRef.current.getElapsedTime();
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

      // Camera
      const ca = cameraAngleRef.current;
      camera.position.set(
        cameraDistance * Math.sin(ca.theta) * Math.cos(ca.phi),
        cameraDistance * Math.cos(ca.theta),
        cameraDistance * Math.sin(ca.theta) * Math.sin(ca.phi)
      );
      camera.lookAt(0, 0, 0);

      // Gather all particle positions for web drawing
      const positions: THREE.Vector3[] = [];

      // ── Main particles A & B ───────────────────────────────
      const particleA = scene.getObjectByName("particleA") as THREE.Mesh;
      const particleB = scene.getObjectByName("particleB") as THREE.Mesh;
      const glowA = scene.getObjectByName("glowA") as THREE.Sprite;
      const glowB = scene.getObjectByName("glowB") as THREE.Sprite;
      const arrowA = scene.getObjectByName("arrowA") as THREE.Mesh;
      const arrowB = scene.getObjectByName("arrowB") as THREE.Mesh;
      const shaftA = scene.getObjectByName("shaftA") as THREE.Mesh;
      const shaftB = scene.getObjectByName("shaftB") as THREE.Mesh;

      if (phase === "entangled") {
        const orbitSpeed = 0.4;
        const angleA = time * orbitSpeed;
        const angleB = angleA + Math.PI;
        const ax = ORBIT_RADIUS * Math.cos(angleA);
        const az = ORBIT_RADIUS * Math.sin(angleA);
        const bx = ORBIT_RADIUS * Math.cos(angleB);
        const bz = ORBIT_RADIUS * Math.sin(angleB);

        if (particleA) {
          particleA.position.set(ax, 0, az);
          particleA.scale.setScalar(1 + Math.sin(time * 3) * 0.1);
          (particleA.material as THREE.MeshPhysicalMaterial).emissiveIntensity = 1.5 + Math.sin(time * 4) * 0.5;
          positions.push(particleA.position.clone());
        }
        if (particleB) {
          particleB.position.set(bx, 0, bz);
          particleB.scale.setScalar(1 + Math.sin(time * 3 + Math.PI) * 0.1);
          (particleB.material as THREE.MeshPhysicalMaterial).emissiveIntensity = 1.5 + Math.sin(time * 4 + Math.PI) * 0.5;
          positions.push(particleB.position.clone());
        }
        if (glowA) glowA.position.copy(particleA.position);
        if (glowB) glowB.position.copy(particleB.position);

        // Spin arrows
        const spinPhase = Math.sin(time * 2);
        if (arrowA && shaftA) {
          const ay = 0.4 + spinPhase * 0.2;
          arrowA.position.set(ax, ay, az);
          arrowA.rotation.set(0, 0, spinPhase > 0 ? 0 : Math.PI);
          shaftA.position.set(ax, ay - 0.3, az);
          const c = spinPhase > 0 ? 0xff4466 : 0x4488ff;
          (arrowA.material as THREE.MeshBasicMaterial).color.set(c);
          (shaftA.material as THREE.MeshBasicMaterial).color.set(c);
        }
        if (arrowB && shaftB) {
          const by = 0.4 - spinPhase * 0.2;
          arrowB.position.set(bx, by, bz);
          arrowB.rotation.set(0, 0, -spinPhase > 0 ? 0 : Math.PI);
          shaftB.position.set(bx, by - 0.3, bz);
          const c = spinPhase > 0 ? 0x4488ff : 0xff4466;
          (arrowB.material as THREE.MeshBasicMaterial).color.set(c);
          (shaftB.material as THREE.MeshBasicMaterial).color.set(c);
        }

        // ── Satellites drift in and orbit ─────────────────────
        for (const sat of scene.children.filter((c) => c.name.startsWith("sat"))) {
          // skip — we handle satellites separately below
        }

        // Handle satellites via the scene
        SATELLITES.forEach((sConfig, idx) => {
          const sat = scene.getObjectByName(sConfig.name) as THREE.Mesh;
          const satGlow = scene.getObjectByName(sConfig.glowName) as THREE.Sprite;
          if (!sat || !satGlow) return;

          const appeared = time > sConfig.startDelay;
          if (!appeared) {
            sat.visible = false;
            satGlow.visible = false;
            return;
          }
          sat.visible = true;
          satGlow.visible = true;

          const elapsed = time - sConfig.startDelay;
          const driftProgress = Math.min(1, elapsed / 3.0); // 3 seconds to arrive

          // Target orbit position
          const satAngle = time * sConfig.speed;
          const targetX = sConfig.orbitRadius * Math.cos(satAngle);
          const targetZ = sConfig.orbitRadius * Math.sin(satAngle);
          const targetY = sConfig.height;

          // Lerp from current scattered position toward orbit
          if (driftProgress < 1) {
            sat.position.lerp(new THREE.Vector3(targetX, targetY, targetZ), 0.02);
            satGlow.position.copy(sat.position);
          } else {
            // Fully arrived — orbit smoothly
            sat.position.set(targetX, targetY, targetZ);
            satGlow.position.copy(sat.position);
          }

          // Scale in
          const scaleTarget = 0.8 + Math.sin(time * 2 + idx) * 0.1;
          sat.scale.setScalar(Math.min(driftProgress, 1) * scaleTarget);
          satGlow.scale.setScalar(Math.min(driftProgress, 1) * 1.0);

          // Emissive pulse
          (sat.material as THREE.MeshPhysicalMaterial).emissiveIntensity =
            1.0 + Math.sin(time * 3 + idx * 1.5) * 0.4;

          positions.push(sat.position.clone());
        });

        // ── Draw web connections between all particles ────────
        // Remove old web lines
        for (let i = scene.children.length - 1; i >= 0; i--) {
          const child = scene.children[i];
          if (child.name === "webLine") {
            scene.remove(child);
            (child as THREE.Line).geometry.dispose();
            ((child as THREE.Line).material as THREE.LineBasicMaterial).dispose();
          }
        }

        // Draw connections between all pairs
        for (let i = 0; i < positions.length; i++) {
          for (let j = i + 1; j < positions.length; j++) {
            const d = positions[i].distanceTo(positions[j]);
            if (d < CONNECTION_THRESHOLD) {
              const alpha = Math.max(0, (1 - d / CONNECTION_THRESHOLD)) * 0.25;
              const lineGeo = new THREE.BufferGeometry().setFromPoints([positions[i], positions[j]]);
              const hue = (time * 20 + i * 50 + j * 30) % 360;
              const lineMat = new THREE.LineBasicMaterial({
                color: new THREE.Color().setHSL(hue / 360, 0.7, 0.6),
                transparent: true,
                opacity: alpha,
                blending: THREE.AdditiveBlending,
              });
              const line = new THREE.Line(lineGeo, lineMat);
              line.name = "webLine";
              scene.add(line);
            }
          }
        }

        // ── Energy pulses along random web links ─────────────
        if (positions.length >= 2 && Math.floor(time * 6) % 4 === 0) {
          const i = Math.floor(Math.random() * positions.length);
          let j = Math.floor(Math.random() * positions.length);
          if (j === i) j = (i + 1) % positions.length;
          const pGeo = new THREE.SphereGeometry(0.04, 8, 8);
          const pMat = new THREE.MeshBasicMaterial({
            color: 0xec4899, transparent: true, opacity: 0.7,
            blending: THREE.AdditiveBlending, depthWrite: false,
          });
          const pulse = new THREE.Mesh(pGeo, pMat);
          pulse.position.copy(positions[i]);
          pulse.userData.target = positions[j].clone();
          pulse.userData.start = positions[i].clone();
          pulse.userData.life = 1.0;
          pulse.name = "energyPulse";
          scene.add(pulse);
        }

        // Animate energy pulses
        for (let i = scene.children.length - 1; i >= 0; i--) {
          const child = scene.children[i];
          if (child.name !== "energyPulse") continue;
          const p = child as THREE.Mesh;
          p.userData.life = (p.userData.life || 1) - 0.012;
          const progress = 1 - p.userData.life;
          const start = p.userData.start as THREE.Vector3;
          const target = p.userData.target as THREE.Vector3;
          p.position.lerpVectors(start, target, progress);
          (p.material as THREE.MeshBasicMaterial).opacity = p.userData.life * 0.7;
          if (p.userData.life <= 0) {
            scene.remove(p);
            (p.material as THREE.MeshBasicMaterial).dispose();
          }
        }

        // ── Spore particles floating in the web ───────────────
        if (Math.floor(time * 10) % 8 === 0 && positions.length >= 2) {
          const idx = Math.floor(Math.random() * positions.length);
          const sporeGeo = new THREE.SphereGeometry(0.02, 6, 6);
          const sporeMat = new THREE.MeshBasicMaterial({
            color: 0xffffff, transparent: true, opacity: 0.5,
            blending: THREE.AdditiveBlending, depthWrite: false,
          });
          const spore = new THREE.Mesh(sporeGeo, sporeMat);
          spore.position.copy(positions[idx]);
          spore.userData.vx = (Math.random() - 0.5) * 0.02;
          spore.userData.vy = (Math.random() - 0.5) * 0.02;
          spore.userData.vz = (Math.random() - 0.5) * 0.02;
          spore.userData.life = 1.0;
          spore.name = "spore";
          scene.add(spore);
        }

        for (let i = scene.children.length - 1; i >= 0; i--) {
          const child = scene.children[i];
          if (child.name !== "spore") continue;
          const s = child as THREE.Mesh;
          s.position.x += s.userData.vx;
          s.position.y += s.userData.vy;
          s.position.z += s.userData.vz;
          s.userData.life -= 0.01;
          (s.material as THREE.MeshBasicMaterial).opacity = s.userData.life * 0.4;
          if (s.userData.life <= 0) {
            scene.remove(s);
            (s.material as THREE.MeshBasicMaterial).dispose();
          }
        }
      } else if (phase === "measuring") {
        const elapsed = time - collapseTimeRef.current;
        const progress = Math.min(1, elapsed * 1.5);

        // Freeze all particles in place
        SATELLITES.forEach((sConfig) => {
          const sat = scene.getObjectByName(sConfig.name) as THREE.Mesh;
          const satGlow = scene.getObjectByName(sConfig.glowName) as THREE.Sprite;
          if (sat && sat.visible) {
            (sat.material as THREE.MeshPhysicalMaterial).emissiveIntensity = 3 * progress;
            (sat.material as THREE.MeshPhysicalMaterial).emissive.set(
              sConfig.color
            );
          }
          if (satGlow && satGlow.visible) {
            satGlow.scale.setScalar(2 * progress);
          }
        });

        if (particleA) {
          (particleA.material as THREE.MeshPhysicalMaterial).emissive.set(0xff4466);
          (particleA.material as THREE.MeshPhysicalMaterial).emissiveIntensity = 3 * progress;
        }
        if (particleB) {
          (particleB.material as THREE.MeshPhysicalMaterial).emissive.set(0x4488ff);
          (particleB.material as THREE.MeshPhysicalMaterial).emissiveIntensity = 3 * progress;
        }
        if (glowA) glowA.scale.setScalar(2 * progress);
        if (glowB) glowB.scale.setScalar(2 * progress);

        if (arrowA && shaftA) {
          (arrowA.material as THREE.MeshBasicMaterial).color.set(0xff4466);
          (shaftA.material as THREE.MeshBasicMaterial).color.set(0xff4466);
        }
        if (arrowB && shaftB) {
          (arrowB.material as THREE.MeshBasicMaterial).color.set(0x4488ff);
          (shaftB.material as THREE.MeshBasicMaterial).color.set(0x4488ff);
        }

        if (progress >= 1) {
          phaseRef.current = "collapsed";
          collapseTimeRef.current = time;
        }
      } else if (phase === "collapsed") {
        const elapsed = time - collapseTimeRef.current;

        // Hold — all particles stationary
        SATELLITES.forEach((sConfig) => {
          const sat = scene.getObjectByName(sConfig.name) as THREE.Mesh;
          const satGlow = scene.getObjectByName(sConfig.glowName) as THREE.Sprite;
          if (sat && sat.visible) {
            (sat.material as THREE.MeshPhysicalMaterial).emissiveIntensity =
              2 + Math.sin(time * 3) * 0.3;
          }
          if (satGlow) satGlow.position.copy(sat.position);
        });

        if (glowA) glowA.position.copy(particleA.position);
        if (glowB) glowB.position.copy(particleB.position);

        if (arrowA) arrowA.position.set(particleA.position.x, 0.5, particleA.position.z);
        if (shaftA) shaftA.position.set(particleA.position.x, 0.2, particleA.position.z);
        if (arrowB) arrowB.position.set(particleB.position.x, 0.5, particleB.position.z);
        if (shaftB) shaftB.position.set(particleB.position.x, 0.2, particleB.position.z);

        if (elapsed > 3) {
          phaseRef.current = "resetting";
          collapseTimeRef.current = time;
        }
      } else if (phase === "resetting") {
        const elapsed = time - collapseTimeRef.current;
        const progress = Math.min(1, elapsed * 0.4);

        const orbitSpeed = 0.4 * progress;
        const angleA = time * orbitSpeed;
        const angleB = angleA + Math.PI;
        const ax = ORBIT_RADIUS * Math.cos(angleA);
        const az = ORBIT_RADIUS * Math.sin(angleA);
        const bx = ORBIT_RADIUS * Math.cos(angleB);
        const bz = ORBIT_RADIUS * Math.sin(angleB);

        if (particleA) {
          particleA.position.set(ax, 0, az);
          (particleA.material as THREE.MeshPhysicalMaterial).emissive.lerp(new THREE.Color(0xec4899), 0.05);
          (particleA.material as THREE.MeshPhysicalMaterial).emissiveIntensity = 1.5;
        }
        if (particleB) {
          particleB.position.set(bx, 0, bz);
          (particleB.material as THREE.MeshPhysicalMaterial).emissive.lerp(new THREE.Color(0xec4899), 0.05);
          (particleB.material as THREE.MeshPhysicalMaterial).emissiveIntensity = 1.5;
        }
        if (glowA) { glowA.position.copy(particleA.position); glowA.scale.lerp(new THREE.Vector3(1.5, 1.5, 1), 0.05); }
        if (glowB) { glowB.position.copy(particleB.position); glowB.scale.lerp(new THREE.Vector3(1.5, 1.5, 1), 0.05); }

        // Reset satellites to orbiting
        SATELLITES.forEach((sConfig, idx) => {
          const sat = scene.getObjectByName(sConfig.name) as THREE.Mesh;
          const satGlow = scene.getObjectByName(sConfig.glowName) as THREE.Sprite;
          if (sat && sat.visible) {
            const satAngle = time * sConfig.speed * progress;
            sat.position.set(
              sConfig.orbitRadius * Math.cos(satAngle),
              sConfig.height,
              sConfig.orbitRadius * Math.sin(satAngle)
            );
            (sat.material as THREE.MeshPhysicalMaterial).emissive.lerp(new THREE.Color(sConfig.color), 0.05);
            (sat.material as THREE.MeshPhysicalMaterial).emissiveIntensity = 1.0;
            sat.scale.setScalar(0.8);
          }
          if (satGlow && sat && sat.visible) {
            satGlow.position.copy(sat.position);
            satGlow.scale.lerp(new THREE.Vector3(1.0, 1.0, 1), 0.05);
          }
        });

        if (arrowA && shaftA) {
          const sp = Math.sin(time * 2 * progress);
          arrowA.position.set(ax, 0.4 + sp * 0.2, az);
          arrowA.rotation.set(0, 0, sp > 0 ? 0 : Math.PI);
          shaftA.position.set(ax, 0.4 + sp * 0.2 - 0.3, az);
          const c = sp > 0 ? 0xff4466 : 0x4488ff;
          (arrowA.material as THREE.MeshBasicMaterial).color.set(c);
          (shaftA.material as THREE.MeshBasicMaterial).color.set(c);
        }
        if (arrowB && shaftB) {
          const sp = -Math.sin(time * 2 * progress);
          arrowB.position.set(bx, 0.4 + sp * 0.2, bz);
          arrowB.rotation.set(0, 0, sp > 0 ? 0 : Math.PI);
          shaftB.position.set(bx, 0.4 + sp * 0.2 - 0.3, bz);
          const c = sp > 0 ? 0xff4466 : 0x4488ff;
          (arrowB.material as THREE.MeshBasicMaterial).color.set(c);
          (shaftB.material as THREE.MeshBasicMaterial).color.set(c);
        }

        if (progress >= 1) { phaseRef.current = "entangled"; }
      }

      renderer.render(scene, camera);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div className="relative w-full h-[70vh] min-h-[500px] rounded-3xl overflow-hidden bg-black/40 border border-pink-500/20">
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/50 border border-pink-500/30 text-pink-300/60 text-sm pointer-events-none select-none">
        Click to measure · Drag to orbit
      </div>
    </div>
  );
}
