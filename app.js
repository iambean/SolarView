import * as THREE from "./lib/three.module.js";
import { OrbitControls } from "./lib/OrbitControls.js";
import {
  ASTEROID_BELT_CONFIG,
  BODY_DEFINITIONS,
  SCENE_CONFIG,
  SIMULATION_CONFIG,
  STARFIELD_CONFIG,
} from "./config.js";

const infoPanel = document.getElementById("infoPanel");
const hint = document.getElementById("hint");
const infoTitle = document.getElementById("infoTitle");
const infoHighlight = document.getElementById("infoHighlight");
const infoSummary = document.getElementById("infoSummary");
const infoFacts = document.getElementById("infoFacts");
const infoSources = document.getElementById("infoSources");
const audioText = document.getElementById("audioText");
const audioNote = document.getElementById("audioNote");
const closeInfo = document.getElementById("closeInfo");
const muteBtn = document.getElementById("muteBtn");
const canvas = document.getElementById("scene");

function updatePlatformHint() {
  if (!hint) return;
  const isTouchLike =
    window.matchMedia("(pointer: coarse)").matches ||
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0;
  hint.textContent = isTouchLike
    ? "单指旋转 / 双指缩放 / 三指平移"
    : "左键旋转 / 滚轮缩放 / Shift+左键平移";
}
updatePlatformHint();
window.addEventListener("resize", updatePlatformHint);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = SCENE_CONFIG.renderer.toneMappingExposure;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x030811);

const camera = new THREE.PerspectiveCamera(
  SCENE_CONFIG.camera.fov,
  window.innerWidth / window.innerHeight,
  SCENE_CONFIG.camera.near,
  SCENE_CONFIG.camera.far
);
camera.position.set(...SCENE_CONFIG.camera.position);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = true;
controls.minDistance = SCENE_CONFIG.controls.minDistance;
controls.maxDistance = SCENE_CONFIG.controls.maxDistance;
controls.target.set(...SCENE_CONFIG.controls.target);
// PC: left drag rotate, Shift+left drag pan, wheel zoom.
controls.touches.ONE = THREE.TOUCH.ROTATE;
controls.touches.TWO = THREE.TOUCH.DOLLY;

scene.add(new THREE.AmbientLight(SCENE_CONFIG.lights.ambient.color, SCENE_CONFIG.lights.ambient.intensity));
scene.add(
  new THREE.HemisphereLight(
    SCENE_CONFIG.lights.hemisphere.skyColor,
    SCENE_CONFIG.lights.hemisphere.groundColor,
    SCENE_CONFIG.lights.hemisphere.intensity
  )
);
const sunLight = new THREE.PointLight(
  SCENE_CONFIG.lights.sun.color,
  SCENE_CONFIG.lights.sun.intensity,
  SCENE_CONFIG.lights.sun.distance,
  SCENE_CONFIG.lights.sun.decay
);
scene.add(sunLight);
// Demo-friendly camera fill light to avoid pitch-black planets when backlit.
const cameraFillLight = new THREE.DirectionalLight(
  SCENE_CONFIG.lights.cameraFill.color,
  SCENE_CONFIG.lights.cameraFill.intensity
);
scene.add(cameraFillLight);
scene.add(cameraFillLight.target);

const textureLoader = new THREE.TextureLoader();
const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

function loadTexture(path) {
  const t = textureLoader.load(path);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = maxAnisotropy;
  return t;
}

// Texture keys are referenced by `BODY_DEFINITIONS[*].texture`.
const textures = {
  sun: loadTexture("./assets/textures/sun.jpg"),
  mercury: loadTexture("./assets/textures/mercury.jpg"),
  venus: loadTexture("./assets/textures/venus.jpg"),
  earth: loadTexture("./assets/textures/earth.jpg"),
  mars: loadTexture("./assets/textures/mars.jpg"),
  jupiter: loadTexture("./assets/textures/jupiter.jpg"),
  saturn: loadTexture("./assets/textures/saturn.jpg"),
  saturnRing: loadTexture("./assets/textures/saturn_ring.png"),
  uranus: loadTexture("./assets/textures/uranus.jpg"),
  neptune: loadTexture("./assets/textures/neptune.jpg"),
  moon: loadTexture("./assets/textures/moon.jpg"),
  titan: loadTexture("./assets/textures/titan.png"),
};

