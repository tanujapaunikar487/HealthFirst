import { cn } from '@/Lib/utils';
import { Home, MapPin, Plus, Check } from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';

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
      <div className="border rounded-xl overflow-hidden divide-y">
        {addresses.map((addr) => {
          const isSelected = selectedAddressId === addr.id;

          return (
            <button
              key={addr.id}
              onClick={() => !disabled && onSelect(addr.id, addr.label, addr.address)}
              disabled={disabled}
              className={cn(
                'w-full flex items-start gap-3 p-4 text-left transition-all',
                'hover:bg-muted/50',
                isSelected && 'bg-primary/5 border-l-2 border-l-primary',
                disabled && !isSelected && 'opacity-60',
              )}
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
                  isSelected ? 'bg-primary/10' : 'bg-muted',
                )}
              >
                <Home className={cn('h-5 w-5', isSelected && 'text-primary')} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-[14px]">{addr.label}</p>
                  {addr.is_default && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                      Default
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-1 text-[14px] text-muted-foreground">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{addr.address}</span>
                </div>
              </div>

              {isSelected && (
                <div className="flex-shrink-0 mt-2">
                  <Check className="h-5 w-5 text-primary" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Add new address placeholder */}
      <button
        disabled={disabled}
        className={cn(
          'w-full flex items-center gap-3 p-3 rounded-xl border border-dashed transition-all text-left',
          'hover:bg-muted/50 hover:border-primary/30',
          'disabled:opacity-50 disabled:cursor-not-allowed',
        )}
        onClick={() => !disabled && onAddAddress?.()}
      >
        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
          <Plus className="h-4 w-4 text-muted-foreground" />
        </div>
        <span className="text-[14px] text-muted-foreground">Add new address</span>
      </button>
    </div>
  );
}
