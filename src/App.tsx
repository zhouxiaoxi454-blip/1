import React, { useState, useEffect, useMemo } from 'react';
import {
  AppData,
  KnowledgePoint,
  QuestionPracticeLog,
  TipCard,
  Subject,
  RecallAction,
  Achievement,
  QuizQuestion,
} from './types';
import {
  loadAppData,
  saveAppData,
  getInitialSeedData,
  DEFAULT_SUBJECTS,
} from './utils/storage';
import {
  computeNextReview,
  getTodayDateString,
  addDaysToDate,
  isDateDueOrOverdue,
} from './utils/ebbinghaus';
import { checkNewAchievements } from './utils/achievements';

import { Header } from './components/Header';
import { TodayReviewView } from './components/TodayReviewView';
import { RecitationView } from './components/RecitationView';
import { PracticeView } from './components/PracticeView';
import { TipsView } from './components/TipsView';
import { CalendarWeeklyView } from './components/CalendarWeeklyView';
import { FlashcardRecallView } from './components/FlashcardRecallView';
import { SettingsSubjectView } from './components/SettingsSubjectView';

import { ModalQuickAddKnowledge } from './components/ModalQuickAddKnowledge';
import { ModalQuickAddPractice } from './components/ModalQuickAddPractice';
import { ModalSmartImportPractice } from './components/ModalSmartImportPractice';
import { InteractiveQuizModal } from './components/InteractiveQuizModal';
import { ModalQuickAddTip } from './components/ModalQuickAddTip';
import { ModalRandomTip } from './components/ModalRandomTip';
import { AchievementToast } from './components/AchievementToast';

