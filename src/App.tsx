import React, { useState, useEffect, useRef } from 'react';
import {
  Settings,
  FileUp,
  Trash2,
  Send,
  FileDown,
  Crop,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { ApiKeyModal } from './components/ApiKeyModal';
import { ImageCropModal } from './components/ImageCropModal';
import { removeBackgroundViaDeepInfra } from './services/deepinfra';
import { fileToBase64, downloadAsPng, downloadAsJpg } from './utils/imageUtils';

export const App: React.FC = () => {
  // Quản lý API Key & Cấu hình mạng
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('deepinfra_api_key') || '';
  });
  const [useProxy, setUseProxy] = useState<boolean>(() => {
    return localStorage.getItem('deepinfra_use_proxy') === 'true';
  });

  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [inputImage, setInputImage] = useState<string | null>(null);
  const [inputFileName, setInputFileName] = useState<string>('image');
  const [outputImage, setOutputImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cropTarget, setCropTarget] = useState<'input' | 'output' | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'error' | 'success';
    text: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const outputSectionRef = useRef<HTMLElement>(null);

  // Lưu API Key & Proxy vào LocalStorage
  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('deepinfra_api_key', key);
    if (key.trim()) {
      setStatusMessage({ type: 'success', text: 'Đã lưu API Key thành công!' });
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleToggleProxy = (proxyVal: boolean) => {
    setUseProxy(proxyVal);
    localStorage.setItem('deepinfra_use_proxy', String(proxyVal));
  };

  // Xử lý nạp ảnh từ File
  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setStatusMessage({ type: 'error', text: 'Vui lòng chọn file hình ảnh hợp lệ (PNG, JPG, WEBP).' });
      return;
    }
    try {
      const base64 = await fileToBase64(file);
      setInputImage(base64);
      setInputFileName(file.name.replace(/\.[^/.]+$/, ''));
      setOutputImage(null);
      setStatusMessage(null);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: 'Không thể đọc file ảnh.' });
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // Hỗ trợ Paste từ Clipboard (Ctrl + V trên máy tính)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            handleFile(file);
            break;
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Xóa ảnh Input & Output
  const handleClear = () => {
    setInputImage(null);
    setOutputImage(null);
    setStatusMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Kích hoạt xử lý tách nền qua DeepInfra
  const handleProcess = async () => {
    if (!inputImage) {
      setStatusMessage({ type: 'error', text: 'Vui lòng tải ảnh lên trước khi tách nền.' });
      return;
    }

    if (!apiKey.trim()) {
      setIsKeyModalOpen(true);
      setStatusMessage({ type: 'error', text: 'Vui lòng nhập DeepInfra API Key để tiếp tục.' });
      return;
    }

    setIsProcessing(true);
    setStatusMessage(null);

    // Trên điện thoại: Tự động cuộn mượt xuống vùng Output khi bắt đầu tách
    if (window.innerWidth < 768 && outputSectionRef.current) {
      outputSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    try {
      const res = await removeBackgroundViaDeepInfra({
        apiKey,
        imageBase64: inputImage,
        preserveAlpha: true,
        useProxy,
      });
      setOutputImage(res.imageUrl);
      setStatusMessage({
        type: 'success',
        text: `Tách nền thành công! (${res.runtimeMs}ms • $${res.cost?.toFixed(3) || '0.018'})`,
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Lỗi khi gọi DeepInfra API.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Tải ảnh định dạng PNG
  const handleDownloadPng = () => {
    if (!outputImage) {
      setStatusMessage({ type: 'error', text: 'Chưa có ảnh kết quả để tải.' });
      return;
    }
    downloadAsPng(outputImage, `${inputFileName}-remove.png`);
  };

  // Tải ảnh định dạng JPG
  const handleDownloadJpg = async () => {
    if (!outputImage) {
      setStatusMessage({ type: 'error', text: 'Chưa có ảnh kết quả để tải.' });
      return;
    }
    await downloadAsJpg(outputImage, `${inputFileName}-remove.jpg`, '#ffffff');
  };

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white flex flex-col font-sans select-none antialiased">
      {/* 1. Header Bar: Tối ưu khoảng đệm trên cả Mobile và Desktop */}
      <header className="bg-[#2a2a2a] px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between border-b border-[#383838] sticky top-0 z-20">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
          Remove
        </h1>
        <button
          onClick={() => setIsKeyModalOpen(true)}
          className="text-white hover:text-slate-300 p-2 -mr-1 rounded-lg hover:bg-[#353535] active:scale-95 transition-all touch-manipulation"
          title="Cài đặt DeepInfra API"
          aria-label="Cài đặt"
        >
          <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </header>

      {/* Thông báo trạng thái */}
      {statusMessage && (
        <div
          className={`px-4 sm:px-6 py-2.5 text-xs flex items-center justify-between border-b transition-all ${
            statusMessage.type === 'error'
              ? 'bg-red-950/80 text-red-200 border-red-800'
              : 'bg-emerald-950/80 text-emerald-200 border-emerald-800'
          }`}
        >
          <div className="flex items-center space-x-2 min-w-0 pr-2">
            {statusMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            )}
            <span className="truncate">{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-[11px] underline opacity-80 hover:opacity-100 shrink-0 p-1"
          >
            Đóng
          </button>
        </div>
      )}

      {/* 2. Main Content Grid: Tự động xếp dọc trên Mobile, chia đôi 2 cột trên Desktop */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#2e2e2e] px-4 pt-4 pb-20 sm:px-6 sm:pt-6 sm:pb-16 lg:px-8 lg:pt-8 lg:pb-16 gap-y-6 md:gap-y-0">
        
        {/* === Cột 1: Input (Ở trên trên mobile, bên trái trên desktop) === */}
        <section className="flex flex-col md:pr-8 pb-6 md:pb-0">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Input</h2>

          {/* Nút Upload image - Vùng bấm rộng rãi cho ngón tay */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-[#353535] hover:bg-[#3f3f3f] active:scale-[0.99] border border-[#555555] text-white py-3 sm:py-3.5 px-4 rounded flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-sm group touch-manipulation"
          >
            <FileUp className="w-5 h-5 text-slate-200 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium tracking-wide">Upload image</span>
          </button>

          {/* Dòng biểu tượng thao tác: Vùng chạm chuẩn Mobile (40x40px) */}
          <div className="flex items-center justify-end space-x-2 sm:space-x-3 mt-2 sm:mt-3 mb-3 pr-1">
            <button
              type="button"
              onClick={() => setCropTarget('input')}
              disabled={!inputImage || isProcessing}
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white hover:text-amber-300 active:bg-[#2a2a2a] disabled:opacity-30 disabled:hover:text-white transition-all cursor-pointer touch-manipulation"
              title="Cắt ảnh đầu vào (Crop)"
              aria-label="Cắt ảnh đầu vào"
            >
              <Crop className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={!inputImage}
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white hover:text-red-400 active:bg-red-950/40 disabled:opacity-30 disabled:hover:text-white transition-all cursor-pointer touch-manipulation"
              title="Xóa ảnh"
              aria-label="Xóa ảnh"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleProcess}
              disabled={!inputImage || isProcessing}
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white hover:text-indigo-400 active:bg-indigo-950/40 disabled:opacity-30 disabled:hover:text-white transition-all cursor-pointer touch-manipulation"
              title="Bắt đầu tách nền"
              aria-label="Bắt đầu tách nền"
            >
              {isProcessing ? (
                <div className="flex items-center space-x-1" aria-label="Đang xử lý">
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-white animate-dot-wave-sm"
                    style={{ animationDelay: '0ms' }}
                  />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-white animate-dot-wave-sm"
                    style={{ animationDelay: '150ms' }}
                  />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-white animate-dot-wave-sm"
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Vùng hiển thị ảnh Input - Chiều cao linh hoạt theo thiết bị */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFile(e.dataTransfer.files[0]);
              }
            }}
            className="flex-1 min-h-[260px] sm:min-h-[380px] md:min-h-[460px] max-h-[580px] rounded flex items-center justify-center relative overflow-hidden bg-[#0a0a0a]"
          >
            {inputImage ? (
              <img
                src={inputImage}
                alt="Input preview"
                className="max-h-[540px] w-auto max-w-full object-contain rounded"
              />
            ) : (
              <div className="text-center text-[#555555] text-xs px-4 py-8 space-y-1.5">
                <p className="font-medium text-slate-400">Chưa có ảnh nào được chọn</p>
                <p className="text-[11px] opacity-70 hidden sm:block">
                  Kéo thả ảnh vào đây hoặc nhấn Ctrl + V để dán
                </p>
                <p className="text-[11px] opacity-70 sm:hidden">
                  Chạm nút "Upload image" để chọn ảnh từ máy hoặc chụp mới
                </p>
              </div>
            )}
          </div>
        </section>

        {/* === Cột 2: Output (Ở dưới trên mobile, bên phải trên desktop) === */}
        <section ref={outputSectionRef} className="flex flex-col md:pl-8 pt-6 md:pt-0">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Output</h2>

          {/* Khung viền lớn hiển thị Output */}
          <div className="flex-1 min-h-[260px] sm:min-h-[380px] md:min-h-[460px] max-h-[580px] border border-[#444444] bg-[#000000] rounded flex items-center justify-center relative overflow-hidden">
            {isProcessing && (
              <div className="flex items-center justify-center p-6" role="status" aria-label="Đang tách nền">
                <div className="flex items-center space-x-2.5">
                  <span
                    className="w-3 h-3 rounded-full bg-white animate-dot-wave"
                    style={{ animationDelay: '0ms' }}
                  />
                  <span
                    className="w-3 h-3 rounded-full bg-white animate-dot-wave"
                    style={{ animationDelay: '160ms' }}
                  />
                  <span
                    className="w-3 h-3 rounded-full bg-white animate-dot-wave"
                    style={{ animationDelay: '320ms' }}
                  />
                </div>
              </div>
            )}

            {!isProcessing && outputImage && (
              <div className="w-full h-full flex items-center justify-center bg-checkerboard p-2">
                <img
                  src={outputImage}
                  alt="Output result"
                  className="max-h-[540px] w-auto max-w-full object-contain"
                />
              </div>
            )}
          </div>

          {/* Cụm nút cắt & xuất file góc dưới bên phải - Chạm bấm mượt mà */}
          <div className="flex items-center justify-end space-x-2 mt-4 pt-1">
            <button
              type="button"
              onClick={() => setCropTarget('output')}
              disabled={!outputImage || isProcessing}
              className="bg-[#2c2c2c] hover:bg-[#3a3a3a] active:scale-95 border border-[#4a4a4a] text-white px-3.5 py-2 rounded text-sm font-medium flex items-center space-x-1.5 transition-all disabled:opacity-30 disabled:hover:bg-[#2c2c2c] cursor-pointer touch-manipulation mr-1"
              title="Cắt ảnh kết quả (Crop Output)"
            >
              <Crop className="w-4 h-4" />
              <span>Crop</span>
            </button>
            <div className="p-2 text-white opacity-80" title="Tải xuống">
              <FileDown className="w-5 h-5" />
            </div>
            <button
              type="button"
              onClick={handleDownloadPng}
              disabled={!outputImage}
              className="bg-[#2c2c2c] hover:bg-[#3a3a3a] active:scale-95 border border-[#4a4a4a] text-white px-5 py-2 rounded text-sm font-medium transition-all disabled:opacity-30 disabled:hover:bg-[#2c2c2c] cursor-pointer touch-manipulation"
            >
              Png
            </button>
            <button
              type="button"
              onClick={handleDownloadJpg}
              disabled={!outputImage}
              className="bg-[#2c2c2c] hover:bg-[#3a3a3a] active:scale-95 border border-[#4a4a4a] text-white px-5 py-2 rounded text-sm font-medium transition-all disabled:opacity-30 disabled:hover:bg-[#2c2c2c] cursor-pointer touch-manipulation"
            >
              jpg
            </button>
          </div>
        </section>
      </main>

      {/* Modal cắt ảnh kiểu Photoshop cho cả Input và Output */}
      <ImageCropModal
        isOpen={cropTarget !== null}
        imageUrl={cropTarget === 'input' ? inputImage : outputImage}
        targetLabel={cropTarget === 'input' ? 'Input' : 'Output'}
        showAutoTrim={cropTarget === 'output'}
        onClose={() => setCropTarget(null)}
        onApply={(croppedUrl) => {
          if (cropTarget === 'input') {
            setInputImage(croppedUrl);
            setOutputImage(null);
          } else if (cropTarget === 'output') {
            setOutputImage(croppedUrl);
          }
        }}
      />

      {/* Modal cấu hình DeepInfra API */}
      <ApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        apiKey={apiKey}
        onSaveApiKey={handleSaveApiKey}
        useProxy={useProxy}
        onToggleProxy={handleToggleProxy}
      />
    </div>
  );
};
