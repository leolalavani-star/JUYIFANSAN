import React, { useState } from 'react';
import { MistakeItem, PrintConfig } from '../types';
import { MathText } from '../utils/mathRenderer';
import {
  X,
  Printer,
  FileText,
  Settings2,
  Check,
  Copy,
  AlertCircle,
  HelpCircle,
  BookOpen,
} from 'lucide-react';

interface PrintPreviewModalProps {
  selectedMistakes: MistakeItem[];
  isOpen: boolean;
  onClose: () => void;
  initialConfig?: Partial<PrintConfig>;
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  selectedMistakes,
  isOpen,
  onClose,
  initialConfig,
}) => {
  const [config, setConfig] = useState<PrintConfig>({
    paperTitle: initialConfig?.paperTitle || '错题举一反三 · 变式专项巩固练习卷',
    paperSubtitle: initialConfig?.paperSubtitle || '核心考点深化诊断与易错陷阱突破',
    studentName: initialConfig?.studentName || '',
    studentClass: initialConfig?.studentClass || '',
    dateStr: initialConfig?.dateStr || new Date().toISOString().split('T')[0],
    showOriginalQuestion: initialConfig?.showOriginalQuestion ?? true,
    showVariants: initialConfig?.showVariants ?? true,
    showAnswerAppendix: initialConfig?.showAnswerAppendix ?? true,
    showErrorTrapInAnswer: initialConfig?.showErrorTrapInAnswer ?? true,
    workingSpace: initialConfig?.workingSpace || 'normal',
    fontSize: initialConfig?.fontSize || 'base',
  });

  const [copiedSuccess, setCopiedSuccess] = useState(false);

  if (!isOpen) return null;

  // Calculate total variant count
  const totalVariants = selectedMistakes.reduce(
    (sum, m) => sum + (m.variants?.length || 0),
    0
  );

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    let text = `${config.paperTitle}\n${config.paperSubtitle}\n姓名：_______ 班级：_______ 日期：${config.dateStr}\n\n`;

    let qIndex = 1;
    selectedMistakes.forEach((item) => {
      if (config.showOriginalQuestion) {
        text += `【第 ${qIndex} 题·原题】[${item.subject}·${item.knowledgePoint}]\n${item.originalQuestion}\n\n`;
        qIndex++;
      }
      if (config.showVariants && item.variants) {
        item.variants.forEach((v) => {
          text += `【第 ${qIndex} 题·${v.tag || '变式题'}】\n${v.question}\n\n`;
          qIndex++;
        });
      }
    });

    if (config.showAnswerAppendix) {
      text += `\n================ 参考答案与易错点剖析 ================\n\n`;
      let aIndex = 1;
      selectedMistakes.forEach((item) => {
        if (config.showOriginalQuestion) {
          text += `【第 ${aIndex} 题·原题答案】\n答案：${item.originalAnswer || '见解析'}\n解析：${item.originalAnalysis || '略'}\n易错点：${item.errorAnalysis}\n\n`;
          aIndex++;
        }
        if (config.showVariants && item.variants) {
          item.variants.forEach((v) => {
            text += `【第 ${aIndex} 题·${v.tag}答案】\n答案：${v.answer}\n解析：${v.analysis}\n易错陷阱：${v.errorTrap}\n\n`;
            aIndex++;
          });
        }
      });
    }

    navigator.clipboard.writeText(text);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  const getWorkingSpaceHeight = () => {
    switch (config.workingSpace) {
      case 'none':
        return 'hidden';
      case 'compact':
        return 'h-16';
      case 'normal':
        return 'h-28';
      case 'large':
        return 'h-44';
      default:
        return 'h-28';
    }
  };

  const getFontSizeClass = () => {
    switch (config.fontSize) {
      case 'sm':
        return 'text-xs leading-relaxed';
      case 'lg':
        return 'text-base leading-loose';
      case 'base':
      default:
        return 'text-sm leading-relaxed';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-2 md:p-6 overflow-y-auto print:p-0 print:bg-white">
      {/* Container */}
      <div className="bg-slate-100 rounded-3xl shadow-2xl w-full max-w-6xl max-h-[96vh] flex flex-col overflow-hidden border border-slate-300/60 print:border-none print:shadow-none print:max-h-none print:w-full print:bg-white print:rounded-none">
        {/* Top Modal Header (Hidden during print) */}
        <div className="no-print flex items-center justify-between px-6 py-3.5 bg-white border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                试卷打印与 PDF 导出预览
              </h2>
              <p className="text-xs text-slate-500">
                已选中 {selectedMistakes.length} 道错题（包含 {totalVariants} 道举一反三变式题）
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              {copiedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  已复制文本
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  复制试卷文本
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
            >
              <Printer className="w-4 h-4" />
              打印 / 另存为 PDF
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Content: Left Settings + Right A4 Paper */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Left Settings Sidebar (Hidden during print) */}
          <div className="no-print w-full md:w-80 bg-white border-r border-slate-200 p-5 overflow-y-auto space-y-5 text-xs text-slate-700 shrink-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
              <Settings2 className="w-4 h-4 text-indigo-600" />
              试卷排版与打印参数
            </div>

            {/* Paper Title & Subtitle */}
            <div className="space-y-3">
              <div>
                <label className="block font-medium mb-1 text-slate-600">试卷大标题</label>
                <input
                  type="text"
                  value={config.paperTitle}
                  onChange={(e) => setConfig({ ...config, paperTitle: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium mb-1 text-slate-600">副标题 / 说明</label>
                <input
                  type="text"
                  value={config.paperSubtitle}
                  onChange={(e) => setConfig({ ...config, paperSubtitle: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Student Info inputs */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-medium mb-1 text-slate-600">学生姓名</label>
                <input
                  type="text"
                  value={config.studentName}
                  onChange={(e) => setConfig({ ...config, studentName: e.target.value })}
                  placeholder="打印时留空"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block font-medium mb-1 text-slate-600">班级/考号</label>
                <input
                  type="text"
                  value={config.studentClass}
                  onChange={(e) => setConfig({ ...config, studentClass: e.target.value })}
                  placeholder="打印时留空"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Content Inclusions */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <span className="block font-semibold text-slate-800">试卷内容选编</span>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showOriginalQuestion}
                  onChange={(e) => setConfig({ ...config, showOriginalQuestion: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>包含原题（查看题目原始面貌）</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showVariants}
                  onChange={(e) => setConfig({ ...config, showVariants: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>包含举一反三变式题</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showAnswerAppendix}
                  onChange={(e) => setConfig({ ...config, showAnswerAppendix: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>末尾附录：答案与详细解析（独立分页）</span>
              </label>

              {config.showAnswerAppendix && (
                <label className="flex items-center gap-2 cursor-pointer pl-5 text-amber-800">
                  <input
                    type="checkbox"
                    checked={config.showErrorTrapInAnswer}
                    onChange={(e) =>
                      setConfig({ ...config, showErrorTrapInAnswer: e.target.checked })
                    }
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>解析中突出高亮【易错陷阱】</span>
                </label>
              )}
            </div>

            {/* Working Space */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="block font-semibold text-slate-800">作答草稿留白空间</span>
              <div className="grid grid-cols-4 gap-1">
                {[
                  { key: 'none', label: '无留白' },
                  { key: 'compact', label: '紧凑' },
                  { key: 'normal', label: '适中' },
                  { key: 'large', label: '宽大' },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setConfig({ ...config, workingSpace: item.key as any })}
                    className={`py-1.5 px-1 text-center rounded-lg border font-medium transition-colors ${
                      config.workingSpace === item.key
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="block font-semibold text-slate-800">字号大小</span>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { key: 'sm', label: '小 (紧凑)' },
                  { key: 'base', label: '中 (标准)' },
                  { key: 'lg', label: '大 (清晰)' },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setConfig({ ...config, fontSize: item.key as any })}
                    className={`py-1.5 px-1 text-center rounded-lg border font-medium transition-colors ${
                      config.fontSize === item.key
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Print tips */}
            <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-slate-600 text-xs space-y-1">
              <div className="font-semibold text-indigo-900 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" />
                打印 / 导出 PDF 提示
              </div>
              <p>在弹出的系统打印窗口中，将【目标打印机】选择为【另存为 PDF】，即可无损下载矢量试卷电子文件。</p>
            </div>
          </div>

          {/* Right A4 Paper Preview Container */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-200/80 print:p-0 print:bg-white print:overflow-visible">
            {/* The actual printable sheet */}
            <div
              id="printable-content"
              className={`a4-paper-sheet bg-white text-slate-900 shadow-md ${getFontSizeClass()} print:shadow-none print:w-full`}
            >
              {/* Paper Header */}
              <div className="text-center pb-4 border-b-2 border-slate-900 mb-6 print:border-black">
                <h1 className="text-xl md:text-2xl font-bold tracking-wide text-slate-900 print:text-black">
                  {config.paperTitle}
                </h1>
                {config.paperSubtitle && (
                  <p className="text-xs md:text-sm text-slate-600 mt-1 font-medium print:text-black">
                    {config.paperSubtitle}
                  </p>
                )}

                {/* Student Info Bar */}
                <div className="mt-4 flex flex-wrap justify-center items-center gap-4 text-xs font-serif text-slate-800 print:text-black">
                  <span>
                    姓名：
                    <span className="inline-block border-b border-slate-900 min-w-[70px] text-center font-sans">
                      {config.studentName || '　　　'}
                    </span>
                  </span>
                  <span>
                    班级：
                    <span className="inline-block border-b border-slate-900 min-w-[70px] text-center font-sans">
                      {config.studentClass || '　　　'}
                    </span>
                  </span>
                  <span>
                    日期：
                    <span className="inline-block border-b border-slate-900 min-w-[80px] text-center font-sans">
                      {config.dateStr}
                    </span>
                  </span>
                  <span>
                    得分：
                    <span className="inline-block border-b border-slate-900 min-w-[60px] text-center font-sans">
                      　　　
                    </span>
                  </span>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-6">
                {selectedMistakes.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">请选择至少一道错题进行打印</div>
                ) : (
                  (() => {
                    let questionNumber = 1;
                    return selectedMistakes.map((mistake, mIdx) => (
                      <div key={mistake.id} className="space-y-4">
                        {/* Section Header for this Knowledge Point if multiple */}
                        <div className="print-section-header flex items-center justify-between text-xs font-semibold text-slate-700 bg-slate-100/80 px-3 py-1.5 rounded-md border-l-4 border-slate-800 print:bg-slate-100 print:text-black print:border-black">
                          <span>
                            专题 {mIdx + 1}：{mistake.subject} · {mistake.knowledgePoint}
                          </span>
                          <span className="text-slate-500 print:text-black">
                            含 {1 + (mistake.variants?.length || 0)} 题
                          </span>
                        </div>

                        {/* 1. Original Question */}
                        {config.showOriginalQuestion && (
                          <div className="print-item border border-slate-200 rounded-lg p-4 bg-white print:border-slate-300">
                            <div className="font-bold text-slate-900 mb-2 flex items-center gap-2 print:text-black">
                              <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-mono print:bg-black">
                                {questionNumber++}
                              </span>
                              <span>【原题诊断】</span>
                            </div>
                            <div className="pl-8 text-slate-800 print:text-black">
                              <MathText content={mistake.originalQuestion} />
                            </div>

                            {/* Working space for student */}
                            {config.workingSpace !== 'none' && (
                              <div
                                className={`mt-3 pl-8 border border-dashed border-slate-300 rounded-md bg-slate-50/50 print:bg-transparent ${getWorkingSpaceHeight()} flex items-start p-2`}
                              >
                                <span className="text-[10px] text-slate-400 font-mono select-none">
                                  解题思考 / 作答草稿区域：
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 2. Variants */}
                        {config.showVariants &&
                          mistake.variants?.map((v, vIdx) => (
                            <div
                              key={v.id || vIdx}
                              className="print-item border border-slate-200 rounded-lg p-4 bg-white print:border-slate-300"
                            >
                              <div className="font-bold text-slate-900 mb-2 flex items-center justify-between print:text-black">
                                <div className="flex items-center gap-2">
                                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-mono print:bg-black">
                                    {questionNumber++}
                                  </span>
                                  <span>【举一反三·{v.tag || `变式题 ${vIdx + 1}`}】</span>
                                </div>
                                <span className="text-xs font-normal text-slate-500 italic print:text-black">
                                  变式训练
                                </span>
                              </div>

                              <div className="pl-8 text-slate-800 print:text-black">
                                <MathText content={v.question} />
                              </div>

                              {/* Working space for student */}
                              {config.workingSpace !== 'none' && (
                                <div
                                  className={`mt-3 pl-8 border border-dashed border-slate-300 rounded-md bg-slate-50/50 print:bg-transparent ${getWorkingSpaceHeight()} flex items-start p-2`}
                                >
                                  <span className="text-[10px] text-slate-400 font-mono select-none">
                                    解题思考 / 作答草稿区域：
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    ));
                  })()
                )}
              </div>

              {/* Appendix: Answer & Error Trap Analysis (Page Break for Printing) */}
              {config.showAnswerAppendix && selectedMistakes.length > 0 && (
                <div className="page-break-before mt-12 pt-6 border-t-2 border-slate-900 print:border-black">
                  <div className="text-center pb-4 mb-6">
                    <h2 className="text-lg md:text-xl font-bold tracking-wider text-slate-900 print:text-black">
                      《参考答案、解题步骤与易错陷阱剖析》
                    </h2>
                    <p className="text-xs text-slate-500 mt-1 print:text-black">
                      （做题完成后核对，请务必重点阅读【易错陷阱】强化思维免疫力）
                    </p>
                  </div>

                  <div className="space-y-6">
                    {(() => {
                      let ansNumber = 1;
                      return selectedMistakes.map((mistake, mIdx) => (
                        <div
                          key={`ans-${mistake.id}`}
                          className="print-item p-4 rounded-xl border border-slate-200 bg-slate-50/60 print:bg-white print:border-slate-300 space-y-4"
                        >
                          <div className="font-bold text-xs text-indigo-900 pb-1 border-b border-slate-200 flex justify-between print:text-black">
                            <span>
                              专题 {mIdx + 1}：{mistake.subject} · {mistake.knowledgePoint}
                            </span>
                          </div>

                          {/* Original Question Answer */}
                          {config.showOriginalQuestion && (
                            <div className="text-xs space-y-1.5 pl-2 border-l-2 border-indigo-400">
                              <div className="font-bold text-slate-900 flex items-center gap-1.5 print:text-black">
                                <span className="text-indigo-600 font-mono font-bold">
                                  第 {ansNumber++} 题（原题）
                                </span>
                                <span>答案：</span>
                                <MathText
                                  content={mistake.originalAnswer || '见解析'}
                                  className="inline-block font-semibold"
                                />
                              </div>

                              {mistake.originalAnalysis && (
                                <div className="text-slate-600 pl-4 print:text-black">
                                  <span className="font-semibold text-slate-700">步骤解析：</span>
                                  <MathText content={mistake.originalAnalysis} />
                                </div>
                              )}

                              {config.showErrorTrapInAnswer && mistake.errorAnalysis && (
                                <div className="mt-2 p-2 bg-amber-50 rounded border border-amber-200 text-amber-900 print:bg-slate-100 print:border-slate-400 print:text-black">
                                  <div className="font-bold text-amber-800 print:text-black">
                                    ⚠️ 失分陷阱剖析：
                                  </div>
                                  <MathText
                                    content={mistake.errorAnalysis}
                                    highlightKeywords={mistake.errorKeywords}
                                    className="mt-0.5 text-xs"
                                  />
                                </div>
                              )}
                            </div>
                          )}

                          {/* Variants Answers */}
                          {config.showVariants &&
                            mistake.variants?.map((v, vIdx) => (
                              <div
                                key={`ans-v-${v.id || vIdx}`}
                                className="text-xs space-y-1.5 pl-2 border-l-2 border-emerald-400 mt-3"
                              >
                                <div className="font-bold text-slate-900 flex items-center gap-1.5 print:text-black">
                                  <span className="text-emerald-700 font-mono font-bold">
                                    第 {ansNumber++} 题（{v.tag || `变式 ${vIdx + 1}`}）
                                  </span>
                                  <span>答案：</span>
                                  <MathText
                                    content={v.answer}
                                    className="inline-block font-semibold"
                                  />
                                </div>

                                {v.analysis && (
                                  <div className="text-slate-600 pl-4 print:text-black">
                                    <span className="font-semibold text-slate-700">步骤解析：</span>
                                    <MathText content={v.analysis} />
                                  </div>
                                )}

                                {config.showErrorTrapInAnswer && v.errorTrap && (
                                  <div className="mt-2 p-2 bg-rose-50 rounded border border-rose-200 text-rose-900 print:bg-slate-100 print:border-slate-400 print:text-black">
                                    <div className="font-bold text-rose-800 print:text-black">
                                      ⚠️ 变式避坑提醒：
                                    </div>
                                    <MathText
                                      content={v.errorTrap}
                                      highlightKeywords={v.errorKeywords}
                                      className="mt-0.5 text-xs"
                                    />
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      ));
                    })()
                  }
                  </div>
                </div>
              )}

              {/* End of paper */}
              <div className="text-center pt-8 text-[11px] text-slate-400 font-serif print:text-black">
                —— 全卷完 · 举一反三，触类旁通 ——
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
