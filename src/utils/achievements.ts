import { Achievement, AppData } from '../types';

export const ALL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_recall',
    title: '初试锋芒',
    description: '迈出主动回忆第一步，完成第 1 次知识点复查！',
    icon: '🌱',
  },
  {
    id: 'first_independent',
    title: '独立提取',
    description: '无需提示，第一次完全靠大脑提取出正确答案！',
    icon: '⚡',
  },
  {
    id: 'ten_knowledge',
    title: '筑基小成',
    description: '知识库累计录入超过 10 个核心考点！',
    icon: '📚',
  },
  {
    id: 'fifty_knowledge',
    title: '博闻强识',
    description: '知识库累计录入突破 50 个考点，知识体系正在成型！',
    icon: '🏛️',
  },
  {
    id: 'hundred_knowledge',
    title: '百炼成钢',
    description: '知识库突破 100 个考点，构建了坚实的考点防线！',
    icon: '🛡️',
  },
  {
    id: 'five_mastery',
    title: '炉火纯青',
    description: '有 5 个知识点已达到「熟练掌握」级别！',
    icon: '💎',
  },
  {
    id: 'first_practice',
    title: '真题实战',
    description: '完成第 1 次刷题复盘，对错题进行了深度剖析！',
    icon: '🎯',
  },
  {
    id: 'ten_practice',
    title: '百题斩',
    description: '累计完成 10 组刷题记录复盘！',
    icon: '🏹',
  },
  {
    id: 'wrong_review_done',
    title: '斩断错因',
    description: '成功完成错题二次复查并攻克难点！',
    icon: '🗡️',
  },
  {
    id: 'first_tip',
    title: '灵光一现',
    description: '记录了第 1 张答题技巧或口诀小纸条！',
    icon: '💡',
  },
  {
    id: 'random_tip_flip',
    title: '开卷有益',
    description: '使用了“随机翻一条”抽查技巧小纸条！',
    icon: '🎲',
  },
  {
    id: 'clear_today',
    title: '日事日清',
    description: '清空了今天所有待复查任务，今日事今日毕！',
    icon: '🌟',
  },
  {
    id: 'night_owl',
    title: '披星戴月',
    description: '在深夜（21:00-05:00）潜心复习，静心笃行！',
    icon: '🌙',
  },
  {
    id: 'early_bird',
    title: '晨光破晓',
    description: '在清晨（05:00-08:30）开启晨读复习，早起的鸟儿有虫吃！',
    icon: '🌅',
  },
  {
    id: 'drill_streak',
    title: '闪电记忆',
    description: '在随机抽查中连续 3 次成功独立提取！',
    icon: '🔥',
  },
];

/**
 * Check if any new achievement is unlocked after an action
 * Returns the newly unlocked achievement or null
 */
export function checkNewAchievements(
  appData: AppData,
  triggerContext?: {
    actionType?: string;
    recallAction?: string;
    drillStreak?: number;
    completedWrongCheck?: boolean;
    flippedTip?: boolean;
  }
): Achievement | null {
  const unlocked = new Set(appData.unlockedAchievements || []);
  const nowHour = new Date().getHours();

  for (const ach of ALL_ACHIEVEMENTS) {
    if (unlocked.has(ach.id)) continue;

    let shouldUnlock = false;

    if (ach.id === 'first_recall') {
      const totalReviews = appData.knowledgePoints.reduce((acc, k) => acc + (k.history?.length || 0), 0);
      if (totalReviews >= 1) shouldUnlock = true;
    } else if (ach.id === 'first_independent') {
      if (triggerContext?.recallAction === 'extracted') {
        shouldUnlock = true;
      } else {
        const hasExtracted = appData.knowledgePoints.some(k =>
          k.history?.some(h => h.action === 'extracted')
        );
        if (hasExtracted) shouldUnlock = true;
      }
    } else if (ach.id === 'ten_knowledge') {
      if (appData.knowledgePoints.length >= 10) shouldUnlock = true;
    } else if (ach.id === 'fifty_knowledge') {
      if (appData.knowledgePoints.length >= 50) shouldUnlock = true;
    } else if (ach.id === 'hundred_knowledge') {
      if (appData.knowledgePoints.length >= 100) shouldUnlock = true;
    } else if (ach.id === 'five_mastery') {
      const masteredCount = appData.knowledgePoints.filter(k => k.mastery === 'mastered').length;
      if (masteredCount >= 5) shouldUnlock = true;
    } else if (ach.id === 'first_practice') {
      if (appData.practiceLogs.length >= 1) shouldUnlock = true;
    } else if (ach.id === 'ten_practice') {
      if (appData.practiceLogs.length >= 10) shouldUnlock = true;
    } else if (ach.id === 'wrong_review_done') {
      if (triggerContext?.completedWrongCheck || appData.practiceLogs.some(p => (p.reviewHistory?.length || 0) > 0)) {
        shouldUnlock = true;
      }
    } else if (ach.id === 'first_tip') {
      if (appData.tips.length >= 1) shouldUnlock = true;
    } else if (ach.id === 'random_tip_flip') {
      if (triggerContext?.flippedTip) shouldUnlock = true;
    } else if (ach.id === 'night_owl') {
      if (nowHour >= 21 || nowHour < 5) shouldUnlock = true;
    } else if (ach.id === 'early_bird') {
      if (nowHour >= 5 && nowHour < 9) shouldUnlock = true;
    } else if (ach.id === 'drill_streak') {
      if ((triggerContext?.drillStreak || 0) >= 3) shouldUnlock = true;
    }

    if (shouldUnlock) {
      return ach;
    }
  }

  return null;
}
