import React, { useRef, useState } from 'react';
import {
  Download,
  Copy,
  Check,
  Palette,
  Image as ImageIcon,
  Sparkles,
  Sliders,
  Layers,
  RotateCcw,
  Upload,
} from 'lucide-react';
import { CustomBgConfig } from '../types';
import {
  downloadFile,
  copyImageToClipboard,
  renderImageWithBackground,
} from '../utils/imageUtils';

interface EditorPanelProps {
  originalUrl: string;
  resultUrl: string;
  imageName: string;
  bgConfig: CustomBgConfig;
  onChangeBgConfig: (config: CustomBgConfig) => void;
  runtimeMs?: number;
  cost?: number;
  onReset: () => void;
}

const PRESET_COLORS = [
  { name: 'Trắng tinh', value: '#ffffff' },
  { name: 'Đen tuyền', value: '#0f172a' },
  { name: 'Xám studio', value: '#e2e8f0' },
  { name: 'Đỏ tươi', value: '#ef4444' },
  { name: 'Xanh dương', value: '#3b82f6' },
  { name: 'Xanh ngọc', value: '#10b981' },
  { name: 'Vàng kem', value: '#fef08a' },
  { name: 'Hồng pastel', value: '#fbcfe8' },
];

const PRESET_GRADIENTS = [
  { id: 'sunset', name: 'Hoàng hôn', preview: 'from-orange-400 to-amber-200' },
  { id: 'ocean', name: 'Đại dương', preview: 'from-blue-600 to-indigo-900' },
  { id: 'neon', name: 'Neon Cyber', preview: 'from-pink-500 to-rose-500' },
  { id: 'studio', name: 'Studio thanh lịch', preview: 'from-slate-200 to-indigo-100' },
  { id: 'cyberpunk', name: 'Huyền bí', preview: 'from-slate-900 via-teal-950 to-slate-800' },
  { id: 'emerald', name: 'Ngọc bích', preview: 'from-emerald-500 to-teal-400' },
  { id: 'lavender', name: 'Hoa oải hương', preview: 'from-purple-300 to-pink-200' },
];

