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

interface PackageCardProps {
  package: Package;
  isSelected: boolean;
  onSelect: () => void;
  className?: string;
}

export function PackageCard({ package: pkg, isSelected, onSelect, className }: PackageCardProps) {
  return (
    <div
      className={cn(
        'p-4 transition-all bg-white',
        isSelected && 'bg-primary/5 ring-2 ring-primary ring-inset',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-medium">{pkg.name}</span>
          {pkg.is_recommended && (
            <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 text-xs">
              Recommended
            </Badge>
          )}
        </div>
        <div className="text-right">
          <span className="font-semibold">₹{pkg.price.toLocaleString()}</span>
          {pkg.original_price > pkg.price && (
            <span className="text-sm text-muted-foreground line-through ml-2">
              ₹{pkg.original_price.toLocaleString()}
            </span>
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
            onClick={onSelect}
            className={cn(
              'rounded-full h-8',
              isSelected ? 'bg-foreground text-background hover:bg-foreground' : 'bg-foreground'
            )}
          >
            Book
          </Button>
          <Button size="sm" variant="ghost" className="w-8 h-8 p-0 rounded-full">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
