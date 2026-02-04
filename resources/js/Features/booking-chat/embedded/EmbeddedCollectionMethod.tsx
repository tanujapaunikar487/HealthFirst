import { cn } from '@/Lib/utils';
import { Home, Building2 } from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';

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
  return (
    <div className="border rounded-xl overflow-hidden divide-y">
      {methods.map((method) => {
        const config = methodConfig[method.type];
        const Icon = config.icon;
        const isSelected = selectedMethod === method.type;
        const isFree = method.price === 'free' || method.price === 0;

        return (
          <button
            key={method.type}
            onClick={() => !disabled && onSelect(method.type)}
            disabled={disabled}
            className={cn(
              "w-full flex items-center gap-4 p-4 text-left transition-all",
              "hover:bg-muted/50",
              isSelected && "bg-primary/5 border-l-2 border-l-primary",
              disabled && !isSelected && "opacity-60"
            )}
          >
            {/* Icon */}
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              isSelected ? "bg-primary/10" : "bg-muted"
            )}>
              <Icon className={cn("h-5 w-5", isSelected && "text-primary")} />
            </div>

            {/* Text */}
            <div className="flex-1">
              <p className="font-medium">{method.label}</p>
              <p className="text-[14px] text-muted-foreground">{method.address}</p>
            </div>

            {/* Price */}
            {isFree ? (
              <span className="font-semibold text-green-600">Free</span>
            ) : (
              <span className="font-semibold">₹{typeof method.price === 'number' ? method.price.toLocaleString() : method.price}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
