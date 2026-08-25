import React, { useState, useEffect } from 'react';
import { Subject, QuestionPracticeLog } from '../types';
import { DEFAULT_COMMON_ERROR_TAGS, getTodayDateString, addDaysToDate } from '../utils/ebbinghaus';
import { X, Check, PenLine, AlertTriangle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  existingSets: string[];
  onSave: (log: Partial<QuestionPracticeLog>, isEdit: boolean) => void;
  editLog?: QuestionPracticeLog | null;
  initialSubjectId?: string;
}

export const ModalQuickAddPractice: React.FC<Props> = ({
  isOpen,
  onClose,
  subjects,
  existingSets,
  onSave,
  editLog,
  initialSubjectId,
}) => {
  const [subjectId, setSubjectId] = useState<string>('');
  const [setName, setSetName] = useState<string>('');
  const [knowledgePointTitle, setKnowledgePointTitle] = useState<string>('');
  const [questionNumbers, setQuestionNumbers] = useState<string>('');
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [hesitantCount, setHesitantCount] = useState<number>(0);
  const [wrongCount, setWrongCount] = useState<number>(0);
  const [isIndependent, setIsIndependent] = useState<boolean>(true);
  const [selectedErrorTypes, setSelectedErrorTypes] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState<string>('');
  const [reflection, setReflection] = useState<string>('');
  const [scheduleReview, setScheduleReview] = useState<boolean>(true);
  const [nextReviewDate, setNextReviewDate] = useState<string>(addDaysToDate(getTodayDateString(), 1));

  useEffect(() => {
    if (editLog) {
      setSubjectId(editLog.subjectId);
      setSetName(editLog.setName);
      setKnowledgePointTitle(editLog.knowledgePointTitle || '');
      setQuestionNumbers(editLog.questionNumbers);
      setCorrectCount(editLog.correctCount);
      setHesitantCount(editLog.hesitantCount);
      setWrongCount(editLog.wrongCount);
      setIsIndependent(editLog.isIndependent);
      setSelectedErrorTypes(editLog.errorTypes || []);
      setReflection(editLog.reflection);
      setNextReviewDate(editLog.nextReviewDate || addDaysToDate(getTodayDateString(), 1));
      setScheduleReview(!!editLog.nextReviewDate);
    } else {
      setSubjectId(initialSubjectId || (subjects[0] ? subjects[0].id : ''));
      setSetName('');
      setKnowledgePointTitle('');
      setQuestionNumbers('');
      setCorrectCount(10);
      setHesitantCount(0);
      setWrongCount(0);
      setIsIndependent(true);
      setSelectedErrorTypes([]);
      setReflection('');
      setScheduleReview(false);
      setNextReviewDate(addDaysToDate(getTodayDateString(), 1));
    }
  }, [editLog, isOpen, initialSubjectId, subjects]);

  // When wrong count increases > 0, auto-enable schedule review
  useEffect(() => {
    if (wrongCount > 0 && !scheduleReview) {
      setScheduleReview(true);
    }
  }, [wrongCount]);

  if (!isOpen) return null;

  const currentSubject = subjects.find(s => s.id === subjectId) || subjects[0];
  const allAvailableErrorTags = Array.from(
    new Set([...DEFAULT_COMMON_ERROR_TAGS, ...(currentSubject?.customErrorTags || [])])
  );

  const toggleTag = (tag: string) => {
    if (selectedErrorTypes.includes(tag)) {
      setSelectedErrorTypes(selectedErrorTypes.filter(t => t !== tag));
    } else {
      setSelectedErrorTypes([...selectedErrorTypes, tag]);
    }
  };

  const handleAddCustomTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const clean = customTagInput.trim();
    if (clean && !selectedErrorTypes.includes(clean)) {
      setSelectedErrorTypes([...selectedErrorTypes, clean]);
      setCustomTagInput('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!setName.trim()) return;

    onSave(
      {
        id: editLog ? editLog.id : 'prac_' + Date.now(),
        subjectId: subjectId || (subjects[0] ? subjects[0].id : 'default'),
        setName: setName.trim(),
        knowledgePointTitle: knowledgePointTitle.trim() || undefined,
        questionNumbers: questionNumbers.trim() || '全套',
        correctCount: Number(correctCount) || 0,
        hesitantCount: Number(hesitantCount) || 0,
        wrongCount: Number(wrongCount) || 0,
        isIndependent,
        errorTypes: selectedErrorTypes,
        reflection: reflection.trim(),
        createdAt: editLog ? editLog.createdAt : getTodayDateString(),
        nextReviewDate: scheduleReview && wrongCount > 0 ? nextReviewDate : undefined,
        reviewed: editLog ? editLog.reviewed : false,
      },
      !!editLog
    );
    onClose();
  };

  const totalQuestions = (Number(correctCount) || 0) + (Number(wrongCount) || 0);
  const accuracyRate = totalQuestions > 0 ? Math.round(((Number(correctCount) || 0) / totalQuestions) * 100) : 100;

  return (
    <div
      id="quick-add-practice-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#3d3d3d]/40 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#e8e4dc] relative overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#e8e4dc]">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-semibold shadow-xs"
              style={{ backgroundColor: currentSubject?.color || '#82947d' }}
            >
              <PenLine className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#3d3d3d]">
                {editLog ? '修改刷题记录' : '记录刷题与复盘'}
              </h2>
              <p className="text-xs text-[#7c7467]">
                记录对错分布、错误类型归因与错因复盘
              </p>
            </div>
          </div>
          <button
            id="close-add-practice-modal-btn"
            onClick={onClose}
            className="text-[#8c8275] hover:text-[#3d3d3d] p-1.5 rounded-lg hover:bg-[#f5f2ed] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 overflow-y-auto pr-1 flex-1">
          {/* Subject */}
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
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                    {s.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Set Name & Preset chips */}
          <div>
            <label className="block text-xs font-semibold text-[#4a4a4a] mb-1">
              题集 / 试卷来源名称 <span className="text-[#c17f6f]">*</span>
            </label>
            <input
              id="practice-set-name-input"
              type="text"
              required
              placeholder="例如：1000题第一章 / 2024真题卷 / 模考卷"
              value={setName}
              onChange={e => setSetName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-[#e8e4dc] text-sm focus:outline-none focus:ring-2 focus:ring-[#82947d] bg-white text-[#3d3d3d]"
            />
            {existingSets.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                <span className="text-[11px] text-[#8c8275]">快速填入:</span>
                {existingSets.slice(0, 4).map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSetName(s)}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-[#f5f2ed] text-[#61594f] hover:bg-[#ebe6dd] transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Knowledge point & Question numbers */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#4a4a4a] mb-1">
                关联知识点 <span className="text-[#8c8275] font-normal">(选填)</span>
              </label>
              <input
                id="practice-kp-input"
                type="text"
                placeholder="例如：唯物辩证法 / 阻却事由"
                value={knowledgePointTitle}
                onChange={e => setKnowledgePointTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#e8e4dc] text-xs focus:outline-none focus:ring-2 focus:ring-[#82947d] bg-[#faf8f5] text-[#3d3d3d]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#4a4a4a] mb-1">
                题号 / 范围
              </label>
              <input
                id="practice-question-num-input"
                type="text"
                placeholder="例如：1-15 或 T8, T12"
                value={questionNumbers}
                onChange={e => setQuestionNumbers(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#e8e4dc] text-xs focus:outline-none focus:ring-2 focus:ring-[#82947d] bg-[#faf8f5] text-[#3d3d3d]"
              />
            </div>
          </div>

          {/* Scores Breakdown: Correct, Hesitant, Wrong */}
          <div className="p-3.5 rounded-2xl bg-[#faf8f5] border border-[#e8e4dc]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#3d3d3d]">作答情况统计</span>
              <span className="text-xs font-semibold text-[#61594f]">
                正确率: <span className={accuracyRate >= 80 ? 'text-[#4d6148]' : 'text-[#8d6023]'}>{accuracyRate}%</span>
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-white p-2.5 rounded-xl border border-[#bcd2b8]">
                <span className="block text-[11px] font-medium text-[#4d6148] mb-1">做对数 (题)</span>
                <input
                  id="correct-count-input"
                  type="number"
                  min="0"
                  value={correctCount}
                  onChange={e => setCorrectCount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full text-base font-bold text-[#3b4c37] focus:outline-none bg-transparent"
                />
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-[#eedab9]">
                <span className="block text-[11px] font-medium text-[#8d6023] mb-1">犹豫做对 (题)</span>
                <input
                  id="hesitant-count-input"
                  type="number"
                  min="0"
                  value={hesitantCount}
                  onChange={e => setHesitantCount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full text-base font-bold text-[#734c19] focus:outline-none bg-transparent"
                />
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-[#e8c0b8]">
                <span className="block text-[11px] font-medium text-[#964f3f] mb-1">做错数 (题)</span>
                <input
                  id="wrong-count-input"
                  type="number"
                  min="0"
                  value={wrongCount}
                  onChange={e => setWrongCount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full text-base font-bold text-[#7a3b2d] focus:outline-none bg-transparent"
                />
              </div>
            </div>

            {/* Independent toggle */}
            <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-[#e8e4dc]">
              <span className="text-xs text-[#61594f]">是否独立完成（无翻书/看解析）</span>
              <button
                type="button"
                onClick={() => setIsIndependent(!isIndependent)}
                className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                  isIndependent
                    ? 'bg-[#edf2ec] border-[#bcd2b8] text-[#4d6148]'
                    : 'bg-[#f5f2ed] border-[#e8e4dc] text-[#61594f]'
                }`}
              >
                {isIndependent ? '✓ 独立闭卷完成' : '✕ 开卷/查阅提示'}
              </button>
            </div>
          </div>

          {/* Error Tags Selection (if wrongCount > 0 or hesitantCount > 0) */}
          {(wrongCount > 0 || hesitantCount > 0) && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#4a4a4a] flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#bfa07a]" />
                  错误类型标签归因
                </label>
                <span className="text-[11px] text-[#8c8275]">支持多选</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {allAvailableErrorTags.map(tag => {
                  const isSelected = selectedErrorTypes.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                        isSelected
                          ? 'bg-[#fbf4f2] border-[#e8c0b8] text-[#964f3f] font-medium'
                          : 'bg-[#faf8f5] border-[#e8e4dc] text-[#61594f] hover:bg-[#f5f2ed]'
                      }`}
                    >
                      {isSelected ? '✓ ' : ''}{tag}
                    </button>
                  );
                })}
              </div>

              {/* Custom tag add input */}
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="添加自定义错误标签..."
                  value={customTagInput}
                  onChange={e => setCustomTagInput(e.target.value)}
                  onKeyDown={handleAddCustomTag}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-[#e8e4dc] text-xs focus:outline-none focus:ring-1 focus:ring-[#82947d] bg-white text-[#3d3d3d]"
                />
                <button
                  type="button"
                  onClick={handleAddCustomTag}
                  className="px-3 py-1.5 rounded-lg bg-[#f5f2ed] hover:bg-[#ebe6dd] text-[#61594f] text-xs font-medium transition-colors"
                >
                  添加标签
                </button>
              </div>
            </div>
          )}

          {/* Reflection / Takeaways */}
          <div>
            <label className="block text-xs font-semibold text-[#4a4a4a] mb-1">
              简短复盘 / 错因剖析与避坑笔记
            </label>
            <textarea
              id="practice-reflection-input"
              rows={3}
              placeholder="简要记下错题的干扰项陷阱、正确解法逻辑、考场如何避坑..."
              value={reflection}
              onChange={e => setReflection(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-[#e8e4dc] text-sm focus:outline-none focus:ring-2 focus:ring-[#82947d] bg-white text-[#3d3d3d] leading-relaxed resize-y"
            />
          </div>

          {/* Schedule review if wrongCount > 0 */}
          {wrongCount > 0 && (
            <div className="p-3 bg-[#fdf7ee] border border-[#eedab9] rounded-xl flex items-center justify-between gap-3">
              <div>
                <span className="block text-xs font-semibold text-[#8d6023]">定期错题复查</span>
                <span className="text-[11px] text-[#734c19]">自动加入到期错题重练清单</span>
              </div>
              <input
                id="practice-next-review-input"
                type="date"
                value={nextReviewDate}
                onChange={e => setNextReviewDate(e.target.value)}
                className="px-2.5 py-1 text-xs border border-[#eedab9] rounded-lg bg-white text-[#3d3d3d] focus:outline-none"
              />
            </div>
          )}

          {/* Footer */}
          <div className="pt-3 border-t border-[#e8e4dc] flex items-center justify-end gap-2.5">
            <button
              id="cancel-add-practice-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#e8e4dc] text-xs font-medium text-[#61594f] hover:bg-[#f5f2ed] transition-colors"
            >
              取消
            </button>
            <button
              id="submit-add-practice-btn"
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#82947d] hover:bg-[#71826d] text-white text-xs font-medium shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{editLog ? '保存修改' : '保存做题记录'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
