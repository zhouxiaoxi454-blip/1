import React, { useState } from 'react';
import { KnowledgePoint, QuestionPracticeLog, Subject, RecallAction } from '../types';
import { isDateDueOrOverdue, formatRelativeDate, getTodayDateString } from '../utils/ebbinghaus';
import {
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  XCircle,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Smile,
  Zap,
} from 'lucide-react';

interface Props {
  knowledgePoints: KnowledgePoint[];
  practiceLogs: QuestionPracticeLog[];
  subjects: Subject[];
  onReviewKnowledge: (pointId: string, action: RecallAction) => void;
  onReviewPractice: (practiceId: string, result: 'mastered' | 'still_wrong') => void;
  onOpenAddKnowledge: () => void;
  onOpenFlashcard: () => void;
  onOpenRandomTip: () => void;
}

export const TodayReviewView: React.FC<Props> = ({
  knowledgePoints,
  practiceLogs,
  subjects,
  onReviewKnowledge,
  onReviewPractice,
  onOpenAddKnowledge,
  onOpenFlashcard,
  onOpenRandomTip,
}) => {
  const today = getTodayDateString();
  const [revealedPointIds, setRevealedPointIds] = useState<Set<string>>(new Set());
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');

  // Filter due knowledge points
  const dueKnowledgePoints = knowledgePoints.filter(k => isDateDueOrOverdue(k.nextReviewDate, today));
  // Filter due wrong questions practice logs
  const duePracticeLogs = practiceLogs.filter(p => !p.reviewed && p.wrongCount > 0 && p.nextReviewDate && isDateDueOrOverdue(p.nextReviewDate, today));

  const filteredKnowledge = selectedSubjectFilter === 'all'
    ? dueKnowledgePoints
    : dueKnowledgePoints.filter(k => k.subjectId === selectedSubjectFilter);

  const filteredPractice = selectedSubjectFilter === 'all'
    ? duePracticeLogs
    : duePracticeLogs.filter(p => p.subjectId === selectedSubjectFilter);

  const toggleReveal = (id: string) => {
    setRevealedPointIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getSubject = (id: string) => subjects.find(s => s.id === id);

  const totalDueCount = dueKnowledgePoints.length + duePracticeLogs.length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Progress Overview */}
      <div className="bg-white rounded-3xl p-6 border border-[#e8e4dc] shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f5f2ed] text-[#61594f] text-xs font-semibold mb-2">
              <Clock className="w-3.5 h-3.5 text-[#82947d]" />
              <span>今日复查任务 · {today}</span>
            </div>
            <h1 className="text-2xl font-black text-[#3d3d3d] tracking-tight">
              {totalDueCount > 0 ? (
                <>
                  今日共有 <span className="text-[#c17f6f]">{totalDueCount}</span> 项待复查考点与错题
                </>
              ) : (
                '太棒了！今日待复查内容已全部清空 ✨'
              )}
            </h1>
            <p className="text-xs text-[#7c7467] mt-1">
              核心原则：先自主闭卷提取回忆，再翻看要点确认，科学强化长期记忆
            </p>
          </div>

          {/* Quick Action Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="today-open-flashcard-btn"
              type="button"
              onClick={onOpenFlashcard}
              className="px-3.5 py-2 rounded-xl bg-[#82947d] hover:bg-[#71826d] text-white text-xs font-medium shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-[#fbf4eb]" />
              <span>闭卷抽查模式</span>
            </button>
            <button
              id="today-open-random-tip-btn"
              type="button"
              onClick={onOpenRandomTip}
              className="px-3.5 py-2 rounded-xl bg-[#fbf4eb] hover:bg-[#f5ebd9] text-[#8d6023] border border-[#ebd8be] text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#bfa07a]" />
              <span>翻一条Tips</span>
            </button>
          </div>
        </div>

        {/* Subject Filter Bar */}
        <div className="mt-5 pt-4 border-t border-[#e8e4dc] flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-semibold text-[#8c8275] whitespace-nowrap">筛选科目:</span>
          <button
            type="button"
            onClick={() => setSelectedSubjectFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              selectedSubjectFilter === 'all'
                ? 'bg-[#82947d] text-white shadow-xs'
                : 'bg-[#f5f2ed] text-[#61594f] hover:bg-[#ebe6dd]'
            }`}
          >
            全部 ({totalDueCount})
          </button>
          {subjects.map(s => {
            const count =
              dueKnowledgePoints.filter(k => k.subjectId === s.id).length +
              duePracticeLogs.filter(p => p.subjectId === s.id).length;
            const isSelected = selectedSubjectFilter === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedSubjectFilter(s.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#82947d] text-white shadow-xs'
                    : 'bg-[#f5f2ed] text-[#61594f] hover:bg-[#ebe6dd]'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                {s.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Section 1: Due Knowledge Points for Active Recall */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-5 bg-[#82947d] rounded-full" />
            <h2 className="text-base font-bold text-[#3d3d3d]">
              知识点背诵与主动提取 ({filteredKnowledge.length})
            </h2>
          </div>
          <button
            id="today-add-kp-btn"
            type="button"
            onClick={onOpenAddKnowledge}
            className="text-xs font-medium text-[#7c7467] hover:text-[#3d3d3d] hover:underline"
          >
            + 录入今日新学考点
          </button>
        </div>

        {filteredKnowledge.length > 0 ? (
          <div className="space-y-3">
            {filteredKnowledge.map(point => {
              const subj = getSubject(point.subjectId);
              const isRevealed = revealedPointIds.has(point.id);
              const isOverdue = point.nextReviewDate < today;

              return (
                <div
                  key={point.id}
                  id={`due-card-${point.id}`}
                  className="bg-white rounded-2xl p-5 border border-[#e8e4dc] shadow-xs hover:border-[#d4cebe] transition-all"
                >
                  {/* Card Top Metadata */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-white shadow-2xs"
                        style={{ backgroundColor: subj?.color || '#82947d' }}
                      >
                        {subj?.name || '科目'}
                      </span>
                      {point.source && (
                        <span className="text-xs text-[#7c7467] flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-[#8c8275]" />
                          {point.source}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-[#8c8275]">
                        已复习 <strong className="text-[#3d3d3d]">{point.reviewCount}</strong> 遍
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md font-medium text-[11px] ${
                          isOverdue ? 'bg-[#fbf4f2] text-[#964f3f] border border-[#e8c0b8]' : 'bg-[#fdf7ee] text-[#8d6023] border border-[#eedab9]'
                        }`}
                      >
                        {formatRelativeDate(point.nextReviewDate)}
                      </span>
                    </div>
                  </div>

                  {/* Title / Question */}
                  <div className="mb-3">
                    <h3 className="text-base font-bold text-[#3d3d3d] leading-snug">
                      {point.title}
                    </h3>
                  </div>

                  {/* Revealable Notes Area */}
                  {isRevealed ? (
                    <div className="mb-4 bg-[#faf8f5] p-4 rounded-xl border border-[#e8e4dc] text-sm text-[#4a4a4a] leading-relaxed whitespace-pre-wrap animate-in fade-in duration-200">
                      <div className="text-xs font-semibold text-[#8c8275] mb-1.5 flex items-center gap-1">
                        <span>💡 核心记忆要点与答案：</span>
                      </div>
                      {point.notes || '（未填写核对要点）'}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => toggleReveal(point.id)}
                      className="mb-4 w-full py-2.5 px-3 rounded-xl bg-[#faf8f5] hover:bg-[#f5f2ed] border border-dashed border-[#d8d2c7] text-xs font-medium text-[#61594f] flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <HelpCircle className="w-4 h-4 text-[#8c8275]" />
                      <span>在大脑中回忆答案后，点击展开核对要点</span>
                      <ChevronDown className="w-3.5 h-3.5 text-[#8c8275]" />
                    </button>
                  )}

                  {/* Action Rating Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#e8e4dc]">
                    <div className="text-xs text-[#8c8275] flex items-center gap-1">
                      <span>评价本次回忆效果：</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* 独立提取 */}
                      <button
                        id={`btn-extract-${point.id}`}
                        type="button"
                        onClick={() => onReviewKnowledge(point.id, 'extracted')}
                        className="px-3 py-1.5 rounded-xl bg-[#edf2ec] hover:bg-[#dfeade] text-[#4d6148] border border-[#bcd2b8] text-xs font-medium transition-colors flex items-center gap-1"
                        title="完全能独立说出要点，自动拉长复习周期"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#82947d]" />
                        <span>独立提取</span>
                      </button>

                      {/* 需要提示 */}
                      <button
                        id={`btn-hint-${point.id}`}
                        type="button"
                        onClick={() => onReviewKnowledge(point.id, 'hinted')}
                        className="px-3 py-1.5 rounded-xl bg-[#fdf7ee] hover:bg-[#faebd4] text-[#8d6023] border border-[#eedab9] text-xs font-medium transition-colors flex items-center gap-1"
                        title="看了点提示才想起来，适度保留周期"
                      >
                        <AlertCircle className="w-3.5 h-3.5 text-[#bfa07a]" />
                        <span>需要提示</span>
                      </button>

                      {/* 没想起来 */}
                      <button
                        id={`btn-forget-${point.id}`}
                        type="button"
                        onClick={() => onReviewKnowledge(point.id, 'forgotten')}
                        className="px-3 py-1.5 rounded-xl bg-[#fbf4f2] hover:bg-[#f5e4e0] text-[#964f3f] border border-[#e8c0b8] text-xs font-medium transition-colors flex items-center gap-1"
                        title="完全没想起来，明天重置重背"
                      >
                        <XCircle className="w-3.5 h-3.5 text-[#c17f6f]" />
                        <span>没想起来</span>
                      </button>

                      {/* 今天跳过 */}
                      <button
                        id={`btn-skip-${point.id}`}
                        type="button"
                        onClick={() => onReviewKnowledge(point.id, 'skipped')}
                        className="px-3 py-1.5 rounded-xl bg-[#f5f2ed] hover:bg-[#ebe6dd] text-[#61594f] border border-[#ded8cc] text-xs font-medium transition-colors flex items-center gap-1"
                        title="今天暂不复查，顺延至明天，不算学习失败"
                      >
                        <RotateCcw className="w-3 h-3 text-[#8c8275]" />
                        <span>今天跳过</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center bg-white rounded-2xl border border-[#e8e4dc]">
            <Smile className="w-8 h-8 text-[#82947d] opacity-60 mx-auto mb-2" />
            <p className="text-sm font-medium text-[#3d3d3d]">当前没有到期的知识点复查任务</p>
            <p className="text-xs text-[#8c8275] mt-0.5">
              你可以录入今日新学的知识点，或去背诵库进行随机抽查温故
            </p>
          </div>
        )}
      </div>

      {/* Section 2: Due Wrong Question Sets for Review */}
      {filteredPractice.length > 0 && (
        <div className="space-y-3 pt-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-5 bg-[#c17f6f] rounded-full" />
            <h2 className="text-base font-bold text-[#3d3d3d]">
              错题与薄弱点定期复查 ({filteredPractice.length})
            </h2>
          </div>

          <div className="space-y-3">
            {filteredPractice.map(prac => {
              const subj = getSubject(prac.subjectId);
              return (
                <div
                  key={prac.id}
                  id={`due-practice-${prac.id}`}
                  className="bg-white rounded-2xl p-5 border border-[#e8e4dc] shadow-xs"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-white shadow-2xs"
                        style={{ backgroundColor: subj?.color || '#c17f6f' }}
                      >
                        {subj?.name}
                      </span>
                      <span className="text-xs font-bold text-[#3d3d3d]">{prac.setName}</span>
                      <span className="text-xs text-[#7c7467]">题号: {prac.questionNumbers}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#fbf4f2] text-[#964f3f] border border-[#e8c0b8]">
                      错 {prac.wrongCount} 题
                    </span>
                  </div>

                  {/* Error tags */}
                  {prac.errorTypes && prac.errorTypes.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2.5">
                      {prac.errorTypes.map(tag => (
                        <span
                          key={tag}
                          className="text-[11px] px-2 py-0.5 rounded-md bg-[#fbf4f2] border border-[#e8c0b8] text-[#964f3f] font-medium"
                        >
                          ⚠️ {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Reflection */}
                  {prac.reflection && (
                    <div className="bg-[#faf8f5] p-3 rounded-xl border border-[#e8e4dc] text-xs text-[#4a4a4a] leading-relaxed mb-3">
                      <span className="font-semibold text-[#3d3d3d]">上次复盘笔记：</span>
                      {prac.reflection}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e8e4dc]">
                    <button
                      type="button"
                      onClick={() => onReviewPractice(prac.id, 'still_wrong')}
                      className="px-3 py-1.5 rounded-xl border border-[#e8e4dc] text-[#61594f] hover:bg-[#f5f2ed] text-xs font-medium transition-colors"
                    >
                      仍有疑点（3天后再查）
                    </button>
                    <button
                      type="button"
                      onClick={() => onReviewPractice(prac.id, 'mastered')}
                      className="px-4 py-1.5 rounded-xl bg-[#82947d] hover:bg-[#71826d] text-white text-xs font-medium transition-colors shadow-xs flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>已重新攻克并掌握</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
