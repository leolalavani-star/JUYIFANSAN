import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

// Helper to initialize Gemini Client
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY 未配置，请在 AI Studio 的 Settings > Secrets 中检查 API Key。');
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

// Clean JSON response from Gemini if wrapped in ```json ... ```
function cleanJsonString(str: string): string {
  const trimmed = str.trim();
  const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (match && match[1]) {
    return match[1].trim();
  }
  return trimmed;
}

// API: OCR + Knowledge Extraction + Initial Variants
app.post('/api/ocr-mistake', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', subjectHint = '自动识别', customNotes = '' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: '请上传错题图片' });
    }

    const ai = getGeminiClient();

    // Clean base64 string if it contains data prefix
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    const prompt = `你是一位经验丰富、教学水平极高的中小学及高中全科特级教师。
请仔细辨识用户上传的这道错题图片（可能是印刷体或手写体、试卷或作业本）。

任务目标：
1. 【精准OCR识别】：原原本本地转写出题目的完整内容（题干、公式、图表文字描述、选项A/B/C/D等）。数学/理科公式请使用标准 LaTeX 格式（例如 $x^2 + 2x - 3 = 0$，$\\frac{a}{b}$，$\\sqrt{x}$ 等），保证严谨与美观。
2. 【学科归属与知识点】：判断所属学科（如数学、物理、化学、英语、语文、生物等）及核心考察的知识点名称。
3. 【深度错因与易错点剖析】：分析学生在这道题上最容易出错的原因、思维误区或题目设置的陷阱条件（例如：忽略定义域/分母不为0、忽视审题细节、受力分析漏力、状语从句时态混淆等），并提取出3-5个关键易错词（用于前端醒目高亮）。
4. 【原题详细解析与参考答案】：提供规范的解题步骤与标准答案。
5. 【举一反三变式题生成】：基于该题的核心知识点和易错陷阱，立刻生成 3 道高质量的举一反三变式题：
   - 变式题 1（同构巩固）：同类型但变换情境或数值，帮助学生建立基本解法肌肉记忆；
   - 变式题 2（进阶拓展）：在原题基础上增加思维深度、逆向推导或多步骤融合；
   - 变式题 3（易错陷阱）：针对该知识点最容易踩坑的边界条件或特例进行设计，强化防坑能力。
   每道变式题必须附带：题目、标准答案、详细解析，以及特别标注的【易错点剖析】与【易错关键词】！

${subjectHint && subjectHint !== '自动识别' ? `用户提示学科为：${subjectHint}。` : ''}
${customNotes ? `用户附带备注：${customNotes}` : ''}

请务必只输出严格合法的 JSON 对象，不要输出任何其他的修饰语或开场白。JSON 结构如下：
{
  "subject": "数学",
  "gradeLevel": "高中/初中/小学",
  "knowledgePoint": "核心知识点名称",
  "originalQuestion": "转写出的完整原题题干（支持Markdown及LaTeX公式$公式$）",
  "originalAnswer": "原题参考答案",
  "originalAnalysis": "原题详细解题步骤与思路",
  "errorAnalysis": "针对原题的深度易错点剖析与思维误区揭示",
  "errorKeywords": ["关键词1", "关键词2", "关键词3"],
  "variants": [
    {
      "id": "v1",
      "tag": "同构巩固",
      "question": "变式题1题目内容",
      "answer": "变式题1参考答案",
      "analysis": "变式题1详细解题步骤",
      "errorTrap": "变式题1易错陷阱剖析",
      "errorKeywords": ["陷阱关键词A", "陷阱关键词B"]
    },
    {
      "id": "v2",
      "tag": "进阶拓展",
      "question": "变式题2题目内容",
      "answer": "变式题2参考答案",
      "analysis": "变式题2详细解题步骤",
      "errorTrap": "变式题2易错陷阱剖析",
      "errorKeywords": ["陷阱关键词C", "陷阱关键词D"]
    },
    {
      "id": "v3",
      "tag": "易错陷阱",
      "question": "变式题3题目内容",
      "answer": "变式题3参考答案",
      "analysis": "变式题3详细解题步骤",
      "errorTrap": "变式题3易错陷阱剖析",
      "errorKeywords": ["陷阱关键词E", "陷阱关键词F"]
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType,
                data: cleanBase64,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
      config: {
        systemInstruction: '你是一位名师级全科教研专家，擅长错题学情诊断、变式题设计与易错点剖析。你的输出只包含严格规范的 JSON。',
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    const jsonStr = cleanJsonString(text);
    const parsed = JSON.parse(jsonStr);

    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Error in /api/ocr-mistake:', error);
    res.status(500).json({
      error: error.message || '识别错题失败，请检查网络或图片清晰度',
    });
  }
});

// API: Regenerate or Generate New Variants based on edited question & knowledge point
app.post('/api/generate-variants', async (req, res) => {
  try {
    const {
      originalQuestion,
      subject = '数学',
      knowledgePoint = '',
      errorAnalysis = '',
      count = 3,
      difficultyLevel = '梯度进阶',
      specificRequirement = '',
    } = req.body;

    if (!originalQuestion) {
      return res.status(400).json({ error: '缺少原题内容' });
    }

    const ai = getGeminiClient();

    const prompt = `你是一位经验丰富的特级教研名师。
现有以下学生错题及知识点诊断信息：

【学科】：${subject}
【核心知识点】：${knowledgePoint || '基于题干自动归纳'}
【原题内容】：
${originalQuestion}

【原题易错点诊断】：
${errorAnalysis || '分析题目核心解法与学生常见误区'}

请基于以上核心知识点与易错点，为学生精心原创编写 ${count} 道【举一反三变式题】。
模式/难度偏好：${difficultyLevel}
${specificRequirement ? `额外定制要求：${specificRequirement}` : ''}

要求：
1. 严禁照抄原题，题目必须有新意、贴近近几年最新中考/高考/统考风格。
2. 理科公式请使用严谨的 LaTeX $公式$ 格式。
3. 每一道题都必须附带【标准答案】、【详细解析】，以及【易错点剖析】与【易错关键词】（突出学生容易失分的关键细节）。
4. 输出格式必须为严格合法的 JSON 数组，每个元素包含：
   - "tag": 题目标签（如"同构变式"、"思维进阶"、"避坑陷阱"等）
   - "question": 完整变式题题目
   - "answer": 参考答案
   - "analysis": 步骤解析
   - "errorTrap": 该变式题的易错点剖析
   - "errorKeywords": ["关键词1", "关键词2"]

请只输出合法的 JSON 数组：
[
  {
    "id": "v1",
    "tag": "同构巩固",
    "question": "...",
    "answer": "...",
    "analysis": "...",
    "errorTrap": "...",
    "errorKeywords": ["..."]
  }
]`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: '你是一位资深教研出题专家，负责生成高仿真的变式训练题及易错点解析。输出格式只允许合法的 JSON 数组。',
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '[]';
    const jsonStr = cleanJsonString(text);
    const parsed = JSON.parse(jsonStr);

    res.json({ success: true, variants: parsed });
  } catch (error: any) {
    console.error('Error in /api/generate-variants:', error);
    res.status(500).json({
      error: error.message || '生成举一反三变式题失败，请稍后重试',
    });
  }
});

// Configure Vite integration for dev server or static files for production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    // Serve production assets
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    // Development mode with Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
