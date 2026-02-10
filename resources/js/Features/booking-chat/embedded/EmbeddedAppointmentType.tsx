import { OptionList } from '@/Components/ui/option-list';
import { User, RefreshCw } from '@/Lib/icons';

interface Props {
  selectedType: 'new' | 'followup' | null;
  onSelect: (type: 'new' | 'followup') => void;
  disabled: boolean;
}

const options = [
  {
    value: 'new' as const,
    label: 'New Appointment',
    description: 'First visit for this concern',
    icon: User,
  },
  {
    value: 'followup' as const,
    label: 'Follow-up Visit',
    description: 'Continuing care with previous doctor',
    icon: RefreshCw,
  },
];

export function EmbeddedAppointmentType({ selectedType, onSelect, disabled }: Props) {
  return (
    <OptionList
      options={options}
      selected={selectedType}
      onSelect={onSelect}
      disabled={disabled}
      className="mt-3"
    />
  );
}
