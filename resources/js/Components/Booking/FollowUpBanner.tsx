import { Alert } from '@/Components/ui/alert';

interface FollowUpBannerProps {
  symptoms: string[];
  doctorName: string;
  date: string;
  className?: string;
}

export function FollowUpBanner({ symptoms, doctorName, date, className }: FollowUpBannerProps) {
  return (
    <Alert variant="info" title={`Following up on: ${symptoms.join(', ')}`} className={className}>
      From {doctorName} on {date}. Add any new symptoms below.
    </Alert>
  );
}
