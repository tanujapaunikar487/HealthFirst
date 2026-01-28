import { cn } from '@/Lib/utils';
import { Home, Building2 } from 'lucide-react';

interface Location {
  id: string;
  type: 'home' | 'center';
  name?: string;
  address: string;
  distance_km?: number;
  fee: number | 'free';
}

interface Props {
  locations: Location[];
  selectedLocationId: string | null;
  onSelect: (locationId: string) => void;
  disabled: boolean;
}

const locationConfig = {
  home: {
    icon: Home,
    label: 'Home Collection',
  },
  center: {
    icon: Building2,
    label: 'Visit Center',
  },
};

export function EmbeddedLocationSelector({ locations, selectedLocationId, onSelect, disabled }: Props) {
  return (
    <div className="border rounded-xl overflow-hidden divide-y">
      {locations.map((location) => {
        const config = locationConfig[location.type];
        const Icon = config.icon;
        const isSelected = selectedLocationId === location.id;
        const isFree = location.fee === 'free' || location.fee === 0;

        return (
          <button
            key={location.id}
            onClick={() => !disabled && onSelect(location.id)}
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
              <p className="font-medium text-sm">
                {location.name || config.label}
                {location.distance_km && (
                  <span className="text-xs text-muted-foreground ml-2">
                    ({location.distance_km} km away)
                  </span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">{location.address}</p>
            </div>

            {/* Fee */}
            {isFree ? (
              <span className="font-semibold text-sm text-green-600">Free</span>
            ) : (
              <span className="font-semibold text-sm">₹{typeof location.fee === 'number' ? location.fee.toLocaleString() : location.fee}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
