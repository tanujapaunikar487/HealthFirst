import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
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
    <Card>
      <CardContent className="p-0 divide-y">
        {packages.map((pkg) => {
          const isSelected = selectedPackageId === pkg.id;

          return (
            <div
              key={pkg.id}
              className={cn(
                "p-4 transition-colors hover:bg-accent",
                isSelected && "bg-accent border-l-4 border-l-primary"
              )}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium leading-none">{pkg.name}</span>
                  {pkg.is_recommended && (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                      Recommended
                    </Badge>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium">₹{pkg.price.toLocaleString()}</span>
                  {pkg.original_price > pkg.price && (
                    <span className="text-sm text-muted-foreground line-through ml-2">
                      ₹{pkg.original_price.toLocaleString()}</span>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground mb-3">{pkg.description}</p>

              {/* Metadata + Book button */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {pkg.duration_hours} hrs
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FlaskConical className="h-4 w-4" />
                    {pkg.tests_count} tests
                  </span>
                  <span className="flex items-center gap-1.5">
                    <User className="h-4 w-4" />
                    {pkg.age_range} age
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={isSelected ? "default" : "secondary"}
                    onClick={() => !disabled && onSelect(pkg.id)}
                    disabled={disabled}
                  >
                    Book
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    disabled={disabled}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
