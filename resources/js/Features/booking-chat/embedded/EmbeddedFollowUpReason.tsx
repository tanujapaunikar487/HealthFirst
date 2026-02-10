import { OptionList, OptionListItem } from '@/Components/ui/option-list';
import { CalendarClock, AlertCircle, RefreshCw } from '@/Lib/icons';

export interface FollowUpReasonOption {
  value: string;
  label: string;
  description: string;
}

interface Props {
  selectedReason: string | null;
  onSelect: (reason: string) => void;
  disabled: boolean;
  reasons?: FollowUpReasonOption[];
}

const defaultReasons: FollowUpReasonOption[] = [
  {
    value: 'scheduled',
    label: 'Scheduled follow-up',
    description: 'Doctor asked me to come back',
  },
  {
    value: 'new_concern',
    label: 'New concern',
    description: 'Something changed since last visit',
  },
  {
    value: 'ongoing_issue',
    label: 'Ongoing issue',
    description: "Symptoms haven't improved",
  },
];

const getReasonIcon = (value: string) => {
  switch (value) {
    case 'scheduled':
      return CalendarClock;
    case 'new_concern':
      return AlertCircle;
    case 'ongoing_issue':
      return RefreshCw;
    default:
      return AlertCircle;
  }
};

export function EmbeddedFollowUpReason({ selectedReason, onSelect, disabled, reasons = defaultReasons }: Props) {
  const options: OptionListItem[] = reasons.map((reason) => ({
    value: reason.value,
    label: reason.label,
    description: reason.description,
    icon: getReasonIcon(reason.value),
  }));

  return (
    <OptionList
      options={options}
      selected={selectedReason}
      onSelect={onSelect}
      disabled={disabled}
    />
  );
}
