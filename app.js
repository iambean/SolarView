import * as THREE from "./lib/three.module.js";
import { OrbitControls } from "./lib/OrbitControls.js";

const infoPanel = document.getElementById("infoPanel");
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

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.35;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x030811);

const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 5000);
camera.position.set(0, 85, 205);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 18;
controls.maxDistance = 1200;
controls.target.set(0, 0, 0);

scene.add(new THREE.AmbientLight(0x7a94c6, 0.95));
scene.add(new THREE.HemisphereLight(0x91b8ff, 0x13223d, 0.6));
const sunLight = new THREE.PointLight(0xfff0cc, 4.6, 1800, 1.15);
scene.add(sunLight);
// Demo-friendly camera fill light to avoid pitch-black planets when backlit.
const cameraFillLight = new THREE.DirectionalLight(0xbfd7ff, 0.48);
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

const ORBIT_SPEED = 0.085;
const SPIN_SPEED = 0.05;
let worldPaused = false;

const bodyDefinitions = [
  {
    id: "sun",
    name: "太阳",
    type: "star",
    radius: 14,
    color: 0xffc672,
    texture: "sun",
    orbitRadius: 0,
    orbitalPeriodDays: null,
    rotationHours: 609,
    highlight: "太阳系唯一恒星，提供几乎全部光和热能。",
    summary: "太阳是太阳系中心恒星，提供行星所需的光和热。",
    facts: ["约占太阳系总质量的 99.8%。", "光从太阳到地球约需 8 分 20 秒。", "太阳活动会影响空间天气与地球电离层。"],
    sources: [
      { label: "NASA Solar System Exploration - Sun", url: "assets/external/solarsystem.nasa.gov_sun_overview_" },
      { label: "NASA Science - Sun", url: "assets/external/science.nasa.gov_sun_" },
    ],
    audio: {
      url: "assets/external/www.nasa.gov_wp-content_uploads_2023_03_solar-system-sounds-sun.wav",
      type: "direct",
      note: "NASA 官方：SOHO 观测数据转译的太阳声音。",
    },
  },
  {
    id: "mercury",
    name: "水星",
    type: "planet",
    radius: 1.35,
    texture: "mercury",
    orbitRadius: 24,
    orbitalPeriodDays: 88,
    rotationHours: 1407.6,
    highlight: "距离太阳最近的行星，公转最快。",
    summary: "水星是最靠近太阳的行星，昼夜温差极端。",
    facts: ["公转周期约 88 天。", "表面遍布撞击坑，几乎无大气层。", "自转周期约 59 个地球日。"],
    sources: [{ label: "NASA - Mercury", url: "assets/external/solarsystem.nasa.gov_planets_mercury_overview_" }],
    audio: { url: "assets/external/www.nasa.gov_wp-content_uploads_2023_03_solar-system-sounds-sun.wav", type: "related", note: "该天体暂无 NASA 公开直接音频，播放最近相关任务音频（太阳环境）。" },
  },
  {
    id: "venus",
    name: "金星",
    type: "planet",
    radius: 2.1,
    texture: "venus",
    orbitRadius: 35,
    orbitalPeriodDays: 224.7,
    rotationHours: -5832.5,
    highlight: "自转方向与多数行星相反，且表面温度极高。",
    summary: "金星大小接近地球，但拥有极端温室效应。",
    facts: ["表面温度在八大行星中最高。", "浓密大气以二氧化碳为主。", "自转方向与多数行星相反。"],
    sources: [{ label: "NASA - Venus", url: "assets/external/solarsystem.nasa.gov_planets_venus_overview_" }],
    audio: { url: "assets/external/www.nasa.gov_wp-content_uploads_2023_03_solar-system-sounds-sun.wav", type: "related", note: "该天体暂无 NASA 公开直接音频，播放最近相关任务音频（太阳环境）。" },
  },
  {
    id: "earth",
    name: "地球",
    type: "planet",
    radius: 2.2,
    texture: "earth",
    orbitRadius: 46,
    orbitalPeriodDays: 365.25,
    rotationHours: 23.93,
    highlight: "太阳系已知唯一拥有生命的行星。",
    summary: "地球是目前已知唯一存在稳定地表液态水并孕育生命的行星。",
    facts: ["拥有全球海洋与活跃板块构造。", "1 个天然卫星（月球）。", "磁层可偏转大量高能带电粒子。"],
    sources: [{ label: "NASA - Earth", url: "assets/external/solarsystem.nasa.gov_planets_earth_overview_" }],
    audio: { url: "assets/external/www.nasa.gov_wp-content_uploads_2023_03_solar-system-sounds-earth.wav", type: "related", note: "NASA 官方：Apollo 11 月面任务相关音频。" },
  },
  {
    id: "mars",
    name: "火星",
    type: "planet",
    radius: 1.7,
    texture: "mars",
    orbitRadius: 58,
    orbitalPeriodDays: 687,
    rotationHours: 24.6,
    highlight: "最像地球的岩质行星，也是人类重点探测目标。",
    summary: "火星是岩质行星，拥有稀薄大气与巨型火山地貌。",
    facts: ["大气以二氧化碳为主且很稀薄。", "拥有奥林帕斯山等大型地貌。", "多个 NASA 探测器在轨或在地表工作过。"],
    sources: [{ label: "NASA - Mars", url: "assets/external/solarsystem.nasa.gov_planets_mars_overview_" }],
    audio: { url: "assets/external/photojournal.jpl.nasa.gov_archive_PIA23729.mp3", type: "direct", note: "NASA 官方：Perseverance 记录的火星环境声音。" },
  },
  {
    id: "jupiter",
    name: "木星",
    type: "planet",
    radius: 6.2,
    texture: "jupiter",
    orbitRadius: 80,
    orbitalPeriodDays: 4331,
    rotationHours: 9.93,
    highlight: "太阳系最大行星，拥有极强磁场和大红斑。",
    summary: "木星是太阳系最大行星，拥有强磁场和著名的大红斑。",
    facts: ["主要由氢和氦组成。", "拥有大量卫星系统。", "Juno 探测器持续研究其内部与磁场。"],
    sources: [{ label: "NASA - Jupiter", url: "assets/external/solarsystem.nasa.gov_planets_jupiter_overview_" }],
    audio: { url: "assets/external/photojournal.jpl.nasa.gov_archive_PIA24724.mp4", type: "direct", note: "NASA 官方：Juno 观测到的木星极光电磁波音频化结果。" },
  },
  {
    id: "saturn",
    name: "土星",
    type: "planet",
    radius: 5.2,
    texture: "titan",
    orbitRadius: 102,
    orbitalPeriodDays: 10747,
    rotationHours: 10.7,
    highlight: "拥有太阳系最显著的行星环系统。",
    summary: "土星以明亮环系著称，是典型气体巨行星。",
    facts: ["环系主要由冰粒与岩屑组成。", "平均密度低于水。", "Cassini 长期绕土星探测，数据极为丰富。"],
    sources: [{ label: "NASA - Saturn", url: "assets/external/solarsystem.nasa.gov_planets_saturn_overview_" }],
    audio: { url: "assets/external/photojournal.jpl.nasa.gov_archive_PIA07966.wav", type: "direct", note: "NASA 官方：Cassini 探测到的土星无线电发射音频。" },
  },
  {
    id: "uranus",
    name: "天王星",
    type: "planet",
    radius: 3.4,
    texture: "uranus",
    orbitRadius: 125,
    orbitalPeriodDays: 30589,
    rotationHours: -17.2,
    highlight: "自转轴几乎横躺，呈“躺着转”的独特姿态。",
    summary: "天王星是冰巨星，自转轴倾角约 98°，几乎侧躺公转。",
    facts: ["大气含氢、氦与甲烷。", "拥有暗淡环系与多颗卫星。", "主要近距离探测来自 Voyager 2。"],
    sources: [{ label: "NASA - Uranus", url: "assets/external/solarsystem.nasa.gov_planets_uranus_overview_" }],
    audio: { url: "assets/external/photojournal.jpl.nasa.gov_archive_PIA23641.mp4", type: "related", note: "该天体暂无 NASA 公开直接音频，播放 Voyager 相关等离子体波音频。" },
  },
  {
    id: "neptune",
    name: "海王星",
    type: "planet",
    radius: 3.3,
    texture: "neptune",
    orbitRadius: 145,
    orbitalPeriodDays: 59800,
    rotationHours: 16.1,
    highlight: "八大行星中最远，拥有极端强风环境。",
    summary: "海王星是最远的已知大行星，拥有极强高空风速。",
    facts: ["大气中甲烷使其呈蓝色。", "风速可达太阳系前列。", "Voyager 2 于 1989 年飞掠海王星。"],
    sources: [{ label: "NASA - Neptune", url: "assets/external/solarsystem.nasa.gov_planets_neptune_overview_" }],
    audio: { url: "assets/external/photojournal.jpl.nasa.gov_archive_PIA23641.mp4", type: "related", note: "该天体暂无 NASA 公开直接音频，播放 Voyager 相关等离子体波音频。" },
  },
  {
    id: "moon",
    name: "月球",
    type: "moon",
    parent: "earth",
    radius: 0.9,
    texture: "moon",
    orbitRadius: 5.6,
    orbitalPeriodDays: 27.3,
    rotationHours: 655.7,
    orbitSpeedFactor: 0.35,
    highlight: "地球唯一天然卫星，长期潮汐锁定地球。",
    summary: "月球是地球唯一的天然卫星，与地球潮汐锁定。",
    facts: ["公转周期与自转周期接近，因此几乎总以同一面朝向地球。", "表面覆盖大量撞击坑。", "Apollo 任务实现了载人登月。"],
    sources: [{ label: "NASA - Earth's Moon", url: "assets/external/solarsystem.nasa.gov_moons_earths-moon_overview_" }],
    audio: { url: "assets/external/www.nasa.gov_wp-content_uploads_2023_03_solar-system-sounds-earth.wav", type: "related", note: "NASA 官方：Apollo 11 月面任务相关音频。" },
  },
  {
    id: "europa",
    name: "木卫二（Europa）",
    type: "moon",
    parent: "jupiter",
    radius: 0.95,
    texture: "moon",
    orbitRadius: 8.5,
    orbitalPeriodDays: 3.55,
    rotationHours: 85.2,
    orbitSpeedFactor: 0.08,
    highlight: "冰壳下可能存在全球海洋，是潜在宜居卫星代表。",
    summary: "木卫二表面以冰壳为主，是最受关注的潜在宜居卫星之一。",
    facts: ["冰壳下可能存在全球液态海洋。", "表面裂纹地形发育。", "NASA Europa Clipper 任务将深入研究其可居住性。"],
    sources: [{ label: "NASA - Europa", url: "assets/external/solarsystem.nasa.gov_moons_jupiter-moons_europa_overview_" }],
    audio: { url: "assets/external/photojournal.jpl.nasa.gov_archive_PIA24724.mp4", type: "related", note: "该天体暂无 NASA 公开直接音频，播放木星系统相关音频。" },
  },
  {
    id: "titan",
    name: "土卫六（Titan）",
    type: "moon",
    parent: "saturn",
    radius: 1.0,
    texture: "saturn",
    orbitRadius: 11,
    orbitalPeriodDays: 15.9,
    rotationHours: 382.7,
    orbitSpeedFactor: 0.09,
    highlight: "拥有浓厚大气与稳定甲烷湖海系统。",
    summary: "土卫六是土星最大卫星，拥有浓厚含氮大气与液态甲烷湖。",
    facts: ["大气压高于地球海平面。", "表面存在甲烷和乙烷循环。", "Cassini-Huygens 曾实现对 Titan 的详细探测。"],
    sources: [{ label: "NASA - Titan", url: "assets/external/solarsystem.nasa.gov_moons_saturn-moons_titan_overview_" }],
    audio: { url: "assets/external/photojournal.jpl.nasa.gov_archive_PIA07966.wav", type: "related", note: "该天体暂无 NASA 公开直接音频，播放土星系统相关音频。" },
  },
  {
    id: "triton",
    name: "海卫一（Triton）",
    type: "moon",
    parent: "neptune",
    radius: 0.8,
    texture: "moon",
    orbitRadius: 9.8,
    orbitalPeriodDays: -5.88,
    rotationHours: -141,
    orbitSpeedFactor: 0.09,
    highlight: "逆行绕海王星运行，可能是被捕获天体。",
    summary: "海卫一是海王星最大卫星，逆行轨道表明其可能为被捕获天体。",
    facts: ["存在稀薄氮大气。", "观测到可能的低温喷流活动。", "目前近距离数据主要来自 Voyager 2。"],
    sources: [{ label: "NASA - Triton", url: "assets/external/solarsystem.nasa.gov_moons_neptune-moons_triton_overview_" }],
    audio: { url: "assets/external/photojournal.jpl.nasa.gov_archive_PIA23641.mp4", type: "related", note: "该天体暂无 NASA 公开直接音频，播放 Voyager 相关等离子体波音频。" },
  },
];

