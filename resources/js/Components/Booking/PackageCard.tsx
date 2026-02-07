import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { HStack, VStack } from '@/Components/ui/stack';
import { cn } from '@/Lib/utils';
import { Clock, FlaskConical, User, ChevronRight } from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';

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
        'px-6 py-4 transition-all bg-card',
        isSelected && 'bg-primary/5 ring-2 ring-primary ring-inset',
        className
      )}
    >
      <VStack gap={3}>
        {/* Header */}
        <HStack className="justify-between">
          <HStack gap={2}>
            <span className="text-label">{pkg.name}</span>
            {pkg.is_recommended && (
              <Badge variant="warning">
                Recommended
              </Badge>
            )}
          </HStack>
          <div className="text-right">
            <span className="text-card-title">₹{pkg.price.toLocaleString()}</span>
            {pkg.original_price > pkg.price && (
              <span className="text-body text-muted-foreground line-through ml-2">
                ₹{pkg.original_price.toLocaleString()}
              </span>
            )}
          </div>
        </HStack>

        {/* Description */}
        <p className="text-body text-muted-foreground">{pkg.description}</p>

        {/* Metadata + Book button */}
        <HStack className="justify-between">
          <HStack gap={4} className="text-body text-muted-foreground">
            <HStack gap={1}>
              <Icon icon={Clock} />
              {pkg.duration_hours} hrs
            </HStack>
            <HStack gap={1}>
              <Icon icon={FlaskConical} />
              {pkg.tests_count} tests
            </HStack>
            <HStack gap={1}>
              <Icon icon={User} />
              {pkg.age_range} age
            </HStack>
          </HStack>

          <HStack gap={1}>
            <Button
              size="sm"
              onClick={onSelect}
              className={cn(
                'rounded-full',
                isSelected ? 'bg-foreground text-background hover:bg-foreground' : 'bg-foreground'
              )}
            >
              Select
            </Button>
            <Button size="sm" variant="ghost" iconOnly>
              <Icon icon={ChevronRight} />
            </Button>
          </HStack>
        </HStack>
      </VStack>
    </div>
  );
}
