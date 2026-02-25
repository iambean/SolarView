import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/controls/OrbitControls.js";

const canvas = document.getElementById("scene");
const infoPanel = document.getElementById("infoPanel");
const infoTitle = document.getElementById("infoTitle");
const infoSummary = document.getElementById("infoSummary");
const infoFacts = document.getElementById("infoFacts");
const infoSources = document.getElementById("infoSources");
const audioText = document.getElementById("audioText");
const audioNote = document.getElementById("audioNote");
const closeInfo = document.getElementById("closeInfo");
const muteBtn = document.getElementById("muteBtn");

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 5000);
camera.position.set(0, 130, 320);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 30;
controls.maxDistance = 1400;
controls.target.set(0, 0, 0);

scene.add(new THREE.AmbientLight(0x7799bb, 0.25));

const sunLight = new THREE.PointLight(0xffeecc, 2.6, 0, 1.6);
scene.add(sunLight);

const starGeometry = new THREE.BufferGeometry();
const starCount = 4500;
const starPositions = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i += 1) {
  const r = 1800 * (0.3 + Math.random() * 0.9);
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
  starPositions[i * 3 + 1] = r * Math.cos(phi);
  starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
}
starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
const starMaterial = new THREE.PointsMaterial({
  color: 0xcfe6ff,
  size: 1.6,
  sizeAttenuation: true,
  transparent: true,
  opacity: 0.9,
});
scene.add(new THREE.Points(starGeometry, starMaterial));

const AU_SCALE = 22;
const DAY_SPEED = 24;