let worldPaused = false;

const bodiesById = new Map();
const clickables = [];
const orbitLines = [];
const PLANET_IDS = ["mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune"];

const orbitLineMaterial = new THREE.LineBasicMaterial({ color: 0x355788, transparent: true, opacity: 0.28 });

function makeOrbit(radius, parent = scene) {
  const points = [];
  const seg = 128;
  for (let i = 0; i <= seg; i += 1) {
    const t = (i / seg) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(t) * radius, 0, Math.sin(t) * radius));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const line = new THREE.Line(geo, orbitLineMaterial.clone());
  parent.add(line);
  orbitLines.push(line);
}

function makeMaterial(def) {
  const map = textures[def.texture] || null;
  if (def.type === "star") {
    return new THREE.MeshBasicMaterial({ map, color: def.color || 0xffffff });
  }
  const isSaturn = def.id === "saturn";
  return new THREE.MeshStandardMaterial({
    map,
    color: isSaturn ? 0xfff0d6 : 0xffffff,
    roughness: isSaturn ? 0.78 : 0.9,
    metalness: 0,
    emissive: isSaturn ? 0x403522 : 0x1c2536,
    emissiveIntensity: isSaturn ? 0.42 : 0.22,
  });
}

// Build all celestial bodies from declarative config.
for (const def of BODY_DEFINITIONS) {
  const geometry = new THREE.SphereGeometry(def.radius, 48, 36);
  const mesh = new THREE.Mesh(geometry, makeMaterial(def));
  mesh.userData.bodyId = def.id;
  scene.add(mesh);

  const body = {
    ...def,
    mesh,
    angle: Math.random() * Math.PI * 2,
    spin: Math.random() * Math.PI * 2,
    worldPos: new THREE.Vector3(),
  };

  bodiesById.set(def.id, body);
  clickables.push(mesh);

  if (def.type === "planet") makeOrbit(def.orbitRadius, scene);
}

for (const def of BODY_DEFINITIONS) {
  if (def.type !== "moon") continue;
  const parent = bodiesById.get(def.parent);
  if (parent) makeOrbit(def.orbitRadius, parent.mesh);
}

const saturn = bodiesById.get("saturn");
if (saturn) {
  const innerR = saturn.radius * 1.55;
  const outerR = saturn.radius * 2.4;
  const ringGeo = new THREE.RingGeometry(innerR, outerR, 128);
  const pos = ringGeo.attributes.position;
  const uv = [];
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const r = Math.sqrt(x * x + y * y);
    const u = (r - innerR) / (outerR - innerR);
    uv.push(u, 0.5);
  }
  ringGeo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));

  textures.saturnRing.wrapS = THREE.ClampToEdgeWrapping;
  textures.saturnRing.wrapT = THREE.ClampToEdgeWrapping;
  textures.saturnRing.needsUpdate = true;

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

const starCount = STARFIELD_CONFIG.count;
const starPos = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i += 1) {
  const r =
    STARFIELD_CONFIG.radiusBase *
    (STARFIELD_CONFIG.radiusMinFactor + Math.random() * STARFIELD_CONFIG.radiusRange);
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
  starPos[i * 3 + 1] = r * Math.cos(phi);
  starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
}
const starGeo = new THREE.BufferGeometry();
starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
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
    })
  )
);

function pickAsteroidRadius() {
  // Approximate Kirkwood gaps for a less uniform ring.
  while (true) {
    const r = ASTEROID_BELT_CONFIG.radiusMin + Math.random() * ASTEROID_BELT_CONFIG.radiusRange;
    const inGap = ASTEROID_BELT_CONFIG.gaps.some(([start, end]) => r > start && r < end);
    if (!inGap) return r;
  }
}

