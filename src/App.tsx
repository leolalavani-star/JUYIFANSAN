import React, { useState, useEffect } from 'react';
import { MistakeItem } from './types';
import {
  loadMistakes,
  addMistake,
  updateMistake,
  deleteMistake,
  toggleMastered,
  resetToPresets,
} from './services/storage';
import { Navbar } from './components/Navbar';
import { OcrPage } from './components/OcrPage';
import { MistakeBookPage } from './components/MistakeBookPage';
import { PrintPreviewModal } from './components/PrintPreviewModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<'ocr' | 'notebook'>('ocr');
  const [mistakes, setMistakes] = useState<MistakeItem[]>([]);
  const [printModalState, setPrintModalState] = useState<{
    isOpen: boolean;
    items: MistakeItem[];
  }>({
    isOpen: false,
    items: [],
  });

  // Load mistakes on initial render
  useEffect(() => {
    const loaded = loadMistakes();
    setMistakes(loaded);
  }, []);

  const handleSaveToNotebook = (item: MistakeItem) => {
    const updated = addMistake(item);
    setMistakes(updated);
  };

  const handleUpdateMistake = (id: string, partial: Partial<MistakeItem>) => {
    const updated = updateMistake(id, partial);
    setMistakes(updated);
  };

  const handleDeleteMistake = (id: string) => {
    const updated = deleteMistake(id);
    setMistakes(updated);
  };

  const handleToggleMastered = (id: string) => {
    const updated = toggleMastered(id);
    setMistakes(updated);
  };

  const handleResetPresets = () => {
    if (window.confirm('确定要恢复默认预置的错题与变式题吗？')) {
      const reset = resetToPresets();
      setMistakes(reset);
    }
  };

  const handleOpenPrintPreview = (items: MistakeItem[]) => {
    setPrintModalState({
      isOpen: true,
      items: items.length > 0 ? items : mistakes,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* Navigation Bar (Top + Mobile Bottom Bar) */}
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        mistakeCount={mistakes.length}
        onOpenQuickPrint={() => handleOpenPrintPreview(mistakes)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 md:py-8">
        {activeTab === 'ocr' ? (
          <OcrPage
            onSaveToNotebook={handleSaveToNotebook}
            onOpenPrintPreview={(item) => handleOpenPrintPreview([item])}
            onGoToNotebook={() => setActiveTab('notebook')}
          />
        ) : (
          <MistakeBookPage
            mistakes={mistakes}
            onUpdateMistake={handleUpdateMistake}
            onDeleteMistake={handleDeleteMistake}
            onToggleMastered={handleToggleMastered}
            onResetPresets={handleResetPresets}
            onOpenPrintPreview={handleOpenPrintPreview}
            onNavigateToOcr={() => setActiveTab('ocr')}
          />
        )}
      </main>

      {/* Print Preview & PDF Export Modal */}
      {printModalState.isOpen && (
        <PrintPreviewModal
          selectedMistakes={printModalState.items}
          isOpen={printModalState.isOpen}
          onClose={() => setPrintModalState({ isOpen: false, items: [] })}
        />
      )}
    </div>
  );
}
