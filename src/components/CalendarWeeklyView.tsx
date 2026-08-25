import React, { useState } from 'react';
import { KnowledgePoint, QuestionPracticeLog, Subject } from '../types';
import { getTodayDateString, addDaysToDate, formatRelativeDate } from '../utils/ebbinghaus';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, BookOpen, Clock, CheckCircle2 } from 'lucide-react';

interface Props {
  knowledgePoints: KnowledgePoint[];
  practiceLogs: QuestionPracticeLog[];
  subjects: Subject[];
  onOpenKnowledgeDetail?: (point: KnowledgePoint) => void;
}

export const CalendarWeeklyView: React.FC<Props> = ({
  knowledgePoints,
  practiceLogs,
  subjects,
}) => {
  const today = getTodayDateString();
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [selectedDate, setSelectedDate] = useState<string>(today);

  // Month navigation state
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth()); // 0-indexed

  // Generate 7-day upcoming week dates
  const weekDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    weekDates.push(addDaysToDate(today, i));
  }

  const getDayName = (dateStr: string) => {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const d = new Date(dateStr + 'T00:00:00');
    return days[d.getDay()];
  };

  const getSubject = (id: string) => subjects.find(s => s.id === id);

  // Helper for tasks on a specific date
  const getTasksForDate = (dateStr: string) => {
    const kpList = knowledgePoints.filter(k => k.nextReviewDate === dateStr);
    const pracList = practiceLogs.filter(p => !p.reviewed && p.wrongCount > 0 && p.nextReviewDate === dateStr);
    return { kpList, pracList, total: kpList.length + pracList.length };
  };

  // Month calendar grid helper
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear(currentYear + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const selectedTasks = getTasksForDate(selectedDate);

  return (
    <div className="space-y-5">
      {/* Top Controls */}
      <div className="bg-white rounded-3xl p-5 border border-[#e8e4dc] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#3d3d3d] flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-[#82947d]" />
            <span>复查日程 · 周视图与月历</span>
          </h1>
          <p className="text-xs text-[#7c7467] mt-0.5">
            查看未来 7 天及整月艾宾浩斯复查任务排期分布
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-[#f5f2ed] p-1 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('week')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              viewMode === 'week' ? 'bg-white text-[#3d3d3d] shadow-xs' : 'text-[#61594f] hover:text-[#3d3d3d]'
            }`}
          >
            周视图 (未来7天)
          </button>
          <button
            type="button"
            onClick={() => setViewMode('month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              viewMode === 'month' ? 'bg-white text-[#3d3d3d] shadow-xs' : 'text-[#61594f] hover:text-[#3d3d3d]'
            }`}
          >
            月历视图
          </button>
        </div>
      </div>

      {/* Week View */}
      {viewMode === 'week' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {weekDates.map((dateStr) => {
              const { kpList, pracList, total } = getTasksForDate(dateStr);
              const isSelected = selectedDate === dateStr;
              const isToday = dateStr === today;

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => setSelectedDate(dateStr)}
                  className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between min-h-[130px] ${
                    isSelected
                      ? 'bg-[#82947d] text-white border-[#82947d] shadow-md ring-2 ring-[#82947d]/20'
                      : isToday
                      ? 'bg-[#fdf7ee] border-[#eedab9] text-[#3d3d3d] hover:bg-[#fcf0dc]'
                      : 'bg-white border-[#e8e4dc] text-[#3d3d3d] hover:border-[#cfc9bd]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-semibold ${isSelected ? 'text-white/80' : isToday ? 'text-[#8d6023]' : 'text-[#8c8275]'}`}>
                        {getDayName(dateStr)}
                      </span>
                      {isToday && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${isSelected ? 'bg-white text-[#82947d]' : 'bg-[#eedab9] text-[#8d6023]'}`}>
                          今日
                        </span>
                      )}
                    </div>
                    <span className="text-base font-black tracking-tight block mb-2">
                      {dateStr.slice(5)}
                    </span>
                  </div>

                  {/* Task counts badge */}
                  <div>
                    {total > 0 ? (
                      <div className="space-y-1">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-bold ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-[#f5f2ed] text-[#3d3d3d]'
                        }`}>
                          {total} 项任务
                        </span>
                        <div className="text-[10px] opacity-80 flex items-center gap-1">
                          {kpList.length > 0 && <span>考点: {kpList.length}</span>}
                          {pracList.length > 0 && <span>错题: {pracList.length}</span>}
                        </div>
                      </div>
                    ) : (
                      <span className={`text-[11px] ${isSelected ? 'text-white/60' : 'text-[#8c8275]'}`}>
                        暂无排期
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Month View */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-3xl p-5 border border-[#e8e4dc] shadow-xs space-y-4">
          {/* Month Navigator */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#3d3d3d]">
              {currentYear} 年 {currentMonth + 1} 月
            </h2>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={prevMonth}
                className="p-1.5 rounded-lg border border-[#e8e4dc] text-[#61594f] hover:bg-[#f5f2ed]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentYear(new Date().getFullYear());
                  setCurrentMonth(new Date().getMonth());
                }}
                className="px-2.5 py-1 rounded-lg border border-[#e8e4dc] text-xs font-medium text-[#61594f] hover:bg-[#f5f2ed]"
              >
                本月
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="p-1.5 rounded-lg border border-[#e8e4dc] text-[#61594f] hover:bg-[#f5f2ed]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {['日', '一', '二', '三', '四', '五', '六'].map((day, idx) => (
              <div key={idx} className="py-1.5 font-bold text-[#8c8275]">
                {day}
              </div>
            ))}

            {/* Empty slots for start of month */}
            {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
              <div key={`empty-${idx}`} className="p-2 min-h-[60px]" />
            ))}

            {/* Month days */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const { total } = getTasksForDate(dateStr);
              const isSelected = selectedDate === dateStr;
              const isToday = dateStr === today;

              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => setSelectedDate(dateStr)}
                  className={`p-1.5 rounded-xl border min-h-[64px] flex flex-col justify-between transition-all ${
                    isSelected
                      ? 'bg-[#82947d] text-white border-[#82947d] shadow-xs'
                      : isToday
                      ? 'bg-[#fdf7ee] border-[#eedab9] text-[#3d3d3d] font-bold'
                      : 'bg-white border-[#e8e4dc]/60 text-[#4a4a4a] hover:bg-[#faf8f5]'
                  }`}
                >
                  <span className="text-xs font-semibold self-start ml-1">{dayNum}</span>
                  {total > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold self-center ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-[#f5f2ed] text-[#3d3d3d]'
                    }`}>
                      {total} 项
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Date Task List Inspector */}
      <div className="bg-white rounded-3xl p-5 border border-[#e8e4dc] shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#e8e4dc]">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#82947d]" />
            <h3 className="text-base font-bold text-[#3d3d3d]">
              {selectedDate} ({getDayName(selectedDate)} · {formatRelativeDate(selectedDate)}) 复查详情
            </h3>
          </div>
          <span className="text-xs font-semibold px-2.5 py-0.5 bg-[#f5f2ed] text-[#61594f] rounded-full border border-[#e8e4dc]">
            共 {selectedTasks.total} 项
          </span>
        </div>

        {selectedTasks.total > 0 ? (
          <div className="space-y-3">
            {/* Knowledge points for selected date */}
            {selectedTasks.kpList.map(point => {
              const subj = getSubject(point.subjectId);
              return (
                <div
                  key={point.id}
                  className="p-3.5 bg-[#faf8f5] rounded-2xl border border-[#e8e4dc] flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="px-2 py-0.2 rounded-full text-[10px] font-semibold text-white"
                        style={{ backgroundColor: subj?.color || '#82947d' }}
                      >
                        {subj?.name}
                      </span>
                      {point.source && (
                        <span className="text-xs text-[#8c8275]">{point.source}</span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-[#3d3d3d]">{point.title}</h4>
                    {point.notes && (
                      <p className="text-xs text-[#61594f] mt-1 line-clamp-2">{point.notes}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0 text-xs text-[#8c8275]">
                    <div>遍数: {point.reviewCount}</div>
                    <div className="text-[11px] text-[#8c8275]">阶段 {point.stage}</div>
                  </div>
                </div>
              );
            })}

            {/* Practice reviews for selected date */}
            {selectedTasks.pracList.map(prac => {
              const subj = getSubject(prac.subjectId);
              return (
                <div
                  key={prac.id}
                  className="p-3.5 bg-[#fbf4f2] rounded-2xl border border-[#e8c0b8] flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="px-2 py-0.2 rounded-full text-[10px] font-semibold text-white"
                        style={{ backgroundColor: subj?.color || '#c17f6f' }}
                      >
                        {subj?.name}
                      </span>
                      <span className="text-xs font-bold text-[#3d3d3d]">{prac.setName}</span>
                    </div>
                    <h4 className="text-xs font-semibold text-[#964f3f]">题号: {prac.questionNumbers} (错 {prac.wrongCount} 题)</h4>
                    {prac.reflection && (
                      <p className="text-xs text-[#61594f] mt-1">{prac.reflection}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-[#8c8275] text-xs">
            该日期暂未安排复查任务
          </div>
        )}
      </div>
    </div>
  );
};