const bodyDefinitions = [
  {
    id: "sun",
    name: "太阳",
    type: "star",
    radius: 13,
    color: 0xffc15c,
    orbitRadius: 0,
    orbitalPeriodDays: null,
    rotationHours: 609,
    summary: "太阳是太阳系中心恒星，提供行星所需的光和热。",
    facts: [
      "约占太阳系总质量的 99.8%。",
      "光从太阳到地球约需 8 分 20 秒。",
      "太阳活动会影响空间天气与地球电离层。",
    ],
    sources: [
      { label: "NASA Solar System Exploration - Sun", url: "https://solarsystem.nasa.gov/sun/overview/" },
      { label: "NASA Science - Sun", url: "https://science.nasa.gov/sun/" },
    ],
    audio: {
      url: "https://www.nasa.gov/wp-content/uploads/2023/03/solar-system-sounds-sun.wav",
      type: "direct",
      note: "NASA 官方：SOHO 观测数据转译的太阳声音。",
    },
  },
  {
    id: "mercury",
    name: "水星",
    type: "planet",
    radius: 1.4,
    color: 0xb0b0b0,
    orbitRadius: 0.39 * AU_SCALE,
    orbitalPeriodDays: 88,
    rotationHours: 1407.6,
    summary: "水星是最靠近太阳的行星，昼夜温差极端。",
    facts: ["公转周期约 88 天。", "表面遍布撞击坑，几乎无大气层。", "自转周期约 59 个地球日。"],
    sources: [{ label: "NASA - Mercury", url: "https://solarsystem.nasa.gov/planets/mercury/overview/" }],
    audio: {
      url: "https://www.nasa.gov/wp-content/uploads/2023/03/solar-system-sounds-sun.wav",
      type: "related",
      note: "该天体暂无 NASA 公开直接音频，播放最近相关任务音频（太阳环境）。",
    },
  },
  {
    id: "venus",
    name: "金星",
    type: "planet",
    radius: 2.2,
    color: 0xd8a66f,
    orbitRadius: 0.72 * AU_SCALE,
    orbitalPeriodDays: 224.7,
    rotationHours: -5832.5,
    summary: "金星大小接近地球，但拥有极端温室效应。",
    facts: ["表面温度在八大行星中最高。", "浓密大气以二氧化碳为主。", "自转方向与多数行星相反。"],
    sources: [{ label: "NASA - Venus", url: "https://solarsystem.nasa.gov/planets/venus/overview/" }],
    audio: {
      url: "https://www.nasa.gov/wp-content/uploads/2023/03/solar-system-sounds-sun.wav",
      type: "related",
      note: "该天体暂无 NASA 公开直接音频，播放最近相关任务音频（太阳环境）。",
    },
  },
  {
    id: "earth",
    name: "地球",
    type: "planet",
    radius: 2.3,
    color: 0x4e82ff,
    orbitRadius: 1.0 * AU_SCALE,
    orbitalPeriodDays: 365.25,
    rotationHours: 23.93,
    summary: "地球是目前已知唯一存在稳定地表液态水并孕育生命的行星。",
    facts: ["拥有全球海洋与活跃板块构造。", "1 个天然卫星（月球）。", "磁层可偏转大量高能带电粒子。"],
    sources: [{ label: "NASA - Earth", url: "https://solarsystem.nasa.gov/planets/earth/overview/" }],
    audio: {
      url: "https://photojournal.jpl.nasa.gov/archive/PIA17045.mov",
      type: "direct",
      note: "NASA 官方：Juno 探测器接收到的地球无线电信号音频。",
    },
  },
  {
    id: "mars",
    name: "火星",
    type: "planet",
    radius: 1.9,
    color: 0xc56044,
    orbitRadius: 1.52 * AU_SCALE,
    orbitalPeriodDays: 687,
    rotationHours: 24.6,
    summary: "火星是岩质行星，拥有稀薄大气与巨型火山地貌。",
    facts: ["大气以二氧化碳为主且很稀薄。", "拥有奥林帕斯山等大型地貌。", "多个 NASA 探测器在轨或在地表工作过。"],
    sources: [{ label: "NASA - Mars", url: "https://solarsystem.nasa.gov/planets/mars/overview/" }],
    audio: {
      url: "https://photojournal.jpl.nasa.gov/archive/PIA23729.mp3",
      type: "direct",
      note: "NASA 官方：Perseverance 记录的火星环境声音。",
    },
  },
  {
    id: "jupiter",
    name: "木星",
    type: "planet",
    radius: 6.3,
    color: 0xd6b18b,
    orbitRadius: 5.2 * AU_SCALE,
    orbitalPeriodDays: 4331,
    rotationHours: 9.93,
    summary: "木星是太阳系最大行星，拥有强磁场和著名的大红斑。",
    facts: ["主要由氢和氦组成。", "拥有大量卫星系统。", "Juno 探测器持续研究其内部与磁场。"],
    sources: [{ label: "NASA - Jupiter", url: "https://solarsystem.nasa.gov/planets/jupiter/overview/" }],
    audio: {
      url: "https://photojournal.jpl.nasa.gov/archive/PIA24724.mp4",
      type: "direct",
      note: "NASA 官方：Juno 观测到的木星极光电磁波音频化结果。",
    },
  },
  {
    id: "saturn",
    name: "土星",
    type: "planet",
    radius: 5.6,
    color: 0xf1d28d,
    orbitRadius: 9.58 * AU_SCALE,
    orbitalPeriodDays: 10747,
    rotationHours: 10.7,
    summary: "土星以明亮环系著称，是典型气体巨行星。",
    facts: ["环系主要由冰粒与岩屑组成。", "平均密度低于水。", "Cassini 长期绕土星探测，数据极为丰富。"],
    sources: [{ label: "NASA - Saturn", url: "https://solarsystem.nasa.gov/planets/saturn/overview/" }],
    audio: {
      url: "https://photojournal.jpl.nasa.gov/archive/PIA07966.wav",
      type: "direct",
      note: "NASA 官方：Cassini 探测到的土星无线电发射音频。",
    },
  },
  {
    id: "uranus",
    name: "天王星",
    type: "planet",
    radius: 4.1,
    color: 0x8ed4de,
    orbitRadius: 19.2 * AU_SCALE,
    orbitalPeriodDays: 30589,
    rotationHours: -17.2,
    summary: "天王星是冰巨星，自转轴倾角约 98°，几乎侧躺公转。",
    facts: ["大气含氢、氦与甲烷。", "拥有暗淡环系与多颗卫星。", "主要近距离探测来自 Voyager 2。"],
    sources: [{ label: "NASA - Uranus", url: "https://solarsystem.nasa.gov/planets/uranus/overview/" }],
    audio: {
      url: "https://photojournal.jpl.nasa.gov/archive/PIA23641.mp4",
      type: "related",
      note: "该天体暂无 NASA 公开直接音频，播放 Voyager 相关等离子体波音频。",
    },
  },
  {
    id: "neptune",
    name: "海王星",
    type: "planet",
    radius: 3.9,
    color: 0x4f83ff,
    orbitRadius: 30.05 * AU_SCALE,
    orbitalPeriodDays: 59800,
    rotationHours: 16.1,
    summary: "海王星是最远的已知大行星，拥有极强高空风速。",
    facts: ["大气中甲烷使其呈蓝色。", "风速可达太阳系前列。", "Voyager 2 于 1989 年飞掠海王星。"],
    sources: [{ label: "NASA - Neptune", url: "https://solarsystem.nasa.gov/planets/neptune/overview/" }],
    audio: {
      url: "https://photojournal.jpl.nasa.gov/archive/PIA23641.mp4",
      type: "related",
      note: "该天体暂无 NASA 公开直接音频，播放 Voyager 相关等离子体波音频。",
    },
  },
  {
    id: "moon",
    name: "月球",
    type: "moon",
    parent: "earth",
    radius: 0.7,
    color: 0xc8c8c8,
    orbitRadius: 5.6,
    orbitalPeriodDays: 27.3,
    rotationHours: 655.7,
    summary: "月球是地球唯一的天然卫星，与地球潮汐锁定。",
    facts: ["公转周期与自转周期接近，因此几乎总以同一面朝向地球。", "表面覆盖大量撞击坑。", "Apollo 任务实现了载人登月。"],
    sources: [{ label: "NASA - Earth's Moon", url: "https://solarsystem.nasa.gov/moons/earths-moon/overview/" }],
    audio: {
      url: "https://www.nasa.gov/wp-content/uploads/2023/03/solar-system-sounds-earth.wav",
      type: "related",
      note: "NASA 官方：Apollo 11 月面任务相关音频。",
    },
  },
  {
    id: "europa",
    name: "木卫二（Europa）",
    type: "moon",
    parent: "jupiter",
    radius: 0.8,
    color: 0xe4d8b9,
    orbitRadius: 8.5,
    orbitalPeriodDays: 3.55,
    rotationHours: 85.2,
    summary: "木卫二表面以冰壳为主，是最受关注的潜在宜居卫星之一。",
    facts: ["冰壳下可能存在全球液态海洋。", "表面裂纹地形发育。", "NASA Europa Clipper 任务将深入研究其可居住性。"],
    sources: [{ label: "NASA - Europa", url: "https://solarsystem.nasa.gov/moons/jupiter-moons/europa/overview/" }],
    audio: {
      url: "https://photojournal.jpl.nasa.gov/archive/PIA24724.mp4",
      type: "related",
      note: "该天体暂无 NASA 公开直接音频，播放木星系统相关音频。",
    },
  },
  {
    id: "titan",
    name: "土卫六（Titan）",
    type: "moon",
    parent: "saturn",
    radius: 0.95,
    color: 0xc68f56,
    orbitRadius: 11,
    orbitalPeriodDays: 15.9,
    rotationHours: 382.7,
    summary: "土卫六是土星最大卫星，拥有浓厚含氮大气与液态甲烷湖。",
    facts: ["大气压高于地球海平面。", "表面存在甲烷和乙烷循环。", "Cassini-Huygens 曾实现对 Titan 的详细探测。"],
    sources: [{ label: "NASA - Titan", url: "https://solarsystem.nasa.gov/moons/saturn-moons/titan/overview/" }],
    audio: {
      url: "https://photojournal.jpl.nasa.gov/archive/PIA07966.wav",
      type: "related",
      note: "该天体暂无 NASA 公开直接音频，播放土星系统相关音频。",
    },
  },
  {
    id: "triton",
    name: "海卫一（Triton）",
    type: "moon",
    parent: "neptune",
    radius: 0.75,
    color: 0xd2d5dc,
    orbitRadius: 9.8,
    orbitalPeriodDays: -5.88,
    rotationHours: -141,
    summary: "海卫一是海王星最大卫星，逆行轨道表明其可能为被捕获天体。",
    facts: ["存在稀薄氮大气。", "观测到可能的低温喷流活动。", "目前近距离数据主要来自 Voyager 2。"],
    sources: [{ label: "NASA - Triton", url: "https://solarsystem.nasa.gov/moons/neptune-moons/triton/overview/" }],
    audio: {
      url: "https://photojournal.jpl.nasa.gov/archive/PIA23641.mp4",
      type: "related",
      note: "该天体暂无 NASA 公开直接音频，播放 Voyager 相关等离子体波音频。",
    },
  },
];

