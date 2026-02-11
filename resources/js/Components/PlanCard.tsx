import { Button } from '@/Components/ui/button';
import { ChevronRight } from '@/Lib/icons';
import { cn } from '@/Lib/utils';

export interface PlanCardProps {
  title: string;
  subtitle: string;
  logo?: string | null;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

function getPlanInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function PlanCard({
  title,
  subtitle,
  logo,
  onClick,
  disabled,
  className,
}: PlanCardProps) {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors hover:bg-accent h-auto',
        className
      )}
    >
      {logo ? (
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center">
          <img
            src={logo}
            alt={title}
            className="h-full w-full object-contain"
          />
        </div>
      ) : (
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-card-title"
          style={{
            backgroundColor: 'hsl(var(--primary) / 0.2)',
            color: 'hsl(var(--primary))',
          }}
        >
          {getPlanInitials(title)}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-card-title text-foreground truncate">{title}</p>
        <p className="text-body text-muted-foreground">{subtitle}</p>
      </div>
      <span
        className="flex items-center justify-center flex-shrink-0 rounded-full"
        style={{
          width: '40px',
          height: '40px',
          border: '1px solid hsl(var(--border))',
          background: 'hsl(var(--secondary))',
          color: 'hsl(var(--foreground))',
        }}
      >
        <ChevronRight className="h-5 w-5" />
      </span>
    </Button>
  );
}
