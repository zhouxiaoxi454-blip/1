import React, { useState, useEffect } from 'react';
import { Subject, TipCard } from '../types';
import { X, Dices, Sparkles, BookOpen, Quote } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tips: TipCard[];
  subjects: Subject[];
}

export const ModalRandomTip: React.FC<Props> = ({ isOpen, onClose, tips, subjects }) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [currentTip, setCurrentTip] = useState<TipCard | null>(null);
  const [isFlipping, setIsFlipping] = useState<boolean>(false);

  const drawRandom = (subjId: string = selectedSubjectId) => {
    const pool = subjId === 'all' ? tips : tips.filter(t => t.subjectId === subjId);
    if (pool.length === 0) {
      setCurrentTip(null);
      return;
    }
    setIsFlipping(true);
    setTimeout(() => {
      const idx = Math.floor(Math.random() * pool.length);
      setCurrentTip(pool[idx]);
      setIsFlipping(false);
    }, 200);
  };

  useEffect(() => {
    if (isOpen) {
      drawRandom(selectedSubjectId);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const tipSubject = currentTip ? subjects.find(s => s.id === currentTip.subjectId) : null;

  return (
    <div
      id="random-tip-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#3d3d3d]/50 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#e8e4dc] relative overflow-hidden flex flex-col">
        {/* Top Controls */}
        <div className="flex items-center justify-between pb-3 border-b border-[#e8e4dc] mb-4">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-[#fdf7ee] text-[#8d6023] rounded-xl border border-[#eedab9]">
              <Dices className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-[#3d3d3d]">随机翻一条 Tips</h2>
              <p className="text-xs text-[#7c7467]">温故知新 · 沉淀解题直觉</p>
            </div>
          </div>
          <button
            id="close-random-tip-btn"
            onClick={onClose}
            className="text-[#8c8275] hover:text-[#3d3d3d] p-1.5 rounded-lg hover:bg-[#f5f2ed] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Subject Filter Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none">
          <button
            type="button"
            onClick={() => {
              setSelectedSubjectId('all');
              drawRandom('all');
            }}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              selectedSubjectId === 'all'
                ? 'bg-[#82947d] text-white shadow-xs'
                : 'bg-[#faf8f5] text-[#61594f] border border-[#e8e4dc] hover:bg-[#f5f2ed]'
            }`}
          >
            全部科目 ({tips.length})
          </button>
          {subjects.map(s => {
            const count = tips.filter(t => t.subjectId === s.id).length;
            const isSelected = selectedSubjectId === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setSelectedSubjectId(s.id);
                  drawRandom(s.id);
                }}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#82947d] text-white shadow-xs'
                    : 'bg-[#faf8f5] text-[#61594f] border border-[#e8e4dc] hover:bg-[#f5f2ed]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                {s.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Card Content Area */}
        {currentTip ? (
          <div
            className={`bg-[#faf8f5] rounded-2xl p-5 border border-[#e8e4dc] relative min-h-[220px] flex flex-col justify-between transition-all duration-300 ${
              isFlipping ? 'opacity-30 scale-95' : 'opacity-100 scale-100'
            }`}
          >
            <Quote className="w-8 h-8 text-[#e8e4dc] absolute top-3 right-4 pointer-events-none" />

            <div>
              {/* Badges */}
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-semibold text-white shadow-xs"
                  style={{ backgroundColor: tipSubject?.color || '#bfa07a' }}
                >
                  {tipSubject?.name || '通用技巧'}
                </span>
                {currentTip.source && (
                  <span className="text-[11px] text-[#7c7467] flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-[#8c8275]" />
                    {currentTip.source}
                  </span>
                )}
              </div>

              {/* Title */}
              <h3 className="text-base font-bold text-[#3d3d3d] mb-2.5 leading-snug">
                {currentTip.title}
              </h3>

              {/* Content */}
              <div className="text-sm text-[#4a4a4a] leading-relaxed whitespace-pre-wrap font-sans bg-white p-3.5 rounded-xl border border-[#e8e4dc] shadow-xs">
                {currentTip.content}
              </div>

              {/* Tags */}
              {currentTip.tags && currentTip.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {currentTip.tags.map(t => (
                    <span
                      key={t}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-[#f5f2ed] border border-[#e8e4dc] text-[#61594f] font-medium"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-10 text-center text-[#8c8275] text-sm">
            暂无当前科目的小纸条，可先录入几条解题口诀～
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-5 flex items-center justify-between gap-3 pt-3 border-t border-[#e8e4dc]">
          <span className="text-xs text-[#8c8275]">
            {tips.length > 0 ? `当前库中共有 ${tips.length} 条小纸条` : ''}
          </span>
          <div className="flex items-center gap-2">
            <button
              id="draw-next-tip-btn"
              type="button"
              onClick={() => drawRandom()}
              className="px-4 py-2 rounded-xl bg-[#82947d] hover:bg-[#71826d] text-white text-xs font-medium transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Dices className="w-3.5 h-3.5" />
              <span>换一张</span>
            </button>
            <button
              id="close-tip-card-btn"
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-[#e8e4dc] text-xs font-medium text-[#61594f] hover:bg-[#f5f2ed] transition-colors"
            >
              收起
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