const bodiesById = new Map();
const allMeshes = [];
const planets = [];
const moons = [];

function createOrbitPath(radius, color, parent = null) {
  const points = [];
  const segments = 140;
  for (let i = 0; i <= segments; i += 1) {
    const t = (i / segments) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(t) * radius, 0, Math.sin(t) * radius));
  }
  const orbitGeometry = new THREE.BufferGeometry().setFromPoints(points);
  const orbitMaterial = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.22,
  });
  const line = new THREE.Line(orbitGeometry, orbitMaterial);
  if (parent) {
    parent.add(line);
  } else {
    scene.add(line);
  }
}

for (const body of bodyDefinitions) {
  const material = new THREE.MeshStandardMaterial({
    color: body.color,
    emissive: body.type === "star" ? 0xff8f2a : 0x000000,
    emissiveIntensity: body.type === "star" ? 1.15 : 0,
    roughness: body.type === "star" ? 0.38 : 0.9,
    metalness: body.type === "star" ? 0 : 0.1,
  });
  const geometry = new THREE.SphereGeometry(body.radius, 36, 24);
  const mesh = new THREE.Mesh(geometry, material);

  if (body.id === "uranus") mesh.rotation.z = Math.PI * 0.55;

  body.angle = Math.random() * Math.PI * 2;
  body.spin = 0;
  body.mesh = mesh;
  bodiesById.set(body.id, body);

  if (body.type === "star") {
    mesh.position.set(0, 0, 0);
    scene.add(mesh);
  } else if (body.type === "planet") {
    createOrbitPath(body.orbitRadius, 0x355788);
    scene.add(mesh);
    planets.push(body);

    if (body.id === "saturn") {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(body.radius * 1.35, body.radius * 2.2, 64),
        new THREE.MeshBasicMaterial({ color: 0xd8bf92, transparent: true, opacity: 0.6, side: THREE.DoubleSide })
      );
      ring.rotation.x = Math.PI / 2.3;
      mesh.add(ring);
    }
  } else {
    const parentBody = bodiesById.get(body.parent);
    if (parentBody) {
      createOrbitPath(body.orbitRadius, 0x4c6ea0, parentBody.mesh);
    }
    scene.add(mesh);
    moons.push(body);
  }

  mesh.userData.bodyId = body.id;
  allMeshes.push(mesh);
}

