import { AlertCircle } from 'lucide-react';
import { cn } from '@/Lib/utils';

interface FastingAlertProps {
  hours: number;
  className?: string;
}

export function FastingAlert({ hours, className }: FastingAlertProps) {
  return (
    <div
      className={cn(
        'bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3',
        className
      )}
    >
      <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
        <AlertCircle className="w-4 h-4 text-white" />
      </div>
      <div>
        <p className="font-semibold text-amber-900">Fasting required</p>
        <p className="text-sm text-amber-700">{hours} hours before. Morning recommended.</p>
      </div>
    </div>
  );
}
