import { MistakeItem, PrintConfig } from '../types';
import { PRESET_MISTAKES } from '../data/presetMistakes';

const STORAGE_KEY = 'mistake_notebook_items_v2';
const PRINT_CONFIG_KEY = 'mistake_print_config_v2';

export const DEFAULT_PRINT_CONFIG: PrintConfig = {
  paperTitle: '错题举一反三 · 变式专项巩固训练卷',
  paperSubtitle: '核心考点深化诊断与易错陷阱突破',
  studentName: '',
  studentClass: '',
  dateStr: new Date().toISOString().split('T')[0],
  showOriginalQuestion: true,
  showVariants: true,
  showAnswerAppendix: true,
  showErrorTrapInAnswer: true,
  workingSpace: 'normal',
  fontSize: 'base',
};

export function loadMistakes(): MistakeItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Initialize with preset mistakes
      localStorage.setItem(STORAGE_KEY, JSON.stringify(PRESET_MISTAKES));
      return PRESET_MISTAKES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return PRESET_MISTAKES;
  } catch (err) {
    console.error('Failed to load mistakes from localStorage', err);
    return PRESET_MISTAKES;
  }
}

export function saveMistakes(items: MistakeItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save mistakes to localStorage', err);
  }
}

export function addMistake(item: MistakeItem): MistakeItem[] {
  const current = loadMistakes();
  const updated = [item, ...current];
  saveMistakes(updated);
  return updated;
}

export function updateMistake(id: string, partial: Partial<MistakeItem>): MistakeItem[] {
  const current = loadMistakes();
  const updated = current.map((item) => (item.id === id ? { ...item, ...partial } : item));
  saveMistakes(updated);
  return updated;
}

export function deleteMistake(id: string): MistakeItem[] {
  const current = loadMistakes();
  const updated = current.filter((item) => item.id !== id);
  saveMistakes(updated);
  return updated;
}

export function toggleMastered(id: string): MistakeItem[] {
  const current = loadMistakes();
  const updated = current.map((item) =>
    item.id === id ? { ...item, mastered: !item.mastered } : item
  );
  saveMistakes(updated);
  return updated;
}

export function resetToPresets(): MistakeItem[] {
  saveMistakes(PRESET_MISTAKES);
  return PRESET_MISTAKES;
}

export function loadPrintConfig(): PrintConfig {
  try {
    const raw = localStorage.getItem(PRINT_CONFIG_KEY);
    if (!raw) return DEFAULT_PRINT_CONFIG;
    return { ...DEFAULT_PRINT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PRINT_CONFIG;
  }
}

export function savePrintConfig(config: PrintConfig): void {
  try {
    localStorage.setItem(PRINT_CONFIG_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save print config', err);
  }
}
