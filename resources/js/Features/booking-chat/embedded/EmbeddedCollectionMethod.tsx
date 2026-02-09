import { cn } from '@/Lib/utils';
import { Card } from '@/Components/ui/card';
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
    <Card className="overflow-hidden divide-y">
      {methods.map((method) => {
        const config = methodConfig[method.type];
        const MethodIcon = config.icon;
        const isSelected = selectedMethod === method.type;
        const isFree = method.price === 'free' || method.price === 0;

        return (
          <Button
            key={method.type}
            variant="ghost"
            onClick={() => !disabled && onSelect(method.type)}
            disabled={disabled}
            className={cn(
              "w-full h-auto justify-start px-6 py-4 text-body",
              "flex items-start gap-4 text-left transition-all",
              isSelected
                ? "relative z-10 rounded-3xl border-2 border-primary bg-primary/10 [&:not(:first-child)]:-mt-px [&+*]:border-t-transparent"
                : "rounded-none hover:bg-muted/50",
              disabled && isSelected && "[opacity:1!important]",
              disabled && !isSelected && "opacity-40"
            )}
          >
            {/* Icon */}
            <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0">
              <Icon icon={MethodIcon} size={20} className="text-blue-800" />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0 text-left">
              <p className="text-label">{method.label}</p>
              <p className="text-body text-muted-foreground">{method.address}</p>
            </div>

            {/* Price */}
            {isFree ? (
              <span className="text-card-title text-success shrink-0">Free</span>
            ) : (
              <span className="text-card-title shrink-0">₹{typeof method.price === 'number' ? method.price.toLocaleString() : method.price}</span>
            )}
          </Button>
        );
      })}
    </Card>
  );
}
