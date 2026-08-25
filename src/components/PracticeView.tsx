import React, { useState } from 'react';
import { QuestionPracticeLog, Subject } from '../types';
import { formatRelativeDate, getTodayDateString } from '../utils/ebbinghaus';
import {
  PenLine,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Clock,
  Trash2,
  Edit2,
  BarChart3,
  Dices,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Sparkles,
  UploadCloud,
} from 'lucide-react';

interface Props {
  practiceLogs: QuestionPracticeLog[];
  subjects: Subject[];
  onAddPractice: () => void;
  onOpenSmartImport?: () => void;
  onEditPractice: (log: QuestionPracticeLog) => void;
  onDeletePractice: (logId: string) => void;
  onReviewPractice: (logId: string, result: 'mastered' | 'still_wrong') => void;
}

export const PracticeView: React.FC<Props> = ({
  practiceLogs,
  subjects,
  onAddPractice,
  onOpenSmartImport,
  onEditPractice,
  onDeletePractice,
  onReviewPractice,
}) => {
  const today = getTodayDateString();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [selectedSetFilter, setSelectedSetFilter] = useState<string>('all');
  const [viewTab, setViewTab] = useState<'all' | 'mistakes_only' | 'due_review'>('all');
  const [selectedErrorTagFilter, setSelectedErrorTagFilter] = useState<string>('all');
  const [randomModalLog, setRandomModalLog] = useState<QuestionPracticeLog | null>(null);

  // Extract unique set names
  const allSetNames = Array.from(new Set(practiceLogs.map(p => p.setName).filter(Boolean)));

  // Extract all error tags and their frequencies
  const errorTagStats: { [tag: string]: number } = {};
  practiceLogs.forEach(p => {
    (p.errorTypes || []).forEach(t => {
      errorTagStats[t] = (errorTagStats[t] || 0) + (p.wrongCount || 1);
    });
  });

  const sortedErrorTags = Object.entries(errorTagStats).sort((a, b) => b[1] - a[1]);

  // Filter logs
  const filteredLogs = practiceLogs.filter(log => {
    if (selectedSubjectId !== 'all' && log.subjectId !== selectedSubjectId) return false;
    if (selectedSetFilter !== 'all' && log.setName !== selectedSetFilter) return false;
    if (selectedErrorTagFilter !== 'all' && !(log.errorTypes || []).includes(selectedErrorTagFilter)) return false;

    if (viewTab === 'mistakes_only') {
      if (log.wrongCount <= 0) return false;
    } else if (viewTab === 'due_review') {
      if (log.reviewed || log.wrongCount <= 0 || !log.nextReviewDate || log.nextReviewDate > today) {
        return false;
      }
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchSet = log.setName.toLowerCase().includes(q);
      const matchKp = (log.knowledgePointTitle || '').toLowerCase().includes(q);
      const matchReflect = (log.reflection || '').toLowerCase().includes(q);
      const matchNum = log.questionNumbers.toLowerCase().includes(q);
      if (!matchSet && !matchKp && !matchReflect && !matchNum) return false;
    }

    return true;
  });

  // Calculate totals
  const totalQuestionsDone = practiceLogs.reduce((acc, p) => acc + p.correctCount + p.wrongCount, 0);
  const totalCorrect = practiceLogs.reduce((acc, p) => acc + p.correctCount, 0);
  const totalHesitant = practiceLogs.reduce((acc, p) => acc + p.hesitantCount, 0);
  const totalWrong = practiceLogs.reduce((acc, p) => acc + p.wrongCount, 0);
  const overallAccuracy = totalQuestionsDone > 0 ? Math.round((totalCorrect / totalQuestionsDone) * 100) : 100;

  const getSubject = (id: string) => subjects.find(s => s.id === id);

  const handleRandomWeakDrill = () => {
    const wrongLogs = practiceLogs.filter(p => p.wrongCount > 0 && !p.reviewed);
    const candidateList = wrongLogs.length > 0 ? wrongLogs : practiceLogs;
    if (candidateList.length === 0) return;
    const randomOne = candidateList[Math.floor(Math.random() * candidateList.length)];
    setRandomModalLog(randomOne);
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Accuracy Stats Bar */}
      <div className="bg-white rounded-3xl p-5 border border-[#e8e4dc] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#3d3d3d] flex items-center gap-2">
              <span>📝 刷题记录与错题复盘</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#f5f2ed] text-[#61594f]">
                累计 {practiceLogs.length} 组记录
              </span>
            </h1>
            <p className="text-xs text-[#7c7467] mt-0.5">
              记录做对、犹豫做对与错题类型，定期复查避免重复掉坑
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            {onOpenSmartImport && (
              <button
                id="practice-smart-import-btn"
                type="button"
                onClick={onOpenSmartImport}
                className="px-3.5 py-2 bg-[#fdf7ee] hover:bg-[#f5ead5] text-[#8d6023] border border-[#eedab9] rounded-xl text-xs font-semibold transition-all shadow-2xs flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#bfa07a]" />
                <span>智能导入题目刷题</span>
              </button>
            )}
            <button
              id="random-weak-drill-btn"
              type="button"
              onClick={handleRandomWeakDrill}
              className="px-3.5 py-2 bg-[#fbf4eb] hover:bg-[#f5ebd9] text-[#8d6023] border border-[#ebd8be] rounded-xl text-xs font-medium transition-colors shadow-2xs flex items-center gap-1.5"
            >
              <Dices className="w-3.5 h-3.5 text-[#bfa07a]" />
              <span>抽取薄弱错题复查</span>
            </button>
            <button
              id="practice-add-btn"
              type="button"
              onClick={onAddPractice}
              className="px-4 py-2 bg-[#82947d] hover:bg-[#71826d] text-white rounded-xl text-xs font-medium transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>手动记录</span>
            </button>
          </div>
        </div>

        {/* Aggregate Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <div className="p-3 bg-[#faf8f5] rounded-2xl border border-[#e8e4dc]">
            <span className="block text-[11px] text-[#7c7467]">累计刷题量</span>
            <span className="text-lg font-black text-[#3d3d3d]">{totalQuestionsDone} <span className="text-xs font-normal text-[#8c8275]">题</span></span>
          </div>

          <div className="p-3 bg-[#edf2ec] rounded-2xl border border-[#bcd2b8]">
            <span className="block text-[11px] text-[#4d6148]">总做对数</span>
            <span className="text-lg font-black text-[#3b4c37]">{totalCorrect} <span className="text-xs font-normal text-[#4d6148]">({overallAccuracy}%)</span></span>
          </div>

          <div className="p-3 bg-[#fdf7ee] rounded-2xl border border-[#eedab9]">
            <span className="block text-[11px] text-[#8d6023]">犹豫做对 (潜意识模糊)</span>
            <span className="text-lg font-black text-[#734c19]">{totalHesitant} <span className="text-xs font-normal text-[#8d6023]">题</span></span>
          </div>

          <div className="p-3 bg-[#fbf4f2] rounded-2xl border border-[#e8c0b8]">
            <span className="block text-[11px] text-[#964f3f]">累计做错题数</span>
            <span className="text-lg font-black text-[#7a3b2d]">{totalWrong} <span className="text-xs font-normal text-[#964f3f]">题</span></span>
          </div>
        </div>

        {/* Error Types Frequency Tags */}
        {sortedErrorTags.length > 0 && (
          <div className="pt-2 border-t border-[#e8e4dc]">
            <div className="flex items-center gap-1.5 mb-2">
              <BarChart3 className="w-3.5 h-3.5 text-[#8c8275]" />
              <span className="text-xs font-semibold text-[#3d3d3d]">高频薄弱错因统计：</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedErrorTagFilter('all')}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                  selectedErrorTagFilter === 'all'
                    ? 'bg-[#82947d] text-white border-[#82947d]'
                    : 'bg-[#faf8f5] border-[#e8e4dc] text-[#61594f] hover:bg-[#f5f2ed]'
                }`}
              >
                全部错因
              </button>
              {sortedErrorTags.map(([tag, count]) => {
                const isSelected = selectedErrorTagFilter === tag;
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSelectedErrorTagFilter(isSelected ? 'all' : tag)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1 ${
                      isSelected
                        ? 'bg-[#c17f6f] text-white border-[#c17f6f] font-semibold'
                        : 'bg-[#fbf4f2] border-[#e8c0b8] text-[#964f3f] hover:bg-[#f5e4e0]'
                    }`}
                  >
                    <span>{tag}</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/60 text-[#964f3f] font-bold">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Filter Controls: Tabs + Search + Set Select */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2 border-t border-[#e8e4dc]">
          {/* Search input */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-[#8c8275] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜索题集名、知识点、复盘反思..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-[#e8e4dc] text-xs focus:outline-none focus:ring-2 focus:ring-[#82947d] bg-[#faf8f5]"
            />
          </div>

          {/* Set Select */}
          <div className="md:col-span-3">
            <select
              value={selectedSetFilter}
              onChange={e => setSelectedSetFilter(e.target.value)}
              className="w-full py-2 px-2.5 rounded-xl border border-[#e8e4dc] text-xs bg-white text-[#4a4a4a] focus:outline-none focus:border-[#82947d]"
            >
              <option value="all">全部题集 / 试卷 ({allSetNames.length})</option>
              {allSetNames.map(set => (
                <option key={set} value={set}>{set}</option>
              ))}
            </select>
          </div>

          {/* View Tab Filter */}
          <div className="md:col-span-4 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewTab === 'all' ? 'bg-[#82947d] text-white shadow-xs' : 'bg-[#f5f2ed] text-[#61594f] hover:bg-[#ebe6dd]'
              }`}
            >
              全部记录
            </button>
            <button
              type="button"
              onClick={() => setViewTab('mistakes_only')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewTab === 'mistakes_only' ? 'bg-[#c17f6f] text-white' : 'bg-[#fbf4f2] text-[#964f3f] hover:bg-[#f5e4e0]'
              }`}
            >
              仅看错题
            </button>
            <button
              type="button"
              onClick={() => setViewTab('due_review')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewTab === 'due_review' ? 'bg-[#bfa07a] text-white' : 'bg-[#fdf7ee] text-[#8d6023] hover:bg-[#faebd4]'
              }`}
            >
              待复查错题
            </button>
          </div>
        </div>

        {/* Subject Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs text-[#8c8275] whitespace-nowrap">科目筛选:</span>
          <button
            type="button"
            onClick={() => setSelectedSubjectId('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
              selectedSubjectId === 'all' ? 'bg-[#82947d] text-white shadow-xs' : 'bg-[#f5f2ed] text-[#61594f] hover:bg-[#ebe6dd]'
            }`}
          >
            全部科目 ({practiceLogs.length})
          </button>
          {subjects.map(s => {
            const count = practiceLogs.filter(p => p.subjectId === s.id).length;
            const isSelected = selectedSubjectId === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedSubjectId(s.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected ? 'bg-[#82947d] text-white shadow-xs' : 'bg-[#f5f2ed] text-[#61594f] hover:bg-[#ebe6dd]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                {s.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Practice Logs List */}
      {filteredLogs.length > 0 ? (
        <div className="space-y-3.5">
          {filteredLogs.map(log => {
            const subj = getSubject(log.subjectId);
            const total = log.correctCount + log.wrongCount;
            const accRate = total > 0 ? Math.round((log.correctCount / total) * 100) : 100;
            const isDue = !log.reviewed && log.wrongCount > 0 && log.nextReviewDate && log.nextReviewDate <= today;

            return (
              <div
                key={log.id}
                id={`practice-card-${log.id}`}
                className="bg-white rounded-2xl p-5 border border-[#e8e4dc] shadow-xs hover:border-[#d4cebe] transition-all space-y-3"
              >
                {/* Top Row: Subject & Set & Date */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-white shadow-2xs"
                      style={{ backgroundColor: subj?.color || '#c17f6f' }}
                    >
                      {subj?.name}
                    </span>
                    <h3 className="text-base font-bold text-[#3d3d3d]">{log.setName}</h3>
                    <span className="text-xs text-[#7c7467]">题号: {log.questionNumbers}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[#8c8275]">{log.createdAt}</span>
                    {log.isIndependent ? (
                      <span className="px-2 py-0.5 rounded-md bg-[#edf2ec] text-[#4d6148] font-medium text-[11px]">
                        ✓ 闭卷独立完成
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-[#f5f2ed] text-[#61594f] text-[11px]">
                        开卷/看解析
                      </span>
                    )}
                  </div>
                </div>

                {/* Associated knowledge point */}
                {log.knowledgePointTitle && (
                  <div className="text-xs text-[#4a4a4a] flex items-center gap-1.5 bg-[#faf8f5] px-3 py-1.5 rounded-xl border border-[#e8e4dc]">
                    <BookOpen className="w-3.5 h-3.5 text-[#8c8275]" />
                    <span>关联考点：</span>
                    <strong className="text-[#3d3d3d]">{log.knowledgePointTitle}</strong>
                  </div>
                )}

                {/* Score Stats Badge */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-[#edf2ec] border border-[#bcd2b8] text-[#4d6148] font-bold">
                    对: {log.correctCount} 题
                  </span>
                  {log.hesitantCount > 0 && (
                    <span className="px-2.5 py-1 rounded-lg bg-[#fdf7ee] border border-[#eedab9] text-[#8d6023] font-medium">
                      犹豫做对: {log.hesitantCount} 题
                    </span>
                  )}
                  {log.wrongCount > 0 ? (
                    <span className="px-2.5 py-1 rounded-lg bg-[#fbf4f2] border border-[#e8c0b8] text-[#964f3f] font-bold">
                      错: {log.wrongCount} 题
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg bg-[#edf2ec] text-[#3b4c37] font-semibold">
                      全部做对 🎯
                    </span>
                  )}
                  <span className="text-[#8c8275] font-medium">正确率: {accRate}%</span>

                  {log.nextReviewDate && log.wrongCount > 0 && (
                    <span
                      className={`ml-auto px-2.5 py-0.5 rounded-md font-medium text-[11px] flex items-center gap-1 ${
                        log.reviewed
                          ? 'bg-[#edf2ec] text-[#4d6148] border border-[#bcd2b8]'
                          : isDue
                          ? 'bg-[#fbf4f2] text-[#964f3f] border border-[#e8c0b8]'
                          : 'bg-[#f5f2ed] text-[#61594f]'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      {log.reviewed ? '错题已复查攻克' : `复查: ${log.nextReviewDate} (${formatRelativeDate(log.nextReviewDate)})`}
                    </span>
                  )}
                </div>

                {/* Error Tags */}
                {log.errorTypes && log.errorTypes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {log.errorTypes.map(t => (
                      <span
                        key={t}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-[#fbf4f2] border border-[#e8c0b8] text-[#964f3f] font-medium"
                      >
                        ⚠️ {t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Reflection Notes */}
                {log.reflection && (
                  <div className="bg-[#faf8f5] p-3.5 rounded-xl border border-[#e8e4dc] text-xs text-[#4a4a4a] leading-relaxed">
                    <span className="font-semibold text-[#3d3d3d] block mb-1">💡 错因剖析与复盘笔记：</span>
                    <p className="whitespace-pre-wrap">{log.reflection}</p>
                  </div>
                )}

                {/* Bottom Row Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-[#e8e4dc] text-xs">
                  {/* Left: Quick review status toggle for wrong questions */}
                  {log.wrongCount > 0 && (
                    <div>
                      {log.reviewed ? (
                        <span className="text-[#4d6148] font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          已完成二次复查
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onReviewPractice(log.id, 'mastered')}
                          className="px-3 py-1 rounded-lg bg-[#edf2ec] hover:bg-[#dfeade] text-[#4d6148] border border-[#bcd2b8] font-medium transition-colors flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>标记为已攻克掌握</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Right: Edit & Delete */}
                  <div className="flex items-center gap-1.5 ml-auto">
                    <button
                      type="button"
                      onClick={() => onEditPractice(log)}
                      className="p-1.5 text-[#7c7467] hover:text-[#3d3d3d] rounded-lg hover:bg-[#f5f2ed] transition-colors"
                      title="修改做题记录"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`确定要删除「${log.setName}」的刷题记录吗？`)) {
                          onDeletePractice(log.id);
                        }
                      }}
                      className="p-1.5 text-[#8c8275] hover:text-[#964f3f] rounded-lg hover:bg-[#fbf4f2] transition-colors"
                      title="删除记录"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl border border-[#e8e4dc]">
          <PenLine className="w-10 h-10 text-[#82947d] opacity-40 mx-auto mb-2" />
          <h3 className="text-base font-bold text-[#3d3d3d]">暂无符合条件的刷题记录</h3>
          <p className="text-xs text-[#8c8275] mt-1">做完题后花 1 分钟记录错因与复盘，快速查漏补缺</p>
        </div>
      )}

      {/* Random Weak Drill Detail Modal */}
      {randomModalLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#3d3d3d]/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[#e8e4dc] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#e8e4dc]">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-[#fbf4f2] text-[#964f3f] rounded-xl border border-[#e8c0b8]">
                  <AlertTriangle className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-[#3d3d3d]">薄弱错题复查抽取</h3>
                  <span className="text-xs text-[#7c7467]">{randomModalLog.setName} · {randomModalLog.questionNumbers}</span>
                </div>
              </div>
              <button
                onClick={() => setRandomModalLog(null)}
                className="text-[#8c8275] hover:text-[#3d3d3d] p-1"
              >
                ✕
              </button>
            </div>

            {/* Error tags */}
            {randomModalLog.errorTypes && (
              <div className="flex flex-wrap gap-1.5">
                {randomModalLog.errorTypes.map(t => (
                  <span key={t} className="text-xs px-2.5 py-0.5 bg-[#fbf4f2] text-[#964f3f] rounded-md font-medium border border-[#e8c0b8]">
                    ⚠️ {t}
                  </span>
                ))}
              </div>
            )}

            {/* Reflection Content */}
            <div className="bg-[#faf8f5] p-4 rounded-2xl border border-[#e8e4dc] text-sm text-[#4a4a4a] leading-relaxed whitespace-pre-wrap">
              <span className="font-bold text-[#3d3d3d] block mb-1.5">复盘反思笔记：</span>
              {randomModalLog.reflection || '（未记录具体文字反思）'}
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-[#e8e4dc]">
              <button
                type="button"
                onClick={handleRandomWeakDrill}
                className="px-3.5 py-2 rounded-xl bg-[#f5f2ed] hover:bg-[#ebe6dd] text-[#61594f] text-xs font-medium"
              >
                再抽一道
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onReviewPractice(randomModalLog.id, 'mastered');
                    setRandomModalLog(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#82947d] hover:bg-[#71826d] text-white text-xs font-medium"
                >
                  已掌握并完成复查
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
