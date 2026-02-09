import { cn } from '@/Lib/utils';
import { Card } from '@/Components/ui/card';
import { Home, Building2, MapPin } from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';
import { Button } from '@/Components/ui/button';

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
  onChangeAddress?: () => void;
  onChangeBranch?: () => void;
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

export function EmbeddedLocationSelector({ locations, selectedLocationId, onSelect, onChangeAddress, onChangeBranch, disabled }: Props) {
  return (
    <Card className="overflow-hidden divide-y">
      {locations.map((location) => {
        const config = locationConfig[location.type];
        const LocationIcon = config.icon;
        const isSelected = selectedLocationId === location.id;
        const isFree = location.fee === 'free' || location.fee === 0;

        return (
          <div key={location.id} className="relative">
            <Button
              variant="ghost"
              onClick={() => !disabled && onSelect(location.id)}
              disabled={disabled}
              className="w-full h-auto justify-start px-6 py-4 text-body flex items-start gap-4 text-left transition-all rounded-none hover:bg-muted/50"
            >
              {/* Icon */}
              <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0">
                <Icon icon={LocationIcon} size={20} className="text-blue-800" />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0 text-left">
                <p className="text-label">
                  {location.name || config.label}
                  {location.distance_km && (
                    <span className="text-body text-muted-foreground ml-2">
                      ({location.distance_km} km away)
                    </span>
                  )}
                </p>
                <p className="text-body text-muted-foreground">{location.address}</p>

                {/* Change link - always visible on the card */}
                {!disabled && (
                  <div className="mt-2">
                    {location.type === 'home' && onChangeAddress ? (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onChangeAddress();
                        }}
                        className="h-auto p-0"
                      >
                        <Icon icon={MapPin} size={12} />
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
                        className="h-auto p-0"
                      >
                        <Icon icon={MapPin} size={12} />
                        Change branch
                      </Button>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Fee */}
              {isFree ? (
                <span className="text-card-title text-success flex-shrink-0">Free</span>
              ) : (
                <span className="text-card-title flex-shrink-0">₹{typeof location.fee === 'number' ? location.fee.toLocaleString() : location.fee}</span>
              )}
            </Button>
          </div>
        );
      })}
    </Card>
  );
}
