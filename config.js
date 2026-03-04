export const OSS_BASE_URL = "https://emox-uploads.oss-cn-shenzhen.aliyuncs.com/tmp";

export function ossAssetUrl(relativePath) {
  const normalized = String(relativePath).replace(/^\/+/, "");
  return `${OSS_BASE_URL}/${normalized}`;
}

export const SCENE_CONFIG = {
  // 渲染器配置
  renderer: {
    // 色调映射曝光值，控制整体画面亮度 (1.35 = 轻微过曝营造明亮感)
    toneMappingExposure: 1.35,
  },
  // 相机配置
  camera: {
    // 视野角度，58度提供适中的透视效果
    fov: 58,
    // 近裁剪面距离，小于此距离的物体不可见
    near: 0.1,
    // 远裁剪面距离，大于此距离的物体不可见
    far: 5000,
    // 相机初始位置 [x, y, z]，俯视角度观察场景
    position: [0, 85, 205],
  },
  // 轨道控制器配置
  controls: {
    // 最小缩放距离，防止相机过度靠近中心点
    minDistance: 18,
    // 最大缩放距离，限制相机远离中心点
    maxDistance: 1200,
    // 控制器焦点位置，相机围绕此点旋转
    target: [0, 0, 0],
  },
  // 光照配置
  lights: {
    // 环境光：提供基础照明，模拟天空散射光
    ambient: { color: 0x7a94c6, intensity: 0.95 },
    // 半球光：模拟天空和地面的自然光照差异
    hemisphere: { skyColor: 0x91b8ff, groundColor: 0x13223d, intensity: 0.6 },
    // 太阳光：主光源，模拟太阳照射
    sun: { color: 0xfff0cc, intensity: 4.6, distance: 1800, decay: 1.15 },
    // 相机填充光：从相机方向补光，减少过暗区域
    cameraFill: { color: 0xbfd7ff, intensity: 0.48 },
  },
  // 视觉效果配置
  visual: {
    // 当相机距离超过指定阈值时隐藏轨道辅助线
    orbitLineHideDistance: 320,
  },
};

// 模拟运行配置
export const SIMULATION_CONFIG = {
  // 全局公转速度倍率（统一调快/调慢所有公转动画）
  globalOrbitSpeed: 8,//0.416,
  // 天体自转速度 (0.05 = 缓慢自转营造真实感)
  spinSpeed: 0.05,
};

// 星空背景配置
export const STARFIELD_CONFIG = {
  // 星星总数 (3600颗营造密集星空效果)
  count: 3600,
  // 基础半径 (1800单位距离处的球面上分布)
  radiusBase: 1800,
  // 最小半径系数 (0.35 = 最小半径为基础半径的35%)
  radiusMinFactor: 0.35,
  // 半径变化范围 (0.9 = 星星分布在90%的厚度范围内)
  radiusRange: 0.9,
  // 星星颜色 (0x9ab6dd = 淡蓝色调)
  color: 0x9ab6dd,
  // 星星大小 (0.95 = 相对较小的点状星星)
  size: 0.95,
  // 星星透明度 (0.68 = 半透明营造深邃感)
  opacity: 0.68,
};

// 小行星带配置
export const ASTEROID_BELT_CONFIG = {
  // 最小轨道半径 (70单位距离处开始)
  radiusMin: 70,
  // 轨道半径范围 (14单位距离的厚度)
  radiusRange: 14,
  // 柯克伍德空隙：小行星带中的空白区域，对应轨道共振位置
  gaps: [
    [73.6, 74.3],  // 3:1 木星共振空隙
    [77.2, 78.1],  // 5:2 木星共振空隙  
    [80.6, 81.3],  // 7:3 木星共振空隙
  ],
  // 最大轨道离心率 (0.08 = 接近圆形轨道)
  eccentricityMax: 0.08,
  // 最小轨道倾角 (0.15 = 轻微倾斜)
  inclinationMin: 0.15,
  // 轨道倾角变化范围 (0.95 = 倾角变化较大)
  inclinationRange: 0.95,
  // 最小缩放系数 (0.45 = 最小尺寸为默认的45%)
  scaleMinFactor: 0.45,
  // 缩放变化范围系数 (0.9 = 尺寸变化范围较大)
  scaleRangeFactor: 0.9,
  // 自转幅度 (0.8 = 自转速度适中)
  spinAmplitude: 0.8,
  // 小行星分层配置：不同大小和透明度的小行星群体
  layers: [
    { count: 1200, size: 0.055, opacity: 0.68 },  // 细小颗粒层：数量多，尺寸小，半透明
    { count: 900, size: 0.08, opacity: 0.62 },   // 中等颗粒层：数量中等，尺寸适中
    { count: 650, size: 0.12, opacity: 0.55 },   // 较大颗粒层：数量少，尺寸大，较不透明
  ],
};

