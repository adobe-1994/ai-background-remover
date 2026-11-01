import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Minimize2, Split, Columns2, Eye } from 'lucide-react';
import { CustomBgConfig } from '../types';

interface ComparisonSliderProps {
  originalUrl: string;
  resultUrl: string;
  bgConfig: CustomBgConfig;
  width?: number;
  height?: number;
}

export const ComparisonSlider: React.FC<ComparisonSliderProps> = ({
  originalUrl,
  resultUrl,
  bgConfig,
  width,
  height,
}) => {
  const [sliderPos, setSliderPos] = useState(50); // percentage 0-100
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState<'slider' | 'side-by-side' | 'result'>('slider');
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Background style computation for result layer
  const getBackgroundStyle = (): React.CSSProperties => {
    switch (bgConfig.type) {
      case 'color':
        return { backgroundColor: bgConfig.color };
      case 'gradient': {
        const gradients: Record<string, string> = {
          sunset: 'linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%)',
          ocean: 'linear-gradient(135deg, #2b5876 0%, #4e4376 100%)',
          neon: 'linear-gradient(135deg, #f857a6 0%, #ff5858 100%)',
          studio: 'linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)',
          cyberpunk: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
          emerald: 'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)',
          lavender: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
        };
        return {
          backgroundImage:
            gradients[bgConfig.gradient] ||
            'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
        };
      }
      case 'image':
        return bgConfig.customImageUrl
          ? {
              backgroundImage: `url(${bgConfig.customImageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : { backgroundColor: '#ffffff' };
      case 'blur_original':
        return {};
      default:
        // transparent checkerboard
        return {};
    }
  };

  // Shadow style computation
  const getShadowStyle = (): React.CSSProperties => {
    if (!bgConfig.hasShadow) return {};
    return {
      filter: `drop-shadow(0px ${bgConfig.shadowOffsetY || 15}px ${
        bgConfig.shadowBlur || 25
      }px rgba(0, 0, 0, ${bgConfig.shadowOpacity || 0.45}))`,
    };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    updateSlider(e.clientX);
  };

  const updateSlider = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.round((x / rect.width) * 100);
    setSliderPos(percent);
  }, []);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (isDragging) {
        updateSlider(e.clientX);
      }
    };
    const handlePointerUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };

    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, updateSlider]);

  return (
    <div
      className={`relative flex flex-col bg-slate-900/60 rounded-3xl border border-slate-800/80 overflow-hidden shadow-2xl ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none bg-slate-950 p-6' : ''
      }`}
    >
      {/* Top Toolbar */}
      <div className="px-5 py-3 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 bg-slate-950/40">
        {/* View Mode Switcher */}
        <div className="flex items-center space-x-1 p-1 bg-slate-900 rounded-xl border border-slate-800">
          <button
            onClick={() => setViewMode('slider')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'slider'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Split className="w-3.5 h-3.5" />
            <span>Thanh trượt so sánh</span>
          </button>
          <button
            onClick={() => setViewMode('side-by-side')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'side-by-side'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Columns2 className="w-3.5 h-3.5" />
            <span>Song song</span>
          </button>
          <button
            onClick={() => setViewMode('result')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'result'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Chỉ xem kết quả</span>
          </button>
        </div>

        {/* Zoom & Screen Controls */}
        <div className="flex items-center space-x-2">
          {width && height && (
            <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
              {width} × {height} px
            </span>
          )}

          <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setZoom((z) => Math.min(z + 0.25, 3))}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              title="Phóng to"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono text-slate-300 px-1">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              title="Thu nhỏ"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              title="Về 100%"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 text-slate-400 hover:text-white bg-slate-900 rounded-xl border border-slate-800 hover:bg-slate-800 transition-colors"
            title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Main Image Display Area */}
      <div className="flex-1 p-4 sm:p-6 flex items-center justify-center min-h-[380px] sm:min-h-[500px] overflow-auto select-none">
        {viewMode === 'slider' && (
          <div
            ref={containerRef}
            onPointerDown={handlePointerDown}
            className="relative inline-block max-w-full max-h-[600px] rounded-2xl overflow-hidden shadow-2xl cursor-ew-resize touch-none ring-1 ring-slate-800"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
          >
            {/* Lớp nền kết quả (Result Layer với Custom Background) */}
            <div
              className={`w-full h-full relative ${
                bgConfig.type === 'transparent' ? 'bg-checkerboard' : ''
              }`}
              style={getBackgroundStyle()}
            >
              {bgConfig.type === 'blur_original' && (
                <img
                  src={originalUrl}
                  alt="Background blurred"
                  className="absolute inset-0 w-full h-full object-contain filter"
                  style={{
                    filter: `blur(${bgConfig.blurAmount || 15}px)`,
                    transform: 'scale(1.1)',
                  }}
                />
              )}
              <img
                src={resultUrl}
                alt="Result"
                className="block max-w-full max-h-[600px] object-contain relative z-10"
                style={getShadowStyle()}
              />
              <span className="absolute bottom-3 right-3 z-20 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-indigo-600/90 text-white shadow-lg backdrop-blur-sm">
                Đã tách nền
              </span>
            </div>

            {/* Lớp ảnh gốc (Original Layer - bị cắt bởi slider clip-path) */}
            <div
              className="absolute inset-0 overflow-hidden pointer-events-none"
              style={{
                clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)`,
              }}
            >
              <img
                src={originalUrl}
                alt="Original"
                className="block max-w-full max-h-[600px] object-contain w-full h-full"
              />
              <span className="absolute bottom-3 left-3 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-slate-900/90 text-slate-200 shadow-lg backdrop-blur-sm border border-slate-700/50">
                Ảnh gốc
              </span>
            </div>

            {/* Thanh trượt phân cách (Divider handle) */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-30 shadow-[0_0_12px_rgba(0,0,0,0.6)]"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-xl font-bold ring-2 ring-indigo-500">
                <div className="flex space-x-0.5">
                  <div className="w-0.5 h-3 bg-slate-400 rounded-full"></div>
                  <div className="w-0.5 h-3 bg-slate-400 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'side-by-side' && (
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
          >
            {/* Ảnh gốc */}
            <div className="bg-slate-950/80 rounded-2xl p-3 border border-slate-800 flex flex-col items-center">
              <span className="text-xs font-semibold text-slate-400 mb-2">Ảnh gốc</span>
              <img
                src={originalUrl}
                alt="Original"
                className="max-h-[420px] rounded-xl object-contain"
              />
            </div>

            {/* Ảnh đã tách nền */}
            <div
              className={`rounded-2xl p-3 border border-slate-800 flex flex-col items-center overflow-hidden ${
                bgConfig.type === 'transparent' ? 'bg-checkerboard' : ''
              }`}
              style={getBackgroundStyle()}
            >
              <span className="text-xs font-semibold text-indigo-400 mb-2">Đã tách nền</span>
              <img
                src={resultUrl}
                alt="Result"
                className="max-h-[420px] object-contain"
                style={getShadowStyle()}
              />
            </div>
          </div>
        )}

        {viewMode === 'result' && (
          <div
            className={`rounded-2xl p-4 overflow-hidden max-w-full max-h-[600px] flex items-center justify-center ${
              bgConfig.type === 'transparent' ? 'bg-checkerboard' : ''
            }`}
            style={{
              ...getBackgroundStyle(),
              transform: `scale(${zoom})`,
              transformOrigin: 'center',
            }}
          >
            <img
              src={resultUrl}
              alt="Result"
              className="max-w-full max-h-[560px] object-contain"
              style={getShadowStyle()}
            />
          </div>
        )}
      </div>
    </div>
  );
};
