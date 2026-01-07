
import { GoogleGenAI, Modality } from "@google/genai";

// 오디오 데이터 디코딩 및 재생 유틸리티
async function playAudioFromBase64(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  const dataInt16 = new Int16Array(bytes.buffer);
  const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < dataInt16.length; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gainNode = ctx.createGain();
  gainNode.gain.value = 2.0; // 현자의 목소리 강조
  source.connect(gainNode);
  gainNode.connect(ctx.destination);
  source.start(0);
}

export const generateSageFeedback = async (guess: number, target: number, attempt: number) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  const isCorrect = guess === target;
  const direction = guess > target ? "너무 높소" : "너무 낮소";

  const prompt = `당신은 우주의 비밀을 간직한 '성운의 현자'입니다. 
  사용자가 1~100 사이의 숫자를 맞추고 있습니다. 
  현재 추측: ${guess}, 정답과의 관계: ${isCorrect ? "정답" : direction}, 시도 횟수: ${attempt}.
  
  지침:
  - 한국어로 신비롭고 고풍스럽게 대답하세요 (~소, ~구려, ~도다).
  - 추측이 맞았다면 극찬을, 틀렸다면 철학적인 힌트를 주되 정답 숫자는 절대 말하지 마세요.
  - 답변은 2문장 이내로 짧고 강렬하게 하세요.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
  });

  return response.text;
};

export const speakMessage = async (text: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      await playAudioFromBase64(base64Audio);
    }
  } catch (error) {
    console.error("TTS failed:", error);
  }
};