export const BODY_DEFINITIONS = [
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
      { label: "NASA Solar System Exploration - Sun", url: ossAssetUrl("external/solarsystem.nasa.gov_sun_overview_") },
      { label: "NASA Science - Sun", url: ossAssetUrl("external/science.nasa.gov_sun_") },
    ],
    audio: {
      url: ossAssetUrl("external/www.nasa.gov_wp-content_uploads_2023_03_solar-system-sounds-sun.wav"),
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
    sources: [{ label: "NASA - Mercury", url: ossAssetUrl("external/solarsystem.nasa.gov_planets_mercury_overview_") }],
    audio: { url: ossAssetUrl("external/www.nasa.gov_wp-content_uploads_2023_03_solar-system-sounds-sun.wav"), type: "related", note: "该天体暂无 NASA 公开直接音频，播放最近相关任务音频（太阳环境）。" },
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
    sources: [{ label: "NASA - Venus", url: ossAssetUrl("external/solarsystem.nasa.gov_planets_venus_overview_") }],
    audio: { url: ossAssetUrl("external/www.nasa.gov_wp-content_uploads_2023_03_solar-system-sounds-sun.wav"), type: "related", note: "该天体暂无 NASA 公开直接音频，播放最近相关任务音频（太阳环境）。" },
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
    sources: [{ label: "NASA - Earth", url: ossAssetUrl("external/solarsystem.nasa.gov_planets_earth_overview_") }],
    audio: { url: ossAssetUrl("external/www.nasa.gov_wp-content_uploads_2023_03_solar-system-sounds-earth.wav"), type: "related", note: "NASA 官方：Apollo 11 月面任务相关音频。" },
  },
  {
    id: "mars",
    name: "火星",
    type: "planet",
    radius: 1.7,
    texture: "mars",
    orbitRadius: 54,
    orbitalPeriodDays: 687,
    rotationHours: 24.6,
    highlight: "最像地球的岩质行星，也是人类重点探测目标。",
    summary: "火星是岩质行星，拥有稀薄大气与巨型火山地貌。",
    facts: ["大气以二氧化碳为主且很稀薄。", "拥有奥林帕斯山等大型地貌。", "多个 NASA 探测器在轨或在地表工作过。"],
    sources: [{ label: "NASA - Mars", url: ossAssetUrl("external/solarsystem.nasa.gov_planets_mars_overview_") }],
    audio: { url: ossAssetUrl("external/photojournal.jpl.nasa.gov_archive_PIA23729.mp3"), type: "direct", note: "NASA 官方：Perseverance 记录的火星环境声音。" },
  },
  {
    id: "jupiter",
    name: "木星",
    type: "planet",
    radius: 6.2,
    texture: "jupiter",
    orbitRadius: 112,
    orbitalPeriodDays: 4331,
    rotationHours: 9.93,
    highlight: "太阳系最大行星，拥有极强磁场和大红斑。",
    summary: "木星是太阳系最大行星，拥有强磁场和著名的大红斑。",
    facts: ["主要由氢和氦组成。", "拥有大量卫星系统。", "Juno 探测器持续研究其内部与磁场。"],
    sources: [{ label: "NASA - Jupiter", url: ossAssetUrl("external/solarsystem.nasa.gov_planets_jupiter_overview_") }],
    audio: { url: ossAssetUrl("external/photojournal.jpl.nasa.gov_archive_PIA24724.mp4"), type: "direct", note: "NASA 官方：Juno 观测到的木星极光电磁波音频化结果。" },
  },
  {
    id: "saturn",
    name: "土星",
    type: "planet",
    radius: 5.2,
    texture: "saturn",
    orbitRadius: 142,
    orbitalPeriodDays: 10747,
    rotationHours: 10.7,
    highlight: "拥有太阳系最显著的行星环系统。",
    summary: "土星以明亮环系著称，是典型气体巨行星。",
    facts: ["环系主要由冰粒与岩屑组成。", "平均密度低于水。", "Cassini 长期绕土星探测，数据极为丰富。"],
    sources: [{ label: "NASA - Saturn", url: ossAssetUrl("external/solarsystem.nasa.gov_planets_saturn_overview_") }],
    audio: { url: ossAssetUrl("external/photojournal.jpl.nasa.gov_archive_PIA07966.wav"), type: "direct", note: "NASA 官方：Cassini 探测到的土星无线电发射音频。" },
  },
  {
    id: "uranus",
    name: "天王星",
    type: "planet",
    radius: 3.4,
    texture: "uranus",
    orbitRadius: 176,
    orbitalPeriodDays: 30589,
    rotationHours: -17.2,
    highlight: "自转轴几乎横躺，呈“躺着转”的独特姿态。",
    summary: "天王星是冰巨星，自转轴倾角约 98°，几乎侧躺公转。",
    facts: ["大气含氢、氦与甲烷。", "拥有暗淡环系与多颗卫星。", "主要近距离探测来自 Voyager 2。"],
    sources: [{ label: "NASA - Uranus", url: ossAssetUrl("external/solarsystem.nasa.gov_planets_uranus_overview_") }],
    audio: { url: ossAssetUrl("external/photojournal.jpl.nasa.gov_archive_PIA23641.mp4"), type: "related", note: "该天体暂无 NASA 公开直接音频，播放 Voyager 相关等离子体波音频。" },
  },
  {
    id: "neptune",
    name: "海王星",
    type: "planet",
    radius: 3.3,
    texture: "neptune",
    orbitRadius: 208,
    orbitalPeriodDays: 59800,
    rotationHours: 16.1,
    highlight: "八大行星中最远，拥有极端强风环境。",
    summary: "海王星是最远的已知大行星，拥有极强高空风速。",
    facts: ["大气中甲烷使其呈蓝色。", "风速可达太阳系前列。", "Voyager 2 于 1989 年飞掠海王星。"],
    sources: [{ label: "NASA - Neptune", url: ossAssetUrl("external/solarsystem.nasa.gov_planets_neptune_overview_") }],
    audio: { url: ossAssetUrl("external/photojournal.jpl.nasa.gov_archive_PIA23641.mp4"), type: "related", note: "该天体暂无 NASA 公开直接音频，播放 Voyager 相关等离子体波音频。" },
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
    sources: [{ label: "NASA - Earth's Moon", url: ossAssetUrl("external/solarsystem.nasa.gov_moons_earths-moon_overview_") }],
    audio: { url: ossAssetUrl("external/www.nasa.gov_wp-content_uploads_2023_03_solar-system-sounds-earth.wav"), type: "related", note: "NASA 官方：Apollo 11 月面任务相关音频。" },
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
    sources: [{ label: "NASA - Europa", url: ossAssetUrl("external/solarsystem.nasa.gov_moons_jupiter-moons_europa_overview_") }],
    audio: { url: ossAssetUrl("external/photojournal.jpl.nasa.gov_archive_PIA24724.mp4"), type: "related", note: "该天体暂无 NASA 公开直接音频，播放木星系统相关音频。" },
  },
  {
    id: "titan",
    name: "土卫六（Titan）",
    type: "moon",
    parent: "saturn",
    radius: 1.0,
    texture: "titan",
    orbitRadius: 18,
    orbitalPeriodDays: 15.9,
    rotationHours: 382.7,
    orbitSpeedFactor: 0.09,
    highlight: "拥有浓厚大气与稳定甲烷湖海系统。",
    summary: "土卫六是土星最大卫星，拥有浓厚含氮大气与液态甲烷湖。",
    facts: ["大气压高于地球海平面。", "表面存在甲烷和乙烷循环。", "Cassini-Huygens 曾实现对 Titan 的详细探测。"],
    sources: [{ label: "NASA - Titan", url: ossAssetUrl("external/solarsystem.nasa.gov_moons_saturn-moons_titan_overview_") }],
    audio: { url: ossAssetUrl("external/photojournal.jpl.nasa.gov_archive_PIA07966.wav"), type: "related", note: "该天体暂无 NASA 公开直接音频，播放土星系统相关音频。" },
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
    sources: [{ label: "NASA - Triton", url: ossAssetUrl("external/solarsystem.nasa.gov_moons_neptune-moons_triton_overview_") }],
    audio: { url: ossAssetUrl("external/photojournal.jpl.nasa.gov_archive_PIA23641.mp4"), type: "related", note: "该天体暂无 NASA 公开直接音频，播放 Voyager 相关等离子体波音频。" },
  },
];
