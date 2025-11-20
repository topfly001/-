import { GoogleGenAI } from "@google/genai";

// Initialize the client conditionally to avoid crashes if key is missing during dev
const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const explainGeometryTheorem = async (
  chordLength: number, 
  angle: number, 
  radius: number
): Promise<string> => {
  const ai = getClient();
  if (!ai) {
    return "未找到 API Key。请配置您的环境变量。";
  }

  const prompt = `
    我正在模拟一个几何模型：“圆内定弦定角”（定弦所对的圆周角）。
    
    当前参数：
    - 圆半径: ${radius} 单位
    - 弦长: 约 ${chordLength.toFixed(2)} 单位
    - 圆周角 (∠APB): ${angle.toFixed(1)} 度
    
    请提供一个简明扼要、有趣的数学解释（150字以内），适合高中生阅读。
    请解释为什么当点 P 在优弧上移动时，角度保持不变。
    必须提到“圆周角定理”。
    请使用 Markdown 格式。
    请用中文（简体）回答。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "无法生成解释。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "从 Gemini 获取解释时发生错误。";
  }
};