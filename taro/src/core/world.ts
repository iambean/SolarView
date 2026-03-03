import {
  ASTEROID_BELT_CONFIG,
  BODY_DEFINITIONS,
  SCENE_CONFIG,
  SIMULATION_CONFIG,
  STARFIELD_CONFIG,
} from './config';
import { textureAssetMap } from './assets';
import type { BodyDefinition } from './types';

export const PLANET_IDS = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'] as const;

export interface BodyState extends BodyDefinition {
  mesh: any;
  angle: number;
  spin: number;
}

export interface AsteroidLayerState {
  mesh: any;
  data: Array<{
    radius: number;
    minorRadius: number;
    angle: number;
    inclAmp: number;
    inclPhase: number;
    scale: number;
    spin: number;
    rot: any;
  }>;
  dummy: any;
}

export function applyTextureColorSpace(THREE: any, texture: any) {
  if (!texture) return;
  if ('SRGBColorSpace' in THREE) {
    texture.colorSpace = THREE.SRGBColorSpace;
  } else if ('sRGBEncoding' in THREE) {
    texture.encoding = THREE.sRGBEncoding;
  }
}

export function setRendererColorSpace(THREE: any, renderer: any) {
  if ('SRGBColorSpace' in THREE && 'outputColorSpace' in renderer) {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
  } else if ('sRGBEncoding' in THREE && 'outputEncoding' in renderer) {
    renderer.outputEncoding = THREE.sRGBEncoding;
  }
}

export function loadTextures(THREE: any, textureLoader: any, renderer?: any) {
  const maxAnisotropy = renderer?.capabilities?.getMaxAnisotropy?.() ?? 1;
  const load = (key: string) => {
    const tex = textureLoader.load(textureAssetMap[key]);
    applyTextureColorSpace(THREE, tex);
    if ('anisotropy' in tex) tex.anisotropy = maxAnisotropy;
    return tex;
  };

  return {
    sun: load('sun'),
    mercury: load('mercury'),
    venus: load('venus'),
    earth: load('earth'),
    mars: load('mars'),
    jupiter: load('jupiter'),
    saturn: load('saturn'),
    saturnRing: load('saturnRing'),
    uranus: load('uranus'),
    neptune: load('neptune'),
    moon: load('moon'),
    titan: load('titan'),
  };
}

export function makeOrbit(THREE: any, radius: number, parent: any, orbitLines: any[]) {
  const points: any[] = [];
  const seg = 128;
  for (let i = 0; i <= seg; i += 1) {
    const t = (i / seg) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(t) * radius, 0, Math.sin(t) * radius));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineBasicMaterial({ color: 0x355788, transparent: true, opacity: 0.28 });
  const line = new THREE.Line(geo, mat);
  parent.add(line);
  orbitLines.push(line);
}

export function makeMaterial(THREE: any, textures: Record<string, any>, def: BodyDefinition) {
  const map = textures[def.texture] || null;
  if (def.type === 'star') {
    return new THREE.MeshBasicMaterial({ map, color: def.color || 0xffffff });
  }
  const isSaturn = def.id === 'saturn';
  return new THREE.MeshStandardMaterial({
    map,
    color: isSaturn ? 0xfff0d6 : 0xffffff,
    roughness: isSaturn ? 0.78 : 0.9,
    metalness: 0,
    emissive: isSaturn ? 0x403522 : 0x1c2536,
    emissiveIntensity: isSaturn ? 0.42 : 0.22,
  });
}

