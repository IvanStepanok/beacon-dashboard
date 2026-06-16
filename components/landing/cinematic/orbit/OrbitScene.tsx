"use client";

/* The orbital act of the landing film: a stylized dotted Earth (GitHub-globe
   technique, UNDP palette), procedural cloud cover that thickens on scroll,
   a pulsing beacon at the crisis city, and a scroll-scrubbed camera that finally
   dives through the cloud deck. All scroll state arrives via orbitBridge —
   deterministic in `progress`, so scrubbing backwards replays perfectly;
   only ambient motion (cloud drift, pulse, satellite) runs on the clock.

   eslint react-hooks v6 compiler rules are disabled here: useFrame callbacks
   run in the R3F render loop, not during React render — mutating scene
   objects there is the library's intended idiom, not a hook violation. */
/* eslint-disable react-hooks/immutability, react-hooks/refs, react-hooks/purity */

import { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { latLngToVector3, buildLandDots } from "./geo";
import { orbitBridge, canvasVisible, onBridgeChange } from "../bridge";
import {
  ATMO_VERT, ATMO_FRAG, CLOUD_SPHERE_VERT, CLOUD_SPHERE_FRAG,
  PUFF_VERT, PUFF_FRAG, BEAM_FRAG,
} from "./shaders";
import { CityStage } from "../city/CityScene";

const TARGET = { lat: 36.2, lng: 36.16 };
const CAM_LNG = -20; // fixed camera azimuth; the globe rotates to meet it
const SPIN = 0.5; // rad of eastward travel from hero framing to alignment

/* ----- choreography curves (pure functions of master progress p) ----- */
const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const lerp = THREE.MathUtils.lerp;

const camLat = (p: number) => lerp(14, TARGET.lat, smoothstep(0.36, 0.6, p));
/* Dive ends at r=1.34 by 0.88 — close enough for the arrival, far enough
   that the instanced dots stay dot-sized. The DOM flash is now only a short
   blink at 0.9, so the cloud layers (shell + puff wall) must fully cover
   the closeup on their own by ~0.86. */
const camRadius = (p: number) => lerp(3.25, 1.34, smoothstep(0.52, 0.88, p));
const alignAmount = (p: number) => smoothstep(0.18, 0.6, p);
const cloudCover = (p: number) =>
  lerp(0.34, 0.66, smoothstep(0.16, 0.4, p)) + 0.3 * smoothstep(0.74, 0.88, p);
const markerFade = (p: number) =>
  1 - 0.85 * smoothstep(0.2, 0.36, p) + 0.85 * smoothstep(0.52, 0.68, p);
const descentCloudsIn = (p: number) => smoothstep(0.64, 0.8, p);
const satelliteFade = (p: number) => smoothstep(0.04, 0.1, p) * (1 - smoothstep(0.44, 0.56, p));

/* ---------------------------------------------------------------- globe -- */

function LandDots() {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const dots = useMemo(() => buildLandDots(), []);

  useEffect(() => {
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    dots.forEach((d, i) => {
      const p = latLngToVector3(d.lat, d.lng, 1.001);
      dummy.position.copy(p);
      dummy.lookAt(p.x * 2, p.y * 2, p.z * 2);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
      /* Two-tone speckle reads richer than a flat field. */
      const bright = (Math.sin(d.lat * 12.9898 + d.lng * 78.233) + 1) / 2;
      color.set(bright > 0.72 ? "#7CB8E8" : "#3B7CB8");
      ref.current.setColorAt(i, color);
    });
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
  }, [dots]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, dots.length]} renderOrder={1}>
      {/* 5 segments — GitHub's literal pentagon dots */}
      <circleGeometry args={[0.0062, 5]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}

function Atmosphere() {
  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color("#3F8FD9") },
      uCoef: { value: 0.72 },
      uPower: { value: 5.0 },
      uOpacity: { value: 1.0 },
    }),
    [],
  );
  return (
    <mesh scale={1.16} renderOrder={4}>
      <sphereGeometry args={[1, 48, 48]} />
      <shaderMaterial
        vertexShader={ATMO_VERT}
        fragmentShader={ATMO_FRAG}
        uniforms={uniforms}
        side={THREE.BackSide}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

/* Subtle lit-edge fresnel on the globe itself, FrontSide. */
function InnerRim() {
  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color("#2C70A8") },
      uCoef: { value: 1.0 },
      uPower: { value: 3.2 },
      uOpacity: { value: 0.5 },
    }),
    [],
  );
  return (
    <mesh scale={1.002} renderOrder={2}>
      <sphereGeometry args={[1, 48, 48]} />
      <shaderMaterial
        vertexShader={ATMO_VERT}
        fragmentShader={ATMO_FRAG}
        uniforms={uniforms}
        side={THREE.FrontSide}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

/* ---------------------------------------------------------------- clouds -- */

function CloudSphere() {
  const mat = useRef<THREE.ShaderMaterial>(null!);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uCover: { value: 0.3 },
      uOpacity: { value: 0.55 },
      uColor: { value: new THREE.Color("#C9DCEE") },
    }),
    [],
  );
  useFrame(({ clock }) => {
    mat.current.uniforms.uTime.value = clock.elapsedTime;
    mat.current.uniforms.uCover.value = cloudCover(orbitBridge.progress);
  });
  return (
    <mesh scale={1.022} renderOrder={3}>
      <sphereGeometry args={[1, 64, 64]} />
      <shaderMaterial
        ref={mat}
        vertexShader={CLOUD_SPHERE_VERT}
        fragmentShader={CLOUD_SPHERE_FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

/* Billboarded puffs along the final approach corridor — they rush past the
   camera during the dive and sell the through-the-clouds moment. */
function DescentClouds() {
  const group = useRef<THREE.Group>(null!);
  const puffs = useMemo(() => {
    const dir = latLngToVector3(TARGET.lat, CAM_LNG, 1).normalize();
    const right = new THREE.Vector3(0, 1, 0).cross(dir).normalize();
    const up = dir.clone().cross(right).normalize();
    const ring = Array.from({ length: 9 }, (_, i) => {
      const t = i / 8;
      const radius = lerp(2.0, 1.12, t);
      const a = i * 2.39996; // golden-angle scatter around the corridor
      /* Keep a sight-line to the beacon: puffs hug the corridor's edges. */
      const spread = 0.55 + 0.4 * t;
      const pos = dir
        .clone()
        .multiplyScalar(radius)
        .addScaledVector(right, Math.cos(a) * spread)
        .addScaledVector(up, Math.sin(a) * spread * 0.6);
      return { pos, seed: i * 7.31, scale: 0.6 + (i % 3) * 0.3, late: false };
    });
    /* The wall: puffs straight on the axis, fading in only at the very end.
       The first two get crossed (fly-through), the last two sit BELOW the
       camera's final radius (1.34) so they keep covering the dot field all
       the way to the act's end — the white is just a blink now. */
    const wall = [1.46, 1.36, 1.28, 1.22].map((radius, i) => {
      const a = i * 2.1 + 0.7;
      const pos = dir
        .clone()
        .multiplyScalar(radius)
        .addScaledVector(right, Math.cos(a) * 0.1)
        .addScaledVector(up, Math.sin(a) * 0.07);
      return { pos, seed: 31.7 + i * 5.13, scale: 1.05 + (i % 2) * 0.35, late: true };
    });
    return [...ring, ...wall];
  }, []);
  const mats = useRef<(THREE.ShaderMaterial | null)[]>([]);

  useFrame(({ clock, camera }) => {
    const prog = orbitBridge.progress;
    const o = descentCloudsIn(prog);
    const oLate = smoothstep(0.78, 0.88, prog);
    group.current.visible = o > 0.001;
    group.current.children.forEach((child, i) => {
      child.lookAt(camera.position);
      const m = mats.current[i];
      if (m) {
        m.uniforms.uTime.value = clock.elapsedTime;
        m.uniforms.uOpacity.value = (puffs[i].late ? oLate : o) * 0.85;
      }
    });
  });

  return (
    <group ref={group} renderOrder={5}>
      {puffs.map((p, i) => (
        <mesh key={i} position={p.pos} scale={p.scale}>
          <planeGeometry args={[1.3, 0.85]} />
          <shaderMaterial
            ref={(m) => {
              mats.current[i] = m;
            }}
            vertexShader={PUFF_VERT}
            fragmentShader={PUFF_FRAG}
            uniforms={{
              uTime: { value: 0 },
              uOpacity: { value: 0 },
              uSeed: { value: p.seed },
            }}
            transparent
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ---------------------------------------------------------------- marker -- */

function Beacon() {
  const group = useRef<THREE.Group>(null!);
  const ringA = useRef<THREE.Mesh>(null!);
  const ringB = useRef<THREE.Mesh>(null!);
  const dotMat = useRef<THREE.MeshBasicMaterial>(null!);
  const beamMat = useRef<THREE.ShaderMaterial>(null!);
  const pos = useMemo(() => latLngToVector3(TARGET.lat, TARGET.lng, 1.004), []);
  const outward = useMemo(() => pos.clone().multiplyScalar(2), [pos]);

  useFrame(({ clock }) => {
    const fade = markerFade(orbitBridge.progress);
    const t = clock.elapsedTime;
    const pulse = (phase: number) => ((t * 0.45 + phase) % 1);
    [ringA.current, ringB.current].forEach((ring, i) => {
      const k = pulse(i * 0.5);
      ring.scale.setScalar(1 + k * 2.6);
      (ring.material as THREE.MeshBasicMaterial).opacity = (1 - k) * 0.8 * fade;
    });
    dotMat.current.opacity = fade;
    beamMat.current.uniforms.uOpacity.value = (0.65 + 0.2 * Math.sin(t * 2.1)) * fade;
  });

  return (
    <group ref={group} position={pos} onUpdate={(g) => g.lookAt(outward)}>
      <mesh renderOrder={6}>
        <circleGeometry args={[0.013, 24]} />
        <meshBasicMaterial ref={dotMat} color="#FF5B3D" transparent toneMapped={false} />
      </mesh>
      {[ringA, ringB].map((r, i) => (
        <mesh key={i} ref={r} renderOrder={6}>
          <ringGeometry args={[0.014, 0.0165, 32]} />
          <meshBasicMaterial color="#FF5B3D" transparent depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
      {/* The beacon itself — a thin light pillar rising from the crisis point. */}
      <mesh rotation-x={Math.PI / 2} position-z={0.11} renderOrder={6}>
        <cylinderGeometry args={[0.0045, 0.0085, 0.22, 8, 1, true]} />
        <shaderMaterial
          ref={beamMat}
          vertexShader={PUFF_VERT}
          fragmentShader={BEAM_FRAG}
          uniforms={{ uOpacity: { value: 0.5 } }}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------- satellite -- */

function Satellite() {
  const group = useRef<THREE.Group>(null!);
  const inner = useRef<THREE.Group>(null!);
  const mats = useRef<THREE.MeshBasicMaterial[]>([]);
  const collect = (m: THREE.MeshBasicMaterial | null) => {
    if (m && !mats.current.includes(m)) mats.current.push(m);
  };

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const fade = satelliteFade(orbitBridge.progress);
    group.current.visible = fade > 0.001;
    const a = t * 0.11;
    inner.current.position.set(Math.cos(a) * 1.55, Math.sin(a * 0.9) * 0.42, Math.sin(a) * 1.55);
    inner.current.rotation.y = -a;
    mats.current.forEach((m) => {
      m.opacity = fade;
    });
  });

  return (
    <group ref={group}>
      <group ref={inner}>
        <mesh>
          <boxGeometry args={[0.028, 0.02, 0.02]} />
          <meshBasicMaterial ref={collect} color="#B9CFE3" transparent toneMapped={false} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.042, 0, 0]}>
            <boxGeometry args={[0.05, 0.002, 0.022]} />
            <meshBasicMaterial ref={collect} color="#39618C" transparent toneMapped={false} />
          </mesh>
        ))}
      </group>
      {/* faint orbit trace */}
      <mesh rotation-x={Math.PI / 2.22}>
        <torusGeometry args={[1.55, 0.0008, 6, 128]} />
        <meshBasicMaterial ref={collect} color="#39618C" transparent opacity={0.4} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ----------------------------------------------------------------- stars -- */

function Stars() {
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const n = 1600;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const v = new THREE.Vector3()
        .randomDirection()
        .multiplyScalar(26 + Math.random() * 30);
      pos.set([v.x, v.y, v.z], i * 3);
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  const ref = useRef<THREE.Points>(null!);
  useFrame((_, delta) => {
    ref.current.rotation.y += delta * 0.004;
  });
  return (
    <points ref={ref} geometry={geom}>
      <pointsMaterial color="#9FB6CC" size={0.05} sizeAttenuation transparent opacity={0.8} />
    </points>
  );
}

/* ------------------------------------------------------------ camera rig -- */

function CameraRig({ globe }: { globe: React.RefObject<THREE.Group | null> }) {
  const smoothedPointer = useRef(new THREE.Vector2());
  const { alignYaw, camAzimuth } = useMemo(() => {
    const m = latLngToVector3(TARGET.lat, TARGET.lng, 1);
    const c = latLngToVector3(0, CAM_LNG, 1);
    /* Ry(α) maps azimuth β → β − α, so to bring the marker's azimuth onto the
       camera's: α = β_marker − β_camera. */
    return {
      alignYaw: Math.atan2(m.z, m.x) - Math.atan2(c.z, c.x),
      camAzimuth: 0,
    };
  }, []);
  void camAzimuth;

  const tmpDir = useRef(new THREE.Vector3());
  const tmpRight = useRef(new THREE.Vector3());
  const tmpUp = useRef(new THREE.Vector3());

  const owning = useRef(false);

  useFrame(({ camera, viewport }, delta) => {
    /* The city rig owns the camera during act II. */
    if (orbitBridge.cityOn) {
      owning.current = false;
      return;
    }
    const p = orbitBridge.progress;
    const g = globe.current;
    if (!g) return;

    const cam = camera as THREE.PerspectiveCamera;
    if (!owning.current) {
      cam.near = 0.01;
      cam.far = 120;
      cam.fov = 42;
      cam.updateProjectionMatrix();
      owning.current = true;
    }

    /* Globe yaw: eased journey from hero framing to city-under-camera. */
    g.rotation.y = alignYaw + SPIN * (1 - alignAmount(p));

    /* Globe slides from the right split to center as the dive begins. */
    const wide = viewport.aspect > 1.05;
    g.position.x = (wide ? 0.95 : 0) * (1 - smoothstep(0.34, 0.56, p));
    g.position.y = wide ? 0 : -0.25 * (1 - smoothstep(0.34, 0.56, p));

    /* Camera: fixed azimuth, latitude rises to meet the target, radius dives. */
    const dir = tmpDir.current.copy(latLngToVector3(camLat(p), CAM_LNG, 1)).normalize();
    camera.position.copy(dir).multiplyScalar(camRadius(p));

    /* Hero-only pointer parallax, eased out before the dive. */
    const damp = 1 - Math.pow(0.0015, delta);
    smoothedPointer.current.x += (orbitBridge.pointerX - smoothedPointer.current.x) * damp;
    smoothedPointer.current.y += (orbitBridge.pointerY - smoothedPointer.current.y) * damp;
    const par = 1 - smoothstep(0.46, 0.6, p);
    tmpRight.current.set(0, 1, 0).cross(dir).normalize();
    tmpUp.current.copy(dir).cross(tmpRight.current).normalize();
    camera.position
      .addScaledVector(tmpRight.current, smoothedPointer.current.x * 0.09 * par)
      .addScaledVector(tmpUp.current, smoothedPointer.current.y * -0.055 * par);

    camera.lookAt(g.position);
  });
  return null;
}

/* Stop rendering entirely once both film acts have scrolled past. The scene
   mounts lazily (dynamic ssr:false), so visibility may have already flipped
   before we subscribe — apply the current bridge value first, then listen. */
function FrameloopGate() {
  const set = useThree((s) => s.set);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    const apply = () => {
      const v = canvasVisible();
      set({ frameloop: v ? "always" : "never" });
      if (v) invalidate();
    };
    apply();
    return onBridgeChange(apply);
  }, [set, invalidate]);
  return null;
}

/* ----------------------------------------------------------------- scene -- */

function OrbitStage() {
  const root = useRef<THREE.Group>(null!);
  const globe = useRef<THREE.Group>(null);
  useFrame(() => {
    root.current.visible = orbitBridge.orbitOn;
  });
  return (
    <group ref={root}>
      <Stars />
      <group ref={globe}>
        <mesh renderOrder={0}>
          <sphereGeometry args={[0.9965, 64, 64]} />
          <meshBasicMaterial color="#0B1E33" />
        </mesh>
        <LandDots />
        <InnerRim />
        <CloudSphere />
        <Beacon />
        <Atmosphere />
      </group>
      <Satellite />
      <DescentClouds />
      <CameraRig globe={globe} />
    </group>
  );
}

/* One canvas, two worlds: the globe (act I) and the the demo city maquette
   (act II). Stage visibility + camera ownership flip on the bridge; the
   handoff between them happens inside the cloud whiteout. */
export default function OrbitScene() {
  return (
    <Canvas
      frameloop="always"
      shadows
      dpr={[1, 2]}
      camera={{ fov: 42, near: 0.01, far: 120, position: [0, 0.55, 3.25] }}
      gl={{ antialias: true, powerPreference: "high-performance", alpha: true }}
      style={{ background: "transparent" }}
      onCreated={({ scene, camera }) => {
        if (process.env.NODE_ENV === "development") {
          (window as unknown as { __film?: unknown }).__film = { scene, camera };
        }
      }}
    >
      <OrbitStage />
      <CityStage />
      <FrameloopGate />
    </Canvas>
  );
}
