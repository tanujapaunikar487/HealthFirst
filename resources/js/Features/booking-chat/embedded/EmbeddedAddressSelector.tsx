import { cn } from '@/Lib/utils';
import { Badge } from '@/Components/ui/badge';
import { Card } from '@/Components/ui/card';
import { Home, MapPin, Plus, Check } from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';
import { Button } from '@/Components/ui/button';

interface Address {
  id: number;
  label: string;
  address: string;
  is_default: boolean;
}

interface Props {
  addresses: Address[];
  selectedAddressId: number | null;
  onSelect: (id: number, label: string, address: string) => void;
  onAddAddress?: () => void;
  disabled: boolean;
}

export function EmbeddedAddressSelector({ addresses, selectedAddressId, onSelect, onAddAddress, disabled }: Props) {
  return (
    <div className="space-y-3">
      {/* Saved addresses */}
      <Card className="overflow-hidden divide-y">
        {addresses.map((addr) => {
          const isSelected = selectedAddressId === addr.id;

          return (
            <Button
              key={addr.id}
              variant="ghost"
              onClick={() => !disabled && onSelect(addr.id, addr.label, addr.address)}
              disabled={disabled}
              className={cn(
                'w-full h-auto rounded-none justify-start px-6 py-4 text-body hover:bg-muted/50',
                'flex items-start gap-3 text-left transition-all',
                isSelected && 'bg-primary/5 border-l-2 border-l-primary',
                disabled && !isSelected && 'opacity-60',
              )}
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                  isSelected ? 'bg-primary/10' : 'bg-muted',
                )}
              >
                <Icon icon={Home} size={20} className={cn(isSelected && 'text-primary')} />
              </div>

              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-2">
                  <p className="text-label">{addr.label}</p>
                  {addr.is_default && (
                    <Badge variant="info">Default</Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-1 text-body text-muted-foreground">
                  <Icon icon={MapPin} size={12} className="flex-shrink-0" />
                  <span className="truncate">{addr.address}</span>
                </div>
              </div>

              {isSelected && (
                <div className="flex-shrink-0 mt-2">
                  <Icon icon={Check} size={20} className="text-primary" />
                </div>
              )}
            </Button>
          );
        })}
      </Card>

      {/* Add new address placeholder */}
      <Button
        variant="outline"
        disabled={disabled}
        className={cn(
          'w-full h-auto flex items-center gap-3 p-3 rounded-xl border-dashed transition-all text-left font-normal',
          'hover:bg-muted/50 hover:border-primary/30',
        )}
        onClick={() => !disabled && onAddAddress?.()}
      >
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          <Icon icon={Plus} className="text-foreground" />
        </div>
        <span className="text-body text-muted-foreground">Add new address</span>
      </Button>
    </div>
  );
}
