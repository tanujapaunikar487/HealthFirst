import { cn } from '@/Lib/utils';
import { Home, Building2 } from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';
import { Button } from '@/Components/ui/button';

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
          <Button
            key={method.type}
            variant="ghost"
            onClick={() => !disabled && onSelect(method.type)}
            disabled={disabled}
            className={cn(
              "w-full h-auto rounded-none justify-start px-6 py-4 text-body hover:bg-muted/50",
              "flex items-center gap-4 text-left transition-all",
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
            <div className="flex-1 text-left">
              <p className="font-medium">{method.label}</p>
              <p className="text-body text-muted-foreground">{method.address}</p>
            </div>

            {/* Price */}
            {isFree ? (
              <span className="font-semibold text-success">Free</span>
            ) : (
              <span className="font-semibold">₹{typeof method.price === 'number' ? method.price.toLocaleString() : method.price}</span>
            )}
          </Button>
        );
      })}
    </div>
  );
}
