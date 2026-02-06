import { cn } from '@/Lib/utils';
import { Home, Building2, MapPin } from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';
import { Button } from '@/Components/ui/button';

interface LocationOption {
  type: 'home' | 'center';
  label: string;
  description: string;
  address?: string;
  distance?: string;
  fee: number;
}

interface LocationSelectorProps {
  locations: LocationOption[];
  selectedLocation: string | null;
  onSelect: (type: string) => void;
  onChangeAddress?: () => void;
  onChangeBranch?: () => void;
  className?: string;
}

const locationIcons = {
  home: Home,
  center: Building2,
};

export function LocationSelector({
  locations,
  selectedLocation,
  onSelect,
  onChangeAddress,
  onChangeBranch,
  className,
}: LocationSelectorProps) {
  return (
    <div className="space-y-3">
      <div className={cn('border rounded-xl overflow-hidden divide-y', className)}>
        {locations.map((location) => {
          const locIcon = locationIcons[location.type];
          const isSelected = selectedLocation === location.type;

          return (
            <div key={location.type} className="relative">
              <Button
                variant="ghost"
                onClick={() => onSelect(location.type)}
                className={cn(
                  'w-full h-auto rounded-none justify-start px-6 py-4 font-normal text-[14px] hover:bg-muted/50',
                  'flex items-start gap-4 text-left transition-all',
                  isSelected && 'bg-primary/5 border border-primary'
                )}
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                    isSelected ? 'bg-primary/10' : 'bg-muted'
                  )}
                >
                  <Icon icon={locIcon} className={cn('h-5 w-5', isSelected ? 'text-primary' : 'text-foreground')} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[14px]">{location.label}</p>
                  <p className="text-[14px] text-muted-foreground">{location.description}</p>
                  {location.address && (
                    <p className="text-[14px] text-muted-foreground mt-1">
                      {location.address}
                      {location.distance && ` • ${location.distance}`}
                    </p>
                  )}

                  {/* Change link - always visible on the card */}
                  <div className="mt-2">
                    {location.type === 'home' && onChangeAddress ? (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onChangeAddress();
                        }}
                        className="h-auto p-0 inline-flex items-center gap-1 text-[14px] text-primary hover:text-primary/80 transition-colors"
                      >
                        <Icon icon={MapPin} className="h-3 w-3" />
                        Change address
                      </Button>
                    ) : location.type === 'center' && onChangeBranch ? (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onChangeBranch();
                        }}
                        className="h-auto p-0 inline-flex items-center gap-1 text-[14px] text-primary hover:text-primary/80 transition-colors"
                      >
                        <Icon icon={MapPin} className="h-3 w-3" />
                        Change branch
                      </Button>
                    ) : null}
                  </div>
                </div>

                <span className="font-semibold text-[14px] flex-shrink-0">
                  ₹{location.fee.toLocaleString()}
                </span>
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
