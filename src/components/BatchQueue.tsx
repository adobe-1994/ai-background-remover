import React, { useState } from 'react';
import {
  Play,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileArchive,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { ImageItem } from '../types';
import { downloadFile, downloadAllAsZip } from '../utils/imageUtils';

interface BatchQueueProps {
  items: ImageItem[];
  activeItemId: string | null;
  onSelectItem: (id: string) => void;
  onRemoveItem: (id: string) => void;
  onProcessAll: () => void;
  onProcessItem: (id: string) => void;
  onClearAll: () => void;
  isProcessingAny: boolean;
}

export const BatchQueue: React.FC<BatchQueueProps> = ({
  items,
  activeItemId,
  onSelectItem,
  onRemoveItem,
  onProcessAll,
  onProcessItem,
  onClearAll,
  isProcessingAny,
}) => {
  const [zipping, setZipping] = useState(false);

  const completedCount = items.filter((i) => i.status === 'done').length;
  const pendingCount = items.filter((i) => i.status === 'idle').length;
  const totalCount = items.length;
  const progressPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleDownloadZip = async () => {
    setZipping(true);
    try {
      await downloadAllAsZip(items);
    } catch (err: any) {
      alert(err.message || 'Lỗi nén ZIP');
    } finally {
      setZipping(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="bg-slate-900/60 rounded-3xl border border-slate-800/80 p-5 space-y-4 shadow-2xl">
      {/* Header hàng đợi */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">
              Hàng đợi xử lý hàng loạt ({items.length} ảnh)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Đã hoàn thành: <strong className="text-emerald-400">{completedCount}</strong>/{totalCount} ảnh
          </p>
        </div>

        {/* Nút hành động chung */}
        <div className="flex items-center space-x-2">
          {completedCount > 0 && (
            <button
              type="button"
              disabled={zipping}
              onClick={handleDownloadZip}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors disabled:opacity-50"
            >
              {zipping ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileArchive className="w-3.5 h-3.5 text-indigo-400" />
              )}
              <span>Tải tất cả (.ZIP)</span>
            </button>
          )}

          {pendingCount > 0 && (
            <button
              type="button"
              disabled={isProcessingAny}
              onClick={onProcessAll}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {isProcessingAny ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Tách nền tất cả</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            disabled={isProcessingAny}
            onClick={onClearAll}
            className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Xóa danh sách"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Thanh tiến trình chung */}
      {totalCount > 1 && (
        <div className="space-y-1">
          <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Danh sách items */}
      <div className="max-h-[360px] overflow-y-auto space-y-2 pr-1">
        {items.map((item) => {
          const isActive = item.id === activeItemId;

          return (
            <div
              key={item.id}
              onClick={() => onSelectItem(item.id)}
              className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-950/40 border-indigo-500/80 ring-1 ring-indigo-500/50 shadow-md'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {/* Thumbnail & Tên */}
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-checkerboard shrink-0 border border-slate-700/60">
                  <img
                    src={item.resultUrl || item.originalUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                  {item.status === 'done' && (
                    <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                      <CheckCircle2 className="w-3 h-3" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-slate-200 truncate">
                    {item.name}
                  </div>
                  <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                    <span>{formatSize(item.size)}</span>
                    {item.runtimeMs && (
                      <>
                        <span>•</span>
                        <span className="text-slate-400 font-mono">
                          {item.runtimeMs}ms
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Trạng thái & Nút thao tác item */}
              <div className="flex items-center space-x-2 ml-3">
                {item.status === 'processing' && (
                  <span className="flex items-center space-x-1 text-xs text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-lg">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span className="text-[11px]">Đang tách</span>
                  </span>
                )}

                {item.status === 'done' && item.resultUrl && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const cleanName = item.name.replace(/\.[^/.]+$/, '');
                      downloadFile(item.resultUrl!, `${cleanName}-tach-nen.png`);
                    }}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                    title="Tải ảnh PNG"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                )}

                {item.status === 'idle' && (
                  <button
                    type="button"
                    disabled={isProcessingAny}
                    onClick={(e) => {
                      e.stopPropagation();
                      onProcessItem(item.id);
                    }}
                    className="p-1.5 text-indigo-400 hover:text-indigo-300 rounded-lg hover:bg-indigo-500/10 transition-colors"
                    title="Tách ảnh này"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                )}

                {item.status === 'error' && (
                  <span
                    className="text-rose-400 p-1"
                    title={item.error || 'Lỗi xử lý'}
                  >
                    <AlertCircle className="w-4 h-4" />
                  </span>
                )}

                <button
                  type="button"
                  disabled={item.status === 'processing'}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveItem(item.id);
                  }}
                  className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                  title="Xóa khỏi danh sách"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
