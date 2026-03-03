export type BodyType = 'star' | 'planet' | 'moon';
export type AudioType = 'direct' | 'related';

export interface SourceItem {
  label: string;
  url: string;
}

export interface AudioMeta {
  url: string;
  type: AudioType;
  note: string;
}

export interface BodyDefinition {
  id: string;
  name: string;
  type: BodyType;
  radius: number;
  texture: string;
  orbitRadius: number;
  orbitalPeriodDays: number | null;
  rotationHours: number | null;
  highlight: string;
  summary: string;
  facts: string[];
  sources: SourceItem[];
  audio: AudioMeta;
  color?: number;
  parent?: string;
  orbitSpeedFactor?: number;
}

export interface PanelInfo {
  title: string;
  highlight: string;
  summary: string;
  facts: string[];
  audioNote: string;
  sources: SourceItem[];
}

export interface RendererCallbacks {
  onInfoOpen: (info: PanelInfo) => void;
  onInfoClose: () => void;
  onAudioText: (text: string) => void;
}

export interface SolarRenderer {
  start: () => void;
  destroy: () => void;
  setMuted: (muted: boolean) => void;
  closeInfoPanel: () => void;
  resetView: () => void;
  handleTouchStart?: (e: any) => void;
  handleTouchMove?: (e: any) => void;
  handleTouchEnd?: (e: any) => void;
}
