import { OptionList, OptionListItem } from '@/Components/ui/option-list';

interface Props {
  selectedUrgency: string | null;
  onSelect: (urgency: string) => void;
  disabled: boolean;
}

const options: OptionListItem[] = [
  {
    value: 'urgent',
    label: 'Urgent (Today/ASAP)',
    description: 'Need to see someone ASAP',
    indicator: {
      dotColor: 'bg-destructive',
      bgColor: 'bg-destructive/10',
    },
  },
  {
    value: 'this_week',
    label: 'This Week',
    description: 'Within a few days',
    indicator: {
      dotColor: 'bg-warning',
      bgColor: 'bg-warning/10',
    },
  },
  {
    value: 'specific_date',
    label: "I've a specific date",
    description: 'Select a particular date',
    indicator: {
      dotColor: 'bg-info',
      bgColor: 'bg-info/10',
    },
  },
];

export function EmbeddedUrgencySelector({ selectedUrgency, onSelect, disabled }: Props) {
  return (
    <OptionList
      options={options}
      selected={selectedUrgency}
      onSelect={onSelect}
      disabled={disabled}
    />
  );
}
