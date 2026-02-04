import { Info } from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';
import { cn } from '@/Lib/utils';

interface FollowUpBannerProps {
  symptoms: string[];
  doctorName: string;
  date: string;
  className?: string;
}

export function FollowUpBanner({ symptoms, doctorName, date, className }: FollowUpBannerProps) {
  return (
    <div className={cn("bg-primary/10 rounded-xl p-4 flex items-start gap-3", className)}>
      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
        <Info className="w-4 h-4 text-white" />
      </div>
      <div>
        <p className="font-medium text-foreground">
          Following up on: {symptoms.join(', ')}
        </p>
        <p className="text-[14px] text-muted-foreground">
          From {doctorName} on {date}. Add any new symptoms below.
        </p>
      </div>
    </div>
  );
}
