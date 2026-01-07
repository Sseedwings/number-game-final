import { GoogleGenAI, Modality } from "@google/genai";

// TypeScript 컴파일 에러 TS2580 해결을 위한 선언
declare var process: {
  env: {
    NODE_ENV: string;
    API_KEY: string;
  };
};

async function playAudioFromBase64(base64: string) {
  try {
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
    gainNode.gain.value = 2.0; 
    
    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    source.start(0);
  } catch (e) {
    console.error("Audio playback failed:", e);
  }
}

export const testApiKey = async (apiKey: string): Promise<boolean> => {
  if (!apiKey) return false;
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "ping",
    });
    return !!response.text;
  } catch (err) {
    console.error("API Key validation failed:", err);
    return false;
  }
};

const getApiKey = (userApiKey: string) => {
  if (userApiKey) return userApiKey;
  try {
    return process.env.API_KEY || "";
  } catch {
    return "";
  }
};

export const generateSageFeedback = async (guess: number, target: number, attempt: number, userApiKey: string) => {
  const apiKey = getApiKey(userApiKey);
  if (!apiKey) throw new Error("API Key is missing");
  
  const ai = new GoogleGenAI({ apiKey });
  
  const isCorrect = guess === target;
  const direction = guess > target ? "너무 높소" : "너무 낮소";

  const prompt = `당신은 우주의 비밀을 간직한 '성운의 현자'입니다. 
  사용자가 1~100 사이의 숫자를 맞추고 있습니다. 
  현재 추측: ${guess}, 정답과의 관계: ${isCorrect ? "정답" : direction}, 시도 횟수: ${attempt}.
  
  지침:
  - 한국어로 신비롭고 고풍스럽게 대답하세요 (~소, ~구려, ~도다).
  - 답변은 2문장 이내로 짧고 강렬하게 하세요.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
  });

  return response.text;
};

export const speakMessage = async (text: string, userApiKey: string) => {
  try {
    const apiKey = getApiKey(userApiKey);
    if (!apiKey) return;

    const ai = new GoogleGenAI({ apiKey });
    
    // 속도를 3배속 느낌으로 아주 빠르게 읊조리도록 지시 (피치는 낮게 유지)
    const ttsPrompt = `고풍스럽고 신비로운 현자의 목소리이나, 속도는 숨 가쁠 정도로 매우 빠르게(약 3배속 수준) 읊조리시오. 피치는 낮고 평온하게 유지하되 딜레이 없이 즉시 말하시오: ${text}`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: ttsPrompt }] }],
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