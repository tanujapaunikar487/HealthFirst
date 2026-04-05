import { cn } from '@/Lib/utils';

interface AIBlobProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-28 h-28',
  lg: 'w-[120px] h-[120px]',
};

export function AIBlob({ size = 'md', className }: AIBlobProps) {
  return (
    <div className={cn('relative', sizeClasses[size], className)}>
      {/* Glow layer */}
      <div className="absolute inset-0 animate-blob-glow rounded-full opacity-40 blur-xl"
        style={{ background: 'radial-gradient(circle, hsl(210 80% 80% / 0.6), hsl(260 60% 85% / 0.3), transparent)' }}
      />
      {/* Blob image with fluid motion */}
      <img
        src="/assets/images/ai-blob.png"
        alt=""
        className="relative w-full h-full object-contain animate-blob-float"
      />
    </div>
  );
}
