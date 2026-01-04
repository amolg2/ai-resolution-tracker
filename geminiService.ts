
import { GoogleGenAI, Type } from "@google/genai";
import { Weekend } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const getNextWeekendSuggestion = async (completedHistory: Weekend[], nextWeekendId: number): Promise<{ suggestedTasks: {title: string, description: string}[], reasoning: string }> => {
  const historyText = completedHistory.map(w => {
    const done = w.assignments.filter(a => a.completed).map(a => `${a.title}: ${a.notes}`);
    return `Weekend ${w.id} (${w.title}): ${done.join(', ')}`;
  }).join('\n');

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are an expert AI learning coach. The user is on a 10-weekend AI resolution journey.
      They have finished some tasks and are now planning Weekend #${nextWeekendId}.
      
      Progress History:
      ${historyText || "No tasks completed yet."}
      
      Based on their history (or starting fresh if empty), suggest exactly 2-3 specific assignments for Weekend #${nextWeekendId}.
      Make the titles concise and descriptions actionable.`,
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
              },
              description: "A list of 2-3 specific assignments for the next weekend"
            },
            reasoning: {
              type: Type.STRING,
              description: "Briefly explain the focus of this suggested weekend curriculum"
            }
          },
          required: ["suggestedTasks", "reasoning"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("AI Suggestion failed:", error);
    return {
      suggestedTasks: [
        { title: "Foundational API Setup", description: "Connect to Gemini API and create a basic prompt interface." },
        { title: "Response Parsing", description: "Implement structured JSON output handling." }
      ],
      reasoning: "Starting with the basics of LLM integration."
    };
  }
};
