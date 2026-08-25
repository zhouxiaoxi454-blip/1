import React, { useState } from 'react';
import { Subject, QuizQuestion } from '../types';
import { SAMPLE_QUIZ_PRESETS, SampleQuizPreset } from '../utils/sampleQuizPresets';
import {
  X,
  UploadCloud,
  FileText,
  Sparkles,
  Image as ImageIcon,
  Check,
  AlertCircle,
  HelpCircle,
  BookOpen,
  ArrowRight,
  Loader2,
  FileCode2,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  onStartQuiz: (quizData: {
    setName: string;
    subjectId: string;
    questions: QuizQuestion[];
  }) => void;
}

export const ModalSmartImportPractice: React.FC<Props> = ({
  isOpen,
  onClose,
  subjects,
  onStartQuiz,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'preset'>('upload');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    subjects[0] ? subjects[0].id : ''
  );
  const [setName, setSetName] = useState<string>('');
  const [pastedText, setPastedText] = useState<string>('');

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [fileTextContent, setFileTextContent] = useState<string | null>(null);

  // Status & loading
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStatusText, setLoadingStatusText] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  if (!isOpen) return null;

  const currentSubject = subjects.find(s => s.id === selectedSubjectId) || subjects[0];

  const handleFileChange = (file: File) => {
    setSelectedFile(file);
    setErrorMessage('');
    const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
    if (!setName.trim()) {
      setSetName(fileNameWithoutExt);
    }

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = e => {
        const res = e.target?.result as string;
        setFilePreview(res);
        setFileBase64(res);
        setFileTextContent(null);
      };
      reader.readAsDataURL(file);
    } else if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      const reader = new FileReader();
      reader.onload = e => {
        const text = e.target?.result as string;
        setFileTextContent(text);
        setFilePreview(null);
        setFileBase64(null);
      };
      reader.readAsText(file);
    } else {
      // PDF or other binary file: read as DataURL base64
      const reader = new FileReader();
      reader.onload = e => {
        const res = e.target?.result as string;
        setFileBase64(res);
        setFilePreview(null);
        setFileTextContent(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleApplyPreset = (preset: SampleQuizPreset) => {
    // Match or create subject
    const matchSubj = subjects.find(s => s.name.includes(preset.subjectName)) || subjects[0];
    onStartQuiz({
      setName: preset.setName,
      subjectId: matchSubj ? matchSubj.id : 'default',
      questions: preset.questions,
    });
    onClose();
  };

  const handleStartAiParsing = async () => {
    setErrorMessage('');

    let promptText = '';
    let sendImageBase64: string | undefined = undefined;
    let mimeType: string | undefined = undefined;

    if (activeTab === 'upload') {
      if (!selectedFile) {
        setErrorMessage('请先选择或拖拽上传题目文件/图片');
        return;
      }
      if (fileTextContent) {
        promptText = fileTextContent;
      } else if (fileBase64) {
        sendImageBase64 = fileBase64;
        mimeType = selectedFile.type || 'image/png';
      }
    } else if (activeTab === 'paste') {
      if (!pastedText.trim()) {
        setErrorMessage('请在文本框中粘贴试卷或题目的文本内容');
        return;
      }
      promptText = pastedText.trim();
    }

    const finalSetName =
      setName.trim() ||
      (selectedFile ? selectedFile.name.replace(/\.[^/.]+$/, '') : `${currentSubject?.name || '综合'}专项训练题`);

    setIsLoading(true);
    setLoadingStatusText('正在扫描题干与选项结构...');

    try {
      // Periodic status updates for smooth UX
      const timer1 = setTimeout(() => {
        setLoadingStatusText('AI 正在智能识别考点、校准标准答案与生成高阶解析...');
      }, 1800);
      const timer2 = setTimeout(() => {
        setLoadingStatusText('正在编排结构化互动答题卡与易错点辨析...');
      }, 4000);

      const response = await fetch('/api/extract-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: promptText || undefined,
          imageBase64: sendImageBase64,
          mimeType,
          subjectName: currentSubject?.name,
        }),
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `请求失败 (${response.status})`);
      }

      const result = await response.json();
      if (!result.success || !result.data?.questions || result.data.questions.length === 0) {
        throw new Error(result.error || '未能从材料中识别出有效题目，请检查上传内容格式');
      }

      const parsedQuestions: QuizQuestion[] = result.data.questions.map((q: any, idx: number) => ({
        id: q.id || `q_${Date.now()}_${idx + 1}`,
        questionNumber: q.questionNumber || `${idx + 1}`,
        type: q.type || 'single_choice',
        stem: q.stem || `题目 ${idx + 1}`,
        options: q.options || [],
        answer: q.answer || '',
        explanation: q.explanation || '（AI 已生成标准解析）',
        knowledgePoint: q.knowledgePoint || currentSubject?.name,
        difficulty: q.difficulty || 'medium',
      }));

      // Launch interactive quiz directly!
      onStartQuiz({
        setName: result.data.setName || finalSetName,
        subjectId: selectedSubjectId || (subjects[0] ? subjects[0].id : 'default'),
        questions: parsedQuestions,
      });

      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || '识别提取失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="smart-import-practice-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#3d3d3d]/40 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-[#e8e4dc] relative overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#e8e4dc]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#fdf7ee] border border-[#eedab9] flex items-center justify-center text-[#8d6023] shadow-xs">
              <Sparkles className="w-5 h-5 text-[#bfa07a]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#3d3d3d] flex items-center gap-2">
                <span>智能导入题目 · 在线互动刷题</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#edf2ec] text-[#4d6148] border border-[#bcd2b8] font-bold">
                  AI 自动识别解析
                </span>
              </h2>
              <p className="text-xs text-[#7c7467]">
                支持上传图片/文本/试卷，自动提取题目与答案并开启沉浸式互动刷题与即时答疑
              </p>
            </div>
          </div>
          <button
            id="close-smart-import-btn"
            onClick={onClose}
            disabled={isLoading}
            className="text-[#8c8275] hover:text-[#3d3d3d] p-1.5 rounded-lg hover:bg-[#f5f2ed] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="mt-4 space-y-4 overflow-y-auto pr-1 flex-1">
          {/* Method Tabs */}
          <div className="flex items-center p-1 bg-[#f5f2ed] rounded-2xl border border-[#e8e4dc]">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'upload'
                  ? 'bg-white text-[#3d3d3d] shadow-xs'
                  : 'text-[#61594f] hover:text-[#3d3d3d]'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>上传文件 / 题目截图</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('paste')}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'paste'
                  ? 'bg-white text-[#3d3d3d] shadow-xs'
                  : 'text-[#61594f] hover:text-[#3d3d3d]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>粘贴题目文本</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preset')}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'preset'
                  ? 'bg-white text-[#3d3d3d] shadow-xs'
                  : 'text-[#61594f] hover:text-[#3d3d3d]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-[#bfa07a]" />
              <span>体验预设样卷</span>
            </button>
          </div>

          {/* Subject & Set Name row */}
          {activeTab !== 'preset' && (
            <div className="space-y-3 p-3.5 rounded-2xl bg-[#faf8f5] border border-[#e8e4dc]">
              {/* Subject selector */}
              <div>
                <label className="block text-xs font-semibold text-[#4a4a4a] mb-1.5">
                  归属科目 <span className="text-[#c17f6f]">*</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {subjects.map(s => {
                    const isSelected = s.id === selectedSubjectId;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelectedSubjectId(s.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'border-[#82947d] bg-[#82947d] text-white shadow-xs'
                            : 'border-[#e8e4dc] bg-white text-[#61594f] hover:bg-[#f5f2ed]'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                        {s.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Set Name */}
              <div>
                <label className="block text-xs font-semibold text-[#4a4a4a] mb-1">
                  题集 / 试卷名称 <span className="text-[#8c8275] font-normal">(选填，AI也可自动识别)</span>
                </label>
                <input
                  type="text"
                  placeholder="例如：2024真题模拟卷一 / 马原核心错题集"
                  value={setName}
                  onChange={e => setSetName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#e8e4dc] text-xs focus:outline-none focus:ring-2 focus:ring-[#82947d] bg-white text-[#3d3d3d]"
                />
              </div>
            </div>
          )}

          {/* Tab 1: File Upload */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              <div
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
                className={`p-6 rounded-2xl border-2 border-dashed text-center transition-all cursor-pointer ${
                  selectedFile
                    ? 'border-[#82947d] bg-[#edf2ec]/50'
                    : 'border-[#e8e4dc] bg-[#faf8f5] hover:bg-[#f5f2ed] hover:border-[#82947d]/60'
                }`}
                onClick={() => document.getElementById('file-upload-input')?.click()}
              >
                <input
                  id="file-upload-input"
                  type="file"
                  accept="image/*,.txt,.md,.pdf,.docx"
                  className="hidden"
                  onChange={e => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                />

                {selectedFile ? (
                  <div className="space-y-2">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-[#edf2ec] border border-[#bcd2b8] flex items-center justify-center text-[#4d6148]">
                      {filePreview ? (
                        <ImageIcon className="w-6 h-6" />
                      ) : (
                        <FileCode2 className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-[#3d3d3d] truncate max-w-sm mx-auto">
                        {selectedFile.name}
                      </span>
                      <span className="text-[11px] text-[#8c8275]">
                        大小: {(selectedFile.size / 1024).toFixed(1)} KB · 点击可重新上传
                      </span>
                    </div>

                    {filePreview && (
                      <div className="mt-2 max-h-36 overflow-hidden rounded-xl border border-[#e8e4dc] inline-block shadow-2xs">
                        <img
                          src={filePreview}
                          alt="题目预览"
                          className="max-h-36 object-contain mx-auto"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-[#f5f2ed] text-[#8c8275] flex items-center justify-center">
                      <UploadCloud className="w-6 h-6 text-[#82947d]" />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-[#3d3d3d]">
                        点击选择或拖拽试卷文件 / 题目截图到此处
                      </span>
                      <p className="text-[11px] text-[#8c8275] mt-0.5">
                        支持 JPG、PNG、WEBP 题目截图，以及 TXT、Markdown 试卷文本
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Text Paste */}
          {activeTab === 'paste' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#4a4a4a]">
                  直接粘贴题目文本内容
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setPastedText(`1. 唯物辩证法的总特征是（ ）。
A. 联系和发展的观点
B. 物质第一性的观点
C. 实践第一性的观点
D. 对立统一的观点
答案：A
解析：普遍联系和永恒发展是唯物辩证法的两个总特征。

2. 下列哪些行为属于正当防卫？（ ）
A. 制止正在行凶的歹徒
B. 在受到正在进行的不法侵害时反击
C. 事后追打已逃离的盗窃犯
D. 挑逗对方动手然后实施伤害
答案：AB
解析：正当防卫要求不法侵害必须正在进行，事后防卫与防卫挑拨不属于正当防卫。`);
                  }}
                  className="text-[11px] text-[#82947d] hover:underline font-medium"
                >
                  填入示例题目
                </button>
              </div>
              <textarea
                rows={7}
                placeholder="粘贴包含题干、选项（A/B/C/D）和答案解析的文字内容，例如：&#10;1. 某考点题目...&#10;A. 选项1&#10;B. 选项2&#10;C. 选项3&#10;D. 选项4&#10;答案：B&#10;（即使没有答案和解析，AI 也会自动为你补充权威标准答案与详细解析）"
                value={pastedText}
                onChange={e => setPastedText(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[#e8e4dc] text-xs focus:outline-none focus:ring-2 focus:ring-[#82947d] bg-white text-[#3d3d3d] leading-relaxed resize-y font-mono"
              />
            </div>
          )}

          {/* Tab 3: Preset Demo Sets */}
          {activeTab === 'preset' && (
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-[#3d3d3d] block">
                精选高频备考测试题库（一键开启作答与解析体验）：
              </span>
              <div className="grid grid-cols-1 gap-2.5">
                {SAMPLE_QUIZ_PRESETS.map(preset => (
                  <div
                    key={preset.id}
                    className="p-4 rounded-2xl border border-[#e8e4dc] bg-[#faf8f5] hover:border-[#82947d] transition-all flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#edf2ec] text-[#4d6148] border border-[#bcd2b8]">
                          {preset.subjectName}
                        </span>
                        <h4 className="text-xs font-bold text-[#3d3d3d]">{preset.setName}</h4>
                      </div>
                      <p className="text-[11px] text-[#7c7467]">{preset.description}</p>
                      <span className="text-[10px] text-[#8c8275] mt-1 inline-block">
                        共包含 {preset.questions.length} 道典型单选/多选/判断考题
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="px-3.5 py-2 rounded-xl bg-[#82947d] hover:bg-[#71826d] text-white text-xs font-semibold transition-colors flex items-center gap-1 shrink-0 shadow-xs"
                    >
                      <span>直接开始刷题</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error display */}
          {errorMessage && (
            <div className="p-3 bg-[#fbf4f2] border border-[#e8c0b8] rounded-xl flex items-start gap-2 text-xs text-[#964f3f]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 mt-3 border-t border-[#e8e4dc] flex items-center justify-between gap-3">
          <span className="text-[11px] text-[#8c8275] hidden sm:inline">
            ✨ 支持智能补齐题型、答案、考点与高分解析
          </span>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl border border-[#e8e4dc] text-xs font-medium text-[#61594f] hover:bg-[#f5f2ed] transition-colors"
            >
              取消
            </button>

            {activeTab !== 'preset' && (
              <button
                id="start-ai-parse-btn"
                type="button"
                onClick={handleStartAiParsing}
                disabled={isLoading}
                className="px-5 py-2 rounded-xl bg-[#82947d] hover:bg-[#71826d] text-white text-xs font-medium shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{loadingStatusText || 'AI 正在解析中...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-[#eedab9]" />
                    <span>开始智能提取并刷题</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
