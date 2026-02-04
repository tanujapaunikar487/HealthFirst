import { Alert } from '@/Components/ui/alert';
import { cn } from '@/Lib/utils';

interface FastingAlertProps {
  hours: number;
  className?: string;
}

export function FastingAlert({ hours, className }: FastingAlertProps) {
  return (
    <Alert variant="warning" title="Fasting required" className={cn(className)}>
      {hours} hours before. Morning recommended.
    </Alert>
  );
}
