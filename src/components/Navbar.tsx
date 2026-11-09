import React from 'react';
import { Camera, BookOpen, Printer, Sparkles } from 'lucide-react';

interface NavbarProps {
  activeTab: 'ocr' | 'notebook';
  onTabChange: (tab: 'ocr' | 'notebook') => void;
  mistakeCount: number;
  onOpenQuickPrint: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  mistakeCount,
  onOpenQuickPrint,
}) => {
  return (
    <>
      {/* Top Header */}
      <header className="no-print sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 tracking-tight text-base sm:text-lg">
                  错题举一反三打印机
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 hidden sm:inline-block">
                  全科智学
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                拍照识题 · 考点诊断 · 易错变式生成 · A4 PDF 打印
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/60">
            <button
              onClick={() => onTabChange('ocr')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'ocr'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Camera className="w-4 h-4" />
              错题识别与变式
            </button>

            <button
              onClick={() => onTabChange('notebook')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'notebook'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              错题本
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-700 text-[10px]">
                {mistakeCount}
              </span>
            </button>
          </div>

          {/* Quick Print Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenQuickPrint}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
              title="打开试卷排版打印预览"
            >
              <Printer className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline">试卷打印中心</span>
              <span className="sm:hidden">打印预览</span>
            </button>
          </div>
        </div>
      </header>

      {/* Floating Bottom Navigation Bar (Two-page layout as requested) */}
      <nav className="no-print fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-lg border-t border-slate-200/90 py-2 px-6 shadow-lg sm:hidden">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {/* Tab 1: OCR */}
          <button
            onClick={() => onTabChange('ocr')}
            className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-colors ${
              activeTab === 'ocr' ? 'text-indigo-600 font-bold' : 'text-slate-500'
            }`}
          >
            <Camera className="w-5 h-5" />
            <span className="text-[11px]">错题识别</span>
          </button>

          {/* Tab 2: Notebook */}
          <button
            onClick={() => onTabChange('notebook')}
            className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl relative transition-colors ${
              activeTab === 'notebook' ? 'text-indigo-600 font-bold' : 'text-slate-500'
            }`}
          >
            <div className="relative">
              <BookOpen className="w-5 h-5" />
              {mistakeCount > 0 && (
                <span className="absolute -top-1 -right-2.5 px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-indigo-600 text-white">
                  {mistakeCount}
                </span>
              )}
            </div>
            <span className="text-[11px]">错题本</span>
          </button>

          {/* Quick Print on Mobile */}
          <button
            onClick={onOpenQuickPrint}
            className="flex flex-col items-center gap-1 py-1 px-4 rounded-xl text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <Printer className="w-5 h-5" />
            <span className="text-[11px]">打印预览</span>
          </button>
        </div>
      </nav>
    </>
  );
};
