import texSun from '@/assets/textures/sun.jpg';
import texMercury from '@/assets/textures/mercury.jpg';
import texVenus from '@/assets/textures/venus.jpg';
import texEarth from '@/assets/textures/earth.jpg';
import texMars from '@/assets/textures/mars.jpg';
import texJupiter from '@/assets/textures/jupiter.jpg';
import texSaturn from '@/assets/textures/saturn.jpg';
import texSaturnRing from '@/assets/textures/saturn_ring.png';
import texUranus from '@/assets/textures/uranus.jpg';
import texNeptune from '@/assets/textures/neptune.jpg';
import texMoon from '@/assets/textures/moon.jpg';
import texTitan from '@/assets/textures/titan.png';

import audioMarsRover from '@/assets/audio/nasa_psd_mars_rover_self_noise.wav';
import audioMarsFiltered from '@/assets/audio/nasa_psd_mars_filtered.wav';
import audioCassiniRadio from '@/assets/audio/nasa_psd_cassini_radio.mp4';

export const textureAssetMap: Record<string, string> = {
  sun: texSun,
  mercury: texMercury,
  venus: texVenus,
  earth: texEarth,
  mars: texMars,
  jupiter: texJupiter,
  saturn: texSaturn,
  saturnRing: texSaturnRing,
  uranus: texUranus,
  neptune: texNeptune,
  moon: texMoon,
  titan: texTitan,
};

export const audioFallbacks: string[] = [audioMarsRover, audioMarsFiltered, audioCassiniRadio];

const brokenToPlayableAudioMap: Record<string, string> = {
  'assets/external/www.nasa.gov_wp-content_uploads_2023_03_solar-system-sounds-sun.wav': audioMarsFiltered,
  'assets/external/www.nasa.gov_wp-content_uploads_2023_03_solar-system-sounds-earth.wav': audioMarsRover,
  'assets/external/photojournal.jpl.nasa.gov_archive_PIA07966.wav': audioCassiniRadio,
  'assets/external/photojournal.jpl.nasa.gov_archive_PIA23729.mp3': audioMarsRover,
  'assets/external/photojournal.jpl.nasa.gov_archive_PIA24724.mp4': audioCassiniRadio,
  'assets/external/photojournal.jpl.nasa.gov_archive_PIA23641.mp4': audioCassiniRadio,
};

export function resolveAudioUrl(rawUrl: string | undefined): string | undefined {
  if (!rawUrl) return undefined;
  return brokenToPlayableAudioMap[rawUrl] || rawUrl;
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
