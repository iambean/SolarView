import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

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

export class H5SolarRenderer implements SolarRenderer {
  private canvas: HTMLCanvasElement;
  private callbacks: RendererCallbacks;

  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: any;

  private textureLoader: THREE.TextureLoader;
  private textures: Record<string, THREE.Texture>;
  private bodiesById: Map<string, BodyState>;
  private clickables: THREE.Object3D[];
  private orbitLines: THREE.Object3D[];
  private asteroidLayers: any[];

  private sunLight: THREE.PointLight;
  private cameraFillLight: THREE.DirectionalLight;

  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private pointerDown: { x: number; y: number } | null = null;
  private threeFingerPan: { x: number; y: number } | null = null;

  private activeAudio = new Audio();
  private isMuted = false;

  private worldPaused = false;
  private infoOpened = false;

  private rafId = 0;
  private clock = new THREE.Clock();

  private initialCameraPosition: THREE.Vector3;
  private initialControlTarget: THREE.Vector3;
  private cameraTween:
    | {
        start: number;
        duration: number;
        startPos: THREE.Vector3;
        endPos: THREE.Vector3;
        startTarget: THREE.Vector3;
        endTarget: THREE.Vector3;
      }
    | null = null;

  private onPointerDown = (event: PointerEvent) => {
    this.pointerDown = { x: event.clientX, y: event.clientY };
  };

  private onPointerUp = (event: PointerEvent) => {
    if (this.infoOpened) {
      this.closeInfoPanel();
      this.pointerDown = null;
      return;
    }
    if (!this.pointerDown) return;

    const dx = event.clientX - this.pointerDown.x;
    const dy = event.clientY - this.pointerDown.y;
    this.pointerDown = null;
    if (Math.hypot(dx, dy) > 7) return;

    const rect = this.canvas.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hit = this.raycaster.intersectObjects(this.clickables, false)[0] as any;
    if (!hit) return;

    const body = this.bodiesById.get(hit.object.userData.bodyId);
    if (body) this.focusBody(body);
  };