function buildAsteroidLayer(count, size, opacity) {
  const geometry = new THREE.IcosahedronGeometry(1, 0);
  const material = new THREE.MeshStandardMaterial({
    color: 0xc9c2b5,
    roughness: 1,
    metalness: 0,
    emissive: 0x5f5a52,
    emissiveIntensity: 1.05,
    transparent: true,
    opacity: Math.min(1, opacity + 0.08),
  });
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;

  const dummy = new THREE.Object3D();
  const data = [];

  for (let i = 0; i < count; i += 1) {
    const radius = pickAsteroidRadius();
    const angle = Math.random() * Math.PI * 2;
    const eccentricity = Math.random() * ASTEROID_BELT_CONFIG.eccentricityMax;
    const minorRadius = radius * (1 - eccentricity);
    const inclAmp = ASTEROID_BELT_CONFIG.inclinationMin + Math.random() * ASTEROID_BELT_CONFIG.inclinationRange;
    const inclPhase = Math.random() * Math.PI * 2;
    const scale = size * (ASTEROID_BELT_CONFIG.scaleMinFactor + Math.random() * ASTEROID_BELT_CONFIG.scaleRangeFactor);
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
  scene.add(mesh);
  return { mesh, data, dummy };
}

const asteroidLayers = [
  ...ASTEROID_BELT_CONFIG.layers.map((layer) => buildAsteroidLayer(layer.count, layer.size, layer.opacity)),
];

function getInnerPlanetAverageAngularSpeed() {
  const rates = PLANET_IDS.map((id) => {
    const body = bodiesById.get(id);
    if (!body || !body.orbitalPeriodDays) return 0;
    return (SIMULATION_CONFIG.globalOrbitSpeed * Math.PI * 2) / body.orbitalPeriodDays;
  }).filter((v) => v > 0);
  if (rates.length === 0) return 0;
  return rates.reduce((sum, v) => sum + v, 0) / rates.length;
}

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let pointerDown = null;

const activeAudio = new Audio();
activeAudio.crossOrigin = "anonymous";
activeAudio.loop = true;
activeAudio.volume = 0.65;
let isMuted = false;

function updateAudioUi(message) {
  audioText.textContent = `音频：${message}`;
}

function playBodyAudio(body) {
  if (!body.audio?.url) {
    updateAudioUi(`${body.name} 暂无可播放音频`);
    return;
  }
  activeAudio.pause();
  activeAudio.src = body.audio.url;
  activeAudio.currentTime = 0;
  activeAudio.muted = isMuted;
  activeAudio
    .play()
    .then(() => {
      const mode = body.audio.type === "direct" ? "NASA 直接音频" : "NASA 相关任务音频";
      updateAudioUi(`${body.name}（${mode}）`);
    })
    .catch(() => updateAudioUi(`${body.name} 音频播放受浏览器策略限制，请再次点击`));
}

activeAudio.addEventListener("error", () => updateAudioUi("音频资源加载失败"));

function showBodyInfo(body) {
  const formatRotation = (hours) => {
    if (hours == null) return "暂无";
    const abs = Math.abs(hours);
    const direction = hours < 0 ? "（逆行）" : "";
    if (abs >= 24) return `${(abs / 24).toFixed(1)} 地球日${direction}`;
    return `${abs.toFixed(1)} 小时${direction}`;
  };
  const formatOrbit = (days) => {
    if (days == null) return "不适用";
    const abs = Math.abs(days);
    const direction = days < 0 ? "（逆行）" : "";
    if (abs >= 365) return `${(abs / 365.25).toFixed(2)} 地球年${direction}`;
    return `${abs.toFixed(1)} 地球日${direction}`;
  };

  infoTitle.textContent = body.name;
  infoHighlight.textContent = `最大特点：${body.highlight || "暂无"}`;
  infoSummary.textContent = body.summary;
  infoFacts.innerHTML = "";
  const periodFacts = [`自转周期：${formatRotation(body.rotationHours)}`, `公转周期：${formatOrbit(body.orbitalPeriodDays)}`];
  [...periodFacts, ...body.facts].forEach((fact) => {
    const li = document.createElement("li");
    li.textContent = fact;
    infoFacts.appendChild(li);
  });
  audioNote.textContent = body.audio?.note || "";
  infoSources.innerHTML = `来源：${body.sources
    .map((s) => `<a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.label}</a>`)
    .join(" | ")}`;
  infoPanel.classList.remove("hidden");
  worldPaused = true;
}

