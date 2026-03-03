import Taro from '@tarojs/taro';
import { createScopedThreejs } from 'threejs-miniprogram';

import { SCENE_CONFIG } from '@/core/config';
import { resolveAudioUrl, audioFallbacks } from '@/core/assets';
import { buildFacts } from '@/core/helpers';
import {
  buildWorld,
  loadTextures,
  setRendererColorSpace,
  shouldShowOrbitLines,
  updateBodies,
  type BodyState,
} from '@/core/world';
import type { PanelInfo, RendererCallbacks, SolarRenderer } from '@/core/types';

function touchX(t: any): number {
  return t.x ?? t.pageX ?? t.clientX ?? 0;
}

function touchY(t: any): number {
  return t.y ?? t.pageY ?? t.clientY ?? 0;
}

export class WeappSolarRenderer implements SolarRenderer {
  private canvas: any;
  private callbacks: RendererCallbacks;

  private THREE: any;
  private renderer: any;
  private scene: any;
  private camera: any;

  private cameraTarget: any;
  private cameraUp: any;
  private cameraDistance: number;
  private cameraAzimuth: number;
  private cameraPolar: number;

  private initialTarget: any;
  private initialDistance: number;
  private initialAzimuth: number;
  private initialPolar: number;

  private textureLoader: any;
  private textures: Record<string, any>;
  private bodiesById: Map<string, BodyState>;
  private clickables: any[];
  private orbitLines: any[];
  private asteroidLayers: any[];

  private sunLight: any;
  private cameraFillLight: any;
  private cameraFillTarget: any;

  private raycaster: any;
  private pointer: any;

  private audio = Taro.createInnerAudioContext();
  private isMuted = false;

  private worldPaused = false;
  private infoOpened = false;
  private touchState: { count: number; touches: any[]; moved: boolean } | null = null;

  private frameId = 0;
  private lastTs = 0;

  constructor(canvas: any, callbacks: RendererCallbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks;

    this.THREE = createScopedThreejs(this.canvas);

    const sys = Taro.getSystemInfoSync();
    this.renderer = new this.THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(sys.pixelRatio || 1, 2));
    this.renderer.setSize(sys.windowWidth, sys.windowHeight);
    this.renderer.toneMapping = this.THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = SCENE_CONFIG.renderer.toneMappingExposure;
    setRendererColorSpace(this.THREE, this.renderer);

    this.scene = new this.THREE.Scene();
    this.scene.background = new this.THREE.Color(0x030811);

    this.camera = new this.THREE.PerspectiveCamera(
      SCENE_CONFIG.camera.fov,
      sys.windowWidth / sys.windowHeight,
      SCENE_CONFIG.camera.near,
      SCENE_CONFIG.camera.far,
    );

    this.cameraTarget = new this.THREE.Vector3(...SCENE_CONFIG.controls.target);
    this.cameraUp = new this.THREE.Vector3(0, 1, 0);

    const initial = new this.THREE.Vector3(...SCENE_CONFIG.camera.position);
    const offset = initial.clone().sub(this.cameraTarget);
    this.cameraDistance = offset.length();
    this.cameraAzimuth = Math.atan2(offset.x, offset.z);
    this.cameraPolar = Math.acos(offset.y / this.cameraDistance);

    this.initialTarget = this.cameraTarget.clone();
    this.initialDistance = this.cameraDistance;
    this.initialAzimuth = this.cameraAzimuth;
    this.initialPolar = this.cameraPolar;

    this.scene.add(new this.THREE.AmbientLight(SCENE_CONFIG.lights.ambient.color, SCENE_CONFIG.lights.ambient.intensity));
    this.scene.add(
      new this.THREE.HemisphereLight(
        SCENE_CONFIG.lights.hemisphere.skyColor,
        SCENE_CONFIG.lights.hemisphere.groundColor,
        SCENE_CONFIG.lights.hemisphere.intensity,
      ),
    );

    this.sunLight = new this.THREE.PointLight(
      SCENE_CONFIG.lights.sun.color,
      SCENE_CONFIG.lights.sun.intensity,
      SCENE_CONFIG.lights.sun.distance,
      SCENE_CONFIG.lights.sun.decay,
    );
    this.scene.add(this.sunLight);

