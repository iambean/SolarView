# SolarView Taro 版

该目录为 SolarView 的 Taro 重构版本，支持同一套代码构建：
- H5
- 微信小程序

## 目录

- `src/core`：共享配置、天体参数、轨道更新逻辑、资源映射
- `src/renderers/h5.ts`：H5 Three.js 渲染器
- `src/renderers/weapp.ts`：微信小程序 Three 渲染器（`threejs-miniprogram`）
- `src/pages/index`：统一 UI 层（信息弹窗、音频状态、重置视角按钮）

## 安装

```bash
npm install
```

## 开发

```bash
# H5 开发
npm run dev:h5

# 微信小程序开发
npm run dev:weapp
```

## 构建

```bash
# 一键构建 H5
npm run build:h5

# 一键构建 微信小程序
npm run build:weapp
```

## 体验一致性说明

当前已保证 H5/小程序统一：
- 同一套天体配置与公转/自转参数
- 同一套点击信息卡内容（最大特点、自转/公转周期、来源）
- 同一套音频播放策略（含失败回退）
- 同一套轨道线显示阈值与小行星带逻辑
- 同一套“打开弹窗即暂停，关闭即继续”行为

交互映射：
- PC（H5）：左键旋转 / 滚轮缩放 / Shift+左键平移
- 移动端（H5 + 小程序）：单指旋转 / 双指缩放 / 三指平移
