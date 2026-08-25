import React, { useState, useEffect } from 'react';
import { KnowledgePoint, Subject, RecallAction } from '../types';
import {
  Zap,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  XCircle,
  BookOpen,
  ArrowRight,
  Sparkles,
  Flame,
  HelpCircle,
} from 'lucide-react';

interface Props {
  knowledgePoints: KnowledgePoint[];
  subjects: Subject[];
  onReviewKnowledge: (pointId: string, action: RecallAction, streak?: number) => void;
  onClose: () => void;
}

export const FlashcardRecallView: React.FC<Props> = ({
  knowledgePoints,
  subjects,
  onReviewKnowledge,
  onClose,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [drillPoolType, setDrillPoolType] = useState<'all' | 'learning' | 'lapses'>('all');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const [sessionStreak, setSessionStreak] = useState<number>(0);
  const [sessionCount, setSessionCount] = useState<number>(0);
  const [shuffledPoints, setShuffledPoints] = useState<KnowledgePoint[]>([]);

  // Build candidate pool
  useEffect(() => {
    let pool = [...knowledgePoints];
    if (selectedSubjectId !== 'all') {
      pool = pool.filter(k => k.subjectId === selectedSubjectId);
    }
    if (drillPoolType === 'learning') {
      pool = pool.filter(k => k.mastery !== 'mastered');
    } else if (drillPoolType === 'lapses') {
      pool = pool.filter(k => k.lapses > 0);
    }

    // Shuffle pool
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    setShuffledPoints(shuffled);
    setCurrentIndex(0);
    setIsRevealed(false);
  }, [knowledgePoints, selectedSubjectId, drillPoolType]);

  const currentPoint = shuffledPoints[currentIndex] || null;
  const currentSubject = currentPoint ? subjects.find(s => s.id === currentPoint.subjectId) : null;

  const handleRate = (action: RecallAction) => {
    if (!currentPoint) return;

    let newStreak = sessionStreak;
    if (action === 'extracted') {
      newStreak += 1;
      setSessionStreak(newStreak);
    } else if (action === 'forgotten') {
      setSessionStreak(0);
      newStreak = 0;
    }

    setSessionCount(prev => prev + 1);
    onReviewKnowledge(currentPoint.id, action, newStreak);

    // Advance to next card
    if (currentIndex + 1 < shuffledPoints.length) {
      setCurrentIndex(prev => prev + 1);
      setIsRevealed(false);
    } else {
      // Re-shuffle or end
      const reshuffled = [...shuffledPoints].sort(() => Math.random() - 0.5);
      setShuffledPoints(reshuffled);
      setCurrentIndex(0);
      setIsRevealed(false);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < shuffledPoints.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(0);
    }
    setIsRevealed(false);
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Pool Controls */}
      <div className="bg-white rounded-3xl p-5 border border-[#e8e4dc] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fdf7ee] text-[#8d6023] border border-[#eedab9] text-xs font-semibold mb-1">
              <Zap className="w-3.5 h-3.5 text-[#bfa07a]" />
              <span>闭卷主动回忆 · 闪电记忆抽查</span>
            </div>
            <h1 className="text-xl font-bold text-[#3d3d3d]">随机抽查已学考点</h1>
            <p className="text-xs text-[#7c7467]">
              闭卷在大脑中构建知识框架并口述/回忆，之后核对答案评分
            </p>
          </div>

          {/* Streak & Stats */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#fdf7ee] border border-[#eedab9] text-[#8d6023] text-xs font-bold">
              <Flame className="w-4 h-4 text-[#bfa07a]" />
              <span>连胜: {sessionStreak}</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-[#f5f2ed] border border-[#e8e4dc] text-[#61594f] text-xs font-semibold">
              本轮已抽查: {sessionCount} 题
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#e8e4dc]">
          {/* Pool selection */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-[#8c8275] whitespace-nowrap">抽查范围:</span>
            <button
              type="button"
              onClick={() => setDrillPoolType('all')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                drillPoolType === 'all' ? 'bg-[#82947d] text-white shadow-xs' : 'bg-[#faf8f5] border border-[#e8e4dc] text-[#61594f] hover:bg-[#f5f2ed]'
              }`}
            >
              全部考点
            </button>
            <button
              type="button"
              onClick={() => setDrillPoolType('learning')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                drillPoolType === 'learning' ? 'bg-[#82947d] text-white shadow-xs' : 'bg-[#faf8f5] border border-[#e8e4dc] text-[#61594f] hover:bg-[#f5f2ed]'
              }`}
            >
              未熟练考点
            </button>
            <button
              type="button"
              onClick={() => setDrillPoolType('lapses')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                drillPoolType === 'lapses' ? 'bg-[#c17f6f] text-white shadow-xs' : 'bg-[#fbf4f2] text-[#964f3f] border border-[#e8c0b8] hover:bg-[#f5e6e1]'
              }`}
            >
              历史遗忘难点
            </button>
          </div>

          {/* Subject Filter */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            <span className="text-xs text-[#8c8275] whitespace-nowrap">科目:</span>
            <button
              type="button"
              onClick={() => setSelectedSubjectId('all')}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                selectedSubjectId === 'all' ? 'bg-[#82947d] text-white shadow-xs' : 'bg-[#faf8f5] border border-[#e8e4dc] text-[#61594f]'
              }`}
            >
              全部
            </button>
            {subjects.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedSubjectId(s.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex items-center gap-1 ${
                  selectedSubjectId === s.id ? 'bg-[#82947d] text-white shadow-xs' : 'bg-[#faf8f5] border border-[#e8e4dc] text-[#61594f]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                {s.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Flashcard Component */}
      {currentPoint ? (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e8e4dc] shadow-sm max-w-2xl mx-auto flex flex-col justify-between min-h-[380px] transition-all">
          {/* Card Header Meta */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold text-white shadow-2xs"
                  style={{ backgroundColor: currentSubject?.color || '#82947d' }}
                >
                  {currentSubject?.name}
                </span>
                {currentPoint.source && (
                  <span className="text-xs text-[#7c7467] flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-[#8c8275]" />
                    {currentPoint.source}
                  </span>
                )}
              </div>
              <span className="text-xs text-[#8c8275]">
                进度: {currentIndex + 1} / {shuffledPoints.length}
              </span>
            </div>

            {/* Question Title */}
            <div className="text-center py-6">
              <span className="text-xs font-bold text-[#8c8275] block mb-2 tracking-wider">
                【 请闭卷回忆此考点的核心要点 】
              </span>
              <h2 className="text-2xl font-black text-[#3d3d3d] leading-snug tracking-tight">
                {currentPoint.title}
              </h2>
            </div>

            {/* Answer / Notes Revealed Area */}
            {isRevealed ? (
              <div className="mt-4 p-5 bg-[#faf8f5] rounded-2xl border border-[#e8e4dc] text-sm text-[#3d3d3d] leading-relaxed whitespace-pre-wrap animate-in fade-in zoom-in-95 duration-200">
                <span className="text-xs font-bold text-[#7c7467] block mb-2">
                  💡 核心记忆要点与标准解析：
                </span>
                {currentPoint.notes || '（未记录具体要点）'}
              </div>
            ) : (
              <div className="mt-6 flex justify-center">
                <button
                  id="flashcard-reveal-btn"
                  type="button"
                  onClick={() => setIsRevealed(true)}
                  className="px-6 py-3 rounded-2xl bg-[#faf8f5] hover:bg-[#f5f2ed] text-[#3d3d3d] text-sm font-bold border border-[#e8e4dc] shadow-2xs transition-all flex items-center gap-2"
                >
                  <HelpCircle className="w-4 h-4 text-[#82947d]" />
                  <span>在大脑中回忆后 · 点击核对答案</span>
                </button>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="pt-6 mt-6 border-t border-[#e8e4dc] flex flex-wrap items-center justify-between gap-3">
            {isRevealed ? (
              <div className="flex items-center gap-2 flex-wrap w-full justify-between">
                <span className="text-xs font-semibold text-[#61594f]">评价记忆效果：</span>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    id="flashcard-rate-extract"
                    type="button"
                    onClick={() => handleRate('extracted')}
                    className="px-4 py-2 rounded-xl bg-[#82947d] hover:bg-[#71826d] text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>独立提取 (+1阶)</span>
                  </button>
                  <button
                    id="flashcard-rate-hint"
                    type="button"
                    onClick={() => handleRate('hinted')}
                    className="px-3.5 py-2 rounded-xl bg-[#fdf7ee] hover:bg-[#fcf0dc] text-[#8d6023] border border-[#eedab9] text-xs font-medium transition-colors flex items-center gap-1"
                  >
                    <AlertCircle className="w-4 h-4 text-[#bfa07a]" />
                    <span>需要提示</span>
                  </button>
                  <button
                    id="flashcard-rate-forget"
                    type="button"
                    onClick={() => handleRate('forgotten')}
                    className="px-3.5 py-2 rounded-xl bg-[#fbf4f2] hover:bg-[#f5e6e1] text-[#964f3f] border border-[#e8c0b8] text-xs font-medium transition-colors flex items-center gap-1"
                  >
                    <XCircle className="w-4 h-4 text-[#c17f6f]" />
                    <span>没想起来</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <span className="text-xs text-[#8c8275]">已复习 {currentPoint.reviewCount} 遍 · 阶段 {currentPoint.stage}</span>
                <button
                  type="button"
                  onClick={handleNext}
                  className="text-xs text-[#61594f] hover:text-[#3d3d3d] flex items-center gap-1 font-medium"
                >
                  <span>跳过此题</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl border border-[#e8e4dc]">
          <Zap className="w-10 h-10 text-[#8c8275]/40 mx-auto mb-2" />
          <h3 className="text-base font-bold text-[#3d3d3d]">当前抽查范围内暂无考点</h3>
          <p className="text-xs text-[#7c7467] mt-1">请尝试切换抽查范围或录入新的知识点</p>
        </div>
      )}
    </div>
  );
};