function closeInfoPanel() {
  if (infoPanel.classList.contains("hidden")) return;
  infoPanel.classList.add("hidden");
  worldPaused = false;
}

closeInfo.addEventListener("click", closeInfoPanel);

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !infoPanel.classList.contains("hidden")) {
    closeInfoPanel();
  }
});

muteBtn.addEventListener("click", () => {
  isMuted = !isMuted;
  activeAudio.muted = isMuted;
  muteBtn.textContent = isMuted ? "取消静音" : "静音";
});

let cameraTween = null;
function startCameraTween(body, duration = 1000) {
  const worldPos = body.mesh.getWorldPosition(new THREE.Vector3());
  const startPos = camera.position.clone();
  const startTarget = controls.target.clone();
  let dir = camera.position.clone().sub(controls.target);
  if (dir.lengthSq() < 0.001) dir = new THREE.Vector3(1, 0.5, 1);
  dir.normalize();
  const distance = Math.max(16, body.radius * 7 + 12);
  const endPos = worldPos.clone().add(dir.multiplyScalar(distance));
  cameraTween = {
    start: performance.now(),
    duration,
    startPos,
    endPos,
    startTarget,
    endTarget: worldPos,
  };
}

function focusBody(body) {
  showBodyInfo(body);
  playBodyAudio(body);
  startCameraTween(body);
}

renderer.domElement.addEventListener("pointerdown", (event) => {
  pointerDown = { x: event.clientX, y: event.clientY };
});
renderer.domElement.addEventListener("pointerup", (event) => {
  if (!infoPanel.classList.contains("hidden")) {
    closeInfoPanel();
    pointerDown = null;
    return;
  }

  if (!pointerDown) return;
  const dx = event.clientX - pointerDown.x;
  const dy = event.clientY - pointerDown.y;
  pointerDown = null;
  if (Math.hypot(dx, dy) > 7) return;

  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(clickables, false)[0];
  if (!hit) return;

  const body = bodiesById.get(hit.object.userData.bodyId);
  if (body) focusBody(body);
});

document.addEventListener("pointerdown", (event) => {
  if (infoPanel.classList.contains("hidden")) return;
  if (infoPanel.contains(event.target)) return;
  closeInfoPanel();
});

function updateBodies(dt) {
  // 1) Update sun/planets/moons transforms.
  const sun = bodiesById.get("sun");
  if (sun) {
    sun.mesh.position.set(0, 0, 0);
    sunLight.position.copy(sun.mesh.position);
    sun.spin += (dt * SIMULATION_CONFIG.spinSpeed * 24 * Math.PI * 2) / Math.abs(sun.rotationHours);
    sun.mesh.rotation.y = sun.spin;
  }

  bodiesById.forEach((body) => {
    if (body.type !== "planet") return;
    body.angle +=
      (dt * SIMULATION_CONFIG.globalOrbitSpeed * Math.PI * 2) /
      body.orbitalPeriodDays;
    body.mesh.position.set(Math.cos(body.angle) * body.orbitRadius, 0, Math.sin(body.angle) * body.orbitRadius);

    const spinDir = body.rotationHours < 0 ? -1 : 1;
    body.spin +=
      (dt * SIMULATION_CONFIG.spinSpeed * 24 * Math.PI * 2 * spinDir) / Math.abs(body.rotationHours);
    body.mesh.rotation.y = body.spin;
  });

  bodiesById.forEach((body) => {
    if (body.type !== "moon") return;
    const parent = bodiesById.get(body.parent);
    if (!parent) return;

    const orbitDir = body.orbitalPeriodDays < 0 ? -1 : 1;
    const factor = body.orbitSpeedFactor || 1;
    body.angle +=
      (dt * SIMULATION_CONFIG.globalOrbitSpeed * Math.PI * 2 * orbitDir * factor) /
      Math.abs(body.orbitalPeriodDays);

    body.mesh.position.set(
      parent.mesh.position.x + Math.cos(body.angle) * body.orbitRadius,
      parent.mesh.position.y,
      parent.mesh.position.z + Math.sin(body.angle) * body.orbitRadius
    );

    const spinDir = body.rotationHours < 0 ? -1 : 1;
    body.spin +=
      (dt * SIMULATION_CONFIG.spinSpeed * 24 * Math.PI * 2 * spinDir * 0.8) /
      Math.abs(body.rotationHours);
    body.mesh.rotation.y = body.spin;
  });

  // 2) Update asteroid-belt instanced meshes.
  const asteroidAngularSpeed = getInnerPlanetAverageAngularSpeed();
  asteroidLayers.forEach((layer) => {
    const { dummy } = layer;
    for (let i = 0; i < layer.data.length; i += 1) {
      const a = layer.data[i];
      // Use the average angular speed of all 8 planets.
      a.angle += dt * asteroidAngularSpeed;
      dummy.position.set(
        Math.cos(a.angle) * a.radius,
        Math.sin(a.angle * 2 + a.inclPhase) * a.inclAmp,
        Math.sin(a.angle) * a.minorRadius
      );
      a.rot.x += a.spin * 0.01;
      a.rot.y += a.spin * 0.013;
      a.rot.z += a.spin * 0.008;
      dummy.rotation.copy(a.rot);
      dummy.scale.setScalar(a.scale);
      dummy.updateMatrix();
      layer.mesh.setMatrixAt(i, dummy.matrix);
    }
    layer.mesh.instanceMatrix.needsUpdate = true;
  });
}