const bodiesById = new Map();
const clickables = [];

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

for (const def of bodyDefinitions) {
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

for (const def of bodyDefinitions) {
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
  ring.rotation.x = -Math.PI / 2.45;
  saturn.mesh.add(ring);
}

const starCount = 6000;
const starPos = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i += 1) {
  const r = 1800 * (0.35 + Math.random() * 0.9);
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
  starPos[i * 3 + 1] = r * Math.cos(phi);
  starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
}
const starGeo = new THREE.BufferGeometry();
starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xcde0ff, size: 1.2, sizeAttenuation: true })));

function pickAsteroidRadius() {
  // Approximate Kirkwood gaps for a less uniform ring.
  while (true) {
    const r = 64 + Math.random() * 16;
    const inGap =
      (r > 68.7 && r < 69.5) ||
      (r > 72.0 && r < 72.9) ||
      (r > 75.8 && r < 76.6);
    if (!inGap) return r;
  }
}

function buildAsteroidLayer(count, size, opacity) {
  const geometry = new THREE.IcosahedronGeometry(1, 0);
  const material = new THREE.MeshBasicMaterial({
    color: 0xd8d2c4,
    transparent: false,
    opacity: 1,
  });
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;

  const dummy = new THREE.Object3D();
  const data = [];

  for (let i = 0; i < count; i += 1) {
    const radius = pickAsteroidRadius();
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.14 + Math.random() * 0.34;
    const eccentricity = Math.random() * 0.08;
    const minorRadius = radius * (1 - eccentricity);
    const inclAmp = 0.15 + Math.random() * 0.95;
    const inclPhase = Math.random() * Math.PI * 2;
    const scale = size * (0.45 + Math.random() * 0.9);
    const spin = (Math.random() - 0.5) * 0.8;
    const rot = new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

    data.push({ radius, minorRadius, angle, speed, inclAmp, inclPhase, scale, spin, rot });

    const tone = 0.8 + Math.random() * 0.2;
    mesh.setColorAt(i, new THREE.Color(tone, tone * 0.93, tone * 0.84));

    dummy.position.set(Math.cos(angle) * radius, Math.sin(angle * 2 + inclPhase) * inclAmp, Math.sin(angle) * minorRadius);
    dummy.rotation.copy(rot);
    dummy.scale.setScalar(scale);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }

  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  scene.add(mesh);
  return { mesh, data, dummy };
}

