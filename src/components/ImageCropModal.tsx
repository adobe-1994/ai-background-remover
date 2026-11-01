import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Crop as CropIcon,
  Check,
  X,
  RotateCcw,
  Scan,
} from 'lucide-react';
import {
  CropRect,
  cropImageToDataUrl,
  getNonTransparentBounds,
} from '../utils/imageUtils';

interface ImageCropModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  targetLabel: 'Input' | 'Output';
  showAutoTrim?: boolean;
  onClose: () => void;
  onApply: (croppedDataUrl: string) => void;
}

type DragMode =
  | 'move'
  | 'nw'
  | 'ne'
  | 'sw'
  | 'se'
  | 'n'
  | 's'
  | 'w'
  | 'e';

interface AspectPreset {
  id: string;
  label: string;
  ratio: number | null;
}

const ASPECT_PRESETS: AspectPreset[] = [
  { id: 'free', label: 'Tự do', ratio: null },
  { id: '1:1', label: '1:1', ratio: 1 },
  { id: '3:4', label: '3:4', ratio: 3 / 4 },
  { id: '4:3', label: '4:3', ratio: 4 / 3 },
  { id: '9:16', label: '9:16', ratio: 9 / 16 },
  { id: '16:9', label: '16:9', ratio: 16 / 9 },
];

