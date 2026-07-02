import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { RefreshCw, CheckCircle2, Sun, Moon, Monitor, Trash2, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, YAxis } from 'recharts';

// Custom Hook for Local Storage Persistence
function useStickyState<T>(defaultValue: T, key: string): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    const stickyValue = window.localStorage.getItem(key);
    return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
  });
  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue];
}

const MODES = {
  work: { label: 'Work', minutes: 25, color: 'bg-rose-500', textColor: 'text-rose-500', glow: 'drop-shadow-[0_0_40px_rgba(244,63,94,0.15)] dark:drop-shadow-[0_0_40px_rgba(244,63,94,0.3)]' },
  shortBreak: { label: 'Short Break', minutes: 5, color: 'bg-teal-500', textColor: 'text-teal-500', glow: 'drop-shadow-[0_0_40px_rgba(20,184,166,0.15)] dark:drop-shadow-[0_0_40px_rgba(20,184,166,0.3)]' },
  longBreak: { label: 'Long Break', minutes: 15, color: 'bg-blue-500', textColor: 'text-blue-500', glow: 'drop-shadow-[0_0_40px_rgba(59,130,246,0.15)] dark:drop-shadow-[0_0_40px_rgba(59,130,246,0.3)]' },
};

type ModeType = keyof typeof MODES;
type ThemeType = 'light' | 'dark' | 'system';
type CompletedTask = { id: string, text: string, time: string, date: string };

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-700 p-2 rounded-xl shadow-lg border border-slate-100 dark:border-slate-600">
        <p className="text-xs font-bold text-slate-500 dark:text-slate-300">{label}</p>
        <p className="text-sm font-bold text-blue-500">{`${payload[0].value} sessions`}</p>
      </div>
    );
  }
  return null;
};