export function buildWorld(THREE: any, scene: any, textures: Record<string, any>) {
  const bodiesById = new Map<string, BodyState>();
  const clickables: any[] = [];
  const orbitLines: any[] = [];

  for (const def of BODY_DEFINITIONS) {
    const geometry = new THREE.SphereGeometry(def.radius, 48, 36);
    const mesh = new THREE.Mesh(geometry, makeMaterial(THREE, textures, def));
    mesh.userData.bodyId = def.id;
    scene.add(mesh);

    const body: BodyState = {
      ...def,
      mesh,
      angle: Math.random() * Math.PI * 2,
      spin: Math.random() * Math.PI * 2,
    };

    bodiesById.set(def.id, body);
    clickables.push(mesh);
    if (def.type === 'planet') makeOrbit(THREE, def.orbitRadius, scene, orbitLines);
  }

  for (const def of BODY_DEFINITIONS) {
    if (def.type !== 'moon') continue;
    const parent = bodiesById.get(def.parent as string);
    if (parent) makeOrbit(THREE, def.orbitRadius, parent.mesh, orbitLines);
  }

  const saturn = bodiesById.get('saturn');
  if (saturn) {
    const innerR = saturn.radius * 1.55;
    const outerR = saturn.radius * 2.4;
    // Weapp (`threejs-miniprogram`) may use older Three revisions where
    // `RingGeometry` is not always BufferGeometry with `attributes.position`.
    const RingCtor = THREE.RingBufferGeometry || THREE.RingGeometry;
    const ringGeo = new RingCtor(innerR, outerR, 128);
    const pos = ringGeo?.attributes?.position;
    if (pos && typeof ringGeo.setAttribute === 'function' && THREE.Float32BufferAttribute) {
      const uv: number[] = [];
      for (let i = 0; i < pos.count; i += 1) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const r = Math.sqrt(x * x + y * y);
        const u = (r - innerR) / (outerR - innerR);
        uv.push(u, 0.5);
      }
      ringGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    }

    if ('ClampToEdgeWrapping' in THREE) {
      textures.saturnRing.wrapS = THREE.ClampToEdgeWrapping;
      textures.saturnRing.wrapT = THREE.ClampToEdgeWrapping;
      textures.saturnRing.needsUpdate = true;
    }

    const ringMat = new THREE.MeshBasicMaterial({
      map: textures.saturnRing,
      alphaMap: textures.saturnRing,
      color: 0xf5e8ce,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95,
      alphaTest: 0.12,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    saturn.mesh.add(ring);
  }

  const starPos = new Float32Array(STARFIELD_CONFIG.count * 3);
  for (let i = 0; i < STARFIELD_CONFIG.count; i += 1) {
    const r = STARFIELD_CONFIG.radiusBase * (STARFIELD_CONFIG.radiusMinFactor + Math.random() * STARFIELD_CONFIG.radiusRange);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPos[i * 3 + 1] = r * Math.cos(phi);
    starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  scene.add(
    new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({
        color: STARFIELD_CONFIG.color,
        size: STARFIELD_CONFIG.size,
        sizeAttenuation: true,
        transparent: true,
        opacity: STARFIELD_CONFIG.opacity,
        depthWrite: false,
      }),
    ),
  );

  const pickAsteroidRadius = () => {
    while (true) {
      const r = ASTEROID_BELT_CONFIG.radiusMin + Math.random() * ASTEROID_BELT_CONFIG.radiusRange;
      const inGap = ASTEROID_BELT_CONFIG.gaps.some(([s, e]) => r > s && r < e);
      if (!inGap) return r;
    }
  };

  const asteroidLayers: AsteroidLayerState[] = ASTEROID_BELT_CONFIG.layers.map((layer) => {
    const geo = new THREE.IcosahedronGeometry(1, 0);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xc9c2b5,
      roughness: 1,
      metalness: 0,
      emissive: 0x5f5a52,
      emissiveIntensity: 1.05,
      transparent: true,
      opacity: Math.min(1, layer.opacity + 0.08),
    });
    const mesh = new THREE.InstancedMesh(geo, mat, layer.count);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false;
    scene.add(mesh);

    const data: AsteroidLayerState['data'] = [];
    const dummy = new THREE.Object3D();
    for (let i = 0; i < layer.count; i += 1) {
      const radius = pickAsteroidRadius();
      const angle = Math.random() * Math.PI * 2;
      const eccentricity = Math.random() * ASTEROID_BELT_CONFIG.eccentricityMax;
      const minorRadius = radius * (1 - eccentricity);
      const inclAmp = ASTEROID_BELT_CONFIG.inclinationMin + Math.random() * ASTEROID_BELT_CONFIG.inclinationRange;
      const inclPhase = Math.random() * Math.PI * 2;
      const scale = layer.size * (ASTEROID_BELT_CONFIG.scaleMinFactor + Math.random() * ASTEROID_BELT_CONFIG.scaleRangeFactor);
      const spin = (Math.random() - 0.5) * ASTEROID_BELT_CONFIG.spinAmplitude;
      const rot = new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

      data.push({ radius, minorRadius, angle, inclAmp, inclPhase, scale, spin, rot });
      dummy.position.set(Math.cos(angle) * radius, Math.sin(angle * 2 + inclPhase) * inclAmp, Math.sin(angle) * minorRadius);
      dummy.rotation.copy(rot);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    return { mesh, data, dummy };
  });

  return { bodiesById, clickables, orbitLines, asteroidLayers };
}

