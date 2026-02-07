import { Badge } from '@/Components/ui/badge';
import { HStack, VStack } from '@/Components/ui/stack';
import { cn } from '@/Lib/utils';
import { Clock, FlaskConical, User } from '@/Lib/icons';
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
        'px-6 py-4 transition-all cursor-pointer hover:bg-muted/50',
        isSelected && 'bg-primary/5',
        className
      )}
      onClick={onSelect}
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

        {/* Metadata + Select indicator */}
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

          <span className={cn(
            'px-4 py-2 rounded-full text-label transition-all',
            isSelected ? 'bg-foreground text-inverse' : 'bg-muted text-foreground'
          )}>
            {isSelected ? 'Selected' : 'Select'}
          </span>
        </HStack>
      </VStack>
    </div>
  );
}
