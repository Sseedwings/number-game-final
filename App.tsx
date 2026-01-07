
import React, { useState, useEffect, useRef } from "https://esm.sh/react@^19.2.3";
import { generateSageFeedback, speakMessage } from "./services/geminiService.ts";
import { soundService } from "./services/soundService.ts";
import GuessChart from "./components/GuessChart.tsx";

const MAX_ATTEMPTS = 10;

const App: React.FC = () => {
  const [target, setTarget] = useState(0);
  const [guess, setGuess] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [status, setStatus] = useState<'idle' | 'playing' | 'won' | 'lost'>('idle');
  const [message, setMessage] = useState("성운의 안개 너머에서 현자가 그대를 부르고 있소.");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    initGame();
  }, []);

  const initGame = () => {
    setTarget(Math.floor(Math.random() * 100) + 1);
    setHistory([]);
    setStatus('playing');
    setMessage("환영하오. 1부터 100 사이, 운명의 숫자를 찾아보시오.");
    soundService.playReset();
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

    const feedback = await generateSageFeedback(val, target, newHistory.length);
    setMessage(feedback || "");
    speakMessage(feedback || "");

    if (val === target) {
      setStatus('won');
      soundService.playVictory();
    } else if (newHistory.length >= MAX_ATTEMPTS) {
      setStatus('lost');
      soundService.playGameOver();
    } else {
      val > target ? soundService.playHighHint() : soundService.playLowHint();
    }
    
    setIsLoading(false);
  };

  if (status === 'idle') return <div className="min-h-screen bg-slate-950"></div>;

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-orbitron font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-2">성운의 현자</h1>
          <div className="h-1 w-24 bg-cyan-500 mx-auto rounded-full shadow-[0_0_15px_#22d3ee]"></div>
        </header>

        <main className="glass-panel rounded-[2.5rem] p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6">
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">공명 잔여 횟수</span>
              <div className={`text-3xl font-orbitron ${MAX_ATTEMPTS - history.length <= 2 ? 'text-rose-500 animate-pulse' : 'text-cyan-400'}`}>
                {MAX_ATTEMPTS - history.length}
              </div>
            </div>
          </div>

          <div className="mb-12 mt-4 bg-slate-900/50 p-6 rounded-3xl border border-white/5">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></div>
              <span className="text-xs font-bold text-cyan-500 tracking-tighter uppercase">Oracle Feedback</span>
            </div>
            <p className="text-xl text-slate-100 font-medium leading-relaxed italic">"{message}"</p>
          </div>

          {status === 'playing' ? (
            <form onSubmit={handleGuess} className="relative group">
              <input
                type="number"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                placeholder="숫자를 입력하시오..."
                disabled={isLoading}
                className="w-full bg-slate-950/50 border-2 border-white/10 rounded-2xl px-8 py-6 text-4xl font-orbitron text-white focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all"
              />
              <button
                type="submit"
                disabled={!guess || isLoading}
                className="absolute right-3 top-3 bottom-3 px-8 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 text-white font-bold rounded-xl transition-all shadow-lg active:scale-95"
              >
                {isLoading ? '탐색 중...' : '교신'}
              </button>
            </form>
          ) : (
            <div className="text-center py-6 animate-in fade-in slide-in-from-bottom-4">
              <h2 className={`text-4xl font-bold mb-4 ${status === 'won' ? 'text-emerald-400' : 'text-rose-500'}`}>
                {status === 'won' ? '진리를 찾았도다!' : '운명이 다했구려...'}
              </h2>
              <p className="text-slate-400 mb-8">현자가 숨긴 숫자는 <span className="text-white font-bold text-2xl font-orbitron">{target}</span>이었소.</p>
              <button
                onClick={initGame}
                className="px-12 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-2xl transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-cyan-900/20"
              >
                다시 구도의 길로
              </button>
            </div>
          )}

          <div className="mt-12">
            <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.3em] mb-4">공명의 궤적</h3>
            <GuessChart guesses={history} target={target} showTarget={status !== 'playing'} />
          </div>
        </main>

        <footer className="mt-8 text-center text-[10px] text-slate-700 font-bold tracking-widest uppercase opacity-50">
          Nebula Sage Oracle Interface • v4.0.1
        </footer>
      </div>
    </div>
  );
};

export default App;