export const EditorPanel: React.FC<EditorPanelProps> = ({
  originalUrl,
  resultUrl,
  imageName,
  bgConfig,
  onChangeBgConfig,
  runtimeMs,
  cost,
  onReset,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const bgFileInputRef = useRef<HTMLInputElement>(null);

  const handleCustomBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onChangeBgConfig({
        ...bgConfig,
        type: 'image',
        customImageUrl: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDownload = async (format: 'image/png' | 'image/jpeg') => {
    setDownloading(true);
    try {
      let finalDataUrl = resultUrl;
      // Nếu có chỉnh nền hoặc bóng đổ, ta render lên canvas trước khi xuất
      if (bgConfig.type !== 'transparent' || bgConfig.hasShadow) {
        finalDataUrl = await renderImageWithBackground(
          resultUrl,
          originalUrl,
          bgConfig,
          format
        );
      }
      const cleanName = imageName.replace(/\.[^/.]+$/, '');
      const ext = format === 'image/png' ? 'png' : 'jpg';
      downloadFile(finalDataUrl, `${cleanName}-tach-nen.${ext}`);
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopy = async () => {
    try {
      let finalDataUrl = resultUrl;
      if (bgConfig.type !== 'transparent' || bgConfig.hasShadow) {
        finalDataUrl = await renderImageWithBackground(
          resultUrl,
          originalUrl,
          bgConfig,
          'image/png'
        );
      }
      await copyImageToClipboard(finalDataUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  return (
    <div className="bg-slate-900/60 rounded-3xl border border-slate-800/80 p-5 space-y-6 shadow-2xl">
      {/* Thống kê xử lý */}
      <div className="flex items-center justify-between p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800/80">
        <div className="flex items-center space-x-2 text-xs text-slate-300">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>Thời gian: <strong className="text-white font-mono">{runtimeMs ? `${runtimeMs}ms` : 'N/A'}</strong></span>
        </div>
        <div className="text-xs text-slate-300">
          Chi phí API: <strong className="text-emerald-400 font-mono">${cost?.toFixed(3) || '0.018'}</strong>
        </div>
      </div>

      {/* Tùy chỉnh Nền */}
      <div className="space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
          <Palette className="w-3.5 h-3.5 text-indigo-400" />
          <span>Lựa chọn Nền (Background)</span>
        </label>

        {/* Nút chọn kiểu nền */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <button
            type="button"
            onClick={() => onChangeBgConfig({ ...bgConfig, type: 'transparent' })}
            className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-semibold transition-all ${
              bgConfig.type === 'transparent'
                ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400 ring-2 ring-indigo-500/20'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="w-6 h-6 rounded-lg bg-checkerboard border border-slate-700 mb-1.5" />
            <span>Trong suốt</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeBgConfig({ ...bgConfig, type: 'color' })}
            className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-semibold transition-all ${
              bgConfig.type === 'color'
                ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400 ring-2 ring-indigo-500/20'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div
              className="w-6 h-6 rounded-lg border border-slate-700 mb-1.5"
              style={{ backgroundColor: bgConfig.color }}
            />
            <span>Màu sắc</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeBgConfig({ ...bgConfig, type: 'gradient' })}
            className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-semibold transition-all ${
              bgConfig.type === 'gradient'
                ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400 ring-2 ring-indigo-500/20'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-pink-500 to-indigo-500 border border-slate-700 mb-1.5" />
            <span>Gradient</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (!bgConfig.customImageUrl) {
                bgFileInputRef.current?.click();
              } else {
                onChangeBgConfig({ ...bgConfig, type: 'image' });
              }
            }}
            className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-semibold transition-all ${
              bgConfig.type === 'image'
                ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400 ring-2 ring-indigo-500/20'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700 mb-1.5 text-slate-300">
              <Upload className="w-3.5 h-3.5" />
            </div>
            <span>Ảnh riêng</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeBgConfig({ ...bgConfig, type: 'blur_original' })}
            className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-semibold transition-all col-span-2 sm:col-span-1 ${
              bgConfig.type === 'blur_original'
                ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400 ring-2 ring-indigo-500/20'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="w-6 h-6 rounded-lg bg-slate-700/60 blur-[1px] border border-slate-600 mb-1.5" />
            <span>Mờ nền gốc</span>
          </button>
        </div>

        {/* Bảng chọn màu chi tiết khi chọn 'color' */}
        {bgConfig.type === 'color' && (
          <div className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => onChangeBgConfig({ ...bgConfig, color: c.value })}
                  className={`w-7 h-7 rounded-xl border-2 transition-transform hover:scale-110 ${
                    bgConfig.color === c.value ? 'border-indigo-500 scale-110' : 'border-slate-700'
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}

              {/* Color picker custom */}
              <label className="relative flex items-center justify-center w-7 h-7 rounded-xl border border-slate-700 bg-slate-900 cursor-pointer overflow-hidden hover:scale-110 transition-transform">
                <input
                  type="color"
                  value={bgConfig.color}
                  onChange={(e) =>
                    onChangeBgConfig({ ...bgConfig, color: e.target.value })
                  }
                  className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
                />
                <Palette className="w-3.5 h-3.5 text-slate-300" />
              </label>
            </div>
          </div>
        )}

        {/* Bảng chọn Gradient */}
        {bgConfig.type === 'gradient' && (
          <div className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRESET_GRADIENTS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => onChangeBgConfig({ ...bgConfig, gradient: g.id })}
                  className={`flex items-center space-x-2 p-2 rounded-xl border text-left text-xs transition-all ${
                    bgConfig.gradient === g.id
                      ? 'border-indigo-500 bg-indigo-500/10 text-white font-medium'
                      : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-lg bg-gradient-to-tr ${g.preview} shrink-0 ring-1 ring-white/20`}
                  />
                  <span className="truncate">{g.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Khi chọn tải ảnh nền riêng */}
        {bgConfig.type === 'image' && (
          <div className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800 flex items-center justify-between">
            <input
              ref={bgFileInputRef}
              type="file"
              accept="image/*"
              onChange={handleCustomBgUpload}
              className="hidden"
            />
            <div className="flex items-center space-x-3">
              {bgConfig.customImageUrl ? (
                <img
                  src={bgConfig.customImageUrl}
                  alt="Custom background preview"
                  className="w-12 h-12 rounded-xl object-cover ring-1 ring-white/10"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500">
                  <ImageIcon className="w-5 h-5" />
                </div>
              )}
              <div>
                <div className="text-xs font-semibold text-slate-200">
                  {bgConfig.customImageUrl ? 'Ảnh nền đã nạp' : 'Chưa chọn ảnh nền'}
                </div>
                <div className="text-[11px] text-slate-500">
                  Thay phong cảnh, phòng trưng bày, studio...
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => bgFileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
            >
              Chọn ảnh khác
            </button>
          </div>
        )}

        {/* Khi chọn làm mờ ảnh gốc */}
        {bgConfig.type === 'blur_original' && (
          <div className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex justify-between text-xs text-slate-300">
              <span>Độ mờ hậu cảnh (Bokeh effect)</span>
              <span className="font-mono">{bgConfig.blurAmount}px</span>
            </div>
            <input
              type="range"
              min="2"
              max="40"
              value={bgConfig.blurAmount}
              onChange={(e) =>
                onChangeBgConfig({
                  ...bgConfig,
                  blurAmount: Number(e.target.value),
                })
              }
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* Hiệu ứng Đổ bóng (Drop Shadow) */}
      <div className="space-y-3 pt-2 border-t border-slate-800/80">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Hiệu ứng Bóng đổ 3D</span>
          </label>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={bgConfig.hasShadow}
              onChange={(e) =>
                onChangeBgConfig({ ...bgConfig, hasShadow: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        {bgConfig.hasShadow && (
          <div className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800 space-y-3">
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Độ nhòe bóng</span>
                <span className="font-mono">{bgConfig.shadowBlur}px</span>
              </div>
              <input
                type="range"
                min="5"
                max="60"
                value={bgConfig.shadowBlur}
                onChange={(e) =>
                  onChangeBgConfig({
                    ...bgConfig,
                    shadowBlur: Number(e.target.value),
                  })
                }
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Độ đậm của bóng</span>
                <span className="font-mono">{Math.round(bgConfig.shadowOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.05"
                value={bgConfig.shadowOpacity}
                onChange={(e) =>
                  onChangeBgConfig({
                    ...bgConfig,
                    shadowOpacity: Number(e.target.value),
                  })
                }
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* Nút hành động Download & Copy */}
      <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            disabled={downloading}
            onClick={() => handleDownload('image/png')}
            className="flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Tải ảnh PNG</span>
          </button>

          <button
            type="button"
            disabled={downloading}
            onClick={() => handleDownload('image/jpeg')}
            className="flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs border border-slate-700 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Tải ảnh JPG</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Đã chép vào Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Sao chép ảnh (Ctrl+C)</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onReset}
            className="p-2.5 rounded-2xl bg-slate-950 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 transition-colors"
            title="Chọn ảnh khác"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
