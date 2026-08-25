import React, { useState } from 'react';
import { TipCard, Subject } from '../types';
import {
  Lightbulb,
  Search,
  Plus,
  Dices,
  Edit2,
  Trash2,
  BookOpen,
  Quote,
  Sparkles,
} from 'lucide-react';

interface Props {
  tips: TipCard[];
  subjects: Subject[];
  onAddTip: () => void;
  onEditTip: (tip: TipCard) => void;
  onDeleteTip: (tipId: string) => void;
  onOpenRandomTip: () => void;
}

export const TipsView: React.FC<Props> = ({
  tips,
  subjects,
  onAddTip,
  onEditTip,
  onDeleteTip,
  onOpenRandomTip,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  // Collect all unique tags
  const allTags = Array.from(new Set(tips.flatMap(t => t.tags || []).filter(Boolean)));

  const filteredTips = tips.filter(tip => {
    if (selectedSubjectId !== 'all' && tip.subjectId !== selectedSubjectId) return false;
    if (selectedTag !== 'all' && !(tip.tags || []).includes(selectedTag)) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchTitle = tip.title.toLowerCase().includes(q);
      const matchContent = tip.content.toLowerCase().includes(q);
      const matchSource = (tip.source || '').toLowerCase().includes(q);
      if (!matchTitle && !matchContent && !matchSource) return false;
    }

    return true;
  });

  const getSubject = (id: string) => subjects.find(s => s.id === id);

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="bg-white rounded-3xl p-5 border border-[#e8e4dc] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#3d3d3d] flex items-center gap-2">
              <span>💡 Tips 小纸条 · 做题技巧与口诀</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#f5f2ed] text-[#61594f]">
                共 {tips.length} 张
              </span>
            </h1>
            <p className="text-xs text-[#7c7467] mt-0.5">
              记录排除法、审题切入点、大题框架与避坑口诀（独立于日常复查，可随时翻阅）
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              id="tips-random-flip-btn"
              type="button"
              onClick={onOpenRandomTip}
              className="px-3.5 py-2 bg-[#fbf4eb] hover:bg-[#f5ebd9] text-[#8d6023] border border-[#ebd8be] rounded-xl text-xs font-medium transition-colors shadow-2xs flex items-center gap-1.5"
            >
              <Dices className="w-4 h-4 text-[#bfa07a]" />
              <span>随机翻一条温习</span>
            </button>
            <button
              id="tips-add-btn"
              type="button"
              onClick={onAddTip}
              className="px-4 py-2 bg-[#82947d] hover:bg-[#71826d] text-white rounded-xl text-xs font-medium transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>存一条纸条</span>
            </button>
          </div>
        </div>

        {/* Search & Subject Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-[#8c8275] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜索技巧标题、口诀、解题要点、来源出处..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-[#e8e4dc] text-xs focus:outline-none focus:ring-2 focus:ring-[#82947d] bg-[#faf8f5]"
            />
          </div>

          {/* Tag Filter */}
          <div className="sm:col-span-4">
            <select
              value={selectedTag}
              onChange={e => setSelectedTag(e.target.value)}
              className="w-full py-2 px-3 rounded-xl border border-[#e8e4dc] text-xs bg-white text-[#4a4a4a] focus:outline-none focus:border-[#82947d]"
            >
              <option value="all">全部标签分类 ({allTags.length})</option>
              {allTags.map(t => (
                <option key={t} value={t}>#{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Subject Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs text-[#8c8275] whitespace-nowrap">科目:</span>
          <button
            type="button"
            onClick={() => setSelectedSubjectId('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
              selectedSubjectId === 'all' ? 'bg-[#82947d] text-white shadow-xs' : 'bg-[#f5f2ed] text-[#61594f] hover:bg-[#ebe6dd]'
            }`}
          >
            全部 ({tips.length})
          </button>
          {subjects.map(s => {
            const count = tips.filter(t => t.subjectId === s.id).length;
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

      {/* Tips Cards Grid */}
      {filteredTips.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTips.map(tip => {
            const subj = getSubject(tip.subjectId);

            return (
              <div
                key={tip.id}
                id={`tip-card-${tip.id}`}
                className="bg-white rounded-3xl p-5 border border-[#e8e4dc] shadow-xs hover:border-[#d4cebe] transition-all flex flex-col justify-between relative group"
              >
                <Quote className="w-8 h-8 text-[#f0ece4] absolute top-4 right-4 pointer-events-none group-hover:text-[#e4ded3] transition-colors" />

                <div>
                  {/* Top Subject & Source */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-white shadow-2xs"
                        style={{ backgroundColor: subj?.color || '#bfa07a' }}
                      >
                        {subj?.name}
                      </span>
                      {tip.source && (
                        <span className="text-xs text-[#7c7467] flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-[#8c8275]" />
                          {tip.source}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#8c8275]">{tip.createdAt}</span>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-[#3d3d3d] mb-2 leading-snug">
                    {tip.title}
                  </h3>

                  {/* Content Box */}
                  <div className="bg-[#faf8f5] p-3.5 rounded-2xl border border-[#e8e4dc] text-xs text-[#4a4a4a] leading-relaxed whitespace-pre-wrap">
                    {tip.content}
                  </div>

                  {/* Tags */}
                  {tip.tags && tip.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {tip.tags.map(t => (
                        <span
                          key={t}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-[#f5f2ed] text-[#61594f] font-medium"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-end gap-1.5 pt-3 mt-3 border-t border-[#e8e4dc]">
                  <button
                    type="button"
                    onClick={() => onEditTip(tip)}
                    className="p-1.5 text-[#7c7467] hover:text-[#3d3d3d] rounded-lg hover:bg-[#f5f2ed] transition-colors text-xs flex items-center gap-1"
                    title="修改纸条"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>编辑</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`确定要删除小纸条「${tip.title}」吗？`)) {
                        onDeleteTip(tip.id);
                      }
                    }}
                    className="p-1.5 text-[#8c8275] hover:text-[#964f3f] rounded-lg hover:bg-[#fbf4f2] transition-colors text-xs flex items-center gap-1"
                    title="删除纸条"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>删除</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl border border-[#e8e4dc]">
          <Lightbulb className="w-10 h-10 text-[#82947d] opacity-40 mx-auto mb-2" />
          <h3 className="text-base font-bold text-[#3d3d3d]">暂无符合条件的 Tips 小纸条</h3>
          <p className="text-xs text-[#8c8275] mt-1">
            把刷题总结的排雷口诀、秒杀套路或易错辨析记录在这里吧
          </p>
        </div>
      )}
    </div>
  );
};
