import React, { useState, useEffect } from 'react';
import {
  Subject,
  QuizQuestion,
  QuizAnswerState,
  QuestionPracticeLog,
  KnowledgePoint,
} from '../types';
import {
  DEFAULT_COMMON_ERROR_TAGS,
  getTodayDateString,
  addDaysToDate,
  computeNextReview,
} from '../utils/ebbinghaus';
import {
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Clock,
  RotateCcw,
  BookOpen,
  Check,
  Send,
  Loader2,
  Award,
  BookmarkPlus,
  Flame,
  Lightbulb,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  setName: string;
  subjectId: string;
  subjects: Subject[];
  questions: QuizQuestion[];
  onSavePracticeLog: (log: Partial<QuestionPracticeLog>) => void;
  onAddKnowledgePoint?: (point: Partial<KnowledgePoint>) => void;
}

export const InteractiveQuizModal: React.FC<Props> = ({
  isOpen,
  onClose,
  setName,
  subjectId,
  subjects,
  questions,
  onSavePracticeLog,
  onAddKnowledgePoint,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answersState, setAnswersState] = useState<{ [qId: string]: QuizAnswerState }>({});
  const [quizMode, setQuizMode] = useState<'instant' | 'exam'>('instant');
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);

  // AI Tutor Q&A state for current question
  const [tutorQuery, setTutorQuery] = useState<string>('');
  const [isTutorLoading, setIsTutorLoading] = useState<boolean>(false);
  const [savedKnowledgeIds, setSavedKnowledgeIds] = useState<{ [qId: string]: boolean }>({});

  // Timer
  useEffect(() => {
    if (!isOpen || isFinished || !isTimerRunning) return;
    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, isFinished, isTimerRunning]);

  // Reset state when opening with new questions
  useEffect(() => {
    if (isOpen && questions.length > 0) {
      setCurrentIndex(0);
      setIsFinished(false);
      setElapsedSeconds(0);
      setIsTimerRunning(true);
      const initMap: { [qId: string]: QuizAnswerState } = {};
      questions.forEach(q => {
        initMap[q.id] = {
          userAnswer: '',
          isSubmitted: false,
        };
      });
      setAnswersState(initMap);
      setSavedKnowledgeIds({});
    }
  }, [isOpen, questions]);

  if (!isOpen || questions.length === 0) return null;

  const currentSubject = subjects.find(s => s.id === subjectId) || subjects[0];
  const currentQ = questions[currentIndex] || questions[0];
  const currentAns = answersState[currentQ.id] || { userAnswer: '', isSubmitted: false };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Helper to normalize choices (e.g. 'A,B' -> 'AB')
  const normalizeAnswer = (ans: string) => {
    return ans.toUpperCase().replace(/[^A-Z0-9\u4e00-\u9fa5]/g, '').split('').sort().join('');
  };

  const handleSelectOption = (optKey: string) => {
    if (currentAns.isSubmitted && quizMode === 'instant') return;

    let nextAnswer = '';
    if (currentQ.type === 'multiple_choice') {
      const currentArr = (currentAns.userAnswer || '').split('');
      if (currentArr.includes(optKey)) {
        nextAnswer = currentArr.filter(k => k !== optKey).join('');
      } else {
        nextAnswer = [...currentArr, optKey].sort().join('');
      }
    } else {
      nextAnswer = optKey;
    }

    setAnswersState(prev => ({
      ...prev,
      [currentQ.id]: {
        ...prev[currentQ.id],
        userAnswer: nextAnswer,
      },
    }));
  };

  const handleSubmitCurrentQuestion = (forcedState?: Partial<QuizAnswerState>) => {
    const userNorm = normalizeAnswer(currentAns.userAnswer);
    const correctNorm = normalizeAnswer(currentQ.answer);
    const isCorrect = userNorm === correctNorm;

    setAnswersState(prev => ({
      ...prev,
      [currentQ.id]: {
        ...prev[currentQ.id],
        isSubmitted: true,
        isCorrect: forcedState?.isCorrect !== undefined ? forcedState.isCorrect : isCorrect,
        ...forcedState,
      },
    }));
  };

  const handleToggleHesitant = () => {
    setAnswersState(prev => ({
      ...prev,
      [currentQ.id]: {
        ...prev[currentQ.id],
        isHesitant: !prev[currentQ.id]?.isHesitant,
      },
    }));
  };

  const handleSelectErrorTag = (tag: string) => {
    setAnswersState(prev => ({
      ...prev,
      [currentQ.id]: {
        ...prev[currentQ.id],
        userErrorTag: prev[currentQ.id]?.userErrorTag === tag ? undefined : tag,
      },
    }));
  };

  // Ask AI Tutor for in-depth explanation / Q&A
  const handleAskTutor = async (customText?: string) => {
    const query = customText || tutorQuery.trim();
    if (!query) return;

    setIsTutorLoading(true);
    try {
      const response = await fetch('/api/explain-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionStem: currentQ.stem,
          options: currentQ.options,
          correctAnswer: currentQ.answer,
          userAnswer: currentAns.userAnswer || '未填写',
          explanation: currentQ.explanation,
          userQuery: query,
        }),
      });

      if (!response.ok) throw new Error('请求失败');
      const data = await response.json();

      setAnswersState(prev => ({
        ...prev,
        [currentQ.id]: {
          ...prev[currentQ.id],
          customAiExplanation: data.tutorExplanation,
        },
      }));
      setTutorQuery('');
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsTutorLoading(false);
    }
  };

  // Add question's core concept as flashcard knowledge point
  const handleSaveToKnowledge = () => {
    if (!onAddKnowledgePoint) return;
    const kpTitle = currentQ.knowledgePoint || `【考点】${currentQ.stem.slice(0, 24)}...`;
    const kpNotes = `【题目】${currentQ.stem}\n【正确答案】${currentQ.answer}\n\n【考点精析与避坑口诀】\n${currentQ.explanation}`;

    onAddKnowledgePoint({
      subjectId: subjectId,
      title: kpTitle,
      notes: kpNotes,
      source: setName,
    });

    setSavedKnowledgeIds(prev => ({ ...prev, [currentQ.id]: true }));
  };

  // Submit whole exam & view report
  const handleFinishExam = () => {
    // Submit all unanswered questions
    const nextAnswers = { ...answersState };
    questions.forEach(q => {
      const cur = nextAnswers[q.id] || { userAnswer: '', isSubmitted: false };
      const userNorm = normalizeAnswer(cur.userAnswer);
      const correctNorm = normalizeAnswer(q.answer);
      nextAnswers[q.id] = {
        ...cur,
        isSubmitted: true,
        isCorrect: userNorm === correctNorm && Boolean(cur.userAnswer),
      };
    });
    setAnswersState(nextAnswers);
    setIsFinished(true);
    setIsTimerRunning(false);
  };

  // Calculate stats for summary
  const totalQuestions = questions.length;
  const allAnswerValues = Object.values(answersState) as QuizAnswerState[];
  const answeredCount = allAnswerValues.filter(a => a.userAnswer).length;
  const correctCount = allAnswerValues.filter(a => a.isSubmitted && a.isCorrect).length;
  const hesitantCount = allAnswerValues.filter(
    a => a.isSubmitted && a.isCorrect && a.isHesitant
  ).length;
  const wrongCount = allAnswerValues.filter(a => a.isSubmitted && !a.isCorrect).length;
  const accuracyRate = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  // Sync to QuestionPracticeLog
  const handleSaveToPracticeLog = () => {
    const wrongQuestions = questions.filter(q => {
      const st = answersState[q.id];
      return st && st.isSubmitted && !st.isCorrect;
    });

    const errorTypesCollected: string[] = [];
    allAnswerValues.forEach(st => {
      if (st.userErrorTag && !errorTypesCollected.includes(st.userErrorTag)) {
        errorTypesCollected.push(st.userErrorTag);
      }
    });

    const wrongNums = wrongQuestions.map(q => q.questionNumber).join(', ');
    const questionRange = `第 1-${totalQuestions} 题${wrongNums ? ` (错题: ${wrongNums})` : ''}`;

    // Auto-generate a brief review reflection
    let autoReflection = `智能在线刷题完成：共 ${totalQuestions} 题，正确率 ${accuracyRate}%。做对 ${correctCount} 题，犹豫做对 ${hesitantCount} 题，做错 ${wrongCount} 题。`;
    if (wrongQuestions.length > 0) {
      autoReflection += `\n【重点错题与易错陷阱】:\n` +
        wrongQuestions
          .slice(0, 3)
          .map(
            wq =>
              `• 题号 ${wq.questionNumber}（${wq.knowledgePoint || '核心考点'}）：正解 ${wq.answer}，主要错因在于未识破干扰项。`
          )
          .join('\n');
    }

    const todayStr = getTodayDateString();
    onSavePracticeLog({
      id: 'prac_' + Date.now(),
      subjectId: subjectId || (subjects[0] ? subjects[0].id : 'default'),
      setName: setName.trim() || '智能提取题集',
      questionNumbers: questionRange,
      knowledgePointTitle: questions[0]?.knowledgePoint || undefined,
      correctCount,
      hesitantCount,
      wrongCount,
      isIndependent: true,
      errorTypes: errorTypesCollected.length > 0 ? errorTypesCollected : ['概念混淆', '干扰项未识破'],
      reflection: autoReflection,
      createdAt: todayStr,
      nextReviewDate: wrongCount > 0 ? addDaysToDate(todayStr, 1) : undefined,
      reviewed: false,
    });

    onClose();
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'single_choice':
        return '单选题';
      case 'multiple_choice':
        return '多选题';
      case 'true_false':
        return '判断题';
      case 'fill_blank':
        return '填空题';
      case 'essay':
        return '简答/分析题';
      default:
        return '选择题';
    }
  };

  return (
    <div
      id="interactive-quiz-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#3d3d3d]/50 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-3xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl border border-[#e8e4dc] relative overflow-hidden flex flex-col max-h-[95vh]">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-[#e8e4dc]">
          <div className="flex items-center gap-2.5">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: currentSubject?.color || '#82947d' }}
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#3d3d3d] truncate max-w-xs sm:max-w-md">
                  {setName}
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f5f2ed] text-[#61594f]">
                  {currentSubject?.name}
                </span>
              </div>
              <p className="text-[11px] text-[#7c7467]">
                第 {currentIndex + 1} / {totalQuestions} 题 · 已答 {answeredCount} 题
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Timer Badge */}
            <div className="px-2.5 py-1 rounded-xl bg-[#faf8f5] border border-[#e8e4dc] text-xs font-mono text-[#61594f] flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#8c8275]" />
              <span>{formatTime(elapsedSeconds)}</span>
            </div>

            {/* Mode Switcher */}
            {!isFinished && (
              <div className="hidden sm:flex items-center bg-[#f5f2ed] p-0.5 rounded-xl border border-[#e8e4dc] text-xs">
                <button
                  type="button"
                  onClick={() => setQuizMode('instant')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    quizMode === 'instant'
                      ? 'bg-white text-[#3d3d3d] shadow-2xs font-semibold'
                      : 'text-[#7c7467] hover:text-[#3d3d3d]'
                  }`}
                >
                  即时判分
                </button>
                <button
                  type="button"
                  onClick={() => setQuizMode('exam')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    quizMode === 'exam'
                      ? 'bg-white text-[#3d3d3d] shadow-2xs font-semibold'
                      : 'text-[#7c7467] hover:text-[#3d3d3d]'
                  }`}
                >
                  整卷模考
                </button>
              </div>
            )}

            <button
              id="close-interactive-quiz-btn"
              onClick={onClose}
              className="text-[#8c8275] hover:text-[#3d3d3d] p-1.5 rounded-lg hover:bg-[#f5f2ed] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Question Numbers Jump Bar */}
        <div className="py-2.5 border-b border-[#e8e4dc] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {questions.map((q, idx) => {
            const st = answersState[q.id];
            const isCurrent = idx === currentIndex;
            let btnClass = 'border-[#e8e4dc] bg-[#faf8f5] text-[#61594f]';

            if (st?.isSubmitted) {
              if (st.isCorrect) {
                btnClass = st.isHesitant
                  ? 'border-[#eedab9] bg-[#fdf7ee] text-[#8d6023] font-bold'
                  : 'border-[#bcd2b8] bg-[#edf2ec] text-[#4d6148] font-bold';
              } else {
                btnClass = 'border-[#e8c0b8] bg-[#fbf4f2] text-[#964f3f] font-bold';
              }
            } else if (st?.userAnswer) {
              btnClass = 'border-[#82947d] bg-[#82947d]/10 text-[#4d6148] font-semibold';
            }

            if (isCurrent) {
              btnClass += ' ring-2 ring-[#82947d] shadow-xs';
            }

            return (
              <button
                key={q.id}
                type="button"
                onClick={() => {
                  setCurrentIndex(idx);
                }}
                className={`w-7 h-7 shrink-0 rounded-xl text-xs flex items-center justify-center border transition-all ${btnClass}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {/* Modal Main Area: Question View vs Final Report */}
        {!isFinished ? (
          <div className="flex-1 overflow-y-auto py-4 pr-1 space-y-4">
            {/* Question Stem Card */}
            <div className="p-4 rounded-2xl bg-[#faf8f5] border border-[#e8e4dc] space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-[#82947d] text-white">
                    第 {currentIndex + 1} 题
                  </span>
                  <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-white border border-[#e8e4dc] text-[#61594f]">
                    {getQuestionTypeLabel(currentQ.type)}
                  </span>
                  {currentQ.knowledgePoint && (
                    <span className="text-xs text-[#8c8275] truncate max-w-xs">
                      考点: {currentQ.knowledgePoint}
                    </span>
                  )}
                </div>
              </div>

              <h3 className="text-sm sm:text-base font-semibold text-[#3d3d3d] leading-relaxed whitespace-pre-wrap">
                {currentQ.stem}
              </h3>
            </div>

            {/* Options Interactive Selector */}
            {currentQ.options && currentQ.options.length > 0 ? (
              <div className="space-y-2">
                {currentQ.options.map(opt => {
                  const isSelected =
                    currentQ.type === 'multiple_choice'
                      ? (currentAns.userAnswer || '').includes(opt.key)
                      : currentAns.userAnswer === opt.key;

                  let optCardClass =
                    'border-[#e8e4dc] bg-white text-[#3d3d3d] hover:bg-[#faf8f5] hover:border-[#82947d]/60';
                  let keyBadgeClass = 'border-[#e8e4dc] bg-[#f5f2ed] text-[#61594f]';

                  if (currentAns.isSubmitted) {
                    const isOptionCorrect = (currentQ.answer || '').toUpperCase().includes(opt.key.toUpperCase());
                    if (isOptionCorrect) {
                      optCardClass = 'border-[#bcd2b8] bg-[#edf2ec] text-[#3b4c37] font-medium';
                      keyBadgeClass = 'border-[#bcd2b8] bg-[#4d6148] text-white';
                    } else if (isSelected && !isOptionCorrect) {
                      optCardClass = 'border-[#e8c0b8] bg-[#fbf4f2] text-[#964f3f]';
                      keyBadgeClass = 'border-[#e8c0b8] bg-[#964f3f] text-white';
                    }
                  } else if (isSelected) {
                    optCardClass = 'border-[#82947d] bg-[#edf2ec] text-[#3b4c37] font-medium shadow-2xs';
                    keyBadgeClass = 'border-[#82947d] bg-[#82947d] text-white';
                  }

                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => handleSelectOption(opt.key)}
                      disabled={currentAns.isSubmitted && quizMode === 'instant'}
                      className={`w-full p-3 rounded-2xl border text-left transition-all flex items-start gap-3 ${optCardClass}`}
                    >
                      <span
                        className={`w-6 h-6 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 border mt-0.5 ${keyBadgeClass}`}
                      >
                        {opt.key}
                      </span>
                      <span className="text-xs sm:text-sm leading-relaxed flex-1 pt-0.5">
                        {opt.text}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : currentQ.type === 'true_false' ? (
              <div className="grid grid-cols-2 gap-3">
                {['正确', '错误'].map(val => {
                  const isSelected = currentAns.userAnswer === val;
                  let cardClass = 'border-[#e8e4dc] bg-white text-[#3d3d3d]';
                  if (currentAns.isSubmitted) {
                    if (currentQ.answer === val) {
                      cardClass = 'border-[#bcd2b8] bg-[#edf2ec] text-[#4d6148] font-bold';
                    } else if (isSelected) {
                      cardClass = 'border-[#e8c0b8] bg-[#fbf4f2] text-[#964f3f]';
                    }
                  } else if (isSelected) {
                    cardClass = 'border-[#82947d] bg-[#edf2ec] text-[#4d6148] font-bold';
                  }

                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleSelectOption(val)}
                      disabled={currentAns.isSubmitted && quizMode === 'instant'}
                      className={`p-3.5 rounded-2xl border text-center text-sm font-semibold transition-all ${cardClass}`}
                    >
                      {val === '正确' ? '✓ 正确' : '✕ 错误'}
                    </button>
                  );
                })}
              </div>
            ) : (
              // Fill-in or Essay input
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#4a4a4a] block">
                  请输入你的作答内容 / 核心关键词：
                </label>
                <textarea
                  rows={3}
                  placeholder="在此写下作答内容..."
                  value={currentAns.userAnswer}
                  onChange={e =>
                    setAnswersState(prev => ({
                      ...prev,
                      [currentQ.id]: {
                        ...prev[currentQ.id],
                        userAnswer: e.target.value,
                      },
                    }))
                  }
                  disabled={currentAns.isSubmitted && quizMode === 'instant'}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-[#e8e4dc] text-xs focus:outline-none focus:ring-2 focus:ring-[#82947d] bg-white text-[#3d3d3d]"
                />
              </div>
            )}

            {/* Instant Mode: Action Button (Submit current question or show explanation) */}
            {quizMode === 'instant' && !currentAns.isSubmitted && (
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleSubmitCurrentQuestion()}
                  disabled={!currentAns.userAnswer}
                  className="px-5 py-2 rounded-xl bg-[#82947d] hover:bg-[#71826d] text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>核对答案与查看解析</span>
                </button>
              </div>
            )}

            {/* Detailed Explanation Section (Shown after submission in instant mode, or after exam finished) */}
            {(currentAns.isSubmitted || (isFinished && quizMode === 'exam')) && (
              <div className="space-y-3 pt-2 animate-in fade-in duration-300">
                {/* Result Bar */}
                <div
                  className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    currentAns.isCorrect
                      ? currentAns.isHesitant
                        ? 'bg-[#fdf7ee] border-[#eedab9]'
                        : 'bg-[#edf2ec] border-[#bcd2b8]'
                      : 'bg-[#fbf4f2] border-[#e8c0b8]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {currentAns.isCorrect ? (
                      currentAns.isHesitant ? (
                        <AlertTriangle className="w-5 h-5 text-[#bfa07a]" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-[#4d6148]" />
                      )
                    ) : (
                      <XCircle className="w-5 h-5 text-[#964f3f]" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold ${
                            currentAns.isCorrect
                              ? currentAns.isHesitant
                                ? 'text-[#8d6023]'
                                : 'text-[#3b4c37]'
                              : 'text-[#964f3f]'
                          }`}
                        >
                          {currentAns.isCorrect
                            ? currentAns.isHesitant
                              ? '⚠️ 犹豫做对（潜意识模糊）'
                              : '✅ 回答正确！'
                            : '❌ 回答错误'}
                        </span>
                        <span className="text-xs font-semibold text-[#3d3d3d]">
                          标准答案: <span className="font-bold text-[#82947d]">{currentQ.answer}</span>
                        </span>
                        {currentAns.userAnswer && (
                          <span className="text-xs text-[#7c7467]">
                            (你的作答: {currentAns.userAnswer})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Hesitant & Error Tag Badges */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {currentAns.isCorrect && (
                      <button
                        type="button"
                        onClick={handleToggleHesitant}
                        className={`text-xs px-2.5 py-1 rounded-xl border transition-colors ${
                          currentAns.isHesitant
                            ? 'bg-[#fdf7ee] border-[#eedab9] text-[#8d6023] font-bold'
                            : 'bg-white border-[#e8e4dc] text-[#7c7467] hover:bg-[#faf8f5]'
                        }`}
                      >
                        {currentAns.isHesitant ? '✓ 已标记为犹豫做对' : '标记为犹豫/蒙对'}
                      </button>
                    )}

                    {!currentAns.isCorrect && (
                      <div className="flex items-center gap-1">
                        {['概念混淆', '审题马虎', '陷阱未识破', '盲区缺漏'].map(tag => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => handleSelectErrorTag(tag)}
                            className={`text-[11px] px-2 py-0.5 rounded-lg border transition-colors ${
                              currentAns.userErrorTag === tag
                                ? 'bg-[#964f3f] border-[#964f3f] text-white font-medium'
                                : 'bg-white border-[#e8e4dc] text-[#61594f] hover:bg-[#f5f2ed]'
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Structured In-Depth Explanation Box */}
                <div className="p-4 rounded-2xl bg-white border border-[#e8e4dc] shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#82947d]" />
                      <h4 className="text-xs font-bold text-[#3d3d3d]">
                        名师考点精解与易错点辨析
                      </h4>
                    </div>

                    {/* Add to Knowledge Flashcards */}
                    {onAddKnowledgePoint && (
                      <button
                        type="button"
                        onClick={handleSaveToKnowledge}
                        disabled={savedKnowledgeIds[currentQ.id]}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1 ${
                          savedKnowledgeIds[currentQ.id]
                            ? 'bg-[#edf2ec] border-[#bcd2b8] text-[#4d6148]'
                            : 'bg-[#faf8f5] border-[#e8e4dc] text-[#61594f] hover:bg-[#f5f2ed]'
                        }`}
                      >
                        <BookmarkPlus className="w-3.5 h-3.5" />
                        <span>{savedKnowledgeIds[currentQ.id] ? '已加入背诵考点库' : '一键加入背诵库'}</span>
                      </button>
                    )}
                  </div>

                  {/* Standard Explanation Content */}
                  <div className="text-xs sm:text-sm text-[#4a4a4a] leading-relaxed whitespace-pre-wrap bg-[#faf8f5] p-3.5 rounded-xl border border-[#e8e4dc]">
                    {currentQ.explanation}
                  </div>

                  {/* Interactive Custom AI Tutor Question Box */}
                  <div className="pt-2 border-t border-[#e8e4dc] space-y-2">
                    {currentAns.customAiExplanation && (
                      <div className="p-3.5 rounded-xl bg-[#fdf7ee] border border-[#eedab9] text-xs text-[#3d3d3d] space-y-1.5 animate-in fade-in">
                        <div className="flex items-center gap-1.5 text-[#8d6023] font-bold">
                          <Lightbulb className="w-4 h-4" />
                          <span>AI 名师深度答疑指导：</span>
                        </div>
                        <div className="leading-relaxed whitespace-pre-wrap font-sans text-xs">
                          {currentAns.customAiExplanation}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="对这道题还有疑问？问问 AI 导师（例如：为什么不能选C？帮我出句避坑口诀）..."
                        value={tutorQuery}
                        onChange={e => setTutorQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAskTutor()}
                        className="flex-1 px-3 py-1.5 rounded-xl border border-[#e8e4dc] text-xs focus:outline-none focus:ring-1 focus:ring-[#82947d] bg-[#faf8f5] text-[#3d3d3d]"
                      />
                      <button
                        type="button"
                        onClick={() => handleAskTutor()}
                        disabled={isTutorLoading || !tutorQuery.trim()}
                        className="px-3 py-1.5 rounded-xl bg-[#82947d] hover:bg-[#71826d] text-white text-xs font-medium transition-colors flex items-center gap-1 disabled:opacity-50 shrink-0 shadow-2xs"
                      >
                        {isTutorLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        <span>追问答疑</span>
                      </button>
                    </div>

                    {/* Quick Suggested Tutor Queries */}
                    {!currentAns.customAiExplanation && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] text-[#8c8275]">快捷追问:</span>
                        {[
                          '为什么不能选其它干扰项？',
                          '这道题的核心题眼和陷阱是什么？',
                          '请用一句朗朗上口的口诀帮我记住',
                        ].map((qText, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleAskTutor(qText)}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-[#f5f2ed] text-[#61594f] hover:bg-[#ebe6dd] transition-colors"
                          >
                            {qText}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Final Report & Summary View */
          <div className="flex-1 overflow-y-auto py-4 pr-1 space-y-4 animate-in fade-in duration-300">
            {/* Score & Summary Banner */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-[#faf8f5] to-[#f5f2ed] border border-[#e8e4dc] text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[#edf2ec] border border-[#bcd2b8] flex items-center justify-center text-[#4d6148] shadow-xs">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#3d3d3d]">刷题完成！作答复盘报告</h3>
                <p className="text-xs text-[#7c7467] mt-0.5">
                  题集：{setName} · 用时 {formatTime(elapsedSeconds)}
                </p>
              </div>

              {/* Accuracy Ring/Stat */}
              <div className="grid grid-cols-4 gap-2.5 max-w-lg mx-auto pt-2">
                <div className="p-3 bg-white rounded-2xl border border-[#e8e4dc]">
                  <span className="block text-[11px] text-[#7c7467]">总题数</span>
                  <span className="text-base font-black text-[#3d3d3d]">{totalQuestions} 题</span>
                </div>
                <div className="p-3 bg-[#edf2ec] rounded-2xl border border-[#bcd2b8]">
                  <span className="block text-[11px] text-[#4d6148]">做对数</span>
                  <span className="text-base font-black text-[#3b4c37]">
                    {correctCount} <span className="text-[10px] font-normal">({accuracyRate}%)</span>
                  </span>
                </div>
                <div className="p-3 bg-[#fdf7ee] rounded-2xl border border-[#eedab9]">
                  <span className="block text-[11px] text-[#8d6023]">犹豫做对</span>
                  <span className="text-base font-black text-[#734c19]">{hesitantCount} 题</span>
                </div>
                <div className="p-3 bg-[#fbf4f2] rounded-2xl border border-[#e8c0b8]">
                  <span className="block text-[11px] text-[#964f3f]">做错数</span>
                  <span className="text-base font-black text-[#7a3b2d]">{wrongCount} 题</span>
                </div>
              </div>
            </div>

            {/* AI Diagnosis */}
            <div className="p-4 rounded-2xl bg-white border border-[#e8e4dc] space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#3d3d3d]">
                <Sparkles className="w-4 h-4 text-[#82947d]" />
                <span>AI 复盘诊断与备考建议：</span>
              </div>
              <p className="text-xs text-[#61594f] leading-relaxed">
                {accuracyRate >= 90
                  ? '🔥 表现极佳！该模块基础非常扎实，建议将少量模糊题号加入艾宾浩斯复查清单巩固熟练度。'
                  : accuracyRate >= 70
                  ? '👍 整体掌握良好，但存在部分概念混淆与犹豫项，建议重点回顾错题解析中的干扰项剖析。'
                  : '💡 该模块属于当前薄弱环节，已为你自动提取错题考点并安排艾宾浩斯记忆复查，建议多结合口诀加深理解。'}
              </p>
            </div>

            {/* Wrong Questions List Recap */}
            {wrongCount > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#964f3f] flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>待巩固错题清单（共 {wrongCount} 题）：</span>
                </span>
                <div className="space-y-2">
                  {questions
                    .filter(q => answersState[q.id] && !answersState[q.id].isCorrect)
                    .map(wq => (
                      <div
                        key={wq.id}
                        className="p-3 rounded-xl bg-[#fbf4f2] border border-[#e8c0b8] flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="truncate flex-1">
                          <span className="font-bold text-[#964f3f] mr-2">
                            第 {wq.questionNumber} 题:
                          </span>
                          <span className="text-[#3d3d3d]">{wq.stem}</span>
                        </div>
                        <span className="text-[#8c8275] shrink-0">
                          正解: <strong className="text-[#4d6148]">{wq.answer}</strong>
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Navigation Bar */}
        <div className="pt-3 border-t border-[#e8e4dc] flex items-center justify-between gap-2">
          {!isFinished ? (
            <>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="px-3.5 py-2 rounded-xl border border-[#e8e4dc] text-xs font-medium text-[#61594f] hover:bg-[#f5f2ed] transition-colors disabled:opacity-40 flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>上一题</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentIndex(prev => Math.min(totalQuestions - 1, prev + 1))}
                  disabled={currentIndex === totalQuestions - 1}
                  className="px-3.5 py-2 rounded-xl border border-[#e8e4dc] text-xs font-medium text-[#61594f] hover:bg-[#f5f2ed] transition-colors disabled:opacity-40 flex items-center gap-1"
                >
                  <span>下一题</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                {quizMode === 'exam' || currentIndex === totalQuestions - 1 ? (
                  <button
                    type="button"
                    onClick={handleFinishExam}
                    className="px-5 py-2 rounded-xl bg-[#82947d] hover:bg-[#71826d] text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>交卷查看总成绩与复盘</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (!currentAns.isSubmitted) {
                        handleSubmitCurrentQuestion();
                      }
                      if (currentIndex < totalQuestions - 1) {
                        setCurrentIndex(currentIndex + 1);
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-[#82947d] hover:bg-[#71826d] text-white text-xs font-medium shadow-xs transition-colors flex items-center gap-1"
                  >
                    <span>下一题</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </>
          ) : (
            /* Finished Actions */
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={() => {
                  setIsFinished(false);
                  setCurrentIndex(0);
                }}
                className="px-4 py-2 rounded-xl border border-[#e8e4dc] text-xs font-medium text-[#61594f] hover:bg-[#f5f2ed] transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>逐题查看解析与错因</span>
              </button>

              <button
                id="save-quiz-to-practice-log-btn"
                type="button"
                onClick={handleSaveToPracticeLog}
                className="px-6 py-2.5 rounded-xl bg-[#82947d] hover:bg-[#71826d] text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>一键同步至刷题复盘并安排艾宾浩斯复查</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
