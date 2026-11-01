import React, { useRef, useState, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon, Sparkles, Clipboard, Layers } from 'lucide-react';
import { fileToBase64, getImageDimensions } from '../utils/imageUtils';
import { ImageItem } from '../types';

interface DropzoneProps {
  onImagesAdded: (newImages: ImageItem[]) => void;
  disabled?: boolean;
}

// Mẫu ảnh demo chất lượng cao để người dùng test ngay lập tức
const SAMPLE_IMAGES = [
  {
    name: 'Chân dung (Portrait)',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    type: 'Chân dung',
  },
  {
    name: 'Sản phẩm giày sneaker',
    url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
    type: 'Sản phẩm',
  },
  {
    name: 'Thú cưng (Cute dog)',
    url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=600&q=80',
    type: 'Động vật',
  },
  {
    name: 'Đồng hồ cao cấp',
    url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
    type: 'Thương mại',
  },
];

export const Dropzone: React.FC<DropzoneProps> = ({ onImagesAdded, disabled }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [loadingSample, setLoadingSample] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lắng nghe sự kiện paste clipboard (Ctrl+V)
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (disabled) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) imageFiles.push(file);
        }
      }

      if (imageFiles.length > 0) {
        await processFiles(imageFiles);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [disabled]);

  const processFiles = async (files: File[]) => {
    const newItems: ImageItem[] = [];

    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      try {
        const base64 = await fileToBase64(file);
        const dimensions = await getImageDimensions(base64);

        newItems.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          size: file.size,
          originalUrl: base64,
          originalBase64: base64,
          status: 'idle',
          width: dimensions.width,
          height: dimensions.height,
        });
      } catch (err) {
        console.error('Error reading file:', file.name, err);
      }
    }

    if (newItems.length > 0) {
      onImagesAdded(newItems);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    await processFiles(files);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || disabled) return;
    const files = Array.from(e.target.files);
    await processFiles(files);
    e.target.value = '';
  };

  const handleSelectSample = async (sample: typeof SAMPLE_IMAGES[0]) => {
    if (disabled || loadingSample) return;
    setLoadingSample(sample.name);
    try {
      // Tải ảnh qua proxy/fetch rồi chuyển thành Data URL
      const res = await fetch(sample.url);
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const dimensions = await getImageDimensions(base64);
        onImagesAdded([
          {
            id: `${Date.now()}-sample`,
            name: `${sample.name}.jpg`,
            size: blob.size,
            originalUrl: base64,
            originalBase64: base64,
            status: 'idle',
            width: dimensions.width,
            height: dimensions.height,
          },
        ]);
        setLoadingSample(null);
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error('Failed to load sample image:', err);
      setLoadingSample(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Vùng Dropzone chính */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`relative group rounded-3xl p-8 sm:p-12 text-center border-2 border-dashed transition-all cursor-pointer overflow-hidden ${
          isDragOver
            ? 'border-indigo-400 bg-indigo-500/10 shadow-2xl shadow-indigo-500/20 scale-[1.01]'
            : 'border-slate-800 hover:border-indigo-500/50 bg-slate-900/40 hover:bg-slate-900/80'
        } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Hiệu ứng nền mờ nhẹ */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-600/20 transition-all duration-500" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-pink-600/10 rounded-full blur-3xl pointer-events-none group-hover:bg-pink-600/20 transition-all duration-500" />

        <div className="relative z-10 flex flex-col items-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-xl shadow-indigo-600/25 ring-4 ring-indigo-500/20 group-hover:scale-110 transition-transform duration-300 mb-5">
            <UploadCloud className="w-8 h-8 text-white" />
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
            Kéo thả ảnh vào đây, hoặc nhấn để chọn
          </h3>

          <p className="text-xs sm:text-sm text-slate-400 mb-4 leading-relaxed">
            Hỗ trợ tách nền 1 ảnh hoặc hàng loạt nhiều ảnh cùng lúc. Định dạng PNG, JPG, WEBP.
          </p>

          {/* Quick paste shortcut badge */}
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
            <Clipboard className="w-3.5 h-3.5 text-indigo-400" />
            <span>Mẹo: Bạn có thể nhấn <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono text-[11px] text-white">Ctrl + V</kbd> để dán ảnh trực tiếp</span>
          </div>
        </div>
      </div>

      {/* Mẫu ảnh demo thử nghiệm nhanh */}
      <div className="bg-slate-900/30 rounded-2xl p-4 border border-slate-800/60">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Hoặc thử ngay với ảnh mẫu:</span>
          </span>
          <span className="text-[11px] text-slate-500">Nhấp để tải & tách thử</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {SAMPLE_IMAGES.map((sample) => (
            <button
              key={sample.name}
              type="button"
              disabled={Boolean(loadingSample)}
              onClick={(e) => {
                e.stopPropagation();
                handleSelectSample(sample);
              }}
              className="flex items-center space-x-2.5 p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/40 text-left transition-all group disabled:opacity-50"
            >
              <img
                src={sample.url}
                alt={sample.name}
                className="w-10 h-10 rounded-lg object-cover ring-1 ring-white/10 group-hover:scale-105 transition-transform"
              />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-slate-200 truncate group-hover:text-indigo-300 transition-colors">
                  {sample.type}
                </div>
                <div className="text-[10px] text-slate-500 truncate">
                  {loadingSample === sample.name ? 'Đang nạp...' : 'Thử ngay'}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
