export interface ImageItem {
  id: string;
  name: string;
  size: number;
  originalUrl: string;
  originalBase64: string;
  resultUrl?: string;
  status: 'idle' | 'processing' | 'done' | 'error';
  error?: string;
  runtimeMs?: number;
  cost?: number;
  width?: number;
  height?: number;
}

export interface ProcessingSettings {
  model: string;
  preserveAlpha: boolean;
  useProxy: boolean;
}

export interface CustomBgConfig {
  type: 'transparent' | 'color' | 'gradient' | 'image' | 'blur_original';
  color: string;
  gradient: string;
  customImageUrl?: string;
  blurAmount: number;
  hasShadow: boolean;
  shadowBlur: number;
  shadowOpacity: number;
  shadowOffsetY: number;
}
