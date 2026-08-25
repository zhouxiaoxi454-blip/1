var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json({ limit: "30mb" }));
app.use(import_express.default.urlencoded({ extended: true, limit: "30mb" }));
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in server environment.");
  }
  return new import_genai.GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: (/* @__PURE__ */ new Date()).toISOString() });
});
app.post("/api/extract-questions", async (req, res) => {
  try {
    const { text, imageBase64, mimeType, subjectName } = req.body;
    if (!text && !imageBase64) {
      return res.status(400).json({ error: "\u8BF7\u63D0\u4F9B\u9898\u76EE\u6587\u672C\u6216\u56FE\u7247/\u6587\u4EF6\u6570\u636E" });
    }
    const ai = getGenAI();
    const systemInstruction = `\u4F60\u662F\u4E00\u4F4D\u9876\u7EA7\u7684\u8003\u8BD5\u547D\u9898\u4E13\u5BB6\u4E0E\u9AD8\u5206\u5907\u8003\u540D\u5E08\u3002
\u4F60\u7684\u4EFB\u52A1\u662F\u4ECE\u7528\u6237\u4E0A\u4F20\u7684\u8BD5\u5377\u3001\u9898\u5E93\u3001\u9519\u9898\u672C\u6216\u9898\u76EE\u622A\u56FE/\u6587\u672C\u4E2D\uFF0C\u81EA\u52A8\u8BC6\u522B\u5E76\u63D0\u53D6\u51FA\u6240\u6709\u9898\u76EE\u3001\u9009\u9879\u3001\u6807\u51C6\u7B54\u6848\u548C\u9AD8\u8D28\u91CF\u6DF1\u5EA6\u89E3\u6790\u3002

\u8BF7\u9075\u5FAA\u4EE5\u4E0B\u89C4\u5219\uFF1A
1. \u63D0\u53D6\u51FA\u6BCF\u9053\u9898\u7684\uFF1A
   - id: \u552F\u4E00\u6807\u8BC6\u5B57\u7B26\u4E32\uFF08\u5982 q_1, q_2\uFF09
   - questionNumber: \u9898\u53F7\uFF08\u5982 "1", "2", "\u7B2C1\u9898"\uFF09
   - type: \u9898\u578B\uFF0C\u5FC5\u987B\u662F\u4EE5\u4E0B\u4E4B\u4E00\uFF1A"single_choice"\uFF08\u5355\u9009\uFF09\u3001"multiple_choice"\uFF08\u591A\u9009\uFF09\u3001"true_false"\uFF08\u5224\u65AD\u9898\uFF09\u3001"fill_blank"\uFF08\u586B\u7A7A\u9898\uFF09\u3001"essay"\uFF08\u7B80\u7B54/\u8BBA\u8FF0/\u6750\u6599\u5206\u6790\u9898\uFF09
   - stem: \u9898\u76EE\u9898\u5E72\uFF08\u6E05\u6670\u5B8C\u6574\uFF0C\u53BB\u9664\u65E0\u5173\u6742\u4E71\u7B26\u53F7\uFF09
   - options: \u9009\u9879\u5217\u8868\uFF08\u82E5\u662F\u9009\u62E9\u9898\uFF0C\u5305\u542B key \u5982 "A","B","C","D" \u4E0E text \u9009\u9879\u5185\u5BB9\uFF1B\u82E5\u662F\u5224\u65AD\u9898\u53EF\u4E3A\u7A7A\u6216\u5305\u542B\u5BF9\u9519\uFF1B\u975E\u9009\u62E9\u9898\u8BBE\u4E3A\u7A7A\u6570\u7EC4\uFF09
   - answer: \u6B63\u786E\u7B54\u6848\uFF08\u9009\u62E9\u9898\u5FC5\u987B\u4E3A\u9009\u9879\u5B57\u6BCD\u5927\u5199\u5982 "A" \u6216 "BCD"\uFF1B\u5224\u65AD\u9898\u4E3A "\u6B63\u786E"/"\u9519\u8BEF" \u6216 "T"/"F"\uFF1B\u4E3B\u89C2\u9898/\u586B\u7A7A\u9898\u4E3A\u6807\u51C6\u7B54\u6848\u6838\u5FC3\u8BCD/\u53E5\uFF09
   - explanation: \u6DF1\u5EA6\u7CBE\u8BB2\u89E3\u6790\uFF08\u5FC5\u987B\u975E\u5E38\u8BE6\u5C3D\uFF01\u5305\u542B\uFF1A\u3010\u6838\u5FC3\u8003\u70B9\u7CBE\u89E3\u3011\u3001\u3010\u6B63\u786E\u9879\u903B\u8F91\u3011\u3001\u3010\u9519\u8BEF\u5E72\u6270\u9879\u5256\u6790/\u907F\u5751\u6307\u5357\u3011\u4E0E\u3010\u4E00\u53E5\u8BDD\u79D2\u6740/\u8BB0\u5FC6\u53E3\u8BC0\u3011\uFF09
   - knowledgePoint: \u9898\u76EE\u6240\u5C5E\u7684\u6838\u5FC3\u8003\u70B9/\u6982\u5FF5\u6A21\u5757\u540D\u79F0\uFF08\u5982 "\u552F\u7269\u8FA9\u8BC1\u6CD5\u77DB\u76FE\u7684\u666E\u904D\u6027\u4E0E\u7279\u6B8A\u6027"\u3001"\u5211\u6CD5\u7D27\u6025\u907F\u9669\u4E0E\u6B63\u5F53\u9632\u536B" \u7B49\uFF09
   - difficulty: \u96BE\u5EA6 ("easy" | "medium" | "hard")
2. \u5982\u679C\u7528\u6237\u4E0A\u4F20\u7684\u6750\u6599\u4E2D\u672A\u5305\u542B\u7B54\u6848\u6216\u89E3\u6790\uFF0C\u8BF7\u4F60\u4F5C\u4E3A\u6743\u5A01\u540D\u5E08\uFF0C\u7ED9\u51FA100%\u4E25\u8C28\u7684\u6807\u51C6\u7B54\u6848\u4E0E\u8BE6\u5C3D\u89E3\u6790\uFF01
3. \u82E5\u6750\u6599\u4E2D\u6709\u591A\u9053\u9898\uFF0C\u52A1\u5FC5\u5168\u90E8\u4F9D\u6B21\u63D0\u53D6\uFF1B\u5982\u679C\u662F\u5355\u9053\u9898\u4E5F\u8BF7\u5B8C\u6574\u89C4\u8303\u63D0\u53D6\u3002
4. \u540C\u65F6\u603B\u7ED3\u8BE5\u9898\u96C6\u7684\u63A8\u8350\u540D\u79F0\uFF08setName\uFF0C\u5982 "\u8003\u7814\u653F\u6CBB\u7CBE\u9009\u4E60\u9898\u96C6"\u3001"\u884C\u6D4B\u6570\u91CF\u5173\u7CFB\u8BAD\u7EC3\u5377" \u7B49\uFF09\u3002`;
    const contents = [];
    if (imageBase64) {
      const cleanMime = mimeType || "image/png";
      const base64Data = imageBase64.replace(/^data:[^;]+;base64,/, "");
      contents.push({
        inlineData: {
          mimeType: cleanMime,
          data: base64Data
        }
      });
    }
    const promptText = `\u8BF7\u89E3\u6790\u4EE5\u4E0B\u8BD5\u5377/\u9898\u76EE\u6750\u6599\uFF1A
${subjectName ? `\u3010\u6240\u5C5E\u5B66\u79D1/\u79D1\u76EE\u3011: ${subjectName}` : ""}
${text ? `\u3010\u9898\u76EE\u5185\u5BB9\u6587\u672C\u3011:
${text}` : "\uFF08\u8BF7\u6839\u636E\u4E0A\u4F20\u7684\u56FE\u7247/\u6587\u4EF6\u63D0\u53D6\u6240\u6709\u9898\u76EE\uFF09"}

\u8BF7\u4EE5\u7ED3\u6784\u5316 JSON \u683C\u5F0F\u8F93\u51FA\u9898\u96C6\u540D\u79F0\u4E0E\u63D0\u53D6\u7684\u6240\u6709\u9898\u76EE\u3002`;
    contents.push({ text: promptText });
    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: { parts: contents },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: import_genai.Type.OBJECT,
          properties: {
            setName: {
              type: import_genai.Type.STRING,
              description: "\u9898\u96C6\u6216\u8BD5\u5377\u63A8\u8350\u540D\u79F0"
            },
            subjectSuggested: {
              type: import_genai.Type.STRING,
              description: "\u8BC6\u522B\u6216\u63A8\u8350\u7684\u5B66\u79D1\u540D\u79F0"
            },
            totalExtracted: {
              type: import_genai.Type.INTEGER,
              description: "\u6210\u529F\u63D0\u53D6\u7684\u9898\u76EE\u6570\u91CF"
            },
            questions: {
              type: import_genai.Type.ARRAY,
              description: "\u63D0\u53D6\u51FA\u7684\u9898\u76EE\u5217\u8868",
              items: {
                type: import_genai.Type.OBJECT,
                properties: {
                  id: { type: import_genai.Type.STRING },
                  questionNumber: { type: import_genai.Type.STRING },
                  type: {
                    type: import_genai.Type.STRING,
                    description: "single_choice | multiple_choice | true_false | fill_blank | essay"
                  },
                  stem: { type: import_genai.Type.STRING, description: "\u9898\u5E72\u5185\u5BB9" },
                  options: {
                    type: import_genai.Type.ARRAY,
                    description: "\u9009\u9879\u5217\u8868",
                    items: {
                      type: import_genai.Type.OBJECT,
                      properties: {
                        key: { type: import_genai.Type.STRING, description: "A, B, C, D \u7B49" },
                        text: { type: import_genai.Type.STRING, description: "\u9009\u9879\u6587\u5B57" }
                      },
                      required: ["key", "text"]
                    }
                  },
                  answer: { type: import_genai.Type.STRING, description: "\u6807\u51C6\u6B63\u786E\u7B54\u6848" },
                  explanation: { type: import_genai.Type.STRING, description: "\u6DF1\u5EA6\u89E3\u6790\u4E0E\u6613\u9519\u70B9\u8FA8\u6790" },
                  knowledgePoint: { type: import_genai.Type.STRING, description: "\u8003\u70B9\u5F52\u5C5E" },
                  difficulty: { type: import_genai.Type.STRING, description: "easy | medium | hard" }
                },
                required: ["id", "stem", "type", "answer", "explanation"]
              }
            }
          },
          required: ["setName", "questions"]
        }
      }
    });
    const parsedJson = JSON.parse(response.text || "{}");
    return res.json({
      success: true,
      data: parsedJson
    });
  } catch (error) {
    console.error("Error in extract-questions:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "\u8BC6\u522B\u63D0\u53D6\u9898\u76EE\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5"
    });
  }
});
app.post("/api/explain-question", async (req, res) => {
  try {
    const { questionStem, options, correctAnswer, userAnswer, userQuery, explanation } = req.body;
    if (!questionStem) {
      return res.status(400).json({ error: "\u7F3A\u5C11\u9898\u5E72\u4FE1\u606F" });
    }
    const ai = getGenAI();
    const prompt = `\u4F60\u662F\u4E00\u4F4D\u8010\u5FC3\u7684\u5907\u8003\u540D\u5E08\u4E0E\u7B54\u7591\u5BFC\u5E08\u3002\u5B66\u751F\u6B63\u5728\u505A\u4EE5\u4E0B\u8FD9\u9053\u9898\uFF0C\u5E76\u63D0\u51FA\u4E86\u7591\u95EE\u6216\u4F5C\u7B54\u7ED3\u679C\u3002

\u3010\u9898\u76EE\u9898\u5E72\u3011:
${questionStem}

\u3010\u9009\u9879\u4FE1\u606F\u3011:
${options && Array.isArray(options) ? options.map((o) => `${o.key}. ${o.text}`).join("\n") : "\u65E0\u9009\u9879"}

\u3010\u6807\u51C6\u7B54\u6848\u3011: ${correctAnswer}
${userAnswer ? `\u3010\u5B66\u751F\u4F5C\u7B54\u3011: ${userAnswer}` : ""}
${explanation ? `\u3010\u57FA\u7840\u89E3\u6790\u3011: ${explanation}` : ""}
${userQuery ? `\u3010\u5B66\u751F\u63D0\u51FA\u7684\u5177\u4F53\u7591\u95EE\u3011: ${userQuery}` : "\u3010\u5B66\u751F\u7591\u95EE\u3011: \u8BF7\u8BE6\u7EC6\u4E3A\u6211\u5256\u6790\u8FD9\u9053\u9898\u4E3A\u4EC0\u4E48\u8FD9\u4E48\u9009\uFF0C\u4EE5\u53CA\u6211\u7684\u9519\u9009\u539F\u56E0\u548C\u5BB9\u6613\u6389\u5165\u7684\u601D\u7EF4\u9677\u9631\u3002"}

\u8BF7\u9488\u5BF9\u5B66\u751F\u7684\u7591\u95EE\uFF0C\u63D0\u4F9B\u751F\u52A8\u900F\u5F7B\u3001\u901A\u4FD7\u6613\u61C2\u4E14\u5207\u4E2D\u8003\u70B9\u7684\u7B54\u7591\u6307\u5BFC\u3002\u5305\u542B\uFF1A
1. \u{1F4A1} **\u6838\u5FC3\u903B\u8F91\u62C6\u89E3**\uFF1A\u8FD9\u9053\u9898\u9898\u773C\u7684\u5173\u952E\u8BCD\u662F\u4EC0\u4E48\uFF0C\u547D\u9898\u4EBA\u5728\u8003\u5BDF\u4EC0\u4E48\u5E95\u5C42\u539F\u7406\u3002
2. \u{1F3AF} **\u9009\u9879\u7CBE\u7EC6\u5BF9\u6BD4**\uFF1A\u6B63\u786E\u9009\u9879\u4E0E\u9519\u8BEF\u9009\u9879\u7684\u5173\u952E\u533A\u522B\u4E0E\u9677\u9631\u8BBE\u7F6E\u624B\u6CD5\u3002
3. \u{1F4DD} **\u8003\u573A\u907F\u5751\u53E3\u8BC0\u4E0E\u8BB0\u5FC6\u652F\u70B9**\uFF1A\u7528\u4E00\u4E24\u53E5\u6717\u6717\u4E0A\u53E3\u6216\u5F62\u8C61\u751F\u52A8\u7684\u53E3\u8BC0\u5E2E\u5B66\u751F\u7262\u7262\u8BB0\u4F4F\u3002`;
    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction: "\u4F60\u662F\u4E00\u4F4D\u4E13\u4E1A\u3001\u6E29\u6696\u3001\u5584\u4E8E\u7528\u542F\u53D1\u5F0F\u6559\u5B66\u548C\u8BB0\u5FC6\u53E3\u8BC0\u5E2E\u52A9\u5B66\u751F\u7684\u5907\u8003\u540D\u5E08\u3002\u8BF7\u7528\u6E05\u6670\u6392\u7248\u7684 Markdown \u56DE\u7B54\u3002"
      }
    });
    return res.json({
      success: true,
      tutorExplanation: response.text || ""
    });
  } catch (error) {
    console.error("Error in explain-question:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "\u751F\u6210\u6DF1\u5EA6\u7B54\u7591\u89E3\u6790\u5931\u8D25"
    });
  }
});
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}
start();
//# sourceMappingURL=server.cjs.map