export default function App() {
  const [mode, setMode] = useStickyState<ModeType>('work', 'pomodoro-mode');
  const [timeLeft, setTimeLeft] = useStickyState<number>(25 * 60, 'pomodoro-timeLeft');
  const [isActive, setIsActive] = useStickyState<boolean>(false, 'pomodoro-isActive');
  const [task, setTask] = useStickyState<string>('', 'pomodoro-task');
  const [theme, setTheme] = useStickyState<ThemeType>('system', 'pomodoro-theme');
  const [history, setHistory] = useStickyState<CompletedTask[]>([], 'pomodoro-history');
  const [dailyStats, setDailyStats] = useStickyState<Record<string, number>>({}, 'pomodoro-daily-stats');
  
  const latestTask = React.useRef(task);
  useEffect(() => {
    latestTask.current = task;
  }, [task]);

  const today = new Date().toDateString();
  const [stats, setStats] = useStickyState<{date: string, count: number}>({ date: today, count: 0 }, 'pomodoro-stats');

  const chartData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toDateString();
      const shortDay = d.toLocaleDateString('en-US', { weekday: 'short' });
      data.push({
        name: shortDay,
        fullDate: dateString,
        count: dailyStats[dateString] || 0
      });
    }
    return data;
  }, [dailyStats]);

  // Reset stats if it's a new day
  useEffect(() => {
    if (stats.date !== today) {
      setStats({ date: today, count: 0 });
    }
  }, [today, stats.date, setStats]);

  // Theme management
  useEffect(() => {
    const applyTheme = () => {
      const isDark = 
        theme === 'dark' || 
        (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    applyTheme();

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [theme]);

  const switchMode = useCallback((newMode: ModeType) => {
    setMode(newMode);
    setIsActive(false);
    setTimeLeft(MODES[newMode].minutes * 60);
  }, [setMode, setIsActive, setTimeLeft]);

  // Audio Notification using Web Audio API (no external assets needed)
  const playSound = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      // Pleasant double chime
      oscillator.frequency.setValueAtTime(600, audioCtx.currentTime); 
      oscillator.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.5);
      
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.error("Audio playback failed", e);
    }
  }, []);

  const sendNotification = useCallback((title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
  }, []);

  // Timer Logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      setIsActive(false);
      playSound();
      
      let notificationTitle = 'Timer Complete!';
      let notificationBody = 'Your session has ended.';

      if (mode === 'work') {
        notificationTitle = 'Focus Session Complete!';
        notificationBody = 'Great job! Time for a break.';
        
        const newCount = stats.count + 1;
        setStats({ date: today, count: newCount });
        
        setDailyStats(prev => ({
          ...prev,
          [today]: (prev[today] || 0) + 1
        }));
        
        setHistory(prev => {
          const newTask = {
            id: Date.now().toString(),
            text: latestTask.current.trim() || 'Focused Session',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: today
          };
          return [newTask, ...prev].slice(0, 50); // Keep the last 50 tasks
        });
        
        if (newCount % 4 === 0) {
          switchMode('longBreak');
        } else {
          switchMode('shortBreak');
        }
      } else {
        if (mode === 'shortBreak') {
          notificationTitle = 'Short Break Complete!';
          notificationBody = 'Time to get back to work.';
        } else if (mode === 'longBreak') {
          notificationTitle = 'Long Break Complete!';
          notificationBody = 'Ready for another focus session?';
        }
        switchMode('work');
      }

      sendNotification(notificationTitle, notificationBody);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, mode, stats.count, today, setStats, switchMode, playSound, sendNotification, setTimeLeft, setIsActive]);

  const toggleTimer = () => {
    if (!isActive && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    setIsActive(!isActive);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Tab Title
  useEffect(() => {
    document.title = `${formatTime(timeLeft)} - ${MODES[mode].label}`;
  }, [timeLeft, mode]);

  const handleReset = () => {
    setIsActive(false);
    setTimeLeft(MODES[mode].minutes * 60);
  };

  const totalSeconds = MODES[mode].minutes * 60;
  const progress = timeLeft / totalSeconds;
  const circumference = 2 * Math.PI * 136;
  const offset = circumference - progress * circumference;

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center overflow-hidden py-4 bg-slate-50 dark:bg-slate-900 font-sans transition-colors duration-500">
      
      <div className="flex flex-col items-center w-full max-w-xl px-4 sm:px-6 flex-1 justify-center pb-2">
        
        {/* Header & Theme Switcher */}
        <div className="w-full flex justify-between items-center mb-4 md:mb-5 transition-colors duration-500">
            <div className="text-left">
                <h1 className="text-slate-800 dark:text-slate-100 text-xl md:text-2xl font-bold tracking-tight mb-0.5">FocusFlow</h1>
                <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-medium">Senior Developer Dashboard</p>
            </div>
            
            <div className="flex items-center gap-1 bg-slate-900/5 dark:bg-slate-800/50 p-1 rounded-full backdrop-blur-sm border border-slate-900/10 dark:border-slate-700/50">
              <button 
                onClick={() => setTheme('light')} 
                className={`p-1.5 rounded-full transition-all ${theme === 'light' ? 'bg-white dark:bg-slate-700/80 shadow-sm text-blue-500' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                aria-label="Light theme"
              >
                <Sun size={16} strokeWidth={2}/>
              </button>
              <button 
                onClick={() => setTheme('dark')} 
                className={`p-1.5 rounded-full transition-all ${theme === 'dark' ? 'bg-white dark:bg-slate-700/80 shadow-sm text-blue-500' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                aria-label="Dark theme"
              >
                <Moon size={16} strokeWidth={2}/>
              </button>
              <button 
                onClick={() => setTheme('system')} 
                className={`p-1.5 rounded-full transition-all ${theme === 'system' ? 'bg-white dark:bg-slate-700/80 shadow-sm text-blue-500' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                aria-label="System theme"
              >
                <Monitor size={16} strokeWidth={2}/>
              </button>
            </div>
        </div>

        {/* Main Timer Container */}
        <div className="bg-white dark:bg-slate-800 border border-black/5 dark:border-white/5 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05),0_8px_10px_-6px_rgba(0,0,0,0.05)] dark:shadow-[0_10px_25px_-5px_rgba(0,0,0,0.2)] w-full rounded-3xl md:rounded-[32px] p-4 sm:p-6 md:p-8 flex flex-col items-center transition-colors duration-500">
          
          {/* Mode Selector */}
          <div className="flex flex-wrap justify-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl mb-4 md:mb-5 transition-colors duration-500">
            {(Object.entries(MODES) as [ModeType, typeof MODES[ModeType]][]).map(([key, config]) => (
              <button 
                key={key} 
                onClick={() => switchMode(key)}
                className={`px-3 sm:px-4 md:px-5 py-1.5 rounded-[10px] text-xs sm:text-sm font-semibold transition-all ${mode === key ? `${config.color} text-white shadow-sm` : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 bg-transparent'}`}
              >
                {config.label}
              </button>
            ))}
          </div>

          {/* Timer Display */}
          <div className="relative flex items-center justify-center mb-4 md:mb-5 w-full">
            {/* Progress Circle */}
            <svg className="w-48 h-48 sm:w-52 sm:h-52 md:w-56 md:h-56 transform -rotate-90" viewBox="0 0 288 288">
              <circle cx="144" cy="144" r="136" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-100 dark:text-slate-700 transition-colors duration-500" />
              <circle 
                cx="144" cy="144" r="136" 
                stroke="currentColor" 
                strokeWidth="6" 
                fill="transparent" 
                className={`${MODES[mode].textColor} transition-all duration-1000 ease-linear`}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-[56px] sm:text-[72px] md:text-[80px] font-bold text-slate-800 dark:text-slate-100 leading-none tracking-tight transition-colors duration-500 ${MODES[mode].glow}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>

          {/* Main Controls */}
          <div className="flex items-center justify-center gap-4 sm:gap-5 mb-4 md:mb-5 w-full">
            <button 
              onClick={toggleTimer}
              className="flex-1 max-w-[180px] py-3 sm:py-4 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-lg shadow-lg shadow-slate-200 dark:shadow-none transition-all hover:-translate-y-1 active:translate-y-0 active:scale-95"
            >
              {isActive ? 'PAUSE' : 'START'}
            </button>
            <button 
              onClick={handleReset}
              className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all active:scale-95"
              aria-label="Reset Timer"
            >
              <RefreshCw className="stroke-[2.5] w-5 h-5" />
            </button>
          </div>

          {/* Task Input Area */}
          <div className="w-full flex flex-col items-center border-t border-slate-100 dark:border-slate-700/50 pt-4 transition-colors duration-500">
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Current Task</span>
            <input 
              type="text" 
              value={task} 
              onChange={(e) => setTask(e.target.value)}
              placeholder="What are you working on?"
              className="w-full max-w-sm sm:max-w-md text-center text-sm sm:text-base font-medium text-slate-700 dark:text-slate-200 bg-transparent border-none focus:outline-none placeholder:text-slate-300 dark:placeholder:text-slate-500 px-2 transition-colors duration-500"
            />
          </div>
        </div>

        {/* Stats Footer */}
        <div className="flex justify-center gap-12 mt-4 w-full transition-colors duration-500">
            <div className="text-center">
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">Pomodoros</p>
                <p className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.count}</p>
            </div>
        </div>

        {/* Task History */}
        {history.length > 0 && (
          <div className="w-full mt-4 bg-white dark:bg-slate-800 rounded-3xl p-4 sm:p-5 shadow-[0_8px_20px_-6px_rgba(0,0,0,0.05)] border border-black/5 dark:border-white/5 transition-colors duration-500">
            <div className="flex justify-between items-center mb-3">
              <div className="flex-1"></div>
              <h3 className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest text-center flex-1">Recent Sessions</h3>
              <div className="flex-1 flex justify-end">
                <button 
                  onClick={() => setHistory([])}
                  className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors"
                  aria-label="Clear history"
                >
                  <Trash2 size={12} strokeWidth={2.5} />
                  CLEAR
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-2 max-h-[120px] overflow-y-auto pr-1">
              {history.map((item) => (
                <div key={item.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-2.5 sm:p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
                  <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 truncate pr-4">{item.text}</span>
                  <span className="text-[10px] sm:text-xs font-medium text-slate-400 shrink-0">{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weekly Chart */}
        <div className="w-full mt-4 bg-white dark:bg-slate-800 rounded-3xl p-4 sm:p-5 shadow-[0_8px_20px_-6px_rgba(0,0,0,0.05)] border border-black/5 dark:border-white/5 transition-colors duration-500">
          <div className="flex items-center justify-center gap-2 mb-4">
            <BarChart2 size={16} className="text-slate-400" />
            <h3 className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Weekly Overview</h3>
          </div>
          <div className="h-32 sm:h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                <Bar dataKey="count" radius={[4, 4, 4, 4]}>
                  {
                    chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fullDate === today ? '#3b82f6' : (theme === 'dark' || document.documentElement.classList.contains('dark') ? '#334155' : '#cbd5e1')} />
                    ))
                  }
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}