function updateCameraTween() {
  if (!cameraTween) return;
  const t = Math.min(1, (performance.now() - cameraTween.start) / cameraTween.duration);
  const ease = 1 - (1 - t) ** 3;
  camera.position.lerpVectors(cameraTween.startPos, cameraTween.endPos, ease);
  controls.target.lerpVectors(cameraTween.startTarget, cameraTween.endTarget, ease);
  if (t >= 1) cameraTween = null;
}

function panCameraByPixels(dx, dy) {
  const distance = camera.position.distanceTo(controls.target);
  const panScale = distance * 0.0016;
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
  const up = camera.up.clone().normalize();
  const delta = new THREE.Vector3()
    .add(right.multiplyScalar(-dx * panScale))
    .add(up.multiplyScalar(dy * panScale));
  camera.position.add(delta);
  controls.target.add(delta);
}

let threeFingerPan = null;
renderer.domElement.addEventListener(
  "touchstart",
  (e) => {
    if (e.touches.length === 3) {
      const cX = (e.touches[0].clientX + e.touches[1].clientX + e.touches[2].clientX) / 3;
      const cY = (e.touches[0].clientY + e.touches[1].clientY + e.touches[2].clientY) / 3;
      threeFingerPan = { x: cX, y: cY };
      controls.enabled = false;
      e.preventDefault();
    }
  },
  { passive: false }
);
renderer.domElement.addEventListener(
  "touchmove",
  (e) => {
    if (threeFingerPan && e.touches.length === 3) {
      const cX = (e.touches[0].clientX + e.touches[1].clientX + e.touches[2].clientX) / 3;
      const cY = (e.touches[0].clientY + e.touches[1].clientY + e.touches[2].clientY) / 3;
      panCameraByPixels(cX - threeFingerPan.x, cY - threeFingerPan.y);
      threeFingerPan.x = cX;
      threeFingerPan.y = cY;
      e.preventDefault();
    }
  },
  { passive: false }
);
renderer.domElement.addEventListener("touchend", () => {
  if (threeFingerPan) {
    threeFingerPan = null;
    controls.enabled = true;
  }
});
renderer.domElement.addEventListener("touchcancel", () => {
  if (threeFingerPan) {
    threeFingerPan = null;
    controls.enabled = true;
  }
});

const clock = new THREE.Clock();
function animate() {
  // Main frame loop: simulation -> camera easing -> render.
  const dt = Math.min(clock.getDelta(), 0.05);
  if (!worldPaused) updateBodies(dt);
  updateCameraTween();
  const shouldShowOrbitLines =
    camera.position.distanceTo(controls.target) <= SCENE_CONFIG.visual.orbitLineHideDistance;
  orbitLines.forEach((line) => {
    line.visible = shouldShowOrbitLines;
  });
  cameraFillLight.position.copy(camera.position).add(new THREE.Vector3(40, 30, 20));
  cameraFillLight.target.position.copy(controls.target);
  cameraFillLight.target.updateMatrixWorld();
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
