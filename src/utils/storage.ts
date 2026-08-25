import { AppData, Subject, KnowledgePoint, QuestionPracticeLog, TipCard } from '../types';
import { getTodayDateString, addDaysToDate } from './ebbinghaus';

const STORAGE_KEY = 'exam_review_app_data_v1';
const CURRENT_VERSION = 1;

export const DEFAULT_SUBJECTS: Subject[] = [
  {
    id: 'sub_pol',
    name: '政治 / 理论',
    color: '#c17f6f', // Terracotta Clay
    customErrorTags: ['时政混淆', '主旨理解偏差', '马原概念颠倒', '史纲时间线错乱'],
  },
  {
    id: 'sub_eng',
    name: '英语 / 外语',
    color: '#607d8b', // Slate Blue-Gray
    customErrorTags: ['长难句断句错误', '熟词生义误判', '逻辑指代不清', '作文句式单一'],
  },
  {
    id: 'sub_prof1',
    name: '专业课一',
    color: '#82947d', // Sage Green
    customErrorTags: ['法条要件缺失', '核心定义不严谨', '案例对应错误', '论述缺乏深度'],
  },
  {
    id: 'sub_prof2',
    name: '专业课二 / 综合',
    color: '#bfa07a', // Warm Ochre Tan
    customErrorTags: ['公式遗忘', '跨章节综合不足', '解题步骤不规范', '缺乏关键采分点'],
  },
];

export function getInitialSeedData(): AppData {
  const today = getTodayDateString();
  const yesterday = addDaysToDate(today, -1);
  const tomorrow = addDaysToDate(today, 1);
  const threeDaysLater = addDaysToDate(today, 3);

  const defaultKnowledgePoints: KnowledgePoint[] = [
    {
      id: 'kp_1',
      subjectId: 'sub_pol',
      title: '唯物辩证法的三大基本规律及核心',
      notes: '1. 对立统一规律（唯物辩证法的实质与核心、根本动力）\n2. 质量互变规律（发展的形式与状态）\n3. 否定之否定规律（发展的方向与道路：波浪式前进、螺旋式上升）',
      source: '马原·第二章辩证法',
      createdAt: yesterday,
      nextReviewDate: today, // Due today!
      reviewCount: 1,
      stage: 1,
      intervalDays: 1,
      lapses: 0,
      mastery: 'learning',
      history: [
        {
          date: yesterday + ' 19:30',
          action: 'extracted',
          newInterval: 1,
        },
      ],
    },
    {
      id: 'kp_2',
      subjectId: 'sub_eng',
      title: '阅读理解「转折/让步」长难句解题口诀',
      notes: '1. Although/While/Despite 引导让步状语时，主句才是作者真正观点！\n2. However/But/Yet 出现后，后一句 90% 是出题段落中心句。\n3. 破折号、冒号后是同位解释，生词多可快速略读抓主干。',
      source: '英语历年真题精讲',
      createdAt: yesterday,
      nextReviewDate: today, // Due today!
      reviewCount: 1,
      stage: 1,
      intervalDays: 1,
      lapses: 0,
      mastery: 'learning',
      history: [
        {
          date: yesterday + ' 21:00',
          action: 'extracted',
          newInterval: 1,
        },
      ],
    },
    {
      id: 'kp_3',
      subjectId: 'sub_prof1',
      title: '正当防卫与紧急避险的核心构成要件对比',
      notes: '【正当防卫】针对不法侵害人本人；不能超过必要限度造成重大损害；保护本人或他人合法权益。\n【紧急避险】针对第三者合法权益；必须迫不得已（无其他途径）；损害利益必须小于保全利益（生命权不可避险）。',
      source: '刑法总则·阻却违法事由',
      createdAt: addDaysToDate(today, -3),
      nextReviewDate: tomorrow,
      reviewCount: 2,
      stage: 2,
      intervalDays: 4,
      lapses: 0,
      mastery: 'reviewing',
      history: [
        { date: addDaysToDate(today, -3) + ' 15:00', action: 'extracted', newInterval: 1 },
        { date: addDaysToDate(today, -1) + ' 10:00', action: 'extracted', newInterval: 4 },
      ],
    },
    {
      id: 'kp_4',
      subjectId: 'sub_prof2',
      title: '泰勒公式常用展开式（sinx, cosx, e^x, ln(1+x)）',
      notes: '1. e^x = 1 + x + x^2/2! + ... + x^n/n! + o(x^n)\n2. sinx = x - x^3/3! + x^5/5! - ...\n3. cosx = 1 - x^2/2! + x^4/4! - ...\n4. ln(1+x) = x - x^2/2 + x^3/3 - x^4/4 + ...',
      source: '高等数学·微分中值定理',
      createdAt: addDaysToDate(today, -7),
      nextReviewDate: threeDaysLater,
      reviewCount: 3,
      stage: 3,
      intervalDays: 7,
      lapses: 1,
      mastery: 'reviewing',
      history: [
        { date: addDaysToDate(today, -7) + ' 14:00', action: 'forgotten', newInterval: 1 },
        { date: addDaysToDate(today, -6) + ' 09:00', action: 'extracted', newInterval: 2 },
        { date: addDaysToDate(today, -4) + ' 08:30', action: 'extracted', newInterval: 7 },
      ],
    },
  ];

  const defaultPracticeLogs: QuestionPracticeLog[] = [
    {
      id: 'prac_1',
      subjectId: 'sub_pol',
      setName: '真题汇编精炼 100 题',
      knowledgePointTitle: '近代中国社会的主要矛盾与历史任务',
      questionNumbers: '单选 1-15, 21-25',
      correctCount: 15,
      hesitantCount: 3,
      wrongCount: 2,
      isIndependent: true,
      errorTypes: ['概念混淆', '时政混淆'],
      reflection: '第8题把「主要矛盾」和「根本任务」搞混了。主要矛盾是帝国主义与中华民族、封建主义与人民大众；第22题没看清题干问的是「根本动力」还是「直接动力」。',
      createdAt: yesterday,
      nextReviewDate: today,
      reviewed: false,
      reviewHistory: [],
    },
    {
      id: 'prac_2',
      subjectId: 'sub_eng',
      setName: '2022年真题阅读 Text 2',
      knowledgePointTitle: '主旨大意与态度观点题',
      questionNumbers: '26-30',
      correctCount: 4,
      hesitantCount: 0,
      wrongCount: 1,
      isIndependent: true,
      errorTypes: ['掉入干扰项陷阱', '未理解题干核心'],
      reflection: '第28题选了反讽态度的字面解释，忽视了首段末句与尾段的呼应。记住：议论文观点看首尾段主旨句！',
      createdAt: addDaysToDate(today, -2),
      nextReviewDate: tomorrow,
      reviewed: false,
      reviewHistory: [],
    },
  ];

  const defaultTips: TipCard[] = [
    {
      id: 'tip_1',
      subjectId: 'sub_eng',
      title: '三步排除绝对化错误选项',
      content: '1. 含有 always, never, completely, exclusively 等绝对词的选项 95% 为错误干扰项。\n2. 含有 may, might, can, partly, tend to 等缓和语气的选项多为正确答案。\n3. 原文同义改写的才是真理，直接照抄原句冷僻词的大概率是断章取义！',
      source: '考研英语命题人逻辑解析',
      tags: ['阅读理解', '排除法', '快速提分'],
      createdAt: yesterday,
    },
    {
      id: 'tip_2',
      subjectId: 'sub_pol',
      title: '主观题采分点答题框架口诀',
      content: '【三段论答题法】\n第一步：亮明观点/定性（写出核心马原原理/法理名称）；\n第二步：结合材料阐述（抄材料要提炼，别全抄）；\n第三步：联系实际+方法论总结（启示与我们应该怎么做）。分条标号 ①②③ 老师给分最爽快！',
      source: '高分学长主观题答题卡模板',
      tags: ['大题模板', '采分点', '政治大题'],
      createdAt: yesterday,
    },
    {
      id: 'tip_3',
      subjectId: 'sub_prof1',
      title: '论述题遇冷门考点的急救万能公式',
      content: '万一遇到冷门没背全的名词：\n1. 从字面拆解定义（如“比例原则”拆为目的正当、手段必要、相称均衡）；\n2. 讲其在整个学科框架中的定位与价值（保护了什么权益，规范了什么权力）；\n3. 举一个正反典型案例论证，字数饱满逻辑清晰！',
      source: '备考技巧锦囊',
      tags: ['考场应变', '论述技巧'],
      createdAt: today,
    },
  ];

  return {
    version: CURRENT_VERSION,
    subjects: DEFAULT_SUBJECTS,
    knowledgePoints: defaultKnowledgePoints,
    practiceLogs: defaultPracticeLogs,
    tips: defaultTips,
    unlockedAchievements: [],
  };
}

