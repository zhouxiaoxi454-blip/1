import React, { useState } from 'react';
import { Subject, AppData } from '../types';
import { ALL_ACHIEVEMENTS } from '../utils/achievements';
import { exportDataAsJson, importDataFromJson } from '../utils/storage';
import {
  Settings,
  Plus,
  Trash2,
  Edit2,
  Download,
  Upload,
  AlertTriangle,
  Trophy,
  Shield,
  Palette,
  Check,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface Props {
  appData: AppData;
  onUpdateSubjects: (subjects: Subject[]) => void;
  onRestoreData: (data: AppData) => void;
  onClearData: () => void;
}

const COLOR_PRESETS = [
  '#82947d', // Sage Green
  '#c17f6f', // Terracotta Coral
  '#bfa07a', // Warm Amber Sand
  '#7a918d', // Earthy Teal
  '#8c7b83', // Dusty Mauve
  '#5c7b88', // Slate Blue
  '#9e8876', // Warm Clay
  '#6e8072', // Olive Forest
  '#a67c52', // Bronze Ochre
  '#736f6e', // Natural Pebble
];

export const SettingsSubjectView: React.FC<Props> = ({
  appData,
  onUpdateSubjects,
  onRestoreData,
  onClearData,
}) => {
  const [subjects, setSubjects] = useState<Subject[]>(appData.subjects);
  const [newSubjectName, setNewSubjectName] = useState<string>('');
  const [newSubjectColor, setNewSubjectColor] = useState<string>(COLOR_PRESETS[0]);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [importStatus, setImportStatus] = useState<string>('');
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  const unlockedSet = new Set(appData.unlockedAchievements || []);

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;

    const newSubj: Subject = {
      id: 'sub_' + Date.now(),
      name: newSubjectName.trim(),
      color: newSubjectColor,
      customErrorTags: ['审题偏差', '核心考点混淆'],
    };

    const updated = [...subjects, newSubj];
    setSubjects(updated);
    onUpdateSubjects(updated);
    setNewSubjectName('');
  };

  const handleUpdateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject || !editingSubject.name.trim()) return;

    const updated = subjects.map(s => (s.id === editingSubject.id ? editingSubject : s));
    setSubjects(updated);
    onUpdateSubjects(updated);
    setEditingSubject(null);
  };

  const handleDeleteSubject = (id: string, name: string) => {
    if (subjects.length <= 1) {
      alert('至少需要保留一个科目！');
      return;
    }
    if (window.confirm(`确定要删除科目「${name}」吗？`)) {
      const updated = subjects.filter(s => s.id !== id);
      setSubjects(updated);
      onUpdateSubjects(updated);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const res = await importDataFromJson(file);
    if (res.success && res.data) {
      onRestoreData(res.data);
      setSubjects(res.data.subjects);
      setImportStatus('✅ 数据导入成功！');
      setTimeout(() => setImportStatus(''), 4000);
    } else {
      setImportStatus('❌ ' + res.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-3xl p-5 border border-[#e8e4dc] shadow-xs">
        <h1 className="text-xl font-bold text-[#3d3d3d] flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#82947d]" />
          <span>科目管理与数据安全</span>
        </h1>
        <p className="text-xs text-[#7c7467] mt-0.5">
          自定义你的考试科目名称、备份恢复数据与查看已解锁的备考成就
        </p>
      </div>

      {/* Module 1: Custom Subjects Management */}
      <div className="bg-white rounded-3xl p-6 border border-[#e8e4dc] shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#e8e4dc]">
          <div>
            <h2 className="text-base font-bold text-[#3d3d3d]">自定义考试科目</h2>
            <p className="text-xs text-[#7c7467]">
              支持增删修改、设置专属主题色与自定义学科专属错题标签
            </p>
          </div>
        </div>

        {/* Existing Subjects List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {subjects.map(subj => {
            const kpCount = appData.knowledgePoints.filter(k => k.subjectId === subj.id).length;
            const pracCount = appData.practiceLogs.filter(p => p.subjectId === subj.id).length;

            return (
              <div
                key={subj.id}
                className="p-4 rounded-2xl border border-[#e8e4dc] bg-[#faf8f5] flex items-center justify-between gap-3 shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-4 h-4 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: subj.color }}
                  />
                  <div>
                    <h3 className="text-sm font-bold text-[#3d3d3d]">{subj.name}</h3>
                    <span className="text-xs text-[#7c7467]">
                      考点: {kpCount} 条 · 刷题: {pracCount} 组
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setEditingSubject(subj)}
                    className="p-1.5 text-[#8c8275] hover:text-[#3d3d3d] rounded-lg hover:bg-[#f5f2ed] transition-colors"
                    title="编辑科目"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteSubject(subj.id, subj.name)}
                    className="p-1.5 text-[#8c8275] hover:text-[#c17f6f] rounded-lg hover:bg-[#fbf4f2] transition-colors"
                    title="删除科目"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add New Subject Form */}
        <form onSubmit={handleAddSubject} className="p-4 rounded-2xl border border-[#e8e4dc] bg-[#faf8f5] space-y-3">
          <span className="text-xs font-bold text-[#3d3d3d] block">➕ 添加新考试科目</span>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="输入科目名称 (如：民法 / 408计算机 / 申论)"
              value={newSubjectName}
              onChange={e => setNewSubjectName(e.target.value)}
              className="flex-1 px-3.5 py-2 rounded-xl border border-[#e8e4dc] text-xs focus:outline-none focus:ring-2 focus:ring-[#82947d] bg-white text-[#3d3d3d]"
            />
            {/* Color Presets */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              {COLOR_PRESETS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewSubjectColor(c)}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    newSubjectColor === c ? 'scale-125 ring-2 ring-[#82947d] ring-offset-1' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-[#82947d] hover:bg-[#71826d] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors whitespace-nowrap flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>添加科目</span>
            </button>
          </div>
        </form>

        {/* Edit Subject Modal */}
        {editingSubject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#3d3d3d]/40 backdrop-blur-xs">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[#e8e4dc] space-y-4">
              <h3 className="text-base font-bold text-[#3d3d3d]">编辑科目</h3>
              <form onSubmit={handleUpdateSubject} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#61594f] mb-1">科目名称</label>
                  <input
                    type="text"
                    required
                    value={editingSubject.name}
                    onChange={e => setEditingSubject({ ...editingSubject, name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#e8e4dc] text-xs focus:outline-none focus:ring-2 focus:ring-[#82947d] text-[#3d3d3d]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#61594f] mb-1.5">标记颜色</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {COLOR_PRESETS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setEditingSubject({ ...editingSubject, color: c })}
                        className={`w-6 h-6 rounded-full transition-transform ${
                          editingSubject.color === c ? 'scale-125 ring-2 ring-[#82947d] ring-offset-1' : ''
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e8e4dc]">
                  <button
                    type="button"
                    onClick={() => setEditingSubject(null)}
                    className="px-3.5 py-2 rounded-xl border border-[#e8e4dc] text-xs text-[#61594f] hover:bg-[#f5f2ed]"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#82947d] hover:bg-[#71826d] text-white text-xs font-semibold"
                  >
                    保存修改
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Module 2: Data Backup & Security */}
      <div className="bg-white rounded-3xl p-6 border border-[#e8e4dc] shadow-xs space-y-4">
        <div className="pb-3 border-b border-[#e8e4dc]">
          <h2 className="text-base font-bold text-[#3d3d3d] flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#82947d]" />
            <span>数据安全与离线备份</span>
          </h2>
          <p className="text-xs text-[#7c7467]">
            全部备考数据保存在本地浏览器中。建议定期导出 JSON 备份文件妥善保存。
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Export JSON button */}
          <div className="p-4 rounded-2xl border border-[#e8e4dc] bg-[#faf8f5] flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#3d3d3d] flex items-center gap-1.5 mb-1">
                <Download className="w-4 h-4 text-[#82947d]" />
                <span>导出数据备份 (JSON)</span>
              </h3>
              <p className="text-xs text-[#7c7467] mb-3">
                一键将全部考点、做题复盘与 Tips 导出为标准 JSON 备份文件
              </p>
            </div>
            <button
              id="export-backup-btn"
              type="button"
              onClick={() => exportDataAsJson(appData)}
              className="w-full py-2 px-3 bg-[#82947d] hover:bg-[#71826d] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>立即导出 JSON 备份</span>
            </button>
          </div>

          {/* Import JSON button */}
          <div className="p-4 rounded-2xl border border-[#e8e4dc] bg-[#faf8f5] flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#3d3d3d] flex items-center gap-1.5 mb-1">
                <Upload className="w-4 h-4 text-[#82947d]" />
                <span>从备份文件恢复</span>
              </h3>
              <p className="text-xs text-[#7c7467] mb-3">
                选择之前导出的 JSON 备份文件恢复全部备考记录
              </p>
            </div>
            <label className="w-full py-2 px-3 bg-white hover:bg-[#f5f2ed] border border-[#e8e4dc] text-[#3d3d3d] text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs">
              <Upload className="w-3.5 h-3.5 text-[#82947d]" />
              <span>选择 JSON 文件恢复</span>
              <input
                id="import-backup-input"
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {importStatus && (
          <div className="p-3 bg-[#f5f2ed] border border-[#e8e4dc] rounded-xl text-xs font-medium text-[#3d3d3d]">
            {importStatus}
          </div>
        )}

        {/* Clear Data secondary confirmation */}
        <div className="pt-3 border-t border-[#e8e4dc] flex items-center justify-between">
          <div className="text-xs text-[#8c8275]">
            清空所有记录（不可撤销）
          </div>
          <button
            id="clear-data-danger-btn"
            type="button"
            onClick={() => setShowClearConfirm(true)}
            className="px-3 py-1.5 text-xs text-[#c17f6f] hover:bg-[#fbf4f2] rounded-xl font-medium transition-colors"
          >
            清空全部数据...
          </button>
        </div>

        {showClearConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#3d3d3d]/40 backdrop-blur-xs">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-[#e8c0b8] space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#fbf4f2] text-[#c17f6f] flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="text-center">
                <h3 className="text-base font-bold text-[#3d3d3d]">确定要清空全部备考数据吗？</h3>
                <p className="text-xs text-[#7c7467] mt-1 leading-relaxed">
                  此操作将彻底删除本地所有知识点、刷题复盘和 Tips 纸条，且无法恢复。建议提前导出备份！
                </p>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 py-2 rounded-xl border border-[#e8e4dc] text-xs font-semibold text-[#61594f] hover:bg-[#f5f2ed]"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClearData();
                    setShowClearConfirm(false);
                  }}
                  className="flex-1 py-2 rounded-xl bg-[#c17f6f] hover:bg-[#ad6e5f] text-white text-xs font-semibold shadow-xs"
                >
                  确认彻底清空
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Module 3: Hidden Achievements Trophy Box */}
      <div className="bg-white rounded-3xl p-6 border border-[#e8e4dc] shadow-xs space-y-4">
        <div className="pb-3 border-b border-[#e8e4dc] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#3d3d3d] flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#bfa07a]" />
              <span>隐藏成就陈列室</span>
            </h2>
            <p className="text-xs text-[#7c7467]">
              备考过程中达成特定里程碑时将意外解锁（已解锁 {unlockedSet.size} / {ALL_ACHIEVEMENTS.length} 个）
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-[#fdf7ee] text-[#8d6023] rounded-full border border-[#eedab9]">
            {unlockedSet.size} / {ALL_ACHIEVEMENTS.length}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {ALL_ACHIEVEMENTS.map(ach => {
            const isUnlocked = unlockedSet.has(ach.id);

            return (
              <div
                key={ach.id}
                className={`p-4 rounded-2xl border text-center transition-all ${
                  isUnlocked
                    ? 'bg-[#fdf7ee] border-[#eedab9] shadow-2xs'
                    : 'bg-[#faf8f5] border-[#e8e4dc]/70 opacity-60'
                }`}
              >
                <div className="text-3xl mb-2 filter drop-shadow-xs">
                  {isUnlocked ? ach.icon : '🔒'}
                </div>
                <h4 className="text-xs font-bold text-[#3d3d3d] mb-1">
                  {isUnlocked ? ach.title : '？？？（隐藏成就）'}
                </h4>
                <p className="text-[11px] text-[#7c7467] leading-snug">
                  {isUnlocked ? ach.description : '达成特定备考行动时解锁'}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