export function getAveragePlanetAngularSpeed(bodiesById: Map<string, BodyState>) {
  const rates = PLANET_IDS.map((id) => {
    const body = bodiesById.get(id);
    if (!body || !body.orbitalPeriodDays) return 0;
    return (SIMULATION_CONFIG.globalOrbitSpeed * Math.PI * 2) / body.orbitalPeriodDays;
  }).filter((v) => v > 0);
  if (rates.length === 0) return 0;
  return rates.reduce((sum, v) => sum + v, 0) / rates.length;
}

export function updateBodies(THREE: any, bodiesById: Map<string, BodyState>, asteroidLayers: AsteroidLayerState[], sunLight: any, dt: number) {
  const sun = bodiesById.get('sun');
  if (sun) {
    sun.mesh.position.set(0, 0, 0);
    sunLight.position.copy(sun.mesh.position);
    sun.spin += (dt * SIMULATION_CONFIG.spinSpeed * 24 * Math.PI * 2) / Math.abs(sun.rotationHours || 1);
    sun.mesh.rotation.y = sun.spin;
  }

  bodiesById.forEach((body) => {
    if (body.type !== 'planet' || !body.orbitalPeriodDays) return;
    body.angle += (dt * SIMULATION_CONFIG.globalOrbitSpeed * Math.PI * 2) / body.orbitalPeriodDays;
    body.mesh.position.set(Math.cos(body.angle) * body.orbitRadius, 0, Math.sin(body.angle) * body.orbitRadius);
    const spinDir = (body.rotationHours || 1) < 0 ? -1 : 1;
    body.spin += (dt * SIMULATION_CONFIG.spinSpeed * 24 * Math.PI * 2 * spinDir) / Math.abs(body.rotationHours || 1);
    body.mesh.rotation.y = body.spin;
  });

  bodiesById.forEach((body) => {
    if (body.type !== 'moon' || !body.orbitalPeriodDays) return;
    const parent = body.parent ? bodiesById.get(body.parent) : null;
    if (!parent) return;
    const orbitDir = body.orbitalPeriodDays < 0 ? -1 : 1;
    const factor = body.orbitSpeedFactor || 1;
    body.angle +=
      (dt * SIMULATION_CONFIG.globalOrbitSpeed * Math.PI * 2 * orbitDir * factor) /
      Math.abs(body.orbitalPeriodDays);

    body.mesh.position.set(
      parent.mesh.position.x + Math.cos(body.angle) * body.orbitRadius,
      parent.mesh.position.y,
      parent.mesh.position.z + Math.sin(body.angle) * body.orbitRadius,
    );

    const spinDir = (body.rotationHours || 1) < 0 ? -1 : 1;
    body.spin +=
      (dt * SIMULATION_CONFIG.spinSpeed * 24 * Math.PI * 2 * spinDir * 0.8) /
      Math.abs(body.rotationHours || 1);
    body.mesh.rotation.y = body.spin;
  });

  const asteroidAngularSpeed = getAveragePlanetAngularSpeed(bodiesById);
  asteroidLayers.forEach((layer) => {
    for (let i = 0; i < layer.data.length; i += 1) {
      const a = layer.data[i];
      a.angle += dt * asteroidAngularSpeed;
      layer.dummy.position.set(
        Math.cos(a.angle) * a.radius,
        Math.sin(a.angle * 2 + a.inclPhase) * a.inclAmp,
        Math.sin(a.angle) * a.minorRadius,
      );
      a.rot.x += a.spin * 0.01;
      a.rot.y += a.spin * 0.013;
      a.rot.z += a.spin * 0.008;
      layer.dummy.rotation.copy(a.rot);
      layer.dummy.scale.setScalar(a.scale);
      layer.dummy.updateMatrix();
      layer.mesh.setMatrixAt(i, layer.dummy.matrix);
    }
    layer.mesh.instanceMatrix.needsUpdate = true;
  });
}

export function shouldShowOrbitLines(cameraPos: any, target: any): boolean {
  return cameraPos.distanceTo(target) <= SCENE_CONFIG.visual.orbitLineHideDistance;
}
