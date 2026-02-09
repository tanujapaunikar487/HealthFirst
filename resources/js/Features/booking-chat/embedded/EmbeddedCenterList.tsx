import { cn } from '@/Lib/utils';
import { Card } from '@/Components/ui/card';
import { Building2, MapPin, Star } from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';
import { Button } from '@/Components/ui/button';

interface Center {
  id: number;
  name: string;
  address: string;
  city: string;
  rating: number;
  distance_km: number;
}

interface Props {
  centers: Center[];
  selectedCenterId: number | null;
  onSelect: (centerId: number) => void;
  disabled: boolean;
}

export function EmbeddedCenterList({ centers, selectedCenterId, onSelect, disabled }: Props) {
  return (
    <Card className="overflow-hidden divide-y">
      {centers.map((center) => {
        const isSelected = selectedCenterId === center.id;

        return (
          <Button
            key={center.id}
            variant="ghost"
            onClick={() => !disabled && onSelect(center.id)}
            disabled={disabled}
            className={cn(
              "w-full h-auto justify-start px-6 py-4 text-body",
              "flex items-start gap-3 text-left transition-all",
              disabled && "opacity-60",
              isSelected
                ? "rounded-3xl border-2 border-primary bg-primary/5 [&:not(:first-child)]:border-t-0 [&+*]:border-t-0"
                : "rounded-none hover:bg-muted/50"
            )}
          >
            <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Icon icon={Building2} size={20} className="text-blue-800" />
            </div>

            <div className="flex-1 min-w-0 text-left">
              <p className="text-label">{center.name}</p>
              <div className="flex items-center gap-1 mt-1 text-body text-muted-foreground">
                <Icon icon={MapPin} size={12} className="flex-shrink-0" />
                <span className="truncate">{center.address}</span>
              </div>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="inline-flex items-center gap-1 text-body text-muted-foreground">
                  <Icon icon={Star} size={12} className="fill-warning text-warning" />
                  {center.rating}
                </span>
                <span className="text-body text-muted-foreground">
                  {center.distance_km} km away
                </span>
              </div>
            </div>
          </Button>
        );
      })}
    </Card>
  );
}
