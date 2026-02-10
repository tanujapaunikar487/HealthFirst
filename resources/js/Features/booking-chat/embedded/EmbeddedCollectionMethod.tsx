import { OptionList, OptionListItem } from '@/Components/ui/option-list';
import { Home, Building2 } from '@/Lib/icons';

interface CollectionMethod {
  type: 'home' | 'center';
  label: string;
  address: string;
  price: number | 'free';
}

interface Props {
  methods: CollectionMethod[];
  selectedMethod: string | null;
  onSelect: (method: string) => void;
  disabled: boolean;
}

const methodConfig = {
  home: {
    icon: Home,
  },
  center: {
    icon: Building2,
  },
};

export function EmbeddedCollectionMethod({ methods, selectedMethod, onSelect, disabled }: Props) {
  const options: OptionListItem[] = methods.map((method) => {
    const config = methodConfig[method.type];
    const isFree = method.price === 'free' || method.price === 0;

    return {
      value: method.type,
      label: method.label,
      description: method.address,
      icon: config.icon,
      rightContent: isFree ? (
        <span className="text-card-title text-success">Free</span>
      ) : (
        <span className="text-card-title">₹{typeof method.price === 'number' ? method.price.toLocaleString() : method.price}</span>
      ),
    };
  });

  return (
    <OptionList
      options={options}
      selected={selectedMethod}
      onSelect={onSelect}
      disabled={disabled}
    />
  );
}
