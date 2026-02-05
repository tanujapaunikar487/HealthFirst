import { cn } from '@/Lib/utils';
import { Building2, MapPin, Star } from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';

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
    <div className="border rounded-xl overflow-hidden divide-y">
      {centers.map((center) => {
        const isSelected = selectedCenterId === center.id;

        return (
          <button
            key={center.id}
            onClick={() => !disabled && onSelect(center.id)}
            disabled={disabled}
            className={cn(
              "w-full flex items-start gap-3 p-4 text-left transition-all",
              "hover:bg-muted/50",
              isSelected && "bg-primary/5 border-l-2 border-l-primary",
              disabled && !isSelected && "opacity-60"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
              isSelected ? "bg-primary/10" : "bg-muted"
            )}>
              <Building2 className={cn("h-5 w-5", isSelected && "text-primary")} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-[14px]">{center.name}</p>
              <div className="flex items-center gap-1 mt-1 text-[14px] text-muted-foreground">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{center.address}</span>
              </div>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="inline-flex items-center gap-1 text-[14px] text-muted-foreground">
                  <Star className="h-3 w-3 fill-warning text-warning" />
                  {center.rating}
                </span>
                <span className="text-[14px] text-muted-foreground">
                  {center.distance_km} km away
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
