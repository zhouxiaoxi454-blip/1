import { KnowledgePoint, RecallAction, ReviewLog } from '../types';

/**
 * Standard Ebbinghaus / Spaced Repetition interval ladder (in days)
 * Stage 0 (New): 1 day
 * Stage 1: 2 days
 * Stage 2: 4 days
 * Stage 3: 7 days
 * Stage 4: 15 days
 * Stage 5: 30 days
 * Stage 6+: 60 days, 120 days...
 */
export const INTERVAL_LADDER = [1, 2, 4, 7, 15, 30, 60, 120];

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatRelativeDate(dateStr: string): string {
  const today = getTodayDateString();
  if (dateStr === today) return '今天';
  
  const dToday = new Date(today + 'T00:00:00');
  const dTarget = new Date(dateStr + 'T00:00:00');
  const diffDays = Math.round((dTarget.getTime() - dToday.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return '明天';
  if (diffDays === 2) return '后天';
  if (diffDays === -1) return '昨天 (已逾期)';
  if (diffDays < -1) return `逾期 ${Math.abs(diffDays)} 天`;
  if (diffDays > 0) return `${diffDays} 天后`;
  return dateStr;
}

export function addDaysToDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isDateDueOrOverdue(targetDate: string, referenceDate: string = getTodayDateString()): boolean {
  return targetDate <= referenceDate;
}

export function isDateDueToday(targetDate: string, referenceDate: string = getTodayDateString()): boolean {
  return targetDate === referenceDate;
}

export function isDateOverdue(targetDate: string, referenceDate: string = getTodayDateString()): boolean {
  return targetDate < referenceDate;
}

/**
 * Calculate the next state of a knowledge point based on recall action
 */
export function computeNextReview(
  point: KnowledgePoint,
  action: RecallAction,
  customRescheduleDate?: string
): KnowledgePoint {
  const today = getTodayDateString();
  const nowTime = new Date().toISOString().replace('T', ' ').substring(0, 16);

  let newStage = point.stage;
  let newInterval = point.intervalDays;
  let newLapses = point.lapses;
  let newReviewCount = point.reviewCount;
  let nextDate = '';

  if (action === 'skipped') {
    // Skip today: does not count as review attempt, no penalty
    nextDate = customRescheduleDate || addDaysToDate(today, 1);
  } else if (action === 'extracted') {
    // 独立提取: Progress along the ladder
    newReviewCount += 1;
    newStage = point.stage + 1;
    if (newStage < INTERVAL_LADDER.length) {
      newInterval = INTERVAL_LADDER[newStage];
    } else {
      newInterval = Math.max(30, Math.round(point.intervalDays * 2));
    }
    nextDate = addDaysToDate(today, newInterval);
  } else if (action === 'hinted') {
    // 需要提示: Slower progress, interval nudges slightly (1 or 2 days)
    newReviewCount += 1;
    newInterval = Math.max(1, Math.min(point.intervalDays, 3));
    // Don't advance stage too much
    newStage = Math.max(0, point.stage);
    nextDate = addDaysToDate(today, Math.max(1, Math.round(newInterval)));
  } else if (action === 'forgotten') {
    // 没想起来: Reset interval to 1 day, record lapse
    newReviewCount += 1;
    newLapses += 1;
    newStage = 0;
    newInterval = 1;
    nextDate = addDaysToDate(today, 1);
  }

  // Determine mastery tag
  let mastery = point.mastery;
  if (action !== 'skipped') {
    if (newStage >= 4 && newReviewCount >= 4) {
      mastery = 'mastered';
    } else if (newStage >= 2 || newReviewCount >= 2) {
      mastery = 'reviewing';
    } else {
      mastery = 'learning';
    }
  }

  const log: ReviewLog = {
    date: nowTime,
    action,
    previousInterval: point.intervalDays,
    newInterval: action === 'skipped' ? point.intervalDays : newInterval,
  };

  return {
    ...point,
    stage: newStage,
    intervalDays: newInterval,
    lapses: newLapses,
    reviewCount: newReviewCount,
    mastery,
    lastReviewedAt: action === 'skipped' ? point.lastReviewedAt : today,
    nextReviewDate: nextDate,
    history: [log, ...(point.history || [])],
  };
}

/**
 * Common pre-defined error tags for questions
 */
export const DEFAULT_COMMON_ERROR_TAGS = [
  '审题不清',
  '概念混淆',
  '记忆盲区',
  '公式变形错误',
  '计算/运算失误',
  '掉入干扰项陷阱',
  '未理解题干核心',
  '粗心大意',
];
