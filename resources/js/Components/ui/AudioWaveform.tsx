import { cn } from '@/Lib/utils';

interface AudioWaveformProps {
  className?: string;
  isRecording?: boolean;
}

export function AudioWaveform({ className, isRecording = true }: AudioWaveformProps) {
  return (
    <div className={cn('flex items-center gap-0.5 h-6', className)}>
      {[...Array(40)].map((_, i) => (
        <div
          key={i}
          className={cn(
            'w-0.5 bg-muted-foreground rounded-full transition-all',
            isRecording && 'animate-wave'
          )}
          style={{
            height: isRecording ? `${Math.random() * 100}%` : '20%',
            animationDelay: `${i * 50}ms`,
            animationDuration: '1.2s',
          }}
        />
      ))}
    </div>
  );
}
