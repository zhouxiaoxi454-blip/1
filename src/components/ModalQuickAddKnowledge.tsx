import React, { useState, useEffect } from 'react';
import { Subject, KnowledgePoint } from '../types';
import { getTodayDateString, addDaysToDate } from '../utils/ebbinghaus';
import { X, BookOpen, Check, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  onSave: (point: Partial<KnowledgePoint>, isEdit: boolean) => void;
  editPoint?: KnowledgePoint | null;
  initialSubjectId?: string;
}

export const ModalQuickAddKnowledge: React.FC<Props> = ({
  isOpen,
  onClose,
  subjects,
  onSave,
  editPoint,
  initialSubjectId,
}) => {
  const [subjectId, setSubjectId] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [source, setSource] = useState<string>('');
  const [nextReviewDate, setNextReviewDate] = useState<string>(getTodayDateString());
  const [reviewTiming, setReviewTiming] = useState<'today' | 'tomorrow' | 'custom'>('today');

  useEffect(() => {
    if (editPoint) {
      setSubjectId(editPoint.subjectId);
      setTitle(editPoint.title);
      setNotes(editPoint.notes);
      setSource(editPoint.source || '');
      setNextReviewDate(editPoint.nextReviewDate);
      setReviewTiming('custom');
    } else {
      setSubjectId(initialSubjectId || (subjects[0] ? subjects[0].id : ''));
      setTitle('');
      setNotes('');
      setSource('');
      setNextReviewDate(getTodayDateString());
      setReviewTiming('today');
    }
  }, [editPoint, isOpen, initialSubjectId, subjects]);

  if (!isOpen) return null;

  const handleTimingChange = (timing: 'today' | 'tomorrow' | 'custom') => {
    setReviewTiming(timing);
    if (timing === 'today') {
      setNextReviewDate(getTodayDateString());
    } else if (timing === 'tomorrow') {
      setNextReviewDate(addDaysToDate(getTodayDateString(), 1));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave(
      {
        id: editPoint ? editPoint.id : 'kp_' + Date.now(),
        subjectId: subjectId || (subjects[0] ? subjects[0].id : 'default'),
        title: title.trim(),
        notes: notes.trim(),
        source: source.trim() || undefined,
        nextReviewDate,
      },
      !!editPoint
    );
    onClose();
  };

  const selectedSubject = subjects.find(s => s.id === subjectId) || subjects[0];

  return (
    <div
      id="quick-add-knowledge-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#3d3d3d]/40 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#e8e4dc] relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#e8e4dc]">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-semibold shadow-xs"
              style={{ backgroundColor: selectedSubject?.color || '#82947d' }}
            >
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#3d3d3d]">
                {editPoint ? '修改知识点' : '录入新知识点'}
              </h2>
              <p className="text-xs text-[#7c7467]">
                {editPoint ? '编辑考点详情与复查计划' : '输入考点与核心要点，系统将自动安排记忆周期'}
              </p>
            </div>
          </div>
          <button
            id="close-add-knowledge-modal-btn"
            onClick={onClose}
            className="text-[#8c8275] hover:text-[#3d3d3d] p-1.5 rounded-lg hover:bg-[#f5f2ed] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 overflow-y-auto pr-1 flex-1">
          {/* Subject Selection */}
          <div>
            <label className="block text-xs font-semibold text-[#4a4a4a] mb-1.5">
              所属科目 <span className="text-[#c17f6f]">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {subjects.map(s => {
                const isSelected = s.id === subjectId;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSubjectId(s.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'border-[#82947d] bg-[#82947d] text-white shadow-xs'
                        : 'border-[#e8e4dc] bg-[#faf8f5] text-[#61594f] hover:bg-[#f5f2ed]'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: s.color }}
                    />
                    {s.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-[#4a4a4a] mb-1">
              知识点名称 / 考点概念 <span className="text-[#c17f6f]">*</span>
            </label>
            <input
              id="knowledge-title-input"
              type="text"
              required
              autoFocus
              placeholder="例如：对立统一规律的基本内涵 / 正当防卫要件"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#e8e4dc] text-sm focus:outline-none focus:ring-2 focus:ring-[#82947d] focus:border-[#82947d] bg-white text-[#3d3d3d]"
            />
          </div>

          {/* Source / Chapter (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-[#4a4a4a] mb-1">
              来源 / 章节归属 <span className="text-xs font-normal text-[#8c8275]">(选填)</span>
            </label>
            <input
              id="knowledge-source-input"
              type="text"
              placeholder="例如：马原第二章 / 历年真题考点 / 错题整理"
              value={source}
              onChange={e => setSource(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-[#e8e4dc] text-xs focus:outline-none focus:ring-2 focus:ring-[#82947d] focus:border-[#82947d] bg-[#faf8f5] text-[#3d3d3d]"
            />
          </div>

          {/* Notes / Core Memory points */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-[#4a4a4a]">
                核心记忆要点 / 答案与口诀
              </label>
              <span className="text-[11px] text-[#8c8275]">复查时作为核对答案展示</span>
            </div>
            <textarea
              id="knowledge-notes-input"
              rows={4}
              placeholder="写下用于核对的要点、关键词、分点解析或记忆口诀..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#e8e4dc] text-sm focus:outline-none focus:ring-2 focus:ring-[#82947d] focus:border-[#82947d] bg-white text-[#3d3d3d] leading-relaxed resize-y"
            />
          </div>

          {/* Initial Next Review Date */}
          <div>
            <label className="block text-xs font-semibold text-[#4a4a4a] mb-1.5">
              首次/下次复查时间
            </label>
            <div className="flex items-center gap-2 mb-2">
              <button
                type="button"
                onClick={() => handleTimingChange('today')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  reviewTiming === 'today'
                    ? 'border-[#82947d] bg-[#82947d] text-white shadow-xs'
                    : 'border-[#e8e4dc] text-[#61594f] bg-white hover:bg-[#f5f2ed]'
                }`}
              >
                今天新学（今日复查）
              </button>
              <button
                type="button"
                onClick={() => handleTimingChange('tomorrow')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  reviewTiming === 'tomorrow'
                    ? 'border-[#82947d] bg-[#82947d] text-white shadow-xs'
                    : 'border-[#e8e4dc] text-[#61594f] bg-white hover:bg-[#f5f2ed]'
                }`}
              >
                明天开启循环
              </button>
              <button
                type="button"
                onClick={() => handleTimingChange('custom')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  reviewTiming === 'custom'
                    ? 'border-[#82947d] bg-[#82947d] text-white shadow-xs'
                    : 'border-[#e8e4dc] text-[#61594f] bg-white hover:bg-[#f5f2ed]'
                }`}
              >
                自定义日期
              </button>
            </div>
            {reviewTiming === 'custom' && (
              <input
                id="knowledge-next-date-input"
                type="date"
                value={nextReviewDate}
                onChange={e => setNextReviewDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#e8e4dc] text-xs focus:outline-none focus:ring-2 focus:ring-[#82947d] bg-white text-[#3d3d3d]"
              />
            )}
          </div>

          {/* Footer buttons */}
          <div className="pt-3 border-t border-[#e8e4dc] flex items-center justify-end gap-2.5">
            <button
              id="cancel-add-knowledge-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#e8e4dc] text-xs font-medium text-[#61594f] hover:bg-[#f5f2ed] transition-colors"
            >
              取消
            </button>
            <button
              id="submit-add-knowledge-btn"
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#82947d] hover:bg-[#71826d] text-white text-xs font-medium shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{editPoint ? '保存修改' : '立即保存并加入复习循环'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
