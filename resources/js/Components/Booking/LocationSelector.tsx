import { cn } from '@/Lib/utils';
import { Home, Building2 } from 'lucide-react';

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
  className,
}: LocationSelectorProps) {
  return (
    <div className={cn('border rounded-xl overflow-hidden divide-y', className)}>
      {locations.map((location) => {
        const Icon = locationIcons[location.type];
        const isSelected = selectedLocation === location.type;

        return (
          <button
            key={location.type}
            onClick={() => onSelect(location.type)}
            className={cn(
              'w-full flex items-center gap-4 p-4 text-left transition-all',
              'hover:bg-muted/50',
              isSelected && 'bg-primary/5 border-2 border-primary'
            )}
          >
            <div
              className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                isSelected ? 'bg-primary/10' : 'bg-muted'
              )}
            >
              <Icon className={cn('h-5 w-5', isSelected ? 'text-primary' : 'text-foreground')} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{location.label}</p>
              <p className="text-xs text-muted-foreground">{location.description}</p>
              {location.address && (
                <p className="text-xs text-muted-foreground mt-1">
                  {location.address}
                  {location.distance && ` • ${location.distance}`}
                </p>
              )}
            </div>

            <span className="font-semibold text-sm flex-shrink-0">
              ₹{location.fee.toLocaleString()}
            </span>
          </button>
        );
      })}
    </div>
  );
}
