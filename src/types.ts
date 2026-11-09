export type SubjectType =
  | '数学'
  | '物理'
  | '化学'
  | '英语'
  | '语文'
  | '生物'
  | '历史'
  | '地理'
  | '政治'
  | '综合'
  | '其他';

export interface VariantItem {
  id: string;
  tag: string; // e.g. "同构巩固", "进阶拓展", "易错陷阱"
  question: string;
  answer: string;
  analysis: string;
  errorTrap: string; // 易错陷阱剖析
  errorKeywords: string[]; // 易错关键词
  selectedForPrint?: boolean;
}

export interface MistakeItem {
  id: string;
  createdAt: number;
  subject: SubjectType;
  gradeLevel?: string;
  knowledgePoint: string;
  originalQuestion: string;
  originalAnswer?: string;
  originalAnalysis?: string;
  errorAnalysis: string;
  errorKeywords: string[];
  variants: VariantItem[];
  imageUrl?: string;
  mastered: boolean; // 是否已掌握
  userNotes?: string;
}

export interface PrintConfig {
  paperTitle: string;
  paperSubtitle: string;
  studentName: string;
  studentClass: string;
  dateStr: string;
  showOriginalQuestion: boolean;
  showVariants: boolean;
  showAnswerAppendix: boolean; // 试卷末尾附答案与解析
  showErrorTrapInAnswer: boolean;
  workingSpace: 'none' | 'compact' | 'normal' | 'large';
  fontSize: 'sm' | 'base' | 'lg';
}
