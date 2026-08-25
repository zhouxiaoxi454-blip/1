import React, { useState, useEffect } from 'react';
import { Subject, TipCard } from '../types';
import { getTodayDateString } from '../utils/ebbinghaus';
import { X, Check, Lightbulb } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  onSave: (tip: Partial<TipCard>, isEdit: boolean) => void;
  editTip?: TipCard | null;
  initialSubjectId?: string;
}

export const ModalQuickAddTip: React.FC<Props> = ({
  isOpen,
  onClose,
  subjects,
  onSave,
  editTip,
  initialSubjectId,
}) => {
  const [subjectId, setSubjectId] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [source, setSource] = useState<string>('');
  const [tagInput, setTagInput] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    if (editTip) {
      setSubjectId(editTip.subjectId);
      setTitle(editTip.title);
      setContent(editTip.content);
      setSource(editTip.source || '');
      setTags(editTip.tags || []);
    } else {
      setSubjectId(initialSubjectId || (subjects[0] ? subjects[0].id : ''));
      setTitle('');
      setContent('');
      setSource('');
      setTags([]);
    }
  }, [editTip, isOpen, initialSubjectId, subjects]);

  if (!isOpen) return null;

  const currentSubject = subjects.find(s => s.id === subjectId) || subjects[0];

  const handleAddTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const clean = tagInput.trim();
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      setTagInput('');
    }
  };

  const removeTag = (t: string) => {
    setTags(tags.filter(x => x !== t));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    onSave(
      {
        id: editTip ? editTip.id : 'tip_' + Date.now(),
        subjectId: subjectId || (subjects[0] ? subjects[0].id : 'default'),
        title: title.trim(),
        content: content.trim(),
        source: source.trim() || undefined,
        tags,
        createdAt: editTip ? editTip.createdAt : getTodayDateString(),
      },
      !!editTip
    );
    onClose();
  };

  return (
    <div
      id="quick-add-tip-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#3d3d3d]/40 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#e8e4dc] relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#e8e4dc]">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-semibold shadow-xs"
              style={{ backgroundColor: currentSubject?.color || '#bfa07a' }}
            >
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#3d3d3d]">
                {editTip ? '编辑 Tips 小纸条' : '记录一条 Tips 纸条'}
              </h2>
              <p className="text-xs text-[#7c7467]">做题技巧、口诀方法或防踩坑经验</p>
            </div>
          </div>
          <button
            id="close-add-tip-modal-btn"
            onClick={onClose}
            className="text-[#8c8275] hover:text-[#3d3d3d] p-1.5 rounded-lg hover:bg-[#f5f2ed] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 overflow-y-auto pr-1 flex-1">
          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold text-[#4a4a4a] mb-1.5">所属科目</label>
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
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                    {s.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-[#4a4a4a] mb-1">
              口诀 / 技巧标题 <span className="text-[#c17f6f]">*</span>
            </label>
            <input
              id="tip-title-input"
              type="text"
              required
              placeholder="例如：排除绝对化词汇三大铁律 / 主观题三段论"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#e8e4dc] text-sm focus:outline-none focus:ring-2 focus:ring-[#82947d] bg-white text-[#3d3d3d]"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-semibold text-[#4a4a4a] mb-1">
              详细技巧内容与步骤 <span className="text-[#c17f6f]">*</span>
            </label>
            <textarea
              id="tip-content-input"
              rows={4}
              required
              placeholder="记下口诀全文、做题套路或排除技巧..."
              value={content}
              onChange={e => setContent(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-[#e8e4dc] text-sm focus:outline-none focus:ring-2 focus:ring-[#82947d] bg-white text-[#3d3d3d] leading-relaxed resize-y"
            />
          </div>

          {/* Source */}
          <div>
            <label className="block text-xs font-semibold text-[#4a4a4a] mb-1">
              来源出处 <span className="text-[#8c8275] font-normal">(选填)</span>
            </label>
            <input
              id="tip-source-input"
              type="text"
              placeholder="例如：名师网课 / 错题归纳 / 模拟卷心得"
              value={source}
              onChange={e => setSource(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-[#e8e4dc] text-xs focus:outline-none focus:ring-2 focus:ring-[#82947d] bg-[#faf8f5] text-[#3d3d3d]"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-[#4a4a4a] mb-1">标签分类</label>
            <div className="flex items-center gap-1.5 mb-2">
              <input
                type="text"
                placeholder="输入标签按回车..."
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="flex-1 px-3 py-1.5 rounded-lg border border-[#e8e4dc] text-xs focus:outline-none focus:ring-1 focus:ring-[#82947d] bg-white text-[#3d3d3d]"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1.5 rounded-lg bg-[#f5f2ed] hover:bg-[#ebe6dd] text-[#61594f] text-xs font-medium transition-colors"
              >
                添加
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map(t => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#f5f2ed] text-[#61594f] text-xs"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => removeTag(t)}
                      className="text-[#8c8275] hover:text-[#3d3d3d] ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-[#e8e4dc] flex items-center justify-end gap-2.5">
            <button
              id="cancel-add-tip-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#e8e4dc] text-xs font-medium text-[#61594f] hover:bg-[#f5f2ed] transition-colors"
            >
              取消
            </button>
            <button
              id="submit-add-tip-btn"
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#82947d] hover:bg-[#71826d] text-white text-xs font-medium shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{editTip ? '保存修改' : '存入小纸条'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