const clamp = (val: number, min: number, max: number) =>
  Math.max(min, Math.min(max, val));

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  imageUrl,
  targetLabel,
  showAutoTrim = false,
  onClose,
  onApply,
}) => {
  const [natSize, setNatSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  const [crop, setCrop] = useState<CropRect>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [selectedPreset, setSelectedPreset] = useState<string>('free');
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [activeDrag, setActiveDrag] = useState<DragMode | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const imgRef = useRef<HTMLImageElement>(null);
  const dragSessionRef = useRef<{
    mode: DragMode;
    startClientX: number;
    startClientY: number;
    startCrop: CropRect;
  } | null>(null);

  // Khi ảnh nạp xong, khởi tạo khung cắt mặc định = 100% khung ảnh (giống Photoshop)
  const initFromDimensions = useCallback((w: number, h: number) => {
    if (!w || !h) return;
    setNatSize({ width: w, height: h });
    setCrop({ x: 0, y: 0, width: w, height: h });
    setSelectedPreset('free');
    setAspectRatio(null);
  }, []);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    initFromDimensions(img.naturalWidth, img.naturalHeight);
  };

  useEffect(() => {
    if (!isOpen) {
      setNatSize({ width: 0, height: 0 });
      return;
    }
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      initFromDimensions(img.naturalWidth, img.naturalHeight);
    }
  }, [isOpen, imageUrl, initFromDimensions]);

  // Chọn tỷ lệ khung hình cố định hoặc tự do
  const handleSelectPreset = (preset: AspectPreset) => {
    setSelectedPreset(preset.id);
    setAspectRatio(preset.ratio);

    if (!natSize.width || !natSize.height) return;

    if (preset.ratio === null) {
      return;
    }

    const r = preset.ratio;
    let w = natSize.width;
    let h = w / r;
    if (h > natSize.height) {
      h = natSize.height;
      w = h * r;
    }
    const x = (natSize.width - w) / 2;
    const y = (natSize.height - h) / 2;
    setCrop({ x, y, width: w, height: h });
  };

  // Đặt lại khung cắt về toàn bộ bức ảnh gốc
  const handleReset = () => {
    if (!natSize.width || !natSize.height) return;
    setSelectedPreset('free');
    setAspectRatio(null);
    setCrop({ x: 0, y: 0, width: natSize.width, height: natSize.height });
  };

  // Tự động cắt sát viền chủ thể trong suốt (giống Photoshop Image -> Trim)
  const handleAutoTrim = async () => {
    if (!imageUrl) return;
    const bounds = await getNonTransparentBounds(imageUrl, 0.02);
    if (bounds) {
      setSelectedPreset('free');
      setAspectRatio(null);
      setCrop(bounds);
    }
  };

  // Bắt đầu kéo điểm neo hoặc di chuyển vùng chọn
  const startDrag = (mode: DragMode) => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragSessionRef.current = {
      mode,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startCrop: { ...crop },
    };
    setActiveDrag(mode);
  };

  // Xử lý tọa độ kéo theo thời gian thực
  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      const session = dragSessionRef.current;
      const imgEl = imgRef.current;
      if (!session || !imgEl || !natSize.width || !natSize.height) return;

      const rect = imgEl.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const natW = natSize.width;
      const natH = natSize.height;
      const dx = (e.clientX - session.startClientX) * (natW / rect.width);
      const dy = (e.clientY - session.startClientY) * (natH / rect.height);

      const minW = Math.max(16, Math.min(48, natW * 0.08));
      const minH = Math.max(16, Math.min(48, natH * 0.08));
      const { mode, startCrop } = session;

      // 1. Di chuyển cả khung cắt
      if (mode === 'move') {
        const nx = clamp(startCrop.x + dx, 0, natW - startCrop.width);
        const ny = clamp(startCrop.y + dy, 0, natH - startCrop.height);
        setCrop({
          x: nx,
          y: ny,
          width: startCrop.width,
          height: startCrop.height,
        });
        return;
      }

      // 2. Chế độ tỷ lệ Tự do (Freeform)
      if (aspectRatio === null) {
        let left = startCrop.x;
        let top = startCrop.y;
        let right = startCrop.x + startCrop.width;
        let bottom = startCrop.y + startCrop.height;

        if (mode.includes('w')) {
          left = clamp(left + dx, 0, right - minW);
        }
        if (mode.includes('e')) {
          right = clamp(right + dx, left + minW, natW);
        }
        if (mode.includes('n')) {
          top = clamp(top + dy, 0, bottom - minH);
        }
        if (mode.includes('s')) {
          bottom = clamp(bottom + dy, top + minH, natH);
        }

        setCrop({
          x: left,
          y: top,
          width: right - left,
          height: bottom - top,
        });
        return;
      }

      // 3. Chế độ khóa tỷ lệ cố định (Locked Aspect Ratio)
      const R = aspectRatio;

      if (mode === 'nw' || mode === 'ne' || mode === 'sw' || mode === 'se') {
        const isEast = mode.includes('e');
        const isSouth = mode.includes('s');

        const anchorX = isEast ? startCrop.x : startCrop.x + startCrop.width;
        const anchorY = isSouth ? startCrop.y : startCrop.y + startCrop.height;

        const maxW = isEast ? natW - anchorX : anchorX;
        const maxH = isSouth ? natH - anchorY : anchorY;

        const rawW = isEast ? startCrop.width + dx : startCrop.width - dx;
        const rawH = isSouth ? startCrop.height + dy : startCrop.height - dy;

        let newW = Math.abs(dx) >= Math.abs(dy * R) ? rawW : rawH * R;
        const upperW = Math.min(maxW, maxH * R);
        const lowerW = Math.max(minW, minH * R);

        newW = clamp(newW, Math.min(lowerW, upperW), upperW);
        const newH = newW / R;

        setCrop({
          x: isEast ? anchorX : anchorX - newW,
          y: isSouth ? anchorY : anchorY - newH,
          width: newW,
          height: newH,
        });
      } else if (mode === 'e' || mode === 'w') {
        const isEast = mode === 'e';
        const anchorX = isEast ? startCrop.x : startCrop.x + startCrop.width;
        const centerY = startCrop.y + startCrop.height / 2;
        const maxHByCenter = 2 * Math.min(centerY, natH - centerY);
        const upperW = Math.min(
          isEast ? natW - anchorX : anchorX,
          maxHByCenter * R
        );
        const lowerW = Math.max(minW, minH * R);

        const rawW = isEast ? startCrop.width + dx : startCrop.width - dx;
        const newW = clamp(rawW, Math.min(lowerW, upperW), upperW);
        const newH = newW / R;

        setCrop({
          x: isEast ? anchorX : anchorX - newW,
          y: centerY - newH / 2,
          width: newW,
          height: newH,
        });
      } else if (mode === 'n' || mode === 's') {
        const isSouth = mode === 's';
        const anchorY = isSouth ? startCrop.y : startCrop.y + startCrop.height;
        const centerX = startCrop.x + startCrop.width / 2;
        const maxWByCenter = 2 * Math.min(centerX, natW - centerX);
        const upperH = Math.min(
          isSouth ? natH - anchorY : anchorY,
          maxWByCenter / R
        );
        const lowerH = Math.max(minH, minW / R);

        const rawH = isSouth ? startCrop.height + dy : startCrop.height - dy;
        const newH = clamp(rawH, Math.min(lowerH, upperH), upperH);
        const newW = newH * R;

        setCrop({
          x: centerX - newW / 2,
          y: isSouth ? anchorY : anchorY - newH,
          width: newW,
          height: newH,
        });
      }
    },
    [aspectRatio, natSize]
  );

  useEffect(() => {
    if (!activeDrag) return;
    const handleUp = () => {
      dragSessionRef.current = null;
      setActiveDrag(null);
    };
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, [activeDrag, handlePointerMove]);

  const handleApplyCrop = useCallback(async () => {
    if (!imageUrl || !crop.width || !crop.height || isApplying) return;
    setIsApplying(true);
    try {
      const croppedUrl = await cropImageToDataUrl(imageUrl, crop);
      onApply(croppedUrl);
      onClose();
    } catch (err) {
      console.error('Crop error:', err);
    } finally {
      setIsApplying(false);
    }
  }, [imageUrl, crop, isApplying, onApply, onClose]);

  // Hỗ trợ phím tắt giống Photoshop: Enter để Áp dụng, Esc để Hủy
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleApplyCrop();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleApplyCrop]);

  if (!isOpen || !imageUrl) return null;

  const hasReadySize = natSize.width > 0 && natSize.height > 0;
  const leftPct = hasReadySize ? (crop.x / natSize.width) * 100 : 0;
  const topPct = hasReadySize ? (crop.y / natSize.height) * 100 : 0;
  const widthPct = hasReadySize ? (crop.width / natSize.width) * 100 : 100;
  const heightPct = hasReadySize ? (crop.height / natSize.height) * 100 : 100;

  return (
    <div className="fixed inset-0 z-50 bg-[#0b0b0b]/95 backdrop-blur-sm flex flex-col select-none animate-in fade-in duration-150">
      {/* 1. Thanh tiêu đề công cụ Crop */}
      <header className="bg-[#222222] border-b border-[#363636] px-4 sm:px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2.5 min-w-0">
          <CropIcon className="w-5 h-5 text-white shrink-0" />
          <span className="text-sm sm:text-base font-bold text-white truncate">
            Crop {targetLabel}
          </span>
          {hasReadySize && (
            <span className="text-[11px] font-mono text-slate-300 bg-[#141414] border border-[#383838] px-2 py-0.5 rounded">
              {Math.round(crop.width)} × {Math.round(crop.height)} px
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center space-x-1 px-3 py-1.5 rounded bg-[#2e2e2e] hover:bg-[#3a3a3a] active:scale-95 border border-[#484848] text-xs sm:text-sm text-slate-200 transition-all cursor-pointer touch-manipulation"
            title="Hủy (Esc)"
          >
            <X className="w-4 h-4" />
            <span>Hủy</span>
          </button>
          <button
            type="button"
            disabled={isApplying || !hasReadySize}
            onClick={handleApplyCrop}
            className="flex items-center space-x-1 px-3.5 py-1.5 rounded bg-white hover:bg-slate-200 active:scale-95 text-black font-semibold text-xs sm:text-sm transition-all disabled:opacity-50 cursor-pointer touch-manipulation"
            title="Áp dụng cắt ảnh (Enter)"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Áp dụng</span>
          </button>
        </div>
      </header>

      {/* 2. Không gian bàn cắt tương tác chuẩn Photoshop */}
      <div className="flex-1 min-h-0 flex items-center justify-center p-6 sm:p-10 overflow-hidden touch-none">
        <div className="relative inline-block bg-checkerboard shadow-2xl touch-none">
          <img
            ref={imgRef}
            src={imageUrl}
            alt="Crop workspace"
            draggable={false}
            onLoad={handleImageLoad}
            className="block max-w-[calc(100vw-48px)] max-h-[56vh] sm:max-w-[calc(100vw-112px)] sm:max-h-[65vh] w-auto h-auto object-contain pointer-events-none select-none"
          />

          {hasReadySize && (
            <>
              {/* 4 vùng tối mờ bao quanh khung cắt (Photoshop Dim Shield) */}
              <div
                className="absolute left-0 right-0 top-0 bg-black/65 pointer-events-none"
                style={{ height: `${topPct}%` }}
              />
              <div
                className="absolute left-0 right-0 bottom-0 bg-black/65 pointer-events-none"
                style={{ height: `${Math.max(0, 100 - topPct - heightPct)}%` }}
              />
              <div
                className="absolute left-0 bg-black/65 pointer-events-none"
                style={{
                  top: `${topPct}%`,
                  height: `${heightPct}%`,
                  width: `${leftPct}%`,
                }}
              />
              <div
                className="absolute right-0 bg-black/65 pointer-events-none"
                style={{
                  top: `${topPct}%`,
                  height: `${heightPct}%`,
                  width: `${Math.max(0, 100 - leftPct - widthPct)}%`,
                }}
              />

              {/* Khung cắt chính kèm lưới 3x3 & 8 điểm neo */}
              <div
                onPointerDown={startDrag('move')}
                className="absolute cursor-move touch-none ring-1 ring-white/95 shadow-[0_0_0_1px_rgba(0,0,0,0.65)]"
                style={{
                  left: `${leftPct}%`,
                  top: `${topPct}%`,
                  width: `${widthPct}%`,
                  height: `${heightPct}%`,
                }}
              >
                {/* Lưới chia tỉ lệ 3x3 (Rule of Thirds) */}
                <div
                  className={`absolute inset-0 pointer-events-none transition-opacity duration-150 ${
                    activeDrag ? 'opacity-90' : 'opacity-45'
                  }`}
                >
                  <div className="absolute top-0 bottom-0 left-1/3 w-px bg-white/80 shadow-[0_0_1px_rgba(0,0,0,0.8)]" />
                  <div className="absolute top-0 bottom-0 left-2/3 w-px bg-white/80 shadow-[0_0_1px_rgba(0,0,0,0.8)]" />
                  <div className="absolute left-0 right-0 top-1/3 h-px bg-white/80 shadow-[0_0_1px_rgba(0,0,0,0.8)]" />
                  <div className="absolute left-0 right-0 top-2/3 h-px bg-white/80 shadow-[0_0_1px_rgba(0,0,0,0.8)]" />
                </div>

                {/* === 4 Điểm Neo Góc Chữ L (Corners) === */}
                {/* Top-Left (NW) */}
                <div
                  onPointerDown={startDrag('nw')}
                  className="absolute -top-3.5 -left-3.5 w-8 h-8 flex items-center justify-center cursor-nwse-resize touch-none z-20"
                >
                  <div className="w-4 h-4 border-t-[3px] border-l-[3px] border-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] -translate-x-0.5 -translate-y-0.5" />
                </div>

                {/* Top-Right (NE) */}
                <div
                  onPointerDown={startDrag('ne')}
                  className="absolute -top-3.5 -right-3.5 w-8 h-8 flex items-center justify-center cursor-nesw-resize touch-none z-20"
                >
                  <div className="w-4 h-4 border-t-[3px] border-r-[3px] border-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] translate-x-0.5 -translate-y-0.5" />
                </div>

                {/* Bottom-Left (SW) */}
                <div
                  onPointerDown={startDrag('sw')}
                  className="absolute -bottom-3.5 -left-3.5 w-8 h-8 flex items-center justify-center cursor-nesw-resize touch-none z-20"
                >
                  <div className="w-4 h-4 border-b-[3px] border-l-[3px] border-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] -translate-x-0.5 translate-y-0.5" />
                </div>

                {/* Bottom-Right (SE) */}
                <div
                  onPointerDown={startDrag('se')}
                  className="absolute -bottom-3.5 -right-3.5 w-8 h-8 flex items-center justify-center cursor-nwse-resize touch-none z-20"
                >
                  <div className="w-4 h-4 border-b-[3px] border-r-[3px] border-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] translate-x-0.5 translate-y-0.5" />
                </div>

                {/* === 4 Điểm Neo Cạnh Giữa (Edges) === */}
                {/* Top (N) */}
                <div
                  onPointerDown={startDrag('n')}
                  className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-10 h-7 flex items-center justify-center cursor-ns-resize touch-none z-10"
                >
                  <div className="w-5 h-[3px] bg-white rounded-full drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]" />
                </div>

                {/* Bottom (S) */}
                <div
                  onPointerDown={startDrag('s')}
                  className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 w-10 h-7 flex items-center justify-center cursor-ns-resize touch-none z-10"
                >
                  <div className="w-5 h-[3px] bg-white rounded-full drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]" />
                </div>

                {/* Left (W) */}
                <div
                  onPointerDown={startDrag('w')}
                  className="absolute top-1/2 -left-3.5 -translate-y-1/2 w-7 h-10 flex items-center justify-center cursor-ew-resize touch-none z-10"
                >
                  <div className="w-[3px] h-5 bg-white rounded-full drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]" />
                </div>

                {/* Right (E) */}
                <div
                  onPointerDown={startDrag('e')}
                  className="absolute top-1/2 -right-3.5 -translate-y-1/2 w-7 h-10 flex items-center justify-center cursor-ew-resize touch-none z-10"
                >
                  <div className="w-[3px] h-5 bg-white rounded-full drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]" />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 3. Thanh công cụ chọn tỷ lệ nhanh (Aspect Ratio Bar) */}
      <footer className="bg-[#1b1b1b] border-t border-[#323232] px-4 py-3 pb-6 sm:pb-3 shrink-0">
        <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-center gap-2">
          {ASPECT_PRESETS.map((preset) => {
            const isActive = selectedPreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`px-3 py-1.5 rounded text-xs font-medium border transition-all cursor-pointer touch-manipulation ${
                  isActive
                    ? 'bg-white text-black border-white font-semibold'
                    : 'bg-[#2a2a2a] hover:bg-[#363636] text-slate-200 border-[#444444]'
                }`}
              >
                {preset.label}
              </button>
            );
          })}

          {showAutoTrim && (
            <button
              type="button"
              onClick={handleAutoTrim}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-medium bg-[#2a2a2a] hover:bg-[#363636] active:scale-95 text-slate-200 border border-[#444444] transition-all cursor-pointer touch-manipulation"
              title="Tự động thu gọn sát viền vật thể đã tách nền"
            >
              <Scan className="w-3.5 h-3.5" />
              <span>Cắt sát viền</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleReset}
            className="flex items-center space-x-1 px-3 py-1.5 rounded text-xs font-medium bg-[#222222] hover:bg-[#303030] active:scale-95 text-slate-300 border border-[#3a3a3a] transition-all cursor-pointer touch-manipulation"
            title="Đặt lại toàn bộ vùng chọn"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Đặt lại</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