const asteroidLayers = [
  buildAsteroidLayer(750, 0.055, 0.66),
  buildAsteroidLayer(520, 0.08, 0.58),
  buildAsteroidLayer(360, 0.12, 0.5),
];

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

closeInfo.addEventListener("click", () => {
  infoPanel.classList.add("hidden");
  worldPaused = false;
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !infoPanel.classList.contains("hidden")) {
    infoPanel.classList.add("hidden");
    worldPaused = false;
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

function updateBodies(dt) {
  const sun = bodiesById.get("sun");
  if (sun) {
    sun.mesh.position.set(0, 0, 0);
    sunLight.position.copy(sun.mesh.position);
    sun.spin += (dt * SPIN_SPEED * 24 * Math.PI * 2) / Math.abs(sun.rotationHours);
    sun.mesh.rotation.y = sun.spin;
  }

  bodiesById.forEach((body) => {
    if (body.type !== "planet") return;
    body.angle += (dt * ORBIT_SPEED * Math.PI * 2) / body.orbitalPeriodDays;
    body.mesh.position.set(Math.cos(body.angle) * body.orbitRadius, 0, Math.sin(body.angle) * body.orbitRadius);

    const spinDir = body.rotationHours < 0 ? -1 : 1;
    body.spin += (dt * SPIN_SPEED * 24 * Math.PI * 2 * spinDir) / Math.abs(body.rotationHours);
    body.mesh.rotation.y = body.spin;
  });

  bodiesById.forEach((body) => {
    if (body.type !== "moon") return;
    const parent = bodiesById.get(body.parent);
    if (!parent) return;

    const orbitDir = body.orbitalPeriodDays < 0 ? -1 : 1;
    const factor = body.orbitSpeedFactor || 1;
    body.angle += (dt * ORBIT_SPEED * Math.PI * 2 * orbitDir * factor) / Math.abs(body.orbitalPeriodDays);

    body.mesh.position.set(
      parent.mesh.position.x + Math.cos(body.angle) * body.orbitRadius,
      parent.mesh.position.y,
      parent.mesh.position.z + Math.sin(body.angle) * body.orbitRadius
    );

    const spinDir = body.rotationHours < 0 ? -1 : 1;
    body.spin += (dt * SPIN_SPEED * 24 * Math.PI * 2 * spinDir * 0.8) / Math.abs(body.rotationHours);
    body.mesh.rotation.y = body.spin;
  });

  asteroidLayers.forEach((layer) => {
    const { dummy } = layer;
    for (let i = 0; i < layer.data.length; i += 1) {
      const a = layer.data[i];
      a.angle += dt * ORBIT_SPEED * 0.45 * a.speed;
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

const panel = document.getElementById("controlsPanel");
function panCamera(direction) {
  const step = Math.max(3, camera.position.distanceTo(controls.target) * 0.04);
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
  const up = camera.up.clone().normalize();
  const delta = new THREE.Vector3();
  if (direction === "up") delta.add(up.multiplyScalar(step));
  if (direction === "down") delta.add(up.multiplyScalar(-step));
  if (direction === "left") delta.add(right.multiplyScalar(-step));
  if (direction === "right") delta.add(right.multiplyScalar(step));
  camera.position.add(delta);
  controls.target.add(delta);
}
function rotateView(direction) {
  const targetOffset = controls.target.clone().sub(camera.position);
  const forward = targetOffset.clone().normalize();
  const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
  if (direction === "left") targetOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.11);
  if (direction === "right") targetOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), -0.11);
  if (direction === "up") targetOffset.applyAxisAngle(right, 0.09);
  if (direction === "down") targetOffset.applyAxisAngle(right, -0.09);
  controls.target.copy(camera.position.clone().add(targetOffset));
}
panel.querySelectorAll("button[data-action]").forEach((button) => {
  button.addEventListener("click", () => {
    const action = button.dataset.action;
    if (!action) return;
    if (action.startsWith("pan-")) panCamera(action.replace("pan-", ""));
    if (action.startsWith("look-")) rotateView(action.replace("look-", ""));
  });
});

const clock = new THREE.Clock();
function animate() {
  const dt = Math.min(clock.getDelta(), 0.05);
  if (!worldPaused) updateBodies(dt);
  updateCameraTween();
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
