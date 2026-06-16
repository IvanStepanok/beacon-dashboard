"use client";

/* ACT II's world: the the demo city maquette. A paper-model city — the ground is
   the same cartography the orbit act's map promised, the buildings are
   instanced boxes with the damage gradient around the epicenter, and one
   hand-composed hero: the four-floor building with a pancaked wing, rubble,
   and the beacon rising from the seam. The camera flies a CatmullRom path
   from inside the cloud deck (bird's eye) down to eye height on the street,
   driven deterministically by orbitBridge.city.

   eslint react-hooks v6 compiler rules are off for the same reason as the
   orbit scene: useFrame mutations are R3F's idiom, not render-phase writes. */
/* eslint-disable react-hooks/immutability */

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { orbitBridge } from "../bridge";
import { PUFF_VERT, PUFF_FRAG, BEAM_FRAG } from "../orbit/shaders";
import {
  BLOCKS, FLANKS, TREES, HERO, RUBBLE, EPI, HERO_LOOK, CAM_WAYPOINTS,
  FLIGHT_END, flightU, rnd, type CityBlock,
} from "./cityLayout";
import { paintCityTexture, paintStreetPatch, PATCH } from "./cityTexture";

const TINT_3D: Record<CityBlock["tint"], string> = {
  base: "#E7E0D2",
  light: "#F0EAE0",
  amber: "#EDD9A4",
  red: "#E9B19E",
};

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const lerp = THREE.MathUtils.lerp;

/* ------------------------------------------------------- facade texture -- */

/* White base with a darker window grid — material color multiplies the map,
   so one canvas serves every tint group. Roof faces stay plain. */
function makeFacadeCanvas() {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = "rgba(62, 82, 104, 0.34)";
  const rows = 6;
  const cols = 6;
  for (let r = 0; r < rows; r++) {
    for (let q = 0; q < cols; q++) {
      ctx.fillRect(8 + q * 20, 10 + r * 19, 9, 11);
    }
  }
  /* ground floor band */
  ctx.fillStyle = "rgba(62, 82, 104, 0.12)";
  ctx.fillRect(0, 116, 128, 12);
  return c;
}

function useFacadeMaterials(color: string) {
  const gl = useThree((st) => st.gl);
  return useMemo(() => {
    const tex = new THREE.CanvasTexture(makeFacadeCanvas());
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = Math.min(4, gl.capabilities.getMaxAnisotropy());
    const side = new THREE.MeshLambertMaterial({ color, map: tex });
    const plain = new THREE.MeshLambertMaterial({ color });
    /* box face order: +x −x +y −y +z −z */
    return [side, side, plain, plain, side, side];
  }, [color, gl]);
}

/* ------------------------------------------------------------- ground -- */

function Ground() {
  const gl = useThree((s) => s.gl);
  const texture = useMemo(() => {
    const tex = new THREE.CanvasTexture(paintCityTexture());
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
    return tex;
  }, [gl]);
  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <>
      {/* paper to the horizon — its rim sits past fog.far and inside the
         sky dome, so it fades out instead of cutting off */}
      <mesh rotation-x={-Math.PI / 2} position={[750, -0.2, 425]} receiveShadow>
        <circleGeometry args={[4600, 48]} />
        <meshLambertMaterial color="#EFE9DD" />
      </mesh>
      {/* the city map itself */}
      <mesh rotation-x={-Math.PI / 2} position={[750, 0, 425]} receiveShadow>
        <planeGeometry args={[1500, 850]} />
        <meshLambertMaterial map={texture} />
      </mesh>
      <StreetPatch />
    </>
  );
}

/* Sharp ground around the landing street — the city-wide map is 1.4 px/m,
   which is mush at eye level. Same palette, drawn at ~9 px/m. */
function StreetPatch() {
  const gl = useThree((s) => s.gl);
  const texture = useMemo(() => {
    const tex = new THREE.CanvasTexture(paintStreetPatch());
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = Math.min(16, gl.capabilities.getMaxAnisotropy());
    return tex;
  }, [gl]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <mesh rotation-x={-Math.PI / 2} position={[PATCH.cx, 0.04, PATCH.cz]} receiveShadow>
      <planeGeometry args={[PATCH.size, PATCH.size]} />
      <meshLambertMaterial map={texture} />
    </mesh>
  );
}

/* ---------------------------------------------------------- buildings -- */

