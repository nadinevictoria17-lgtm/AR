import { Languages, PlayCircle, RefreshCcw, Square } from 'lucide-react'

interface ARLearningControlsProps {
  language: 'en' | 'Filipino';
  onLanguageToggle: () => void;
  onPlayAll: () => void;
  onStop: () => void;
  onReplay: () => void;
  isPlaying?: boolean;
  currentIndex?: number;
  total?: number;
  unsupported?: boolean;
}

export function ARLearningControls({
  language,
  onLanguageToggle,
  onPlayAll,
  onStop,
  onReplay,
  isPlaying = false,
  currentIndex = 0,
  total = 0,
  unsupported = false,
}: ARLearningControlsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {unsupported ? 'Voice-over is not supported in this browser.' : `Line ${Math.min(currentIndex + 1, Math.max(total, 1))} of ${Math.max(total, 1)}`}
        </p>
        <span className={`text-xs font-semibold ${isPlaying ? 'text-primary' : 'text-muted-foreground'}`}>
          {isPlaying ? 'Playing' : 'Idle'}
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      <button
        onClick={onPlayAll}
        disabled={unsupported}
        className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-border bg-card text-sm font-semibold hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <PlayCircle size={15} />
        Play All
      </button>
      <button onClick={onStop} className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-border bg-card text-sm font-semibold hover:bg-muted transition-colors">
        <Square size={15} />
        Stop
      </button>
      <button onClick={onLanguageToggle} className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-border bg-card text-sm font-semibold hover:bg-muted transition-colors">
        <Languages size={15} />
        {language === 'en' ? 'English' : 'Filipino'}
      </button>
      <button
        onClick={onReplay}
        disabled={unsupported}
        className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-border bg-card text-sm font-semibold hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <RefreshCcw size={15} />
        Replay
      </button>
    </div>
    </div>
  )
}
