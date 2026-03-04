import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Canvas, Text, View } from '@tarojs/components';
import Taro, { useReady, useUnload } from '@tarojs/taro';

import { isTouchLikePlatform } from '@/core/assets';
import type { PanelInfo, SolarRenderer } from '@/core/types';
import { H5SolarRenderer } from '@/renderers/h5';
import { WeappSolarRenderer } from '@/renderers/weapp';

import './index.scss';

const EMPTY_INFO: PanelInfo = {
  title: '',
  highlight: '',
  summary: '',
  facts: [],
  audioNote: '',
  sources: [],
};

export default function IndexPage() {
  const engineRef = useRef<SolarRenderer | null>(null);

  const [audioText, setAudioText] = useState('音频：未播放');
  const [isMuted, setIsMuted] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);
  const [info, setInfo] = useState<PanelInfo>(EMPTY_INFO);

  const hintText = useMemo(() => {
    if (isTouchLikePlatform()) return '单指旋转 / 双指缩放 / 三指平移';
    return '左键旋转 / 滚轮缩放 / Shift+左键平移';
  }, []);

  useReady(() => {
    const callbacks = {
      onInfoOpen: (panel: PanelInfo) => {
        setInfo(panel);
        setInfoVisible(true);
      },
      onInfoClose: () => {
        setInfoVisible(false);
      },
      onAudioText: (text: string) => {
        setAudioText(text);
      },
    };

    if (process.env.TARO_ENV === 'h5') {
      const canvas = document.getElementById('scene') as HTMLCanvasElement | null;
      if (!canvas) return;
      const engine = new H5SolarRenderer(canvas, callbacks);
      engineRef.current = engine;
      engine.start();
      return;
    }

    Taro.createSelectorQuery()
      .select('#scene')
      .node()
      .exec((res: any[]) => {
        const canvas = res?.[0]?.node;
        if (!canvas) return;
        const engine = new WeappSolarRenderer(canvas, callbacks);
        engineRef.current = engine;
        engine.start();
      });
  });

  useUnload(() => {
    engineRef.current?.destroy();
    engineRef.current = null;
  });

  useEffect(() => {
    if (process.env.TARO_ENV !== 'h5') return;
    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        engineRef.current?.closeInfoPanel();
      }
    };
    window.addEventListener('keydown', onKeydown);
    return () => window.removeEventListener('keydown', onKeydown);
  }, []);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    engineRef.current?.setMuted(next);
  };

  const closeInfo = () => {
    engineRef.current?.closeInfoPanel();
  };

  const resetView = () => {
    engineRef.current?.resetView();
  };

  const onSourceClick = (url: string) => {
    if (process.env.TARO_ENV === 'h5') {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    Taro.setClipboardData({ data: url });
    Taro.showToast({ title: '链接已复制，请在浏览器打开', icon: 'none' });
  };

  return (
    <View className='solar-page'>
      <Canvas
        id='scene'
        canvasId='scene'
        type='webgl'
        className='scene'
        onTouchStart={(e) => engineRef.current?.handleTouchStart?.(e)}
        onTouchMove={(e) => engineRef.current?.handleTouchMove?.(e)}
        onTouchEnd={(e) => engineRef.current?.handleTouchEnd?.(e)}
        onTouchCancel={(e) => engineRef.current?.handleTouchEnd?.(e)}
      />

      <View className='hud-top-left'>
        <Text className='title'>SolarView</Text>
        <Text className='hint'>{hintText}</Text>
      </View>

      <Button className='reset-view-btn' onClick={resetView}>
        还原视角
      </Button>

      <View className='audio-status glass'>
        <Text>{audioText}</Text>
        <Button className='mute-btn' onClick={toggleMute}>
          {isMuted ? '取消静音' : '静音'}
        </Button>
      </View>

      {infoVisible && (
        <>
          <View className='info-mask' onClick={closeInfo} />
          <View className='info-panel glass' onClick={(e) => e.stopPropagation()}>
            <Button className='close-info' onClick={closeInfo}>
              ×
            </Button>
            <View className='info-title'>{info.title}</View>
            <View className='highlight-badge'>最大特点：{info.highlight}</View>
            <View className='info-summary'>{info.summary}</View>
            <View className='info-facts'>
              {info.facts.map((fact) => (
                <Text className='fact' key={fact}>
                  • {fact}
                </Text>
              ))}
            </View>
            <View className='audio-note'>{info.audioNote}</View>
            <View className='source-note'>
              <Text>来源：</Text>
              {info.sources.map((source) => (
                <Text key={source.label} className='source-item' onClick={() => onSourceClick(source.url)}>
                  {source.label}
                </Text>
              ))}
            </View>
          </View>
        </>
      )}
    </View>
  );
}
