import { GoogleGenAI } from '@google/genai';

async function test() {
  try {
    const ai = new GoogleGenAI({ apiKey: "DUMMY_KEY" });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "test",
    });
    console.log("Success");
  } catch (e) {
    console.error("ERROR CAUGHT:");
    console.error(e);
  }
}
test();
