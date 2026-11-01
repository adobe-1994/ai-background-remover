import React from 'react';
import { KeyRound, Sparkles, Sun, Moon, ExternalLink, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  apiKey: string;
  onOpenApiKeyModal: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  apiKey,
  onOpenApiKeyModal,
  darkMode,
  onToggleDarkMode,
}) => {
  const hasKey = Boolean(apiKey.trim());

  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Model Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Tách Nền AI
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Bria RMBG 2.0
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Kết nối DeepInfra API • Nhanh & Chính xác
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          {/* DeepInfra Docs / Link */}
          <a
            href="https://deepinfra.com/Bria/remove_background"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-slate-800/60"
            title="Xem mô hình Bria RMBG trên DeepInfra"
          >
            <span>DeepInfra Model</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {/* API Key Status / Button */}
          <button
            onClick={onOpenApiKeyModal}
            className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-sm ${
              hasKey
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 animate-pulse'
            }`}
          >
            {hasKey ? (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>API Key: Đã lưu</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>Nhập API Key</span>
              </>
            )}
          </button>

          {/* Dark / Light toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-slate-800 transition-colors"
            title={darkMode ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