function BuildingGroup({ blocks, color }: { blocks: CityBlock[]; color: string }) {
  const ref = useRef<THREE.InstancedMesh>(null!);
  useEffect(() => {
    const dummy = new THREE.Object3D();
    blocks.forEach((b, i) => {
      dummy.position.set(b.x, b.h / 2, b.z);
      dummy.rotation.set(0, (-b.rot * Math.PI) / 180, 0);
      dummy.scale.set(b.w, b.h, b.d);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  }, [blocks]);
  const materials = useFacadeMaterials(color);
  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, blocks.length]}
      material={materials}
      frustumCulled={false}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[1, 1, 1]} />
    </instancedMesh>
  );
}

function Buildings() {
  const groups = useMemo(() => {
    const all = [...BLOCKS, ...FLANKS];
    return (Object.keys(TINT_3D) as CityBlock["tint"][]).map((tint) => ({
      tint,
      blocks: all.filter((b) => b.tint === tint),
    }));
  }, []);
  return (
    <>
      {groups.map(({ tint, blocks }) => (
        <BuildingGroup key={tint} blocks={blocks} color={TINT_3D[tint]} />
      ))}
    </>
  );
}

/* -------------------------------------------------------------- trees -- */

function Trees() {
  const crowns = useRef<THREE.InstancedMesh>(null!);
  const trunks = useRef<THREE.InstancedMesh>(null!);
  useEffect(() => {
    const dummy = new THREE.Object3D();
    TREES.forEach((t, i) => {
      dummy.position.set(t.x, 3.6 * t.s, t.z);
      dummy.scale.setScalar(t.s);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      crowns.current.setMatrixAt(i, dummy.matrix);
      dummy.position.set(t.x, 1.2 * t.s, t.z);
      dummy.updateMatrix();
      trunks.current.setMatrixAt(i, dummy.matrix);
    });
    crowns.current.instanceMatrix.needsUpdate = true;
    trunks.current.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <>
      <instancedMesh ref={crowns} args={[undefined, undefined, TREES.length]} frustumCulled={false} castShadow>
        <sphereGeometry args={[2.6, 10, 8]} />
        <meshLambertMaterial color="#A9C98F" />
      </instancedMesh>
      <instancedMesh ref={trunks} args={[undefined, undefined, TREES.length]} frustumCulled={false}>
        <cylinderGeometry args={[0.3, 0.4, 2.4, 6]} />
        <meshLambertMaterial color="#B59A7C" />
      </instancedMesh>
    </>
  );
}

/* --------------------------------------------------- the hero building -- */

function HeroBuilding() {
  const facade = useFacadeMaterials("#EDD9A4");
  return (
    <group>
      {/* the wing still standing — four floors */}
      <mesh
        position={[HERO.intact.x, HERO.intact.h / 2, HERO.intact.z]}
        rotation-y={(-HERO.intact.rot * Math.PI) / 180}
        material={facade}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[HERO.intact.w, HERO.intact.h, HERO.intact.d]} />
      </mesh>
      {/* the pancaked wing — tilted slabs */}
      {HERO.slabs.map((s, i) => (
        <mesh key={i} position={[s.x, s.y, s.z]} rotation={[s.rx, s.ry, s.rz]} castShadow receiveShadow>
          <boxGeometry args={[s.w, s.t, s.d]} />
          <meshLambertMaterial color="#D8CCBC" />
        </mesh>
      ))}
      {/* rubble field */}
      {RUBBLE.map((r, i) => (
        <mesh key={i} position={[r.x, r.s * 0.55, r.z]} rotation-y={r.ry} rotation-z={r.ry * 0.18} castShadow>
          <boxGeometry args={[r.s * 1.5, r.s * 1.1, r.s * 1.3]} />
          <meshLambertMaterial color={rnd(i, 211) > 0.65 ? "#E9B19E" : "#CFC3B2"} />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------- beacon -- */

function CityBeacon() {
  const beamMat = useRef<THREE.ShaderMaterial>(null!);
  const ring = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    beamMat.current.uniforms.uOpacity.value = 0.55 + 0.2 * Math.sin(t * 1.9);
    const k = (t * 0.4) % 1;
    ring.current.scale.setScalar(1 + k * 2.2);
    (ring.current.material as THREE.MeshBasicMaterial).opacity = (1 - k) * 0.55;
  });

  return (
    <group position={[EPI.x, 0, EPI.z]}>
      <mesh position-y={49}>
        <cylinderGeometry args={[0.8, 1.7, 90, 8, 1, true]} />
        <shaderMaterial
          ref={beamMat}
          vertexShader={PUFF_VERT}
          fragmentShader={BEAM_FRAG}
          uniforms={{ uOpacity: { value: 0.6 } }}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh ref={ring} rotation-x={-Math.PI / 2} position-y={0.25}>
        <ringGeometry args={[7, 8.2, 40]} />
        <meshBasicMaterial color="#E2492B" transparent depthWrite={false} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.26}>
        <circleGeometry args={[2.2, 24]} />
        <meshBasicMaterial color="#E2492B" transparent opacity={0.9} depthWrite={false} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------- entry clouds -- */

function EntryClouds() {
  const group = useRef<THREE.Group>(null!);
  const mats = useRef<(THREE.ShaderMaterial | null)[]>([]);
  const puffs = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        pos: new THREE.Vector3(
          980 + rnd(i, 301) * 330,
          420 + rnd(i, 307) * 260,
          830 + rnd(i, 311) * 300,
        ),
        scale: 170 + rnd(i, 313) * 150,
        seed: i * 5.13,
      })),
    [],
  );

  useFrame(({ clock, camera }) => {
    const o = 1 - smoothstep(0.02, 0.1, orbitBridge.city);
    group.current.visible = o > 0.001;
    group.current.children.forEach((child, i) => {
      child.lookAt(camera.position);
      const m = mats.current[i];
      if (m) {
        m.uniforms.uTime.value = clock.elapsedTime;
        m.uniforms.uOpacity.value = o * 0.95;
      }
    });
  });

  return (
    <group ref={group}>
      {puffs.map((p, i) => (
        <mesh key={i} position={p.pos} scale={p.scale}>
          <planeGeometry args={[2.4, 1.5]} />
          <shaderMaterial
            ref={(m) => {
              mats.current[i] = m;
            }}
            vertexShader={PUFF_VERT}
            fragmentShader={PUFF_FRAG}
            uniforms={{ uTime: { value: 0 }, uOpacity: { value: 1 }, uSeed: { value: p.seed } }}
            transparent
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------ the rig -- */

function CityRig() {
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        CAM_WAYPOINTS.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
        false,
        "centripetal",
      ),
    [],
  );
  const owning = useRef(false);
  const tmpLook = useRef(new THREE.Vector3());
  const smoothedPointer = useRef(new THREE.Vector2());

  useFrame(({ camera, clock }, delta) => {
    if (!orbitBridge.cityOn) {
      owning.current = false;
      return;
    }
    const cam = camera as THREE.PerspectiveCamera;
    if (!owning.current) {
      cam.near = 0.4;
      cam.far = 6000;
      owning.current = true;
    }

    const p = orbitBridge.city;
    const u = flightU(p);
    cam.position.copy(curve.getPointAt(Math.min(u, 0.9999)));

    /* arrival: hand-held micro sway + pointer micro-look */
    const arrive = smoothstep(FLIGHT_END, FLIGHT_END + 0.1, p);
    const t = clock.elapsedTime;
    if (arrive > 0) {
      cam.position.x += Math.sin(t * 0.62) * 0.06 * arrive;
      cam.position.y += Math.sin(t * 0.83 + 1.7) * 0.045 * arrive;
    }

    const damp = 1 - Math.pow(0.0015, delta);
    smoothedPointer.current.x += (orbitBridge.pointerX - smoothedPointer.current.x) * damp;
    smoothedPointer.current.y += (orbitBridge.pointerY - smoothedPointer.current.y) * damp;

    /* look: epicenter from above → the hero building as we level out */
    const pitch = smoothstep(0.4, FLIGHT_END, p);
    tmpLook.current.set(
      lerp(EPI.x, HERO_LOOK.x, pitch) + smoothedPointer.current.x * 2.2 * arrive,
      lerp(0, HERO_LOOK.y, pitch) + smoothedPointer.current.y * -1.4 * arrive,
      lerp(EPI.z, HERO_LOOK.z, pitch),
    );
    cam.lookAt(tmpLook.current);

    cam.fov = 42 + 10 * smoothstep(0.45, FLIGHT_END + 0.05, p);
    cam.updateProjectionMatrix();
  });
  return null;
}

/* -------------------------------------------------------------- stage -- */

/* Fog is a scene-level property — flip it with the act, never leave it on
   for the orbit globe. Density follows the camera's ALTITUDE (not scroll):
   scroll-based curves left the fog wall kilometres past the maquette's rim
   at the bird's-eye beat, so the map edge read as a table edge. Tied to
   altitude, the wall always stands a few hundred metres past whatever the
   camera can see — a fog sea swallowing the rim from the air, a Silent-Hill
   bubble (crisp at 50 m, milk past ~380 m) at eye level. */
function FogController() {
  const scene = useThree((s) => s.scene);
  const fog = useMemo(() => new THREE.Fog("#EDE7DA", 550, 3200), []);
  useFrame(({ camera }) => {
    const want = orbitBridge.cityOn ? fog : null;
    if (scene.fog !== want) scene.fog = want;
    if (!orbitBridge.cityOn) return;
    const alt = camera.position.y;
    const a = smoothstep(3, 170, alt);
    const b = smoothstep(170, 620, alt);
    fog.near = lerp(lerp(30, 430, a), 620, b);
    fog.far = lerp(lerp(380, 1500, a), 2300, b);
  });
  return null;
}

/* The maquette's rim, feathered in world space: a ground sheet whose
   radial alpha ramps from clear over the city to solid haze just past the
   map's edge. Camera fog alone can't kill the rim from the air — the edge
   sits at roughly the same distance as the city itself — so the dissolve
   has to live in the world, not in the camera. Iso-alpha curves are
   ellipses matching the 1500×850 map (drawn through a squashed context). */
function HazeRing() {
  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 1024;
    const ctx = c.getContext("2d")!;
    const px = (m: number) => (m / 2600) * 512; // plane is 5200 m wide
    ctx.translate(512, 512);
    ctx.scale(1, 850 / 1500);
    const g = ctx.createRadialGradient(0, 0, px(780), 0, 0, px(2600));
    g.addColorStop(0, "rgba(237,231,218,0)");
    g.addColorStop(0.15, "rgba(237,231,218,0.85)");
    g.addColorStop(0.29, "rgba(237,231,218,1)");
    g.addColorStop(1, "rgba(237,231,218,1)");
    ctx.fillStyle = g;
    ctx.fillRect(-512, -904, 1024, 1808);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <mesh rotation-x={-Math.PI / 2} position={[750, 0.6, 425]}>
      <planeGeometry args={[5200, 5200]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} fog={false} />
    </mesh>
  );
}

/* In-scene sky: a gradient dome whose horizon band is the exact fog color,
   so fully-fogged geometry dissolves into it without a seam. The CSS sky
   behind the canvas can't do that — its gradient lives in screen space
   while the horizon line lives in world space. MeshBasicMaterial (not a
   ShaderMaterial) so the texture runs through the same color-space and
   tone-mapping chain as the fog it must match. */
function SkyDome() {
  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 2;
    c.height = 256;
    const ctx = c.getContext("2d")!;
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    /* sphere UVs put canvas row 0 at the zenith, 0.5 at the horizon */
    g.addColorStop(0, "#BFD6E8");
    g.addColorStop(0.34, "#DCE7EF");
    g.addColorStop(0.48, "#EDE7DA");
    g.addColorStop(1, "#EDE7DA");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 2, 256);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <mesh position={[750, 0, 425]}>
      {/* the rig strays ~1000 from the dome centre; 4800 + 1000 stays inside
         the camera's 6000 far plane so the far wall never clips */}
      <sphereGeometry args={[4800, 32, 24]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} fog={false} depthWrite={false} />
    </mesh>
  );
}

function Sun() {
  const ref = useRef<THREE.DirectionalLight>(null!);
  useEffect(() => {
    ref.current.target.position.set(EPI.x, 0, EPI.z);
    ref.current.target.updateMatrixWorld();
  }, []);
  return (
    <directionalLight
      ref={ref}
      position={[330, 520, 1140]}
      intensity={1.6}
      color="#FFF2DE"
      castShadow
      shadow-mapSize={[2048, 2048]}
      shadow-camera-left={-480}
      shadow-camera-right={480}
      shadow-camera-top={480}
      shadow-camera-bottom={-480}
      shadow-camera-near={200}
      shadow-camera-far={2400}
      shadow-bias={-0.0004}
    />
  );
}

export function CityStage() {
  const group = useRef<THREE.Group>(null!);
  useFrame(() => {
    group.current.visible = orbitBridge.cityOn;
  });

  return (
    <group ref={group} visible={false}>
      <FogController />
      <SkyDome />
      <hemisphereLight args={["#EAF2F8", "#D9CFC0", 0.72]} />
      <Sun />
      <Ground />
      <HazeRing />
      <Buildings />
      <Trees />
      <HeroBuilding />
      <CityBeacon />
      <EntryClouds />
      <CityRig />
    </group>
  );
}