  private onTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 3) {
      const cX = (e.touches[0].clientX + e.touches[1].clientX + e.touches[2].clientX) / 3;
      const cY = (e.touches[0].clientY + e.touches[1].clientY + e.touches[2].clientY) / 3;
      this.threeFingerPan = { x: cX, y: cY };
      this.controls.enabled = false;
      e.preventDefault();
    }
  };

  private onTouchMove = (e: TouchEvent) => {
    if (this.threeFingerPan && e.touches.length === 3) {
      const cX = (e.touches[0].clientX + e.touches[1].clientX + e.touches[2].clientX) / 3;
      const cY = (e.touches[0].clientY + e.touches[1].clientY + e.touches[2].clientY) / 3;
      this.panCameraByPixels(cX - this.threeFingerPan.x, cY - this.threeFingerPan.y);
      this.threeFingerPan.x = cX;
      this.threeFingerPan.y = cY;
      e.preventDefault();
    }
  };

  private onTouchEnd = () => {
    if (this.threeFingerPan) {
      this.threeFingerPan = null;
      this.controls.enabled = true;
    }
  };

  private onResize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  };

  private onKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && this.infoOpened) this.closeInfoPanel();
  };

  constructor(canvas: HTMLCanvasElement, callbacks: RendererCallbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks;

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = SCENE_CONFIG.renderer.toneMappingExposure;
    setRendererColorSpace(THREE, this.renderer);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x030811);

    this.camera = new THREE.PerspectiveCamera(
      SCENE_CONFIG.camera.fov,
      window.innerWidth / window.innerHeight,
      SCENE_CONFIG.camera.near,
      SCENE_CONFIG.camera.far,
    );
    this.camera.position.set(
      SCENE_CONFIG.camera.position[0],
      SCENE_CONFIG.camera.position[1],
      SCENE_CONFIG.camera.position[2],
    );

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.enablePan = true;
    this.controls.minDistance = SCENE_CONFIG.controls.minDistance;
    this.controls.maxDistance = SCENE_CONFIG.controls.maxDistance;
    this.controls.target.set(
      SCENE_CONFIG.controls.target[0],
      SCENE_CONFIG.controls.target[1],
      SCENE_CONFIG.controls.target[2],
    );
    this.controls.touches.ONE = (THREE as any).TOUCH.ROTATE;
    this.controls.touches.TWO = (THREE as any).TOUCH.DOLLY_PAN ?? (THREE as any).TOUCH.DOLLY;

    this.initialCameraPosition = this.camera.position.clone();
    this.initialControlTarget = this.controls.target.clone();

    this.scene.add(new THREE.AmbientLight(SCENE_CONFIG.lights.ambient.color, SCENE_CONFIG.lights.ambient.intensity));
    this.scene.add(
      new THREE.HemisphereLight(
        SCENE_CONFIG.lights.hemisphere.skyColor,
        SCENE_CONFIG.lights.hemisphere.groundColor,
        SCENE_CONFIG.lights.hemisphere.intensity,
      ),
    );

    this.sunLight = new THREE.PointLight(
      SCENE_CONFIG.lights.sun.color,
      SCENE_CONFIG.lights.sun.intensity,
      SCENE_CONFIG.lights.sun.distance,
      SCENE_CONFIG.lights.sun.decay,
    );
    this.scene.add(this.sunLight);

    this.cameraFillLight = new THREE.DirectionalLight(
      SCENE_CONFIG.lights.cameraFill.color,
      SCENE_CONFIG.lights.cameraFill.intensity,
    );
    this.scene.add(this.cameraFillLight);
    this.scene.add(this.cameraFillLight.target);

    this.textureLoader = new THREE.TextureLoader();
    this.textures = loadTextures(THREE, this.textureLoader, this.renderer) as Record<string, THREE.Texture>;

    const world = buildWorld(THREE, this.scene, this.textures);
    this.bodiesById = world.bodiesById;
    this.clickables = world.clickables;
    this.orbitLines = world.orbitLines;
    this.asteroidLayers = world.asteroidLayers;

    this.activeAudio.crossOrigin = 'anonymous';
    this.activeAudio.loop = true;
    this.activeAudio.volume = 0.65;
    this.activeAudio.preload = 'auto';
    (this.activeAudio as any).playsInline = true;

    this.activeAudio.addEventListener('error', () => this.updateAudioUi('音频资源加载失败'));

    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointerup', this.onPointerUp);
    this.canvas.addEventListener('touchstart', this.onTouchStart, { passive: false });
    this.canvas.addEventListener('touchmove', this.onTouchMove, { passive: false });
    this.canvas.addEventListener('touchend', this.onTouchEnd);
    this.canvas.addEventListener('touchcancel', this.onTouchEnd);
    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onKeydown);
  }

  start() {
    this.clock.start();
    const animate = () => {
      const dt = Math.min(this.clock.getDelta(), 0.05);
      if (!this.worldPaused) {
        updateBodies(THREE, this.bodiesById, this.asteroidLayers, this.sunLight, dt);
      }
      this.updateCameraTween();

      const showOrbit = shouldShowOrbitLines(this.camera.position, this.controls.target);
      this.orbitLines.forEach((line) => {
        line.visible = showOrbit;
      });

      this.cameraFillLight.position.copy(this.camera.position).add(new THREE.Vector3(40, 30, 20));
      this.cameraFillLight.target.position.copy(this.controls.target);
      this.cameraFillLight.target.updateMatrixWorld();

      this.controls.update();
      this.renderer.render(this.scene, this.camera);
      this.rafId = window.requestAnimationFrame(animate);
    };

    this.rafId = window.requestAnimationFrame(animate);
  }

  destroy() {
    window.cancelAnimationFrame(this.rafId);
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('touchstart', this.onTouchStart);
    this.canvas.removeEventListener('touchmove', this.onTouchMove);
    this.canvas.removeEventListener('touchend', this.onTouchEnd);
    this.canvas.removeEventListener('touchcancel', this.onTouchEnd);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKeydown);

    this.activeAudio.pause();
    this.activeAudio.src = '';
    this.renderer.dispose();
    this.controls.dispose();
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    this.activeAudio.muted = muted;
  }

  resetView() {
    this.cameraTween = {
      start: performance.now(),
      duration: 550,
      startPos: this.camera.position.clone(),
      endPos: this.initialCameraPosition.clone(),
      startTarget: this.controls.target.clone(),
      endTarget: this.initialControlTarget.clone(),
    };
  }

  closeInfoPanel() {
    if (!this.infoOpened) return;
    this.infoOpened = false;
    this.worldPaused = false;
    this.callbacks.onInfoClose();
  }

  private updateAudioUi(message: string) {
    this.callbacks.onAudioText(`音频：${message}`);
  }

  private async tryPlayAudio(url: string) {
    this.activeAudio.pause();
    this.activeAudio.src = url;
    this.activeAudio.currentTime = 0;
    this.activeAudio.muted = this.isMuted;
    await this.activeAudio.play();
  }

  private async playBodyAudio(body: BodyState) {
    const primary = resolveAudioUrl(body.audio?.url);
    const candidates = [primary, ...audioFallbacks].filter(
      (url, index, arr) => typeof url === 'string' && url.length > 0 && arr.indexOf(url) === index,
    ) as string[];

    let lastError: any = null;
    for (const url of candidates) {
      try {
        await this.tryPlayAudio(url);
        const mode = body.audio.type === 'direct' ? 'NASA 直接音频' : 'NASA 相关任务音频';
        this.updateAudioUi(`${body.name}（${mode}）`);
        return;
      } catch (err) {
        lastError = err;
      }
    }

    if (lastError?.name === 'NotAllowedError') {
      this.updateAudioUi(`${body.name} 音频被浏览器拦截，请再次点击行星`);
      return;
    }
    this.updateAudioUi(`${body.name} 音频资源不可用，已尝试备用音频`);
  }

  private openInfo(body: BodyState) {
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
  }

  private startCameraTween(body: BodyState, duration = 1000) {
    const worldPos = body.mesh.getWorldPosition(new THREE.Vector3());
    const startPos = this.camera.position.clone();
    const startTarget = this.controls.target.clone();
    let dir = this.camera.position.clone().sub(this.controls.target);
    if (dir.lengthSq() < 0.001) dir = new THREE.Vector3(1, 0.5, 1);
    dir.normalize();
    const distance = Math.max(16, body.radius * 7 + 12);
    const endPos = worldPos.clone().add(dir.multiplyScalar(distance));

    this.cameraTween = {
      start: performance.now(),
      duration,
      startPos,
      endPos,
      startTarget,
      endTarget: worldPos,
    };
  }

  private focusBody(body: BodyState) {
    this.openInfo(body);
    this.playBodyAudio(body);
    this.startCameraTween(body);
  }

  private updateCameraTween() {
    if (!this.cameraTween) return;
    const t = Math.min(1, (performance.now() - this.cameraTween.start) / this.cameraTween.duration);
    const ease = 1 - (1 - t) ** 3;
    this.camera.position.lerpVectors(this.cameraTween.startPos, this.cameraTween.endPos, ease);
    this.controls.target.lerpVectors(this.cameraTween.startTarget, this.cameraTween.endTarget, ease);
    if (t >= 1) this.cameraTween = null;
  }

  private panCameraByPixels(dx: number, dy: number) {
    const distance = this.camera.position.distanceTo(this.controls.target);
    const panScale = distance * 0.0016;
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    const right = new THREE.Vector3().crossVectors(forward, this.camera.up).normalize();
    const up = this.camera.up.clone().normalize();
    const delta = new THREE.Vector3()
      .add(right.multiplyScalar(-dx * panScale))
      .add(up.multiplyScalar(dy * panScale));
    this.camera.position.add(delta);
    this.controls.target.add(delta);
  }
}
