import React, { useState } from 'react';
import { KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, ExternalLink, X, Shield } from 'lucide-react';
import { testDeepInfraConnection } from '../services/deepinfra';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveApiKey: (key: string) => void;
  useProxy: boolean;
  onToggleProxy: (useProxy: boolean) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onSaveApiKey,
  useProxy,
  onToggleProxy,
}) => {
  const [inputKey, setInputKey] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleTest = async () => {
    if (!inputKey.trim()) {
      setTestResult({ success: false, message: 'Vui lòng nhập API Key để kiểm tra.' });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testDeepInfraConnection(inputKey, useProxy);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Lỗi không xác định' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    onSaveApiKey(inputKey.trim());
    onClose();
  };

  const handleClear = () => {
    setInputKey('');
    onSaveApiKey('');
    setTestResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1c1c1c] border border-[#383838] rounded-xl w-full max-w-lg shadow-2xl overflow-hidden text-white max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-b border-[#2e2e2e] flex items-center justify-between bg-[#242424] shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded bg-[#333333] text-white">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">Cấu hình DeepInfra API</h3>
              <p className="text-[11px] sm:text-xs text-slate-400">Bria RMBG 2.0 (Bria/remove_background)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 -mr-1 rounded hover:bg-[#333333] transition-colors touch-manipulation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              DeepInfra API Token
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={inputKey}
                onChange={(e) => {
                  setInputKey(e.target.value);
                  setTestResult(null);
                }}
                placeholder="Nhập khóa API (ví dụ: a1b2c3d4...)"
                className="w-full bg-[#121212] border border-[#3a3a3a] rounded px-4 py-2.5 pr-20 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-slate-300 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs flex items-center space-x-1"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Test Status Alert */}
          {testResult && (
            <div
              className={`p-3 rounded border flex items-start space-x-2.5 text-xs ${
                testResult.success
                  ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                  : 'bg-red-950/40 border-red-800 text-red-300'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              )}
              <div className="leading-relaxed">{testResult.message}</div>
            </div>
          )}

          {/* Proxy switch */}
          <div className="flex items-center justify-between p-3 rounded bg-[#141414] border border-[#2e2e2e]">
            <div>
              <span className="text-xs font-medium text-slate-200 block">Sử dụng Local Proxy</span>
              <span className="text-[11px] text-slate-400">
                Chuyển tiếp yêu cầu qua Vite proxy để tránh chặn mạng cục bộ
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={useProxy}
                onChange={(e) => onToggleProxy(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Security & Getting Key note */}
          <div className="bg-[#141414] rounded p-3 border border-[#2e2e2e] space-y-2">
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <Shield className="w-4 h-4 text-slate-300" />
              <span>Khóa API được lưu cục bộ trên trình duyệt (LocalStorage).</span>
            </div>
            <div className="text-xs text-slate-400 flex items-center justify-between pt-1 border-t border-[#2e2e2e]">
              <span>Chưa có khóa API?</span>
              <a
                href="https://deepinfra.com/dash/api_keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:underline inline-flex items-center space-x-1 font-medium"
              >
                <span>Lấy khóa tại DeepInfra</span>
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 bg-[#141414] border-t border-[#2e2e2e] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-red-400 hover:text-red-300 font-medium px-3 py-2 rounded hover:bg-red-950/20 transition-colors"
          >
            Xóa khóa
          </button>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              disabled={testing || !inputKey.trim()}
              onClick={handleTest}
              className="text-xs font-semibold px-3 py-2 rounded text-slate-200 bg-[#2e2e2e] hover:bg-[#3e3e3e] border border-[#444] disabled:opacity-50 transition-colors inline-flex items-center space-x-1.5"
            >
              {testing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang test...</span>
                </>
              ) : (
                <span>Kiểm tra kết nối</span>
              )}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="text-xs font-semibold px-4 py-2 rounded bg-white text-black hover:bg-slate-200 transition-all"
            >
              Lưu cấu hình
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
