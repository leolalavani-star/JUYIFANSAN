import React, { useState, useMemo } from 'react';
import { MistakeItem, SubjectType } from '../types';
import { MistakeCard } from './MistakeCard';
import { EditMistakeModal } from './EditMistakeModal';
import {
  CheckSquare,
  Square,
  Printer,
  Search,
  Filter,
  Sparkles,
  BookOpen,
  RotateCcw,
  PlusCircle,
  Layers,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface MistakeBookPageProps {
  mistakes: MistakeItem[];
  onUpdateMistake: (id: string, partial: Partial<MistakeItem>) => void;
  onDeleteMistake: (id: string) => void;
  onToggleMastered: (id: string) => void;
  onResetPresets: () => void;
  onOpenPrintPreview: (selected: MistakeItem[]) => void;
  onNavigateToOcr: () => void;
}

export const MistakeBookPage: React.FC<MistakeBookPageProps> = ({
  mistakes,
  onUpdateMistake,
  onDeleteMistake,
  onToggleMastered,
  onResetPresets,
  onOpenPrintPreview,
  onNavigateToOcr,
}) => {
  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filter state
  const [selectedSubject, setSelectedSubject] = useState<string>('全部');
  const [masteryFilter, setMasteryFilter] = useState<'all' | 'unmastered' | 'mastered'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Editing state
  const [editingItem, setEditingItem] = useState<MistakeItem | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  // Subject options with counts
  const subjects = useMemo(() => {
    const list: { name: string; count: number }[] = [{ name: '全部', count: mistakes.length }];
    const map = new Map<string, number>();

    mistakes.forEach((m) => {
      map.set(m.subject, (map.get(m.subject) || 0) + 1);
    });

    map.forEach((count, name) => {
      list.push({ name, count });
    });

    return list;
  }, [mistakes]);

  // Filtered mistakes
  const filteredMistakes = useMemo(() => {
    return mistakes.filter((item) => {
      // Subject filter
      if (selectedSubject !== '全部' && item.subject !== selectedSubject) {
        return false;
      }
      // Mastery filter
      if (masteryFilter === 'unmastered' && item.mastered) return false;
      if (masteryFilter === 'mastered' && !item.mastered) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inQuestion = item.originalQuestion.toLowerCase().includes(q);
        const inKnowledge = item.knowledgePoint.toLowerCase().includes(q);
        const inSubject = item.subject.toLowerCase().includes(q);
        const inNotes = (item.userNotes || '').toLowerCase().includes(q);
        const inError = (item.errorAnalysis || '').toLowerCase().includes(q);
        if (!inQuestion && !inKnowledge && !inSubject && !inNotes && !inError) {
          return false;
        }
      }

      return true;
    });
  }, [mistakes, selectedSubject, masteryFilter, searchQuery]);

  // Selection helpers
  const isAllSelected =
    filteredMistakes.length > 0 &&
    filteredMistakes.every((item) => selectedIds.has(item.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      const next = new Set(selectedIds);
      filteredMistakes.forEach((item) => next.delete(item.id));
      setSelectedIds(next);
    } else {
      const next = new Set(selectedIds);
      filteredMistakes.forEach((item) => next.add(item.id));
      setSelectedIds(next);
    }
  };

  const handleToggleSingleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  // Selected items array
  const selectedItems = useMemo(() => {
    return mistakes.filter((item) => selectedIds.has(item.id));
  }, [mistakes, selectedIds]);

  // Total variants in selected items
  const selectedVariantsCount = useMemo(() => {
    return selectedItems.reduce((acc, cur) => acc + (cur.variants?.length || 0), 0);
  }, [selectedItems]);

  // Regenerate variants for an existing mistake in the notebook
  const handleRegenerateItemVariants = async (item: MistakeItem) => {
    setRegeneratingId(item.id);
    try {
      const res = await fetch('/api/generate-variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalQuestion: item.originalQuestion,
          subject: item.subject,
          knowledgePoint: item.knowledgePoint,
          errorAnalysis: item.errorAnalysis,
          count: 3,
          difficultyLevel: '梯度进阶',
        }),
      });

      const data = await res.json();
      if (res.ok && data.variants) {
        onUpdateMistake(item.id, {
          variants: data.variants.map((v: any, idx: number) => ({
            id: `v-regen-${Date.now()}-${idx}`,
            tag: v.tag || `变式 ${idx + 1}`,
            question: v.question,
            answer: v.answer,
            analysis: v.analysis,
            errorTrap: v.errorTrap || '',
            errorKeywords: v.errorKeywords || [],
          })),
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRegeneratingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24">
      {/* Top Banner & Multi-select Action Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        {/* Title row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-800">
                错题本与智能打印中心
              </h1>
              <p className="text-xs text-slate-400">
                共收录 {mistakes.length} 道错题，支持多选按需生成练习试卷或 PDF
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateToOcr}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              拍照录入新题
            </button>
            <button
              onClick={onResetPresets}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl text-xs transition-colors"
              title="重置恢复默认精选考题数据"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Multi-Select & Print Control Bar (Prompt requirement) */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70">
          {/* Select all & Count Indicator */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-indigo-600 transition-colors"
            >
              {isAllSelected ? (
                <CheckSquare className="w-4 h-4 text-indigo-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>{isAllSelected ? '取消全选' : '全选当前列表'}</span>
            </button>

            <div className="text-xs text-slate-500 pl-3 border-l border-slate-200">
              已选中{' '}
              <span className="font-bold text-indigo-600">{selectedIds.size}</span> 道错题
              {selectedVariantsCount > 0 && (
                <span className="text-slate-400">
                  （含 <span className="font-medium text-slate-700">{selectedVariantsCount}</span> 道变式题）
                </span>
              )}
            </div>
          </div>

          {/* Print Button (Highlights when items are selected) */}
          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="text-xs text-slate-400 hover:text-slate-600 hover:underline mr-1"
              >
                清空选择
              </button>
            )}

            <button
              type="button"
              disabled={selectedIds.size === 0}
              onClick={() => onOpenPrintPreview(selectedItems)}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>生成试卷并打印 ({selectedIds.size})</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="space-y-3 pt-1">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索题目、考点关键词、失分原因或个人备忘..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Subject Pills & Mastery Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            {/* Subject Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
              {subjects.map((sub) => (
                <button
                  key={sub.name}
                  onClick={() => setSelectedSubject(sub.name)}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors shrink-0 ${
                    selectedSubject === sub.name
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {sub.name} {sub.count > 0 && <span className="opacity-75">({sub.count})</span>}
                </button>
              ))}
            </div>

            {/* Mastery Tabs */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs font-medium text-slate-600">
              <button
                onClick={() => setMasteryFilter('all')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  masteryFilter === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'hover:text-slate-800'
                }`}
              >
                全部
              </button>
              <button
                onClick={() => setMasteryFilter('unmastered')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  masteryFilter === 'unmastered'
                    ? 'bg-white text-amber-700 shadow-xs'
                    : 'hover:text-slate-800'
                }`}
              >
                待攻克
              </button>
              <button
                onClick={() => setMasteryFilter('mastered')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  masteryFilter === 'mastered'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'hover:text-slate-800'
                }`}
              >
                已掌握
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cards List */}
      <div className="space-y-4">
        {filteredMistakes.length > 0 ? (
          filteredMistakes.map((item) => (
            <MistakeCard
              key={item.id}
              item={item}
              isSelected={selectedIds.has(item.id)}
              onToggleSelect={handleToggleSingleSelect}
              onToggleMastered={onToggleMastered}
              onPrintSingle={(target) => onOpenPrintPreview([target])}
              onEdit={(target) => setEditingItem(target)}
              onDelete={onDeleteMistake}
              onRegenerateVariants={handleRegenerateItemVariants}
              isRegenerating={regeneratingId === item.id}
            />
          ))
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Layers className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">未找到符合条件的错题</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                可以尝试清空搜索词，或拍照录入新的错题进行举一反三变式训练
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={onNavigateToOcr}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
              >
                拍照录入错题
              </button>
              <button
                onClick={onResetPresets}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                恢复示例题库
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <EditMistakeModal
          mistake={editingItem}
          isOpen={true}
          onClose={() => setEditingItem(null)}
          onSave={(updated) => onUpdateMistake(updated.id, updated)}
        />
      )}
    </div>
  );
};
