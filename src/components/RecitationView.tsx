import React, { useState } from 'react';
import { KnowledgePoint, Subject, RecallAction } from '../types';
import { formatRelativeDate, getTodayDateString, addDaysToDate } from '../utils/ebbinghaus';
import {
  Search,
  Plus,
  Filter,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RotateCcw,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  BookOpen,
  ArrowUpDown,
  Sparkles,
} from 'lucide-react';

interface Props {
  knowledgePoints: KnowledgePoint[];
  subjects: Subject[];
  onAddKnowledge: () => void;
  onEditKnowledge: (point: KnowledgePoint) => void;
  onDeleteKnowledge: (pointId: string) => void;
  onReviewKnowledge: (pointId: string, action: RecallAction) => void;
  onBatchAdjustDates: (pointIds: string[], daysToAdd: number, specificDate?: string) => void;
  onBatchDelete: (pointIds: string[]) => void;
}

export const RecitationView: React.FC<Props> = ({
  knowledgePoints,
  subjects,
  onAddKnowledge,
  onEditKnowledge,
  onDeleteKnowledge,
  onReviewKnowledge,
  onBatchAdjustDates,
  onBatchDelete,
}) => {
  const today = getTodayDateString();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [masteryFilter, setMasteryFilter] = useState<'all' | 'due' | 'learning' | 'reviewing' | 'mastered'>('all');
  const [sortBy, setSortBy] = useState<'date_asc' | 'date_desc' | 'reviews_desc' | 'lapses_desc' | 'created_desc'>('date_asc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedNotesIds, setExpandedNotesIds] = useState<Set<string>>(new Set());
  const [customBatchDate, setCustomBatchDate] = useState<string>(today);
  const [showDatePickerModal, setShowDatePickerModal] = useState<boolean>(false);

  // Filter & Search logic
  const filteredPoints = knowledgePoints.filter(point => {
    // Subject match
    if (selectedSubjectId !== 'all' && point.subjectId !== selectedSubjectId) return false;

    // Mastery filter
    if (masteryFilter === 'due') {
      if (point.nextReviewDate > today) return false;
    } else if (masteryFilter !== 'all') {
      if (point.mastery !== masteryFilter) return false;
    }

    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchTitle = point.title.toLowerCase().includes(q);
      const matchNotes = (point.notes || '').toLowerCase().includes(q);
      const matchSource = (point.source || '').toLowerCase().includes(q);
      if (!matchTitle && !matchNotes && !matchSource) return false;
    }

    return true;
  });

  // Sort logic
  const sortedPoints = [...filteredPoints].sort((a, b) => {
    if (sortBy === 'date_asc') return a.nextReviewDate.localeCompare(b.nextReviewDate);
    if (sortBy === 'date_desc') return b.nextReviewDate.localeCompare(a.nextReviewDate);
    if (sortBy === 'reviews_desc') return b.reviewCount - a.reviewCount;
    if (sortBy === 'lapses_desc') return b.lapses - a.lapses;
    if (sortBy === 'created_desc') return (b.createdAt || '').localeCompare(a.createdAt || '');
    return 0;
  });

  // Batch selections
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllFiltered = () => {
    if (selectedIds.size === sortedPoints.length && sortedPoints.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedPoints.map(p => p.id)));
    }
  };

  const toggleExpandNote = (id: string) => {
    setExpandedNotesIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getSubject = (id: string) => subjects.find(s => s.id === id);

  const handleBatchAdjust = (days: number) => {
    if (selectedIds.size === 0) return;
    onBatchAdjustDates(Array.from(selectedIds), days);
    setSelectedIds(new Set());
  };

  const handleBatchSetDate = () => {
    if (selectedIds.size === 0 || !customBatchDate) return;
    onBatchAdjustDates(Array.from(selectedIds), 0, customBatchDate);
    setShowDatePickerModal(false);
    setSelectedIds(new Set());
  };

  const handleBatchDeleteClick = () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`确定要批量删除选中的 ${selectedIds.size} 个知识点吗？`)) {
      onBatchDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Search Bar */}
      <div className="bg-white rounded-3xl p-5 border border-[#e8e4dc] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#3d3d3d] flex items-center gap-2">
              <span>📖 背诵库与考点记忆循环</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#f5f2ed] text-[#61594f]">
                共 {knowledgePoints.length} 条
              </span>
            </h1>
            <p className="text-xs text-[#7c7467] mt-0.5">
              按照艾宾浩斯记忆曲线自动规划复习周期，支持批量微调日期
            </p>
          </div>

          <button
            id="recitation-add-btn"
            type="button"
            onClick={onAddKnowledge}
            className="px-4 py-2 bg-[#82947d] hover:bg-[#71826d] text-white rounded-xl text-xs font-medium transition-colors shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>录入新考点</span>
          </button>
        </div>

        {/* Search & Subject Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-[#8c8275] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="recitation-search-input"
              type="text"
              placeholder="搜索考点名称、记忆要点、章节来源..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-[#e8e4dc] text-xs focus:outline-none focus:ring-2 focus:ring-[#82947d] bg-[#faf8f5]"
            />
          </div>

          {/* Sort Selector */}
          <div className="md:col-span-3 flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#8c8275] shrink-0" />
            <select
              id="recitation-sort-select"
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="w-full py-2 px-2.5 rounded-xl border border-[#e8e4dc] text-xs bg-white text-[#4a4a4a] focus:outline-none focus:border-[#82947d]"
            >
              <option value="date_asc">复查日期最近 (优先到期)</option>
              <option value="date_desc">复查日期最远</option>
              <option value="reviews_desc">复习遍数最多</option>
              <option value="lapses_desc">遗忘次数最多 (易错点)</option>
              <option value="created_desc">新录入优先</option>
            </select>
          </div>

          {/* Mastery Filter Tabs */}
          <div className="md:col-span-3 flex items-center gap-1 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setMasteryFilter('all')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                masteryFilter === 'all' ? 'bg-[#82947d] text-white shadow-xs' : 'bg-[#f5f2ed] text-[#61594f] hover:bg-[#ebe6dd]'
              }`}
            >
              全部
            </button>
            <button
              type="button"
              onClick={() => setMasteryFilter('due')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                masteryFilter === 'due' ? 'bg-[#c17f6f] text-white' : 'bg-[#fbf4f2] text-[#964f3f] hover:bg-[#f5e4e0]'
              }`}
            >
              今日待查
            </button>
            <button
              type="button"
              onClick={() => setMasteryFilter('learning')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                masteryFilter === 'learning' ? 'bg-[#82947d] text-white' : 'bg-[#f5f2ed] text-[#61594f] hover:bg-[#ebe6dd]'
              }`}
            >
              初学中
            </button>
            <button
              type="button"
              onClick={() => setMasteryFilter('mastered')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                masteryFilter === 'mastered' ? 'bg-[#5b7357] text-white' : 'bg-[#edf2ec] text-[#4d6148] hover:bg-[#dfeade]'
              }`}
            >
              已掌握
            </button>
          </div>
        </div>

        {/* Subject Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1">
          <span className="text-xs text-[#8c8275] whitespace-nowrap">科目:</span>
          <button
            type="button"
            onClick={() => setSelectedSubjectId('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
              selectedSubjectId === 'all' ? 'bg-[#82947d] text-white shadow-xs' : 'bg-[#f5f2ed] text-[#61594f] hover:bg-[#ebe6dd]'
            }`}
          >
            全部 ({knowledgePoints.length})
          </button>
          {subjects.map(s => {
            const count = knowledgePoints.filter(k => k.subjectId === s.id).length;
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

      {/* Batch Operations Bar (Floats or shows when checkboxes are selected) */}
      <div className="bg-[#f5f2ed] rounded-2xl p-3.5 border border-[#e8e4dc] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="select-all-filtered-checkbox"
            checked={selectedIds.size > 0 && selectedIds.size === sortedPoints.length}
            onChange={selectAllFiltered}
            className="w-4 h-4 rounded accent-[#82947d] cursor-pointer"
          />
          <label htmlFor="select-all-filtered-checkbox" className="font-semibold text-[#3d3d3d] cursor-pointer">
            {selectedIds.size > 0 ? `已选中 ${selectedIds.size} / ${sortedPoints.length} 项` : `全选当前 ${sortedPoints.length} 项`}
          </label>
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[#7c7467] font-medium">批量顺延:</span>
            <button
              type="button"
              onClick={() => handleBatchAdjust(1)}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#faf8f5] border border-[#d8d2c7] text-[#4a4a4a] font-medium shadow-2xs"
            >
              +1 天
            </button>
            <button
              type="button"
              onClick={() => handleBatchAdjust(3)}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#faf8f5] border border-[#d8d2c7] text-[#4a4a4a] font-medium shadow-2xs"
            >
              +3 天
            </button>
            <button
              type="button"
              onClick={() => handleBatchAdjust(7)}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#faf8f5] border border-[#d8d2c7] text-[#4a4a4a] font-medium shadow-2xs"
            >
              +7 天 (一周)
            </button>
            <button
              type="button"
              onClick={() => setShowDatePickerModal(true)}
              className="px-2.5 py-1 rounded-lg bg-[#82947d] text-white font-medium shadow-2xs"
            >
              指定日期...
            </button>
            <button
              type="button"
              onClick={handleBatchDeleteClick}
              className="px-2.5 py-1 rounded-lg bg-[#fbf4f2] hover:bg-[#f5e4e0] text-[#964f3f] border border-[#e8c0b8] font-medium transition-colors"
            >
              批量删除
            </button>
          </div>
        )}
      </div>

      {/* Knowledge Points List */}
      {sortedPoints.length > 0 ? (
        <div className="space-y-3">
          {sortedPoints.map(point => {
            const subj = getSubject(point.subjectId);
            const isSelected = selectedIds.has(point.id);
            const isExpanded = expandedNotesIds.has(point.id);
            const isOverdue = point.nextReviewDate < today;
            const isDueToday = point.nextReviewDate === today;

            return (
              <div
                key={point.id}
                id={`kp-card-${point.id}`}
                className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all shadow-xs ${
                  isSelected ? 'border-[#82947d] ring-1 ring-[#82947d]/30' : 'border-[#e8e4dc] hover:border-[#d4cebe]'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Select Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(point.id)}
                    className="w-4 h-4 mt-1 rounded accent-[#82947d] cursor-pointer"
                  />

                  {/* Main Content Body */}
                  <div className="flex-1 min-w-0">
                    {/* Top Meta */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-white shadow-2xs"
                          style={{ backgroundColor: subj?.color || '#82947d' }}
                        >
                          {subj?.name}
                        </span>
                        {point.source && (
                          <span className="text-xs text-[#7c7467] flex items-center gap-1">
                            <BookOpen className="w-3 h-3 text-[#8c8275]" />
                            {point.source}
                          </span>
                        )}
                      </div>

                      {/* Status / Stage Badges */}
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-[#7c7467]">
                          阶段 <strong className="text-[#3d3d3d]">{point.stage}</strong>（{point.intervalDays}天间隔）
                        </span>
                        <span className="text-[#8c8275]">·</span>
                        <span className="text-[#7c7467]">
                          已复习 <strong className="text-[#3d3d3d]">{point.reviewCount}</strong> 遍
                        </span>
                        {point.lapses > 0 && (
                          <span className="text-[#964f3f] font-medium">
                            遗忘 {point.lapses} 次
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-md font-medium text-[11px] ${
                            isOverdue
                              ? 'bg-[#fbf4f2] text-[#964f3f] border border-[#e8c0b8]'
                              : isDueToday
                              ? 'bg-[#fdf7ee] text-[#8d6023] border border-[#eedab9]'
                              : 'bg-[#f5f2ed] text-[#61594f]'
                          }`}
                        >
                          {point.nextReviewDate} ({formatRelativeDate(point.nextReviewDate)})
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-bold text-[#3d3d3d] leading-snug mb-2">
                      {point.title}
                    </h3>

                    {/* Notes (Foldable) */}
                    {point.notes && (
                      <div className="mb-3">
                        {isExpanded ? (
                          <div className="bg-[#faf8f5] p-3.5 rounded-xl border border-[#e8e4dc] text-xs text-[#4a4a4a] leading-relaxed whitespace-pre-wrap">
                            {point.notes}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => toggleExpandNote(point.id)}
                            className="text-xs text-[#7c7467] hover:text-[#3d3d3d] flex items-center gap-1"
                          >
                            <ChevronDown className="w-3 h-3" />
                            <span>查看记忆要点与答案</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Bottom Action Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#e8e4dc] text-xs">
                      {/* Left: Quick Recall Buttons */}
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[#8c8275] mr-1">主动提取:</span>
                        <button
                          type="button"
                          onClick={() => onReviewKnowledge(point.id, 'extracted')}
                          className="px-2.5 py-1 rounded-lg bg-[#edf2ec] hover:bg-[#dfeade] text-[#4d6148] border border-[#bcd2b8] font-medium transition-colors"
                          title="独立提取 (+1阶，延长周期)"
                        >
                          独立提取
                        </button>
                        <button
                          type="button"
                          onClick={() => onReviewKnowledge(point.id, 'hinted')}
                          className="px-2.5 py-1 rounded-lg bg-[#fdf7ee] hover:bg-[#faebd4] text-[#8d6023] border border-[#eedab9] font-medium transition-colors"
                          title="需要提示 (+1~2天)"
                        >
                          需要提示
                        </button>
                        <button
                          type="button"
                          onClick={() => onReviewKnowledge(point.id, 'forgotten')}
                          className="px-2.5 py-1 rounded-lg bg-[#fbf4f2] hover:bg-[#f5e4e0] text-[#964f3f] border border-[#e8c0b8] font-medium transition-colors"
                          title="没想起来 (重置1天)"
                        >
                          没想起来
                        </button>
                        <button
                          type="button"
                          onClick={() => onReviewKnowledge(point.id, 'skipped')}
                          className="px-2 py-1 rounded-lg bg-[#f5f2ed] hover:bg-[#ebe6dd] text-[#61594f] font-medium transition-colors"
                          title="今天跳过 (顺延1天)"
                        >
                          跳过
                        </button>
                      </div>

                      {/* Right: Edit & Delete */}
                      <div className="flex items-center gap-1.5">
                        {isExpanded && (
                          <button
                            type="button"
                            onClick={() => toggleExpandNote(point.id)}
                            className="p-1.5 text-[#8c8275] hover:text-[#3d3d3d] rounded-lg hover:bg-[#f5f2ed]"
                            title="收起要点"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onEditKnowledge(point)}
                          className="p-1.5 text-[#7c7467] hover:text-[#3d3d3d] rounded-lg hover:bg-[#f5f2ed] transition-colors"
                          title="修改考点"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`确定要删除考点「${point.title}」吗？`)) {
                              onDeleteKnowledge(point.id);
                            }
                          }}
                          className="p-1.5 text-[#8c8275] hover:text-[#964f3f] rounded-lg hover:bg-[#fbf4f2] transition-colors"
                          title="删除考点"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl border border-[#e8e4dc]">
          <BookOpen className="w-10 h-10 text-[#82947d] opacity-40 mx-auto mb-2" />
          <h3 className="text-base font-bold text-[#3d3d3d]">没有符合条件的知识点</h3>
          <p className="text-xs text-[#8c8275] mt-1">可以尝试更改筛选条件，或录入新的备考知识点</p>
        </div>
      )}

      {/* Date Picker Modal for Batch adjust */}
      {showDatePickerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#3d3d3d]/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-[#e8e4dc]">
            <h3 className="text-base font-bold text-[#3d3d3d] mb-2">批量指定下次复查日期</h3>
            <p className="text-xs text-[#7c7467] mb-4">
              将选中的 {selectedIds.size} 个知识点统一排期到指定日期：
            </p>
            <input
              type="date"
              value={customBatchDate}
              onChange={e => setCustomBatchDate(e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e4dc] rounded-xl text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-[#82947d]"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDatePickerModal(false)}
                className="px-3.5 py-1.5 rounded-xl border border-[#e8e4dc] text-xs font-medium text-[#61594f] hover:bg-[#f5f2ed]"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleBatchSetDate}
                className="px-4 py-1.5 rounded-xl bg-[#82947d] hover:bg-[#71826d] text-white text-xs font-medium"
              >
                确认应用
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
