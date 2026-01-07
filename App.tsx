import React, { useState, useEffect } from "react";
import { generateSageFeedback, speakMessage, testApiKey } from "./services/geminiService";
import { soundService } from "./services/soundService";
import GuessChart from "./components/GuessChart";

const MAX_ATTEMPTS = 10;

const App: React.FC = () => {
  const [hasKey, setHasKey] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyError, setKeyError] = useState("");

  const [hasStarted, setHasStarted] = useState(false);
  const [target, setTarget] = useState(0);
  const [guess, setGuess] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [message, setMessage] = useState("성운의 현자가 당신의 파동을 기다리고 있소.");
  const [isLoading, setIsLoading] = useState(false);
  const [shouldShake, setShouldShake] = useState(false);

  useEffect(() => {
    if (hasStarted) {
      initGame();
    }
  }, [hasStarted]);

  const initGame = () => {
    setTarget(Math.floor(Math.random() * 100) + 1);
    setHistory([]);
    setStatus('playing');
    setMessage("환영하오. 1부터 100 사이, 운명의 숫자를 찾아보시오.");
    soundService.startBGM();
    soundService.playReset();
  };

  const handleStartRequest = () => {
    if (!hasKey) {
      setShowKeyModal(true);
    } else {
      setHasStarted(true);
    }
  };

  const handleKeySubmit = async () => {
    if (!apiKeyInput.trim()) return;
    setIsTestingKey(true);
    setKeyError("");
    
    try {
      const isValid = await testApiKey(apiKeyInput);
      if (isValid) {
        setHasKey(true);
        setShowKeyModal(false);
        setHasStarted(true);
      } else {
        setKeyError("유효하지 않은 API 키입니다. 다시 확인해 주시오.");
      }
    } catch (err) {
      setKeyError("통신 중 오류가 발생했소. 인터넷 연결을 확인하시오.");
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleGuess = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(guess);
    if (isNaN(val) || val < 1 || val > 100 || isLoading) return;

    setIsLoading(true);
    soundService.playScan();

    const newHistory = [...history, { value: val, time: Date.now() }];
    setHistory(newHistory);
    setGuess("");

    try {
      const feedback = await generateSageFeedback(val, target, newHistory.length, apiKeyInput);
      setMessage(feedback || "");
      speakMessage(feedback || "", apiKeyInput);

      if (val === target) {
        setStatus('won');
        soundService.playVictory();
      } else {
        setShouldShake(true);
        setTimeout(() => setShouldShake(false), 500);
        
        if (newHistory.length >= MAX_ATTEMPTS) {
          setStatus('lost');
          soundService.playGameOver();
        } else {
          val > target ? soundService.playHighHint() : soundService.playLowHint();
        }
      }
    } catch (err) {
      console.error(err);
      setMessage("우주의 기운이 잠시 끊겼소. 다시 시도해 보시오.");
    } finally {
      setIsLoading(false);
    }
  };

  // API Key 입력 모달
  if (showKeyModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
        <div className="glass-panel p-8 md:p-10 rounded-[2.5rem] max-w-md w-full animate-in zoom-in duration-300 border-cyan-500/30 border">
          <h2 className="text-2xl font-orbitron font-bold text-cyan-400 mb-2 glow-cyan">성운 접속 터미널</h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed italic">현자와 교신하려면 Google Gemini API 키가 필요하오. 이는 개인 환경에만 저장되니 안심하시오.</p>
          
          <div className="space-y-4">
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="API 키를 입력하시오"
              className="w-full bg-slate-900/60 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-cyan-500/50 transition-all font-mono text-sm"
            />
            {keyError && <p className="text-rose-500 text-xs font-semibold px-2">{keyError}</p>}
            
            <button
              onClick={handleKeySubmit}
              disabled={isTestingKey || !apiKeyInput}
              className="w-full py-4 bg-gradient-to-r from-cyan-600 to-indigo-700 hover:from-cyan-500 hover:to-indigo-600 text-white font-bold rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isTestingKey ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  파동 검증 중...
                </>
              ) : "관문 통과하기"}
            </button>
            <button 
              onClick={() => setShowKeyModal(false)}
              className="w-full py-2 text-slate-500 text-xs hover:text-slate-300 transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!hasStarted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="glass-panel p-12 rounded-[3rem] max-w-md w-full animate-in fade-in zoom-in duration-700">
          <h1 className="text-4xl font-orbitron font-bold text-cyan-400 mb-6 glow-cyan">NEBULA SAGE</h1>
          <p className="text-slate-400 mb-10 leading-relaxed">
            성운의 안개 너머, 현자와 교신할 준비가 되었는가? <br/>
            당신의 직관이 진리에 닿기를.
          </p>
          <button
            onClick={handleStartRequest}
            className="w-full py-5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold rounded-2xl transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(34,211,238,0.3)]"
          >
            공명 시작하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8">
      <div className="max-w-xl w-full">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-orbitron font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500 mb-1 glow-cyan">NEBULA SAGE</h1>
          <div className="text-[10px] font-bold text-cyan-800 tracking-[0.5em] uppercase">Cosmic Oracle Interface</div>
        </header>

        <main className={`glass-panel rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden transition-all duration-300 ${shouldShake ? 'animate-shake border-rose-500/30' : ''}`}>
          
          <div className="absolute top-0 right-0 p-6">
            <div className="text-right">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Resonance Left</span>
              <div className={`text-3xl font-orbitron leading-none mt-1 ${MAX_ATTEMPTS - history.length <= 2 ? 'text-rose-500 animate-pulse' : 'text-cyan-400'}`}>
                {MAX_ATTEMPTS - history.length}
              </div>
            </div>
          </div>

          <div className="mb-10 mt-4 min-h-[120px] flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-cyan-400 animate-ping' : 'bg-cyan-900'}`}></div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Oracle Response</span>
            </div>
            <p className="text-xl md:text-2xl text-slate-100 font-semibold leading-tight italic">
              {isLoading ? "차원의 틈을 엿보는 중..." : `"${message}"`}
            </p>
          </div>

          {status === 'playing' ? (
            <form onSubmit={handleGuess} className="relative mb-12">
              <input
                type="number"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                placeholder="숫자를 공명시키시오"
                disabled={isLoading}
                autoFocus
                className="w-full bg-slate-950/40 border border-white/5 rounded-[1.5rem] px-8 py-6 text-4xl font-orbitron text-white focus:outline-none focus:border-cyan-500/40 transition-all placeholder:text-slate-800"
              />
              <button
                type="submit"
                disabled={!guess || isLoading}
                className="absolute right-3 top-3 bottom-3 px-8 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-bold rounded-xl transition-all border border-cyan-400/20 active:scale-95 disabled:opacity-10"
              >
                {isLoading ? '...' : 'ENTER'}
              </button>
            </form>
          ) : (
            <div className="text-center py-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
              <h2 className={`text-4xl font-bold mb-4 ${status === 'won' ? 'text-emerald-400' : 'text-rose-500'}`}>
                {status === 'won' ? '진리를 보았도다' : '운명이 흩어졌소'}
              </h2>
              <p className="text-slate-400 mb-10 text-lg">찾던 숫자는 <span className="text-white font-bold text-3xl font-orbitron ml-2">{target}</span>이었소.</p>
              <button
                onClick={initGame}
                className="px-14 py-5 bg-white text-slate-950 font-bold rounded-2xl hover:scale-105 transition-all shadow-2xl active:scale-95"
              >
                새로운 구도
              </button>
            </div>
          )}

          <div className="mt-8">
            <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.3em] mb-6 text-center">Trajectory of Destiny</h3>
            <GuessChart guesses={history} target={target} showTarget={status !== 'playing'} />
          </div>
        </main>

        <footer className="mt-8 text-center text-[9px] text-slate-700 font-bold tracking-[0.5em] uppercase opacity-40">
          SAGE ORACLE SYSTEM • ENCRYPTED CONNECTION
        </footer>
      </div>
    </div>
  );
};

export default App;