import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { cn } from '@/Lib/utils';
import { Clock, FlaskConical, User, ChevronRight } from 'lucide-react';

interface Package {
  id: string;
  name: string;
  description: string;
  duration_hours: string;
  tests_count: number;
  age_range: string;
  price: number;
  original_price: number;
  is_recommended: boolean;
}

interface Props {
  packages: Package[];
  selectedPackageId: string | null;
  onSelect: (packageId: string) => void;
  disabled: boolean;
}

export function EmbeddedPackageList({ packages, selectedPackageId, onSelect, disabled }: Props) {
  return (
    <div className="border rounded-xl overflow-hidden divide-y">
      {packages.map((pkg) => {
        const isSelected = selectedPackageId === pkg.id;

        return (
          <div
            key={pkg.id}
            className={cn(
              "p-4 transition-all",
              isSelected && "bg-primary/5 border-l-2 border-l-primary"
            )}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{pkg.name}</span>
                {pkg.is_recommended && (
                  <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 text-xs">
                    Recommended
                  </Badge>
                )}
              </div>
              <div className="text-right">
                <span className="font-semibold text-sm">₹{pkg.price.toLocaleString()}</span>
                {pkg.original_price > pkg.price && (
                  <span className="text-sm text-muted-foreground line-through ml-2">
                    ₹{pkg.original_price.toLocaleString()}</span>
                )}
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground mb-3">{pkg.description}</p>

            {/* Metadata + Book button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {pkg.duration_hours} hrs
                </span>
                <span className="flex items-center gap-1">
                  <FlaskConical className="h-4 w-4" />
                  {pkg.tests_count} tests
                </span>
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {pkg.age_range} age
                </span>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant={isSelected ? "default" : "secondary"}
                  onClick={() => !disabled && onSelect(pkg.id)}
                  disabled={disabled}
                  className="rounded-full text-sm"
                >
                  Book
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-full w-8 h-8 p-0"
                  disabled={disabled}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