const clock = new THREE.Clock();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let pointerDown = null;

let cameraTween = null;
function startCameraTween(targetBody, duration = 1100) {
  const worldPos = targetBody.mesh.getWorldPosition(new THREE.Vector3());
  const startPos = camera.position.clone();
  const startTarget = controls.target.clone();
  let viewDir = camera.position.clone().sub(controls.target);
  if (viewDir.lengthSq() < 0.001) viewDir = new THREE.Vector3(1, 0.5, 1);
  viewDir.normalize();
  const distance = Math.max(18, targetBody.radius * 7 + 10);
  const endPos = worldPos.clone().add(viewDir.multiplyScalar(distance));

  cameraTween = {
    start: performance.now(),
    duration,
    startPos,
    endPos,
    startTarget,
    endTarget: worldPos,
    body: targetBody,
  };
}

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
    .catch(() => {
      updateAudioUi(`${body.name} 音频播放受浏览器策略限制，请再次点击`);
    });
}

activeAudio.addEventListener("error", () => {
  updateAudioUi("音频资源加载失败");
});

function showBodyInfo(body) {
  infoTitle.textContent = body.name;
  infoSummary.textContent = body.summary;

  infoFacts.innerHTML = "";
  for (const fact of body.facts) {
    const li = document.createElement("li");
    li.textContent = fact;
    infoFacts.appendChild(li);
  }

  audioNote.textContent = body.audio?.note || "";
  infoSources.innerHTML = `来源：${body.sources
    .map((s) => `<a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.label}</a>`)
    .join(" | ")}`;
  infoPanel.classList.remove("hidden");
}

