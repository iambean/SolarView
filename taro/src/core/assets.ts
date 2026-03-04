import { ossAssetUrl } from './oss';

function externalAssetUrl(fileName: string): string {
  return ossAssetUrl(`external/${fileName}`);
}

export const textureAssetMap: Record<string, string> = {
  sun: ossAssetUrl('textures/sun.jpg'),
  mercury: ossAssetUrl('textures/mercury.jpg'),
  venus: ossAssetUrl('textures/venus.jpg'),
  earth: ossAssetUrl('textures/earth.jpg'),
  mars: ossAssetUrl('textures/mars.jpg'),
  jupiter: ossAssetUrl('textures/jupiter.jpg'),
  saturn: ossAssetUrl('textures/saturn.jpg'),
  saturnRing: ossAssetUrl('textures/saturn_ring.png'),
  uranus: ossAssetUrl('textures/uranus.jpg'),
  neptune: ossAssetUrl('textures/neptune.jpg'),
  moon: ossAssetUrl('textures/moon.jpg'),
  titan: ossAssetUrl('textures/titan.png'),
};

const audioMarsRover = externalAssetUrl('nasa_psd_mars_rover_self_noise.wav');
const audioMarsFiltered = externalAssetUrl('nasa_psd_mars_filtered.wav');
const audioCassiniRadio = externalAssetUrl('nasa_psd_cassini_radio.mp4');

export const audioFallbacks: string[] = [audioMarsRover, audioMarsFiltered, audioCassiniRadio];

const brokenAudioFallbackPairs: Array<[string, string]> = [
  ['www.nasa.gov_wp-content_uploads_2023_03_solar-system-sounds-sun.wav', audioMarsFiltered],
  ['www.nasa.gov_wp-content_uploads_2023_03_solar-system-sounds-earth.wav', audioMarsRover],
  ['photojournal.jpl.nasa.gov_archive_PIA07966.wav', audioCassiniRadio],
  ['photojournal.jpl.nasa.gov_archive_PIA23729.mp3', audioMarsRover],
  ['photojournal.jpl.nasa.gov_archive_PIA24724.mp4', audioCassiniRadio],
  ['photojournal.jpl.nasa.gov_archive_PIA23641.mp4', audioCassiniRadio],
];

const brokenToPlayableAudioMap = brokenAudioFallbackPairs.reduce<Record<string, string>>((map, [fileName, fallback]) => {
  map[`assets/external/${fileName}`] = fallback;
  map[externalAssetUrl(fileName)] = fallback;
  return map;
}, {});

export function resolveAudioUrl(rawUrl: string | undefined): string | undefined {
  if (!rawUrl) return undefined;
  const normalized = rawUrl.startsWith('assets/') ? ossAssetUrl(rawUrl.slice('assets/'.length)) : rawUrl;
  return brokenToPlayableAudioMap[rawUrl] || brokenToPlayableAudioMap[normalized] || normalized;
}

export function isTouchLikePlatform(): boolean {
  if (process.env.TARO_ENV !== 'h5') return true;
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(pointer: coarse)').matches ||
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0
  );
}
