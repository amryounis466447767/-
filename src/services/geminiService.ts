import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function solveMathProblem(base64Image: string): Promise<string> {
  const prompt = `Solve the math problem in this image. 
  Follow these steps:
  1. Identify the math expression or problem clearly.
  2. Solve it step-by-step to be 100% sure.
  3. Perform the calculation 3 times internally to verify the result.
  4. Provide only the final numerical result as the answer, and a very brief explanation (one sentence) if it's a complex problem.
  
  Format the output as:
  Result: [The numerical result]
  Explanation: [Brief explanation in Arabic since the app is in Arabic]`;

  try {
    const imagePart = {
      inlineData: {
        mimeType: "image/jpeg",
        data: base64Image.split(",")[1], // Remove metadata prefix if present
      },
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview", // Complex math needs Pro
      contents: { parts: [imagePart, { text: prompt }] },
    });

    return response.text || "عذراً، لم أتمكن من حل المسألة.";
  } catch (error) {
    console.error("Gemini AI Error:", error);
    return "حدث خطأ أثناء محاولة حل المسألة.";
  }
}