    this.cameraFillLight = new this.THREE.DirectionalLight(
      SCENE_CONFIG.lights.cameraFill.color,
      SCENE_CONFIG.lights.cameraFill.intensity,
    );
    this.scene.add(this.cameraFillLight);
    // `threejs-miniprogram` may not provide a ready `DirectionalLight.target`.
    // Create and bind an explicit target to avoid runtime `target.position` errors.
    this.cameraFillTarget = new this.THREE.Object3D();
    this.scene.add(this.cameraFillTarget);
    if (this.cameraFillLight) {
      this.cameraFillLight.target = this.cameraFillTarget;
    }

    this.textureLoader = new this.THREE.TextureLoader();
    this.textures = loadTextures(this.THREE, this.textureLoader, this.renderer);

    const world = buildWorld(this.THREE, this.scene, this.textures);
    this.bodiesById = world.bodiesById;
    this.clickables = world.clickables;
    this.orbitLines = world.orbitLines;
    this.asteroidLayers = world.asteroidLayers;

    this.raycaster = new this.THREE.Raycaster();
    this.pointer = new this.THREE.Vector2();

    this.audio.loop = true;
    this.audio.volume = 0.65;
    this.audio.obeyMuteSwitch = false;
    this.audio.onError(() => {
      this.updateAudioUi('音频资源加载失败');
    });
  }

  start() {
    const loop = () => {
      const now = Date.now();
      if (!this.lastTs) this.lastTs = now;
      const dt = Math.min((now - this.lastTs) / 1000, 0.05);
      this.lastTs = now;

      if (!this.worldPaused) {
        updateBodies(this.THREE, this.bodiesById, this.asteroidLayers, this.sunLight, dt);
      }

      const showOrbit = shouldShowOrbitLines(this.camera.position, this.cameraTarget);
      this.orbitLines.forEach((line) => {
        line.visible = showOrbit;
      });

      this.updateCamera();
      this.cameraFillLight.position.copy(this.camera.position).add(new this.THREE.Vector3(40, 30, 20));
      if (this.cameraFillTarget?.position) {
        this.cameraFillTarget.position.copy(this.cameraTarget);
        this.cameraFillTarget.updateMatrixWorld?.();
      }

      this.renderer.render(this.scene, this.camera);
      this.frameId = this.canvas.requestAnimationFrame(loop);
    };

    this.frameId = this.canvas.requestAnimationFrame(loop);
  }

  destroy() {
    if (this.frameId) this.canvas.cancelAnimationFrame(this.frameId);
    this.audio.stop();
    this.audio.destroy();
    this.renderer.dispose?.();
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    this.audio.volume = muted ? 0 : 0.65;
  }

  resetView() {
    this.cameraTarget.copy(this.initialTarget);
    this.cameraDistance = this.initialDistance;
    this.cameraAzimuth = this.initialAzimuth;
    this.cameraPolar = this.initialPolar;
  }

  closeInfoPanel() {
    if (!this.infoOpened) return;
    this.infoOpened = false;
    this.worldPaused = false;
    this.callbacks.onInfoClose();
  }

  handleTouchStart(e: any) {
    this.touchState = {
      count: e.touches.length,
      touches: e.touches,
      moved: false,
    };
  }

  handleTouchMove(e: any) {
    if (!this.touchState) return;

    const touches = e.touches;
    const prev = this.touchState.touches;

    if (touches.length === 1 && prev.length === 1) {
      const dx = touchX(touches[0]) - touchX(prev[0]);
      const dy = touchY(touches[0]) - touchY(prev[0]);
      this.cameraAzimuth -= dx * 0.004;
      this.cameraPolar = Math.max(0.08, Math.min(Math.PI - 0.08, this.cameraPolar + dy * 0.0032));
      this.touchState.moved = true;
    } else if (touches.length === 2 && prev.length === 2) {
      const d0 = Math.hypot(touchX(prev[0]) - touchX(prev[1]), touchY(prev[0]) - touchY(prev[1]));
      const d1 = Math.hypot(touchX(touches[0]) - touchX(touches[1]), touchY(touches[0]) - touchY(touches[1]));
      const scale = d0 / Math.max(d1, 1);
      this.cameraDistance = Math.max(
        SCENE_CONFIG.controls.minDistance,
        Math.min(SCENE_CONFIG.controls.maxDistance, this.cameraDistance * scale),
      );
      this.touchState.moved = true;
    } else if (touches.length === 3 && prev.length === 3) {
      const cPrevX = (touchX(prev[0]) + touchX(prev[1]) + touchX(prev[2])) / 3;
      const cPrevY = (touchY(prev[0]) + touchY(prev[1]) + touchY(prev[2])) / 3;
      const cNowX = (touchX(touches[0]) + touchX(touches[1]) + touchX(touches[2])) / 3;
      const cNowY = (touchY(touches[0]) + touchY(touches[1]) + touchY(touches[2])) / 3;
      const dx = cNowX - cPrevX;
      const dy = cNowY - cPrevY;

      const panScale = this.cameraDistance * 0.0016;
      const f = new this.THREE.Vector3();
      this.camera.getWorldDirection(f);
      const r = new this.THREE.Vector3().crossVectors(f, this.cameraUp).normalize();
      const u = this.cameraUp.clone().normalize();
      const delta = new this.THREE.Vector3().add(r.multiplyScalar(-dx * panScale)).add(u.multiplyScalar(dy * panScale));
      this.cameraTarget.add(delta);
      this.touchState.moved = true;
    }

    this.touchState.touches = touches;
  }

  handleTouchEnd(e: any) {
    if (!this.touchState) return;

    if (this.infoOpened) {
      this.closeInfoPanel();
      this.touchState = null;
      return;
    }

    if (!this.touchState.moved && this.touchState.count === 1) {
      const t = (e.changedTouches && e.changedTouches[0]) || null;
      if (t) this.pickBody(touchX(t), touchY(t));
    }

    this.touchState = null;
  }

  private pickBody(x: number, y: number) {
    const sys = Taro.getSystemInfoSync();
    this.pointer.x = (x / sys.windowWidth) * 2 - 1;
    this.pointer.y = -(y / sys.windowHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hit = this.raycaster.intersectObjects(this.clickables, false)[0];
    if (!hit) return;

    const body = this.bodiesById.get(hit.object.userData.bodyId);
    if (body) this.focusBody(body);
  }

  private updateAudioUi(message: string) {
    this.callbacks.onAudioText(`音频：${message}`);
  }

  private tryPlayAudio(url: string) {
    return new Promise<void>((resolve, reject) => {
      this.audio.stop();
      this.audio.src = url;
      this.audio.play();
      const ok = () => {
        this.audio.offCanplay(ok);
        this.audio.offError(fail);
        resolve();
      };
      const fail = (err: any) => {
        this.audio.offCanplay(ok);
        this.audio.offError(fail);
        reject(err);
      };
      this.audio.onCanplay(ok);
      this.audio.onError(fail);
    });
  }

  private async playBodyAudio(body: BodyState) {
    const primary = resolveAudioUrl(body.audio?.url);
    const candidates = [primary, ...audioFallbacks].filter(
      (url, index, arr) => typeof url === 'string' && url.length > 0 && arr.indexOf(url) === index,
    ) as string[];

    for (const url of candidates) {
      try {
        await this.tryPlayAudio(url);
        const mode = body.audio.type === 'direct' ? 'NASA 直接音频' : 'NASA 相关任务音频';
        this.updateAudioUi(`${body.name}（${mode}）`);
        return;
      } catch {
        // try next
      }
    }
    this.updateAudioUi(`${body.name} 音频资源不可用，已尝试备用音频`);
  }

  private focusBody(body: BodyState) {
    const info: PanelInfo = {
      title: body.name,
      highlight: body.highlight || '暂无',
      summary: body.summary,
      facts: buildFacts(body.rotationHours, body.orbitalPeriodDays, body.facts),
      audioNote: body.audio?.note || '',
      sources: body.sources || [],
    };

    this.infoOpened = true;
    this.worldPaused = true;
    this.callbacks.onInfoOpen(info);
    this.playBodyAudio(body);

    const worldPos = body.mesh.getWorldPosition(new this.THREE.Vector3());
    const toTarget = worldPos.clone().sub(this.cameraTarget);
    this.cameraTarget.add(toTarget.multiplyScalar(0.6));
  }

  private updateCamera() {
    const sinPhi = Math.sin(this.cameraPolar);
    const offset = new this.THREE.Vector3(
      this.cameraDistance * sinPhi * Math.sin(this.cameraAzimuth),
      this.cameraDistance * Math.cos(this.cameraPolar),
      this.cameraDistance * sinPhi * Math.cos(this.cameraAzimuth),
    );
    this.camera.position.copy(this.cameraTarget.clone().add(offset));
    this.camera.lookAt(this.cameraTarget);
  }
}
