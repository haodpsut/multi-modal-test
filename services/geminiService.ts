
import { GoogleGenAI, Content, Part } from "@google/genai";

export async function* generateGeminiStream(
  apiKey: string,
  prompt: string,
  history: Content[],
  imageBase64?: string,
  mimeType?: string
): AsyncGenerator<string> {
  if (!apiKey) {
    throw new Error("Gemini API key is not configured.");
  }
  
  try {
    const ai = new GoogleGenAI({ apiKey });

    // The user's current message, which can include an image and text.
    const currentUserParts: Part[] = [];
    if (imageBase64 && mimeType) {
      currentUserParts.push({
        inlineData: {
          data: imageBase64,
          mimeType: mimeType,
        },
      });
    }
    currentUserParts.push({ text: prompt });
    
    // Combine past history with the current message.
    const contents: Content[] = [
        ...history,
        { role: 'user', parts: currentUserParts }
    ];
    
    const resultStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: contents
    });

    for await (const chunk of resultStream) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  } catch (error) {
    console.error("Gemini API error:", error);
    if (error instanceof Error) {
        yield `Error: ${error.message}`;
    } else {
        yield "An unknown error occurred with the Gemini API.";
    }
  }
}