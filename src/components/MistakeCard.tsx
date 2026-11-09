import React, { useState } from 'react';
import { MistakeItem, VariantItem } from '../types';
import { MathText } from '../utils/mathRenderer';
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Printer,
  Sparkles,
  Edit3,
  Trash2,
  AlertTriangle,
  Lightbulb,
  Check,
  BookmarkCheck,
  Clock,
  Layers,
} from 'lucide-react';

interface MistakeCardProps {
  item: MistakeItem;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onToggleMastered: (id: string) => void;
  onPrintSingle: (item: MistakeItem) => void;
  onEdit: (item: MistakeItem) => void;
  onDelete: (id: string) => void;
  onRegenerateVariants: (item: MistakeItem) => void;
  isRegenerating?: boolean;
}

const SUBJECT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  数学: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  物理: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  化学: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  英语: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  语文: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  生物: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  历史: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  地理: { bg: 'bg-lime-50', text: 'text-lime-700', border: 'border-lime-200' },
  政治: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  综合: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  其他: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
};

export const MistakeCard: React.FC<MistakeCardProps> = ({
  item,
  isSelected,
  onToggleSelect,
  onToggleMastered,
  onPrintSingle,
  onEdit,
  onDelete,
  onRegenerateVariants,
  isRegenerating = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeVariantTab, setActiveVariantTab] = useState(0);

  const subStyle = SUBJECT_COLORS[item.subject] || SUBJECT_COLORS['其他'];
  const formattedDate = new Date(item.createdAt).toLocaleDateString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
  });

  return (
    <div
      className={`group relative bg-white rounded-2xl border transition-all duration-200 ${
        isSelected
          ? 'border-indigo-400 ring-2 ring-indigo-500/15 shadow-md'
          : 'border-slate-200/80 hover:border-slate-300 hover:shadow-sm'
      }`}
    >
      {/* Top Header Row */}
      <div className="p-5 pb-3 flex items-start justify-between gap-3">
        {/* Left: Checkbox & Badges */}
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => onToggleSelect(item.id)}
            className="mt-0.5 text-slate-400 hover:text-indigo-600 focus:outline-none transition-colors"
            title={isSelected ? '取消勾选' : '勾选此题用于打印'}
          >
            {isSelected ? (
              <CheckCircle2 className="w-5 h-5 text-indigo-600 fill-indigo-100" />
            ) : (
              <Circle className="w-5 h-5 hover:text-slate-600" />
            )}
          </button>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${subStyle.bg} ${subStyle.text} ${subStyle.border}`}
              >
                {item.subject}
              </span>

              {item.gradeLevel && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                  {item.gradeLevel}
                </span>
              )}

              <span className="text-xs font-medium text-slate-800 bg-slate-100/90 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                {item.knowledgePoint}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formattedDate}
              </span>
              {item.userNotes && (
                <span className="text-slate-500 italic max-w-xs truncate" title={item.userNotes}>
                  · 备忘: {item.userNotes}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Mastered status button & quick actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => onToggleMastered(item.id)}
            className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 transition-all ${
              item.mastered
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            title="点击切换攻克状态"
          >
            {item.mastered ? (
              <>
                <BookmarkCheck className="w-3.5 h-3.5 text-emerald-600" />
                已掌握
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                待攻克
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Question Body */}
      <div className="px-5 py-2">
        <div className="text-slate-800 text-sm font-normal">
          <MathText content={item.originalQuestion} />
        </div>

        {/* Error Trap Diagnostic Box (Highlight key trap keywords) */}
        {item.errorAnalysis && (
          <div className="mt-3.5 p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs">
            <div className="flex items-center gap-1.5 text-amber-800 font-semibold mb-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>失分陷阱剖析：</span>
            </div>
            <MathText
              content={item.errorAnalysis}
              highlightKeywords={item.errorKeywords}
              className="text-amber-900/90 text-xs"
            />
          </div>
        )}
      </div>

      {/* Variants & Details Drawer */}
      {isExpanded && (
        <div className="px-5 pt-3 pb-4 border-t border-slate-100 mt-3 bg-slate-50/60 rounded-b-2xl">
          {/* Original Question Answer Accordion */}
          {(item.originalAnswer || item.originalAnalysis) && (
            <div className="mb-4 p-3 bg-white rounded-xl border border-slate-200/80 text-xs space-y-1.5">
              <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-indigo-600" />
                原题答案与步骤解析
              </div>
              {item.originalAnswer && (
                <div className="font-medium text-indigo-700">
                  <span className="text-slate-500 font-normal">答案：</span>
                  <MathText content={item.originalAnswer} className="inline-block" />
                </div>
              )}
              {item.originalAnalysis && (
                <div className="text-slate-600">
                  <MathText content={item.originalAnalysis} />
                </div>
              )}
            </div>
          )}

          {/* Variants Tabs & Content */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-800">
                  举一反三变式题 ({item.variants?.length || 0})
                </span>
              </div>
              <button
                disabled={isRegenerating}
                onClick={() => onRegenerateVariants(item)}
                className="text-xs text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1 disabled:opacity-50"
              >
                <Sparkles className="w-3 h-3" />
                {isRegenerating ? '变式生成中...' : '重新生成变式'}
              </button>
            </div>

            {/* Variant Tabs */}
            {item.variants && item.variants.length > 0 ? (
              <div className="space-y-3">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {item.variants.map((v, idx) => (
                    <button
                      key={v.id || idx}
                      onClick={() => setActiveVariantTab(idx)}
                      className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors shrink-0 ${
                        activeVariantTab === idx
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {v.tag ? `${v.tag}` : `变式 ${idx + 1}`}
                    </button>
                  ))}
                </div>

                {/* Active Variant Card */}
                {item.variants[activeVariantTab] && (
                  <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                        {item.variants[activeVariantTab].tag || `变式题 ${activeVariantTab + 1}`}
                      </span>
                    </div>

                    <div className="text-sm text-slate-800">
                      <MathText content={item.variants[activeVariantTab].question} />
                    </div>

                    {/* Variant Error Trap */}
                    {item.variants[activeVariantTab].errorTrap && (
                      <div className="p-2.5 bg-rose-50/70 border border-rose-200 rounded-lg text-xs">
                        <div className="font-semibold text-rose-800 flex items-center gap-1 mb-1">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          该变式易错陷阱警示：
                        </div>
                        <MathText
                          content={item.variants[activeVariantTab].errorTrap}
                          highlightKeywords={item.variants[activeVariantTab].errorKeywords}
                          className="text-rose-900"
                        />
                      </div>
                    )}

                    {/* Variant Answer & Analysis */}
                    <div className="pt-2 border-t border-slate-100 text-xs space-y-1 text-slate-600">
                      <div className="font-medium text-slate-800">
                        <span className="text-indigo-600 font-semibold">答案：</span>
                        <MathText
                          content={item.variants[activeVariantTab].answer}
                          className="inline-block"
                        />
                      </div>
                      <div className="mt-1">
                        <span className="text-slate-500 font-medium">解析步骤：</span>
                        <MathText content={item.variants[activeVariantTab].analysis} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-400 py-3 text-center bg-white rounded-xl border border-dashed border-slate-200">
                暂无变式题，点击上方“重新生成变式”即可智能生成
              </div>
            )}
          </div>
        </div>
      )}

      {/* Card Footer Bar */}
      <div className="px-5 py-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50 rounded-b-2xl">
        {/* Toggle Expand */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium py-1 px-1.5 -ml-1.5 rounded-lg hover:bg-indigo-50/50 transition-colors"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              收起变式与答案 ({item.variants?.length || 0})
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              展开变式题与详细解析 ({item.variants?.length || 0})
            </>
          )}
        </button>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPrintSingle(item)}
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-200/60 rounded-lg transition-colors"
            title="生成单题试卷并打印"
          >
            <Printer className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(item)}
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-200/60 rounded-lg transition-colors"
            title="手动修改题干与知识点"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="从错题本移除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
