import React, { useState } from 'react';
import { MistakeItem, SubjectType } from '../types';
import { X, Save, Sparkles, BookOpen } from 'lucide-react';

interface EditMistakeModalProps {
  mistake: MistakeItem;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: MistakeItem) => void;
}

const SUBJECT_OPTIONS: SubjectType[] = [
  '数学',
  '物理',
  '化学',
  '英语',
  '语文',
  '生物',
  '历史',
  '地理',
  '政治',
  '综合',
  '其他',
];

export const EditMistakeModal: React.FC<EditMistakeModalProps> = ({
  mistake,
  isOpen,
  onClose,
  onSave,
}) => {
  const [subject, setSubject] = useState<SubjectType>(mistake.subject);
  const [gradeLevel, setGradeLevel] = useState(mistake.gradeLevel || '');
  const [knowledgePoint, setKnowledgePoint] = useState(mistake.knowledgePoint);
  const [originalQuestion, setOriginalQuestion] = useState(mistake.originalQuestion);
  const [originalAnswer, setOriginalAnswer] = useState(mistake.originalAnswer || '');
  const [originalAnalysis, setOriginalAnalysis] = useState(mistake.originalAnalysis || '');
  const [errorAnalysis, setErrorAnalysis] = useState(mistake.errorAnalysis);
  const [keywordsStr, setKeywordsStr] = useState(mistake.errorKeywords.join('、'));
  const [userNotes, setUserNotes] = useState(mistake.userNotes || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedKeywords = keywordsStr
      .split(/[,，、\s]+/)
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    const updated: MistakeItem = {
      ...mistake,
      subject,
      gradeLevel,
      knowledgePoint: knowledgePoint.trim() || '未分类知识点',
      originalQuestion: originalQuestion.trim(),
      originalAnswer: originalAnswer.trim(),
      originalAnalysis: originalAnalysis.trim(),
      errorAnalysis: errorAnalysis.trim(),
      errorKeywords: updatedKeywords,
      userNotes: userNotes.trim(),
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-800">手动修正错题与知识点</h3>
              <p className="text-xs text-slate-500">修正 OCR 识别偏差或调整易错点诊断内容</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-sm">
          {/* Subject & Grade */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">所属学科</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value as SubjectType)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                {SUBJECT_OPTIONS.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">年级学段（选填）</label>
              <input
                type="text"
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                placeholder="例如：高中高一 / 初三中考"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Knowledge Point */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">核心知识点</label>
            <input
              type="text"
              required
              value={knowledgePoint}
              onChange={(e) => setKnowledgePoint(e.target.value)}
              placeholder="例如：二次函数闭区间最值分类讨论"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Original Question Content */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-medium text-slate-700">题目完整内容（支持 LaTeX 公式如 $x^2+1$）</label>
            </div>
            <textarea
              required
              rows={4}
              value={originalQuestion}
              onChange={(e) => setOriginalQuestion(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Original Answer & Solution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">原题参考答案</label>
              <input
                type="text"
                value={originalAnswer}
                onChange={(e) => setOriginalAnswer(e.target.value)}
                placeholder="例如：a = 2 或 选 C"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">易错关键词（顿号或逗号分隔）</label>
              <input
                type="text"
                value={keywordsStr}
                onChange={(e) => setKeywordsStr(e.target.value)}
                placeholder="例如：分类讨论、区间端点、忽略验证"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Error Analysis */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              易错点剖析与思维误区（用于解析高亮）
            </label>
            <textarea
              rows={3}
              value={errorAnalysis}
              onChange={(e) => setErrorAnalysis(e.target.value)}
              placeholder="剖析学生容易掉入的思维陷阱或漏掉的隐蔽条件..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* User Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">个人复习备忘（选填）</label>
            <input
              type="text"
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              placeholder="例如：周测第12题，第三次错了，考前必看"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Footer actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-medium transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium flex items-center gap-2 shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              保存修改
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
