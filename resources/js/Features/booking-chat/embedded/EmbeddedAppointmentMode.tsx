import { OptionList, OptionListItem } from '@/Components/ui/option-list';
import { Monitor, Users } from '@/Lib/icons';

interface Mode {
  type: 'video' | 'in_person';
  price: number;
}

interface Props {
  modes: Mode[];
  selectedMode: string | null;
  onSelect: (mode: string) => void;
  disabled: boolean;
}

const modeConfig = {
  video: {
    icon: Monitor,
    label: 'Video Appointment',
    description: 'Connect from home via video call',
  },
  in_person: {
    icon: Users,
    label: 'In-Person Visit',
    description: 'Visit the doctor at the clinic',
  },
};

export function EmbeddedAppointmentMode({ modes, selectedMode, onSelect, disabled }: Props) {
  const options: OptionListItem[] = modes.map((mode) => {
    const config = modeConfig[mode.type];
    return {
      value: mode.type,
      label: config.label,
      description: config.description,
      icon: config.icon,
      rightContent: <p className="text-label">₹{mode.price.toLocaleString()}</p>,
    };
  });

  return (
    <OptionList
      options={options}
      selected={selectedMode}
      onSelect={onSelect}
      disabled={disabled}
    />
  );
}