export default function App() {
  const [appData, setAppData] = useState<AppData>(() => loadAppData());
  const [currentTab, setCurrentTab] = useState<string>('today');

  // Modals state
  const [isAddKnowledgeOpen, setIsAddKnowledgeOpen] = useState<boolean>(false);
  const [editingKnowledgePoint, setEditingKnowledgePoint] = useState<KnowledgePoint | null>(null);

  const [isAddPracticeOpen, setIsAddPracticeOpen] = useState<boolean>(false);
  const [editingPracticeLog, setEditingPracticeLog] = useState<QuestionPracticeLog | null>(null);

  const [isSmartImportOpen, setIsSmartImportOpen] = useState<boolean>(false);
  const [isInteractiveQuizOpen, setIsInteractiveQuizOpen] = useState<boolean>(false);
  const [activeQuizData, setActiveQuizData] = useState<{
    setName: string;
    subjectId: string;
    questions: QuizQuestion[];
  } | null>(null);

  const [isAddTipOpen, setIsAddTipOpen] = useState<boolean>(false);
  const [editingTip, setEditingTip] = useState<TipCard | null>(null);

  const [isRandomTipOpen, setIsRandomTipOpen] = useState<boolean>(false);
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);

  // Sync to local storage
  const updateAppData = (nextData: AppData, triggerContext?: any) => {
    setAppData(nextData);
    saveAppData(nextData);

    // Evaluate hidden achievements
    const ach = checkNewAchievements(nextData, triggerContext);
    if (ach) {
      const updatedUnlocked = Array.from(new Set([...(nextData.unlockedAchievements || []), ach.id]));
      const dataWithAch = { ...nextData, unlockedAchievements: updatedUnlocked };
      setAppData(dataWithAch);
      saveAppData(dataWithAch);
      setNewAchievement(ach);
    }
  };

  const today = getTodayDateString();

  // Due counts for header badge
  const dueKnowledgeCount = useMemo(() => {
    return appData.knowledgePoints.filter(k => isDateDueOrOverdue(k.nextReviewDate, today)).length;
  }, [appData.knowledgePoints, today]);

  const duePracticeCount = useMemo(() => {
    return appData.practiceLogs.filter(
      p => !p.reviewed && p.wrongCount > 0 && p.nextReviewDate && isDateDueOrOverdue(p.nextReviewDate, today)
    ).length;
  }, [appData.practiceLogs, today]);

  const totalDueCount = dueKnowledgeCount + duePracticeCount;

  // Set names for quick suggestions
  const existingSetNames = useMemo(() => {
    return Array.from(new Set(appData.practiceLogs.map(p => p.setName).filter(Boolean)));
  }, [appData.practiceLogs]);

  // Review Knowledge Point Action
  const handleReviewKnowledge = (pointId: string, action: RecallAction, streak?: number) => {
    const point = appData.knowledgePoints.find(k => k.id === pointId);
    if (!point) return;

    const updatedPoint = computeNextReview(point, action);
    const nextPoints = appData.knowledgePoints.map(k => (k.id === pointId ? updatedPoint : k));
    const nextData: AppData = { ...appData, knowledgePoints: nextPoints };

    updateAppData(nextData, {
      actionType: 'review_knowledge',
      recallAction: action,
      drillStreak: streak,
    });
  };

  // Review Wrong Question Practice Action
  const handleReviewPractice = (practiceId: string, result: 'mastered' | 'still_wrong') => {
    const nextLogs = appData.practiceLogs.map(p => {
      if (p.id !== practiceId) return p;

      const history = p.reviewHistory || [];
      const newHistory = [
        {
          date: today,
          result,
        },
        ...history,
      ];

      if (result === 'mastered') {
        return {
          ...p,
          reviewed: true,
          reviewHistory: newHistory,
        };
      } else {
        return {
          ...p,
          reviewed: false,
          nextReviewDate: addDaysToDate(today, 3), // Recheck in 3 days
          reviewHistory: newHistory,
        };
      }
    });

    const nextData: AppData = { ...appData, practiceLogs: nextLogs };
    updateAppData(nextData, {
      actionType: 'review_practice',
      completedWrongCheck: true,
    });
  };

  // Save Knowledge Point (Add or Edit)
  const handleSaveKnowledge = (pointData: Partial<KnowledgePoint>, isEdit: boolean) => {
    let nextPoints: KnowledgePoint[];

    if (isEdit) {
      nextPoints = appData.knowledgePoints.map(k => {
        if (k.id === pointData.id) {
          return {
            ...k,
            ...pointData,
          } as KnowledgePoint;
        }
        return k;
      });
    } else {
      const newPoint: KnowledgePoint = {
        id: pointData.id || 'kp_' + Date.now(),
        subjectId: pointData.subjectId || appData.subjects[0]?.id || 'sub_default',
        title: pointData.title || '',
        notes: pointData.notes || '',
        source: pointData.source,
        createdAt: today,
        nextReviewDate: pointData.nextReviewDate || today,
        reviewCount: 0,
        stage: 0,
        intervalDays: 1,
        lapses: 0,
        mastery: 'learning',
        history: [],
      };
      nextPoints = [newPoint, ...appData.knowledgePoints];
    }

    const nextData: AppData = { ...appData, knowledgePoints: nextPoints };
    updateAppData(nextData, { actionType: 'add_knowledge' });
  };

  const handleDeleteKnowledge = (pointId: string) => {
    const nextPoints = appData.knowledgePoints.filter(k => k.id !== pointId);
    const nextData: AppData = { ...appData, knowledgePoints: nextPoints };
    updateAppData(nextData);
  };

  // Batch Adjust Dates
  const handleBatchAdjustDates = (pointIds: string[], daysToAdd: number, specificDate?: string) => {
    const idSet = new Set(pointIds);
    const nextPoints = appData.knowledgePoints.map(k => {
      if (!idSet.has(k.id)) return k;
      const targetDate = specificDate ? specificDate : addDaysToDate(k.nextReviewDate, daysToAdd);
      return {
        ...k,
        nextReviewDate: targetDate,
      };
    });

    const nextData: AppData = { ...appData, knowledgePoints: nextPoints };
    updateAppData(nextData);
  };

  const handleBatchDeleteKnowledge = (pointIds: string[]) => {
    const idSet = new Set(pointIds);
    const nextPoints = appData.knowledgePoints.filter(k => !idSet.has(k.id));
    const nextData: AppData = { ...appData, knowledgePoints: nextPoints };
    updateAppData(nextData);
  };

  // Save Practice Log
  const handleSavePractice = (logData: Partial<QuestionPracticeLog>, isEdit: boolean) => {
    let nextLogs: QuestionPracticeLog[];

    if (isEdit) {
      nextLogs = appData.practiceLogs.map(p => {
        if (p.id === logData.id) {
          return {
            ...p,
            ...logData,
          } as QuestionPracticeLog;
        }
        return p;
      });
    } else {
      const newLog: QuestionPracticeLog = {
        id: logData.id || 'prac_' + Date.now(),
        subjectId: logData.subjectId || appData.subjects[0]?.id || 'sub_default',
        setName: logData.setName || '未命名练习',
        knowledgePointTitle: logData.knowledgePointTitle,
        questionNumbers: logData.questionNumbers || '全套',
        correctCount: logData.correctCount || 0,
        hesitantCount: logData.hesitantCount || 0,
        wrongCount: logData.wrongCount || 0,
        isIndependent: logData.isIndependent ?? true,
        errorTypes: logData.errorTypes || [],
        reflection: logData.reflection || '',
        createdAt: today,
        nextReviewDate: logData.nextReviewDate,
        reviewed: false,
        reviewHistory: [],
      };
      nextLogs = [newLog, ...appData.practiceLogs];
    }

    const nextData: AppData = { ...appData, practiceLogs: nextLogs };
    updateAppData(nextData, { actionType: 'add_practice' });
  };

  const handleDeletePractice = (logId: string) => {
    const nextLogs = appData.practiceLogs.filter(p => p.id !== logId);
    const nextData: AppData = { ...appData, practiceLogs: nextLogs };
    updateAppData(nextData);
  };

  // Save Tip Card
  const handleSaveTip = (tipData: Partial<TipCard>, isEdit: boolean) => {
    let nextTips: TipCard[];

    if (isEdit) {
      nextTips = appData.tips.map(t => {
        if (t.id === tipData.id) {
          return {
            ...t,
            ...tipData,
          } as TipCard;
        }
        return t;
      });
    } else {
      const newTip: TipCard = {
        id: tipData.id || 'tip_' + Date.now(),
        subjectId: tipData.subjectId || appData.subjects[0]?.id || 'sub_default',
        title: tipData.title || '',
        content: tipData.content || '',
        source: tipData.source,
        tags: tipData.tags || [],
        createdAt: today,
      };
      nextTips = [newTip, ...appData.tips];
    }

    const nextData: AppData = { ...appData, tips: nextTips };
    updateAppData(nextData, { actionType: 'add_tip' });
  };

  const handleDeleteTip = (tipId: string) => {
    const nextTips = appData.tips.filter(t => t.id !== tipId);
    const nextData: AppData = { ...appData, tips: nextTips };
    updateAppData(nextData);
  };

  // Update Subjects
  const handleUpdateSubjects = (newSubjects: Subject[]) => {
    const nextData: AppData = { ...appData, subjects: newSubjects };
    updateAppData(nextData);
  };

  // Restore Data from Backup
  const handleRestoreData = (restored: AppData) => {
    setAppData(restored);
  };

  // Clear Data
  const handleClearData = () => {
    const initial = getInitialSeedData();
    initial.knowledgePoints = [];
    initial.practiceLogs = [];
    initial.tips = [];
    initial.unlockedAchievements = [];
    setAppData(initial);
    saveAppData(initial);
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-[#4a4a4a] flex flex-col font-sans selection:bg-[#82947d] selection:text-white">
      {/* Top Sticky Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        dueCount={totalDueCount}
        knowledgeCount={appData.knowledgePoints.length}
        practiceCount={appData.practiceLogs.length}
        tipsCount={appData.tips.length}
        onOpenAddKnowledge={() => {
          setEditingKnowledgePoint(null);
          setIsAddKnowledgeOpen(true);
        }}
        onOpenAddPractice={() => {
          setEditingPracticeLog(null);
          setIsAddPracticeOpen(true);
        }}
        onOpenAddTip={() => {
          setEditingTip(null);
          setIsAddTipOpen(true);
        }}
        onOpenRandomTip={() => {
          setIsRandomTipOpen(true);
          // Check achievement for flipping tip
          updateAppData(appData, { flippedTip: true });
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'today' && (
          <TodayReviewView
            knowledgePoints={appData.knowledgePoints}
            practiceLogs={appData.practiceLogs}
            subjects={appData.subjects}
            onReviewKnowledge={handleReviewKnowledge}
            onReviewPractice={handleReviewPractice}
            onOpenAddKnowledge={() => {
              setEditingKnowledgePoint(null);
              setIsAddKnowledgeOpen(true);
            }}
            onOpenFlashcard={() => setCurrentTab('flashcard')}
            onOpenRandomTip={() => {
              setIsRandomTipOpen(true);
              updateAppData(appData, { flippedTip: true });
            }}
          />
        )}

        {currentTab === 'recitation' && (
          <RecitationView
            knowledgePoints={appData.knowledgePoints}
            subjects={appData.subjects}
            onAddKnowledge={() => {
              setEditingKnowledgePoint(null);
              setIsAddKnowledgeOpen(true);
            }}
            onEditKnowledge={pt => {
              setEditingKnowledgePoint(pt);
              setIsAddKnowledgeOpen(true);
            }}
            onDeleteKnowledge={handleDeleteKnowledge}
            onReviewKnowledge={handleReviewKnowledge}
            onBatchAdjustDates={handleBatchAdjustDates}
            onBatchDelete={handleBatchDeleteKnowledge}
          />
        )}

        {currentTab === 'practice' && (
          <PracticeView
            practiceLogs={appData.practiceLogs}
            subjects={appData.subjects}
            onAddPractice={() => {
              setEditingPracticeLog(null);
              setIsAddPracticeOpen(true);
            }}
            onOpenSmartImport={() => setIsSmartImportOpen(true)}
            onEditPractice={log => {
              setEditingPracticeLog(log);
              setIsAddPracticeOpen(true);
            }}
            onDeletePractice={handleDeletePractice}
            onReviewPractice={handleReviewPractice}
          />
        )}

        {currentTab === 'tips' && (
          <TipsView
            tips={appData.tips}
            subjects={appData.subjects}
            onAddTip={() => {
              setEditingTip(null);
              setIsAddTipOpen(true);
            }}
            onEditTip={t => {
              setEditingTip(t);
              setIsAddTipOpen(true);
            }}
            onDeleteTip={handleDeleteTip}
            onOpenRandomTip={() => {
              setIsRandomTipOpen(true);
              updateAppData(appData, { flippedTip: true });
            }}
          />
        )}

        {currentTab === 'calendar' && (
          <CalendarWeeklyView
            knowledgePoints={appData.knowledgePoints}
            practiceLogs={appData.practiceLogs}
            subjects={appData.subjects}
          />
        )}

        {currentTab === 'flashcard' && (
          <FlashcardRecallView
            knowledgePoints={appData.knowledgePoints}
            subjects={appData.subjects}
            onReviewKnowledge={handleReviewKnowledge}
            onClose={() => setCurrentTab('today')}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsSubjectView
            appData={appData}
            onUpdateSubjects={handleUpdateSubjects}
            onRestoreData={handleRestoreData}
            onClearData={handleClearData}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#e8e4dc] bg-[#fdfbf7]/90 py-5 text-center text-xs text-[#8c8275] mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>备考复习记录 · 科学主动回忆与艾宾浩斯循环系统</span>
          <span className="text-[11px] text-[#8c8275]">
            全部数据安全存储于本地浏览器 · 支持导出 JSON 离线备份
          </span>
        </div>
      </footer>

      {/* Modals */}
      <ModalQuickAddKnowledge
        isOpen={isAddKnowledgeOpen}
        onClose={() => {
          setIsAddKnowledgeOpen(false);
          setEditingKnowledgePoint(null);
        }}
        subjects={appData.subjects}
        onSave={handleSaveKnowledge}
        editPoint={editingKnowledgePoint}
      />

      <ModalQuickAddPractice
        isOpen={isAddPracticeOpen}
        onClose={() => {
          setIsAddPracticeOpen(false);
          setEditingPracticeLog(null);
        }}
        subjects={appData.subjects}
        existingSets={existingSetNames}
        onSave={handleSavePractice}
        editLog={editingPracticeLog}
      />

      {/* Smart Question Import Modal */}
      <ModalSmartImportPractice
        isOpen={isSmartImportOpen}
        onClose={() => setIsSmartImportOpen(false)}
        subjects={appData.subjects}
        onStartQuiz={quizData => {
          setActiveQuizData(quizData);
          setIsInteractiveQuizOpen(true);
        }}
      />

      {/* Interactive Quiz Answering Modal */}
      {activeQuizData && (
        <InteractiveQuizModal
          isOpen={isInteractiveQuizOpen}
          onClose={() => {
            setIsInteractiveQuizOpen(false);
            setActiveQuizData(null);
          }}
          setName={activeQuizData.setName}
          subjectId={activeQuizData.subjectId}
          subjects={appData.subjects}
          questions={activeQuizData.questions}
          onSavePracticeLog={logData => {
            handleSavePractice(logData, false);
            setIsInteractiveQuizOpen(false);
            setActiveQuizData(null);
          }}
          onAddKnowledgePoint={pointData => {
            handleSaveKnowledge(pointData, false);
          }}
        />
      )}

      <ModalQuickAddTip
        isOpen={isAddTipOpen}
        onClose={() => {
          setIsAddTipOpen(false);
          setEditingTip(null);
        }}
        subjects={appData.subjects}
        onSave={handleSaveTip}
        editTip={editingTip}
      />

      <ModalRandomTip
        isOpen={isRandomTipOpen}
        onClose={() => setIsRandomTipOpen(false)}
        tips={appData.tips}
        subjects={appData.subjects}
      />

      {/* Hidden Achievement Celebration Toast */}
      <AchievementToast
        achievement={newAchievement}
        onClose={() => setNewAchievement(null)}
      />
    </div>
  );
}
