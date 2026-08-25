import React, { useState } from 'react';
import {
  BookOpen,
  Calendar,
  Clock,
  Dices,
  Lightbulb,
  PenLine,
  Plus,
  Settings,
  Sparkles,
  Zap,
} from 'lucide-react';

interface Props {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  dueCount: number;
  knowledgeCount: number;
  practiceCount: number;
  tipsCount: number;
  onOpenAddKnowledge: () => void;
  onOpenAddPractice: () => void;
  onOpenAddTip: () => void;
  onOpenRandomTip: () => void;
}

export const Header: React.FC<Props> = ({
  currentTab,
  onSelectTab,
  dueCount,
  knowledgeCount,
  practiceCount,
  tipsCount,
  onOpenAddKnowledge,
  onOpenAddPractice,
  onOpenAddTip,
  onOpenRandomTip,
}) => {
  const [showQuickAddMenu, setShowQuickAddMenu] = useState<boolean>(false);

  const navItems = [
    {
      id: 'today',
      label: '今日复查',
      icon: Clock,
      badge: dueCount > 0 ? dueCount : undefined,
      badgeColor: 'bg-[#c17f6f] text-white',
    },
    {
      id: 'recitation',
      label: '背诵库',
      icon: BookOpen,
      badge: knowledgeCount,
      badgeColor: 'bg-[#f5f2ed] text-[#7c7467]',
    },
    {
      id: 'practice',
      label: '刷题复盘',
      icon: PenLine,
      badge: practiceCount,
      badgeColor: 'bg-[#f5f2ed] text-[#7c7467]',
    },
    {
      id: 'tips',
      label: 'Tips 纸条',
      icon: Lightbulb,
      badge: tipsCount,
      badgeColor: 'bg-[#f5f2ed] text-[#7c7467]',
    },
    {
      id: 'calendar',
      label: '周/月日程',
      icon: Calendar,
    },
    {
      id: 'flashcard',
      label: '随机抽查',
      icon: Zap,
    },
    {
      id: 'settings',
      label: '科目与设置',
      icon: Settings,
    },
  ];

  return (
    <header className="bg-[#ffffff]/90 backdrop-blur-md border-b border-[#e8e4dc] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <div
            className="flex items-center gap-2.5 cursor-pointer select-none"
            onClick={() => onSelectTab('today')}
          >
            <div className="w-9 h-9 rounded-2xl bg-[#82947d] text-white flex items-center justify-center shadow-xs font-bold text-base">
              考
            </div>
            <div>
              <span className="text-base font-black text-[#3d3d3d] tracking-tight block">
                备考复习记录
              </span>
              <span className="text-[10px] text-[#8c8275] font-medium block -mt-0.5">
                主动提取 · 错题复盘 · 艾宾浩斯循环
              </span>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#82947d] text-white shadow-xs'
                      : 'text-[#61594f] hover:text-[#3d3d3d] hover:bg-[#f5f2ed]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isActive ? 'bg-white/20 text-white' : item.badgeColor
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2">
            <button
              id="top-random-tip-btn"
              type="button"
              onClick={onOpenRandomTip}
              className="hidden sm:flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium text-[#8d6023] bg-[#fbf4eb] hover:bg-[#f5ebd9] border border-[#ebd8be] transition-colors shadow-2xs"
              title="随机翻一张 Tips 技巧"
            >
              <Dices className="w-3.5 h-3.5 text-[#bfa07a]" />
              <span>翻一条 Tips</span>
            </button>

            {/* Quick Add Dropdown */}
            <div className="relative">
              <button
                id="quick-add-dropdown-btn"
                type="button"
                onClick={() => setShowQuickAddMenu(!showQuickAddMenu)}
                className="px-3.5 py-2 bg-[#4a5348] hover:bg-[#3b4339] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">快捷录入</span>
              </button>

              {showQuickAddMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowQuickAddMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-[#e8e4dc] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <button
                      type="button"
                      onClick={() => {
                        setShowQuickAddMenu(false);
                        onOpenAddKnowledge();
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs font-medium text-[#4a4a4a] hover:bg-[#f5f2ed] flex items-center gap-2"
                    >
                      <BookOpen className="w-4 h-4 text-[#82947d]" />
                      <span>录入新考点 (背诵)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowQuickAddMenu(false);
                        onOpenAddPractice();
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs font-medium text-[#4a4a4a] hover:bg-[#f5f2ed] flex items-center gap-2"
                    >
                      <PenLine className="w-4 h-4 text-[#607d8b]" />
                      <span>记录刷题 (复盘)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowQuickAddMenu(false);
                        onOpenAddTip();
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs font-medium text-[#4a4a4a] hover:bg-[#f5f2ed] flex items-center gap-2"
                    >
                      <Lightbulb className="w-4 h-4 text-[#bfa07a]" />
                      <span>存一条 Tips (口诀)</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile / Tablet Horizontal Navigation Scroll */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-[#e8e4dc] scrollbar-none">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#82947d] text-white shadow-xs'
                    : 'text-[#61594f] hover:text-[#3d3d3d] bg-[#f5f2ed]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white/20 text-white' : item.badgeColor
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