export function loadAppData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getInitialSeedData();
      saveAppData(initial);
      return initial;
    }
    const parsed = JSON.parse(raw) as AppData;
    // Data schema check and migration if needed
    if (!parsed.subjects || !Array.isArray(parsed.subjects) || parsed.subjects.length === 0) {
      parsed.subjects = DEFAULT_SUBJECTS;
    }
    if (!parsed.knowledgePoints) parsed.knowledgePoints = [];
    if (!parsed.practiceLogs) parsed.practiceLogs = [];
    if (!parsed.tips) parsed.tips = [];
    if (!parsed.unlockedAchievements) parsed.unlockedAchievements = [];
    return parsed;
  } catch (err) {
    console.error('Error loading app data from storage:', err);
    return getInitialSeedData();
  }
}

export function saveAppData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Error saving app data to storage:', err);
  }
}

export function exportDataAsJson(data: AppData): void {
  const dateStr = getTodayDateString();
  const fileName = `备考复习记录_数据备份_${dateStr}.json`;
  const exportPayload = {
    ...data,
    lastBackupDate: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importDataFromJson(file: File): Promise<{ success: boolean; message: string; data?: AppData }> {
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object') {
      return { success: false, message: '无效的 JSON 文件格式' };
    }
    if (!Array.isArray(parsed.knowledgePoints) && !Array.isArray(parsed.practiceLogs) && !Array.isArray(parsed.subjects)) {
      return { success: false, message: '文件不包含合法的备考记录数据' };
    }

    const validated: AppData = {
      version: parsed.version || CURRENT_VERSION,
      subjects: Array.isArray(parsed.subjects) && parsed.subjects.length > 0 ? parsed.subjects : DEFAULT_SUBJECTS,
      knowledgePoints: Array.isArray(parsed.knowledgePoints) ? parsed.knowledgePoints : [],
      practiceLogs: Array.isArray(parsed.practiceLogs) ? parsed.practiceLogs : [],
      tips: Array.isArray(parsed.tips) ? parsed.tips : [],
      unlockedAchievements: Array.isArray(parsed.unlockedAchievements) ? parsed.unlockedAchievements : [],
      lastBackupDate: parsed.lastBackupDate,
    };

    saveAppData(validated);
    return { success: true, message: '数据恢复成功！', data: validated };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return { success: false, message: `解析失败：${errorMessage}` };
  }
}
