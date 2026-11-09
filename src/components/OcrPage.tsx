import React, { useState, useRef, useEffect } from 'react';
import { MistakeItem, SubjectType, VariantItem } from '../types';
import { MathText } from '../utils/mathRenderer';
import { EditMistakeModal } from './EditMistakeModal';
import {
  UploadCloud,
  Camera,
  Image as ImageIcon,
  Sparkles,
  RefreshCw,
  Plus,
  Edit3,
  BookmarkPlus,
  Printer,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileQuestion,
  HelpCircle,
  X,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface OcrPageProps {
  onSaveToNotebook: (item: MistakeItem) => void;
  onOpenPrintPreview: (item: MistakeItem) => void;
  onGoToNotebook: () => void;
}

const SUBJECT_LIST: SubjectType[] = [
  '数学',
  '物理',
  '化学',
  '英语',
  '语文',
  '生物',
  '历史',
  '地理',
  '政治',
  '其他',
];

// Preset demo images / problem text for quick testing
const QUICK_SAMPLES = [
  {
    title: '数学：导数极值与切线',
    subject: '数学' as SubjectType,
    previewText: '已知函数 $f(x) = \\ln x - ax^2$，若 $f(x)$ 在 $x=1$ 处取得极值，求实数 $a$ 的值，并讨论 $f(x)$ 的单调性。',
    knowledgePoint: '利用导数研究函数极值与单调性',
    errorAnalysis: '学生求出 $a=\\frac{1}{2}$ 后常常遗漏极值检验（导数为0只是必要条件，不是充分条件，需证明导数在两侧变号）。',
    errorKeywords: ['极值充分条件', '导数符号改变', '定义域x>0'],
  },
  {
    title: '物理：受力分析与临界摩擦',
    subject: '物理' as SubjectType,
    previewText: '物块A重 $20\\text{N}$，置于倾角为 $30^\\circ$ 的固定斜面上，物块与斜面间的最大静摩擦力为 $12\\text{N}$。若对物块施加一沿斜面向上的拉力 $F$，使物块保持静止，求拉力 $F$ 的取值范围。',
    knowledgePoint: '斜面物体的平衡与静摩擦力方向双向讨论',
    errorAnalysis: '学生容易默认静摩擦力方向总是向下或向上，忽略了静摩擦力是被动力，其大小在 $0\\sim f_{\\max}$ 之间可自适应调整，必须双向考虑滑上与滑下的临界状态。',
    errorKeywords: ['静摩擦力方向双向性', '临界受力分析', '被动力特点'],
  },
  {
    title: '英语：非谓语动词做状语',
    subject: '英语' as SubjectType,
    previewText: '_______ (hear) the bad news, tears came down her cheeks. (改错或语法填空)',
    knowledgePoint: '非谓语动词的逻辑主语一致性原则',
    errorAnalysis: '学生容易只看从句含义直接填 Hearing，忽略了分词短语的逻辑主语必须与句子主语（tears 眼泪）一致！眼泪不能“听”到消息，出现垂悬分词错误，应改为 When she heard the news... 或 Hearing the news, she wept.',
    errorKeywords: ['垂悬分词', '逻辑主语一致性', '主被动关系'],
  },
];

export const OcrPage: React.FC<OcrPageProps> = ({
  onSaveToNotebook,
  onOpenPrintPreview,
  onGoToNotebook,
}) => {
  // Upload and Image State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('自动识别');
  const [customNotes, setCustomNotes] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Recognition / Generation State
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active Mistake Item Result
  const [currentResult, setCurrentResult] = useState<MistakeItem | null>(null);

  // Generation Controls
  const [isRegeneratingVariants, setIsRegeneratingVariants] = useState(false);
  const [difficultyPreference, setDifficultyPreference] = useState('梯度进阶');
  const [isOriginalAnswerExpanded, setIsOriginalAnswerExpanded] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // Clipboard paste listener for images
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              if (event.target?.result) {
                setSelectedImage(event.target.result as string);
              }
            };
            reader.readAsDataURL(blob);
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('请选择有效的图片文件（JPG、PNG、WebP等）');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string);
      setErrorMsg(null);
    };
    reader.readAsDataURL(file);
  };

  // Trigger OCR & Variant Generation
  const handleStartOCR = async () => {
    if (!selectedImage) {
      setErrorMsg('请先拍照、上传错题图片或点击下方快捷示例');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);
    setSaveSuccessNotice(false);

    try {
      setLoadingStep('正在扫描错题图像，精准识别题干与 LaTeX 公式...');

      const response = await fetch('/api/ocr-mistake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedImage,
          subjectHint: selectedSubject,
          customNotes,
        }),
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData.error || '识别失败，请检查网络或图片清晰度');
      }

      setLoadingStep('正在提取核心考点、诊断失分思维并生成举一反三变式题...');

      const data = resData.data;

      const mistake: MistakeItem = {
        id: `mistake-${Date.now()}`,
        createdAt: Date.now(),
        subject: (data.subject as SubjectType) || '数学',
        gradeLevel: data.gradeLevel || '',
        knowledgePoint: data.knowledgePoint || '核心考点',
        originalQuestion: data.originalQuestion || '',
        originalAnswer: data.originalAnswer || '',
        originalAnalysis: data.originalAnalysis || '',
        errorAnalysis: data.errorAnalysis || '',
        errorKeywords: data.errorKeywords || [],
        imageUrl: selectedImage,
        mastered: false,
        userNotes: customNotes,
        variants: (data.variants || []).map((v: any, idx: number) => ({
          id: v.id || `var-${idx + 1}`,
          tag: v.tag || (idx === 0 ? '同构巩固' : idx === 1 ? '进阶拓展' : '易错陷阱'),
          question: v.question,
          answer: v.answer,
          analysis: v.analysis,
          errorTrap: v.errorTrap || '',
          errorKeywords: v.errorKeywords || [],
        })),
      };

      setCurrentResult(mistake);
    } catch (err: any) {
      console.error('OCR Error:', err);
      setErrorMsg(err.message || '识别服务发生异常，请稍后重试');
    } finally {
      setIsProcessing(false);
      setLoadingStep('');
    }
  };

  // Quick preset loader (uses Gemini to generate fresh variants or load mock sample)
  const handleApplyQuickSample = async (sample: (typeof QUICK_SAMPLES)[0]) => {
    setIsProcessing(true);
    setErrorMsg(null);
    setSaveSuccessNotice(false);
    setLoadingStep(`正在基于【${sample.title}】调取特级名师变式库与易错点分析...`);

    try {
      // Call backend to generate real variants for this sample
      const res = await fetch('/api/generate-variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalQuestion: sample.previewText,
          subject: sample.subject,
          knowledgePoint: sample.knowledgePoint,
          errorAnalysis: sample.errorAnalysis,
          count: 3,
          difficultyLevel: '梯度进阶',
        }),
      });

      const resData = await res.json();
      let variants: VariantItem[] = [];

      if (res.ok && resData.variants && Array.isArray(resData.variants)) {
        variants = resData.variants.map((v: any, idx: number) => ({
          id: v.id || `v-${Date.now()}-${idx}`,
          tag: v.tag || `变式 ${idx + 1}`,
          question: v.question,
          answer: v.answer,
          analysis: v.analysis,
          errorTrap: v.errorTrap,
          errorKeywords: v.errorKeywords || [],
        }));
      }

      const item: MistakeItem = {
        id: `sample-${Date.now()}`,
        createdAt: Date.now(),
        subject: sample.subject,
        gradeLevel: '精选典型考题',
        knowledgePoint: sample.knowledgePoint,
        originalQuestion: sample.previewText,
        originalAnswer: '见详细步骤与答案解析',
        originalAnalysis: '按照标准解题通法进行推导演绎与逻辑检验。',
        errorAnalysis: sample.errorAnalysis,
        errorKeywords: sample.errorKeywords,
        mastered: false,
        variants,
      };

      setCurrentResult(item);
    } catch (e: any) {
      setErrorMsg('生成变式失败，请检查网络');
    } finally {
      setIsProcessing(false);
      setLoadingStep('');
    }
  };

  // Regenerate all variants
  const handleRegenerateVariants = async () => {
    if (!currentResult) return;

    setIsRegeneratingVariants(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/generate-variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalQuestion: currentResult.originalQuestion,
          subject: currentResult.subject,
          knowledgePoint: currentResult.knowledgePoint,
          errorAnalysis: currentResult.errorAnalysis,
          count: 3,
          difficultyLevel: difficultyPreference,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.variants) {
        throw new Error(data.error || '重新生成失败');
      }

      const newVariants = data.variants.map((v: any, idx: number) => ({
        id: `v-${Date.now()}-${idx}`,
        tag: v.tag || (idx === 0 ? '同构变式' : idx === 1 ? '逆向进阶' : '防坑陷阱'),
        question: v.question,
        answer: v.answer,
        analysis: v.analysis,
        errorTrap: v.errorTrap || '',
        errorKeywords: v.errorKeywords || [],
      }));

      setCurrentResult({
        ...currentResult,
        variants: newVariants,
      });
    } catch (err: any) {
      setErrorMsg(err.message || '重新生成变式题目失败');
    } finally {
      setIsRegeneratingVariants(false);
    }
  };

  // Regenerate a single variant
  const handleRegenerateSingleVariant = async (index: number) => {
    if (!currentResult || !currentResult.variants) return;

    setIsRegeneratingVariants(true);
    try {
      const res = await fetch('/api/generate-variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalQuestion: currentResult.originalQuestion,
          subject: currentResult.subject,
          knowledgePoint: currentResult.knowledgePoint,
          errorAnalysis: currentResult.errorAnalysis,
          count: 1,
          difficultyLevel: difficultyPreference,
          specificRequirement: `替换第 ${index + 1} 道变式，保持风格清新，注重易错点防范`,
        }),
      });

      const data = await res.json();
      if (res.ok && data.variants && data.variants.length > 0) {
        const replacement = data.variants[0];
        const updatedVariants = [...currentResult.variants];
        updatedVariants[index] = {
          id: `v-single-${Date.now()}`,
          tag: replacement.tag || updatedVariants[index].tag || `变式 ${index + 1}`,
          question: replacement.question,
          answer: replacement.answer,
          analysis: replacement.analysis,
          errorTrap: replacement.errorTrap,
          errorKeywords: replacement.errorKeywords || [],
        };
        setCurrentResult({
          ...currentResult,
          variants: updatedVariants,
        });
      }
    } catch {
      // Keep previous
    } finally {
      setIsRegeneratingVariants(false);
    }
  };

  const handleSave = () => {
    if (!currentResult) return;
    onSaveToNotebook(currentResult);
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
      {/* Page Title & Intro */}
      <div className="bg-linear-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-indigo-200 text-xs font-semibold border border-white/15">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            AI 智能拍题识别 · 核心考点推导 · 举一反三变式
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            拍照识别错题，生成高质量举一反三练习
          </h1>
          <p className="text-sm text-indigo-100/90 max-w-2xl leading-relaxed">
            支持全学科中英文题干与复杂数学公式。不仅精准还原题目，更能深度剖析思维陷阱，智能原创生成同构、进阶与防坑变式题。
          </p>
        </div>

        {/* Decorative circle */}
        <div className="absolute -right-12 -bottom-16 w-64 h-64 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />
      </div>

      {/* Upload Zone Card */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              1
            </div>
            <h2 className="text-base font-bold text-slate-800">
              上传错题图片 / 拍照识别
            </h2>
          </div>

          {/* Subject Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
            <span className="text-xs text-slate-400 font-medium shrink-0">学科:</span>
            <button
              type="button"
              onClick={() => setSelectedSubject('自动识别')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors shrink-0 ${
                selectedSubject === '自动识别'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              智能自动判定
            </button>
            {SUBJECT_LIST.map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => setSelectedSubject(sub)}
                className={`px-2 py-1 text-xs rounded-lg font-medium transition-colors shrink-0 ${
                  selectedSubject === sub
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-200/70 border border-slate-200/60'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>

        {/* Dropzone & Preview */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (file && file.type.startsWith('image/')) {
              const reader = new FileReader();
              reader.onload = (event) => setSelectedImage(event.target?.result as string);
              reader.readAsDataURL(file);
            }
          }}
          className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
            selectedImage
              ? 'border-indigo-400 bg-indigo-50/20'
              : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />

          {selectedImage ? (
            <div className="space-y-3">
              <div className="relative inline-block max-h-64 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                <img
                  src={selectedImage}
                  alt="错题预览"
                  className="max-h-64 object-contain mx-auto"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage(null);
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-slate-900/70 text-white rounded-full hover:bg-slate-900 transition-colors shadow-md"
                  title="移除此图"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-500">
                已就绪！点击下方按钮开始识别，或点击更换其他图片 / 截屏粘贴 (Ctrl+V)
              </p>
            </div>
          ) : (
            <div className="py-6 space-y-3">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  点击上传错题截图，或将图片拖拽至此处
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  支持 JPG、PNG、WebP，也可直接在网页中按下 <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-slate-700">Ctrl + V</kbd> 快速粘贴
                </p>
              </div>

              {/* Action Buttons inside Dropzone */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  <ImageIcon className="w-4 h-4 text-indigo-600" />
                  选择本地相册图片
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    cameraInputRef.current?.click();
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Camera className="w-4 h-4 text-indigo-600" />
                  手机 / 平板即刻拍照
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Sample Presets (Zero barrier testing) */}
        <div className="pt-2">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-semibold text-slate-700">
              免找图一键体验：试一试以下全科典型错题
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {QUICK_SAMPLES.map((s, idx) => (
              <button
                key={idx}
                type="button"
                disabled={isProcessing}
                onClick={() => handleApplyQuickSample(s)}
                className="text-left p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-indigo-50/60 hover:border-indigo-300 transition-all text-xs space-y-1 group disabled:opacity-50"
              >
                <div className="font-semibold text-slate-800 group-hover:text-indigo-600 flex items-center justify-between">
                  <span>{s.title}</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-slate-500 line-clamp-1">{s.previewText.replace(/\$/g, '')}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Custom notes input */}
        <div>
          <input
            type="text"
            value={customNotes}
            onChange={(e) => setCustomNotes(e.target.value)}
            placeholder="可选：输入试卷批注或要求（例如：期末最后一道大题，请侧重考查易错边界条件）"
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        {/* Error message banner */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Start OCR Button */}
        <div>
          <button
            type="button"
            disabled={isProcessing || !selectedImage}
            onClick={handleStartOCR}
            className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>智能诊断中... 请稍候</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>开始智能识别错题并生成举一反三变式</span>
              </>
            )}
          </button>
        </div>

        {/* Loading Progress Feedback */}
        {isProcessing && (
          <div className="p-4 bg-indigo-50/80 rounded-2xl border border-indigo-100 text-center space-y-2 animate-pulse">
            <div className="inline-flex items-center gap-2 text-indigo-700 font-semibold text-xs">
              <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
              <span>特级教研模型正在工作：</span>
            </div>
            <p className="text-xs text-slate-600">{loadingStep}</p>
          </div>
        )}
      </div>

      {/* Recognition Result & Variant Generation Area */}
      {currentResult && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Success Banner */}
          {saveSuccessNotice && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-semibold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>已成功将这道错题及 3 道举一反三变式题加入错题本！</span>
              </div>
              <button
                onClick={onGoToNotebook}
                className="underline text-emerald-900 font-bold hover:text-emerald-700"
              >
                前往错题本查看 &rarr;
              </button>
            </div>
          )}

          {/* Section: 1. Original Question Recognition Result */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">
                    错题识别诊断与知识点归纳
                  </h2>
                  <p className="text-xs text-slate-400">已智能排版数学公式与题干结构</p>
                </div>
              </div>

              {/* Edit button */}
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="手动纠正 OCR 识别细节"
              >
                <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                手动微调题目
              </button>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                {currentResult.subject}
              </span>
              {currentResult.gradeLevel && (
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {currentResult.gradeLevel}
                </span>
              )}
              <span className="text-xs font-medium px-3 py-1 rounded-lg bg-slate-100 text-slate-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                核心知识点：{currentResult.knowledgePoint}
              </span>
            </div>

            {/* Original Question Content */}
            <div className="p-4 bg-slate-50/60 rounded-2xl border border-slate-200/70 text-slate-800 text-sm">
              <MathText content={currentResult.originalQuestion} />
            </div>

            {/* Error Analysis & Keywords Highlight Card */}
            {currentResult.errorAnalysis && (
              <div className="p-4 bg-linear-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>丢分原因与核心易错点剖析：</span>
                </div>

                <div className="text-xs text-amber-950 leading-relaxed">
                  <MathText
                    content={currentResult.errorAnalysis}
                    highlightKeywords={currentResult.errorKeywords}
                  />
                </div>

                {/* Highlighted Keywords Tags */}
                {currentResult.errorKeywords && currentResult.errorKeywords.length > 0 && (
                  <div className="pt-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-amber-700 font-medium">易错警示词：</span>
                    {currentResult.errorKeywords.map((kw, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-amber-200/80 text-amber-900 border border-amber-300 text-xs font-semibold"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Original Answer & Solution Accordion */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
              <button
                type="button"
                onClick={() => setIsOriginalAnswerExpanded(!isOriginalAnswerExpanded)}
                className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between font-semibold text-slate-700 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-indigo-600" />
                  原题参考答案与规范步骤解析
                </span>
                {isOriginalAnswerExpanded ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {isOriginalAnswerExpanded && (
                <div className="p-4 bg-white space-y-2 border-t border-slate-200">
                  {currentResult.originalAnswer && (
                    <div className="text-slate-800">
                      <span className="font-bold text-indigo-700">参考答案：</span>
                      <MathText
                        content={currentResult.originalAnswer}
                        className="inline-block font-semibold"
                      />
                    </div>
                  )}
                  {currentResult.originalAnalysis && (
                    <div className="text-slate-600 pt-1">
                      <span className="font-semibold text-slate-700">步骤解析：</span>
                      <MathText content={currentResult.originalAnalysis} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Section: 2. 举一反三生成区 (Analogous Variants Section) */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-800">
                      举一反三 · 变式训练区
                    </h2>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold">
                      {currentResult.variants?.length || 0} 道变式题
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    同考点变式，每个题目均附带针对性易错点分析
                  </p>
                </div>
              </div>

              {/* Controls: Regenerate & Difficulty */}
              <div className="flex items-center gap-2">
                <select
                  value={difficultyPreference}
                  onChange={(e) => setDifficultyPreference(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 focus:bg-white focus:outline-none"
                >
                  <option value="梯度进阶">模式：梯度进阶（巩固+拓展+陷阱）</option>
                  <option value="同构变式强化">模式：同构变式巩固</option>
                  <option value="强化易错陷阱">模式：强化易错陷阱</option>
                </select>

                <button
                  type="button"
                  disabled={isRegeneratingVariants}
                  onClick={handleRegenerateVariants}
                  className="px-3.5 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isRegeneratingVariants ? 'animate-spin' : ''}`}
                  />
                  <span>{isRegeneratingVariants ? '生成中...' : '重新生成全部变式'}</span>
                </button>
              </div>
            </div>

            {/* Variant Cards List */}
            <div className="space-y-4">
              {currentResult.variants && currentResult.variants.length > 0 ? (
                currentResult.variants.map((v, index) => (
                  <div
                    key={v.id || index}
                    className="p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all bg-white shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-mono font-bold">
                          {index + 1}
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                          {v.tag || `变式题 ${index + 1}`}
                        </span>
                      </div>

                      {/* Single regenerate button */}
                      <button
                        type="button"
                        disabled={isRegeneratingVariants}
                        onClick={() => handleRegenerateSingleVariant(index)}
                        className="text-xs text-slate-400 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                        title="不满意？单独重新换一道变式题"
                      >
                        <RefreshCw className="w-3 h-3" />
                        换一题
                      </button>
                    </div>

                    {/* Question text */}
                    <div className="text-sm text-slate-800 leading-relaxed">
                      <MathText content={v.question} />
                    </div>

                    {/* Error Trap Caution Box */}
                    {v.errorTrap && (
                      <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200/80 text-xs">
                        <div className="font-semibold text-rose-800 flex items-center gap-1.5 mb-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          <span>易错陷阱警示：</span>
                        </div>
                        <MathText
                          content={v.errorTrap}
                          highlightKeywords={v.errorKeywords}
                          className="text-rose-950"
                        />
                      </div>
                    )}

                    {/* Answer & Explanation */}
                    <div className="pt-2 border-t border-slate-100 text-xs space-y-1.5 text-slate-600">
                      <div>
                        <span className="font-bold text-slate-800">参考答案：</span>
                        <MathText content={v.answer} className="inline-block font-semibold text-indigo-700" />
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700">解析步骤：</span>
                        <MathText content={v.analysis} />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-slate-400">
                  暂无变式题，点击上方“重新生成全部变式”
                </div>
              )}
            </div>

            {/* Bottom Actions for the entire recognized problem */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
              >
                <BookmarkPlus className="w-4 h-4" />
                保存此错题与变式至错题本
              </button>

              <button
                type="button"
                onClick={() => onOpenPrintPreview(currentResult)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
              >
                <Printer className="w-4 h-4" />
                立即生成 A4 巩固试卷并打印
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Mistake Modal */}
      {currentResult && (
        <EditMistakeModal
          mistake={currentResult}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={(updated) => setCurrentResult(updated)}
        />
      )}
    </div>
  );
};