closeInfo.addEventListener("click", () => {
  infoPanel.classList.add("hidden");
});

muteBtn.addEventListener("click", () => {
  isMuted = !isMuted;
  activeAudio.muted = isMuted;
  muteBtn.textContent = isMuted ? "取消静音" : "静音";
});

function focusBody(body) {
  startCameraTween(body);
  showBodyInfo(body);
  playBodyAudio(body);
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
  const hit = raycaster.intersectObjects(allMeshes, false)[0];
  if (!hit) return;

  const bodyId = hit.object.userData.bodyId;
  const body = bodiesById.get(bodyId);
  if (body) focusBody(body);
});

const panel = document.getElementById("controlsPanel");

function panCamera(direction) {
  const distance = Math.max(4, camera.position.distanceTo(controls.target) * 0.045);
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
  const up = camera.up.clone().normalize();
  const delta = new THREE.Vector3();

  if (direction === "up") delta.add(up.multiplyScalar(distance));
  if (direction === "down") delta.add(up.multiplyScalar(-distance));
  if (direction === "left") delta.add(right.multiplyScalar(-distance));
  if (direction === "right") delta.add(right.multiplyScalar(distance));

  camera.position.add(delta);
  controls.target.add(delta);
}

function rotateView(direction) {
  const targetOffset = controls.target.clone().sub(camera.position);
  const yawStep = 0.13;
  const pitchStep = 0.1;

  const forward = targetOffset.clone().normalize();
  const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();

  if (direction === "left" || direction === "right") {
    const yaw = direction === "left" ? yawStep : -yawStep;
    targetOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
  }

  if (direction === "up" || direction === "down") {
    const pitch = direction === "up" ? pitchStep : -pitchStep;
    targetOffset.applyAxisAngle(right, pitch);
  }

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

function updateBodies(dt) {
  for (const body of planets) {
    if (body.orbitalPeriodDays) {
      body.angle += (dt * DAY_SPEED * Math.PI * 2) / body.orbitalPeriodDays;
      body.mesh.position.set(Math.cos(body.angle) * body.orbitRadius, 0, Math.sin(body.angle) * body.orbitRadius);
    }
    if (body.rotationHours) {
      const dir = body.rotationHours < 0 ? -1 : 1;
      const spinStep = (dt * DAY_SPEED * 24 * Math.PI * 2) / Math.abs(body.rotationHours);
      body.mesh.rotation.y += dir * spinStep * 0.16;
    }
  }

  const sun = bodiesById.get("sun");
  if (sun) {
    sun.mesh.rotation.y += dt * 0.1;
  }

  for (const moon of moons) {
    const parent = bodiesById.get(moon.parent);
    if (!parent) continue;

    moon.angle += (dt * DAY_SPEED * Math.PI * 2) / Math.abs(moon.orbitalPeriodDays || 10);
    const direction = moon.orbitalPeriodDays < 0 ? -1 : 1;
    moon.mesh.position.set(
      parent.mesh.position.x + Math.cos(moon.angle * direction) * moon.orbitRadius,
      parent.mesh.position.y,
      parent.mesh.position.z + Math.sin(moon.angle * direction) * moon.orbitRadius
    );

    if (moon.rotationHours) {
      const spinDir = moon.rotationHours < 0 ? -1 : 1;
      moon.mesh.rotation.y += (dt * DAY_SPEED * 24 * Math.PI * 2 * spinDir) / Math.abs(moon.rotationHours);
    }
  }
}

function updateCameraTween() {
  if (!cameraTween) return;

  const now = performance.now();
  const t = Math.min(1, (now - cameraTween.start) / cameraTween.duration);
  const ease = 1 - Math.pow(1 - t, 3);

  camera.position.lerpVectors(cameraTween.startPos, cameraTween.endPos, ease);
  controls.target.lerpVectors(cameraTween.startTarget, cameraTween.endTarget, ease);

  if (t >= 1) {
    cameraTween = null;
  }
}

function animate() {
  const dt = Math.min(clock.getDelta(), 0.05);

  updateBodies(dt);
  updateCameraTween();

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
