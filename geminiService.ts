
import { GoogleGenAI, Type } from "@google/genai";
import { Weekend } from "./types.ts";

// Fallback to empty string to prevent constructor crash, 
// error handling will catch the failure during the actual call.
const apiKey = process.env.API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

export const getNextWeekendSuggestion = async (completedHistory: Weekend[], nextWeekendId: number): Promise<{ suggestedTasks: {title: string, description: string}[], reasoning: string }> => {
  if (!apiKey) {
    console.warn("API_KEY is missing. AI suggestions will use fallback data.");
    return getFallbackSuggestion();
  }

  const historyText = completedHistory.map(w => {
    const done = w.assignments.filter(a => a.completed).map(a => `${a.title}: ${a.notes}`);
    return `Weekend ${w.id} (${w.title}): ${done.join(', ')}`;
  }).join('\n');

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are an expert AI learning coach. The user is on a 10-weekend AI resolution journey.
      They have finished some tasks and are planning Weekend #${nextWeekendId}.
      
      History:
      ${historyText || "No tasks completed yet."}
      
      Suggest 2-3 specific assignments for Weekend #${nextWeekendId}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedTasks: {
              type: Type.ARRAY,
              items: { 
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["title", "description"]
              }
            },
            reasoning: { type: Type.STRING }
          },
          required: ["suggestedTasks", "reasoning"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("AI Suggestion failed:", error);
    return getFallbackSuggestion();
  }
};

const getFallbackSuggestion = () => ({
  suggestedTasks: [
    { title: "Foundational API Setup", description: "Connect to Gemini API and create a basic prompt interface." },
    { title: "Response Parsing", description: "Implement structured JSON output handling." }
  ],
  reasoning: "Starting with the basics of LLM integration."
});
