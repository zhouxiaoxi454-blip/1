import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// Body parser
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Lazy get Google GenAI instance
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in server environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// API: Extract questions from text or image/file
app.post('/api/extract-questions', async (req, res) => {
  try {
    const { text, imageBase64, mimeType, subjectName } = req.body;

    if (!text && !imageBase64) {
      return res.status(400).json({ error: '请提供题目文本或图片/文件数据' });
    }

    const ai = getGenAI();

    const systemInstruction = `你是一位顶级的考试命题专家与高分备考名师。
你的任务是从用户上传的试卷、题库、错题本或题目截图/文本中，自动识别并提取出所有题目、选项、标准答案和高质量深度解析。

请遵循以下规则：
1. 提取出每道题的：
   - id: 唯一标识字符串（如 q_1, q_2）
   - questionNumber: 题号（如 "1", "2", "第1题"）
   - type: 题型，必须是以下之一："single_choice"（单选）、"multiple_choice"（多选）、"true_false"（判断题）、"fill_blank"（填空题）、"essay"（简答/论述/材料分析题）
   - stem: 题目题干（清晰完整，去除无关杂乱符号）
   - options: 选项列表（若是选择题，包含 key 如 "A","B","C","D" 与 text 选项内容；若是判断题可为空或包含对错；非选择题设为空数组）
   - answer: 正确答案（选择题必须为选项字母大写如 "A" 或 "BCD"；判断题为 "正确"/"错误" 或 "T"/"F"；主观题/填空题为标准答案核心词/句）
   - explanation: 深度精讲解析（必须非常详尽！包含：【核心考点精解】、【正确项逻辑】、【错误干扰项剖析/避坑指南】与【一句话秒杀/记忆口诀】）
   - knowledgePoint: 题目所属的核心考点/概念模块名称（如 "唯物辩证法矛盾的普遍性与特殊性"、"刑法紧急避险与正当防卫" 等）
   - difficulty: 难度 ("easy" | "medium" | "hard")
2. 如果用户上传的材料中未包含答案或解析，请你作为权威名师，给出100%严谨的标准答案与详尽解析！
3. 若材料中有多道题，务必全部依次提取；如果是单道题也请完整规范提取。
4. 同时总结该题集的推荐名称（setName，如 "考研政治精选习题集"、"行测数量关系训练卷" 等）。`;

    const contents: any[] = [];

    if (imageBase64) {
      const cleanMime = mimeType || 'image/png';
      // Clean base64 prefix if present
      const base64Data = imageBase64.replace(/^data:[^;]+;base64,/, '');
      contents.push({
        inlineData: {
          mimeType: cleanMime,
          data: base64Data,
        },
      });
    }

    const promptText = `请解析以下试卷/题目材料：
${subjectName ? `【所属学科/科目】: ${subjectName}` : ''}
${text ? `【题目内容文本】:\n${text}` : '（请根据上传的图片/文件提取所有题目）'}

请以结构化 JSON 格式输出题集名称与提取的所有题目。`;

    contents.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: { parts: contents },
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            setName: {
              type: Type.STRING,
              description: '题集或试卷推荐名称',
            },
            subjectSuggested: {
              type: Type.STRING,
              description: '识别或推荐的学科名称',
            },
            totalExtracted: {
              type: Type.INTEGER,
              description: '成功提取的题目数量',
            },
            questions: {
              type: Type.ARRAY,
              description: '提取出的题目列表',
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  questionNumber: { type: Type.STRING },
                  type: {
                    type: Type.STRING,
                    description: 'single_choice | multiple_choice | true_false | fill_blank | essay',
                  },
                  stem: { type: Type.STRING, description: '题干内容' },
                  options: {
                    type: Type.ARRAY,
                    description: '选项列表',
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        key: { type: Type.STRING, description: 'A, B, C, D 等' },
                        text: { type: Type.STRING, description: '选项文字' },
                      },
                      required: ['key', 'text'],
                    },
                  },
                  answer: { type: Type.STRING, description: '标准正确答案' },
                  explanation: { type: Type.STRING, description: '深度解析与易错点辨析' },
                  knowledgePoint: { type: Type.STRING, description: '考点归属' },
                  difficulty: { type: Type.STRING, description: 'easy | medium | hard' },
                },
                required: ['id', 'stem', 'type', 'answer', 'explanation'],
              },
            },
          },
          required: ['setName', 'questions'],
        },
      },
    });

    const parsedJson = JSON.parse(response.text || '{}');
    return res.json({
      success: true,
      data: parsedJson,
    });
  } catch (error: any) {
    console.error('Error in extract-questions:', error);
    return res.status(500).json({
      success: false,
      error: error.message || '识别提取题目失败，请稍后重试',
    });
  }
});

// API: In-depth Question Tutor & Explanation Q&A
app.post('/api/explain-question', async (req, res) => {
  try {
    const { questionStem, options, correctAnswer, userAnswer, userQuery, explanation } = req.body;

    if (!questionStem) {
      return res.status(400).json({ error: '缺少题干信息' });
    }

    const ai = getGenAI();

    const prompt = `你是一位耐心的备考名师与答疑导师。学生正在做以下这道题，并提出了疑问或作答结果。

【题目题干】:
${questionStem}

【选项信息】:
${options && Array.isArray(options) ? options.map((o: any) => `${o.key}. ${o.text}`).join('\n') : '无选项'}

【标准答案】: ${correctAnswer}
${userAnswer ? `【学生作答】: ${userAnswer}` : ''}
${explanation ? `【基础解析】: ${explanation}` : ''}
${userQuery ? `【学生提出的具体疑问】: ${userQuery}` : '【学生疑问】: 请详细为我剖析这道题为什么这么选，以及我的错选原因和容易掉入的思维陷阱。'}

请针对学生的疑问，提供生动透彻、通俗易懂且切中考点的答疑指导。包含：
1. 💡 **核心逻辑拆解**：这道题题眼的关键词是什么，命题人在考察什么底层原理。
2. 🎯 **选项精细对比**：正确选项与错误选项的关键区别与陷阱设置手法。
3. 📝 **考场避坑口诀与记忆支点**：用一两句朗朗上口或形象生动的口诀帮学生牢牢记住。`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        systemInstruction: '你是一位专业、温暖、善于用启发式教学和记忆口诀帮助学生的备考名师。请用清晰排版的 Markdown 回答。',
      },
    });

    return res.json({
      success: true,
      tutorExplanation: response.text || '',
    });
  } catch (error: any) {
    console.error('Error in explain-question:', error);
    return res.status(500).json({
      success: false,
      error: error.message || '生成深度答疑解析失败',
    });
  }
});

// Vite & Static file serving
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

start();
