import React, { useEffect } from 'react';
import { Achievement } from '../types';
import { Sparkles, Trophy, X } from 'lucide-react';

interface Props {
  achievement: Achievement | null;
  onClose: () => void;
}

export const AchievementToast: React.FC<Props> = ({ achievement, onClose }) => {
  useEffect(() => {
    if (achievement) {
      const timer = setTimeout(() => {
        onClose();
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [achievement, onClose]);

  if (!achievement) return null;

  return (
    <div
      id="achievement-popup-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#3d3d3d]/40 backdrop-blur-xs animate-in fade-in duration-300"
    >
      <div
        className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-[#eedab9] text-center relative overflow-hidden transform animate-in zoom-in-95 duration-300"
      >
        {/* Glow decoration */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#fdf7ee] rounded-full blur-xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-[#faf8f5] rounded-full blur-xl pointer-events-none" />

        <button
          id="close-achievement-btn"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 text-[#8c8275] hover:text-[#3d3d3d] p-1.5 rounded-lg hover:bg-[#f5f2ed] transition-colors"
          title="关闭"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-16 h-16 mx-auto bg-gradient-to-tr from-[#eedab9] to-[#faf8f5] rounded-2xl flex items-center justify-center text-3xl shadow-inner mb-3.5 border border-[#eedab9]">
          {achievement.icon || '🏆'}
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fdf7ee] text-[#8d6023] text-xs font-semibold tracking-wide mb-2 border border-[#eedab9]">
          <Sparkles className="w-3.5 h-3.5 text-[#bfa07a]" />
          <span>达成新成就！</span>
        </div>

        <h3 className="text-xl font-bold text-[#3d3d3d] mb-1.5">{achievement.title}</h3>
        <p className="text-sm text-[#61594f] leading-relaxed mb-5">{achievement.description}</p>

        <button
          id="confirm-achievement-btn"
          onClick={onClose}
          className="w-full py-2.5 px-4 bg-[#82947d] hover:bg-[#71826d] text-white text-sm font-medium rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2"
        >
          <Trophy className="w-4 h-4 text-[#eedab9]" />
          <span>收下成就，继续复习</span>
        </button>
      </div>
    </div>
  );
};
