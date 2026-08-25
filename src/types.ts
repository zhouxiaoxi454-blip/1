export interface Subject {
  id: string;
  name: string;
  color: string; // Tailwind color token or hex
  customErrorTags?: string[];
}

export type RecallAction = 'extracted' | 'hinted' | 'forgotten' | 'skipped';

export interface ReviewLog {
  date: string; // YYYY-MM-DD HH:mm
  action: RecallAction;
  note?: string;
  previousInterval?: number;
  newInterval?: number;
}

export type MasteryLevel = 'new' | 'learning' | 'reviewing' | 'mastered';

export interface KnowledgePoint {
  id: string;
  subjectId: string;
  title: string; // 知识点名称
  notes: string; // 核心记忆要点 / 答案 / 助记口诀
  source?: string; // 来源 / 模块 / 章节 (可选)
  createdAt: string; // YYYY-MM-DD
  nextReviewDate: string; // YYYY-MM-DD
  lastReviewedAt?: string;
  reviewCount: number; // 已复习遍数
  stage: number; // 艾宾浩斯阶数 (0, 1, 2, 3, 4, 5...)
  intervalDays: number; // 当前记忆间隔天数
  lapses: number; // 没想起来/遗忘次数
  mastery: MasteryLevel;
  history: ReviewLog[];
}

export interface PracticeReviewHistory {
  date: string;
  result: 'mastered' | 'still_wrong';
  note?: string;
}

export interface QuestionPracticeLog {
  id: string;
  subjectId: string;
  setName: string; // 题集名称 (如 "1000题第一章", "2024真题")
  knowledgePointTitle?: string; // 关联知识点
  questionNumbers: string; // 题号范围或具体题号 (如 "1-15, 22")
  correctCount: number; // 做对数
  hesitantCount: number; // 犹豫做对数
  wrongCount: number; // 做错数
  isIndependent: boolean; // 是否独立完成
  errorTypes: string[]; // 错误类型标签
  reflection: string; // 简短复盘 / 错因与正解
  createdAt: string; // YYYY-MM-DD
  nextReviewDate?: string; // 错题下次复查日期
  reviewed: boolean; // 是否已完成复查
  reviewHistory?: PracticeReviewHistory[];
}

export interface TipCard {
  id: string;
  subjectId: string;
  title: string; // 口诀/技巧标题
  content: string; // 技巧详情/排除口诀
  source?: string; // 技巧来源
  tags: string[];
  createdAt: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
}

export interface QuizQuestionOption {
  key: string; // e.g. 'A', 'B', 'C', 'D'
  text: string;
}

export type QuizQuestionType =
  | 'single_choice'
  | 'multiple_choice'
  | 'true_false'
  | 'fill_blank'
  | 'essay';

export interface QuizQuestion {
  id: string;
  questionNumber: string;
  type: QuizQuestionType;
  stem: string;
  options?: QuizQuestionOption[];
  answer: string;
  explanation: string;
  knowledgePoint?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface QuizAnswerState {
  userAnswer: string;
  isSubmitted: boolean;
  isCorrect?: boolean;
  isHesitant?: boolean;
  userErrorTag?: string;
  customAiExplanation?: string;
}

export interface AppData {
  version: number;
  subjects: Subject[];
  knowledgePoints: KnowledgePoint[];
  practiceLogs: QuestionPracticeLog[];
  tips: TipCard[];
  unlockedAchievements: string[]; // list of achievement ids
  lastBackupDate?: string;
}
