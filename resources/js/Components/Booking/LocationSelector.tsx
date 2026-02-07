import { cn } from '@/Lib/utils';
import { Card } from '@/Components/ui/card';
import { HStack, VStack } from '@/Components/ui/stack';
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
    <Card className={cn('overflow-hidden divide-y', className)}>
      {locations.map((location) => {
        const locIcon = locationIcons[location.type];
        const isSelected = selectedLocation === location.type;

        return (
          <Button
            key={location.type}
            variant="ghost"
            onClick={() => onSelect(location.type)}
            className={cn(
              'w-full h-auto rounded-none justify-start px-6 py-4 text-body hover:bg-muted/50',
              'text-left transition-all',
              isSelected && 'bg-primary/5 border border-primary'
            )}
          >
            <HStack gap={4} className="items-start">
              <div
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                  isSelected ? 'bg-primary/10' : 'bg-muted'
                )}
              >
                <Icon icon={locIcon} className={isSelected ? 'text-primary' : 'text-foreground'} size="lg" />
              </div>

              <VStack gap={2} className="flex-1 min-w-0">
                <VStack gap={0}>
                  <p className="text-label">{location.label}</p>
                  <p className="text-body text-muted-foreground">{location.description}</p>
                  {location.address && (
                    <p className="text-body text-muted-foreground">
                      {location.address}
                      {location.distance && ` • ${location.distance}`}
                    </p>
                  )}
                </VStack>

                {/* Change link - always visible on the card */}
                {location.type === 'home' && onChangeAddress ? (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChangeAddress();
                    }}
                    className="h-auto p-0 text-body text-primary hover:text-primary/80 transition-colors justify-start"
                  >
                    <HStack gap={1}>
                      <Icon icon={MapPin} size="sm" />
                      Change address
                    </HStack>
                  </Button>
                ) : location.type === 'center' && onChangeBranch ? (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChangeBranch();
                    }}
                    className="h-auto p-0 text-body text-primary hover:text-primary/80 transition-colors justify-start"
                  >
                    <HStack gap={1}>
                      <Icon icon={MapPin} size="sm" />
                      Change branch
                    </HStack>
                  </Button>
                ) : null}
              </VStack>

              <span className="text-card-title flex-shrink-0">
                ₹{location.fee.toLocaleString()}
              </span>
            </HStack>
          </Button>
        );
      })}
    </Card>
  );
}
