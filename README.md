# SolarView

一个基于 Three.js 的太阳系 3D 探索页（全屏、移动端适配、相机平移/旋转、点击信息弹窗、NASA 音频联动）。

当前版本已升级为本地 `Three.js + 本地真实行星贴图` 渲染。

## 运行

建议使用本地静态服务器打开（避免浏览器模块/音频限制）：

```bash
npx serve .
```

然后访问命令输出的本地地址。

## 本地渲染资源

- Three.js 本地模块：`lib/three.module.js`
- OrbitControls 本地模块：`lib/OrbitControls.js`
- 真实行星贴图：`assets/textures/`

## 主要数据来源（以 NASA 为准）

- NASA Solar System Exploration: https://solarsystem.nasa.gov/
- Sun: https://solarsystem.nasa.gov/sun/overview/
- Mercury: https://solarsystem.nasa.gov/planets/mercury/overview/
- Venus: https://solarsystem.nasa.gov/planets/venus/overview/
- Earth: https://solarsystem.nasa.gov/planets/earth/overview/
- Mars: https://solarsystem.nasa.gov/planets/mars/overview/
- Jupiter: https://solarsystem.nasa.gov/planets/jupiter/overview/
- Saturn: https://solarsystem.nasa.gov/planets/saturn/overview/
- Uranus: https://solarsystem.nasa.gov/planets/uranus/overview/
- Neptune: https://solarsystem.nasa.gov/planets/neptune/overview/
- Moon: https://solarsystem.nasa.gov/moons/earths-moon/overview/
- Europa: https://solarsystem.nasa.gov/moons/jupiter-moons/europa/overview/
- Titan: https://solarsystem.nasa.gov/moons/saturn-moons/titan/overview/
- Triton: https://solarsystem.nasa.gov/moons/neptune-moons/triton/overview/

## 音频来源（NASA 官方）

- Sun sound: https://www.nasa.gov/wp-content/uploads/2023/03/solar-system-sounds-sun.wav
- Earth/Apollo related: https://www.nasa.gov/wp-content/uploads/2023/03/solar-system-sounds-earth.wav
- Mars (Perseverance): https://photojournal.jpl.nasa.gov/archive/PIA23729.mp3
- Jupiter (Juno): https://photojournal.jpl.nasa.gov/archive/PIA24724.mp4
- Saturn (Cassini): https://photojournal.jpl.nasa.gov/archive/PIA07966.wav
- Voyager plasma waves (related for Uranus/Neptune/Triton): https://photojournal.jpl.nasa.gov/archive/PIA23641.mp4
- Earth radio signal (Juno): https://photojournal.jpl.nasa.gov/archive/PIA17045.mov

## 外链本地化

- 已将 `app.js` 中所有外部 URL 映射为本地 `assets/external/...` 路径。
- URL 到本地文件映射：`assets/external/url-map.tsv`
- 全项目外链映射：`assets/external/url-map-all.tsv`
- 下载成功清单：`assets/external/manifest.tsv`
- 下载失败清单：`assets/external/failed.tsv`
- 完整性报告（状态码/文件类型）：`assets/external/integrity_report.tsv`
- 如果你下一步要“真实 NASA/JPL 图片贴图文件版”，我可以再把各星球贴图下载到 `assets/textures/` 并切换为真实图贴。
