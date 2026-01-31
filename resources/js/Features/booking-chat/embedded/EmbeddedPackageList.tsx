import * as React from 'react';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { cn } from '@/Lib/utils';
import { Clock, FlaskConical, User, ChevronRight, TestTube, Check, Square, CheckSquare } from 'lucide-react';

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

interface IndividualTest {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  turnaround_hours: number | null;
  requires_fasting: boolean;
  fasting_hours: number | null;
}

interface Props {
  packages: Package[];
  individualTests?: IndividualTest[];
  selectedPackageId: string | null;
  selectedTestIds?: string[];
  onSelect: (packageId: string) => void;
  onSelectTests?: (testIds: string[]) => void;
  disabled: boolean;
}

export function EmbeddedPackageList({
  packages,
  individualTests = [],
  selectedPackageId,
  selectedTestIds = [],
  onSelect,
  onSelectTests,
  disabled,
}: Props) {
  const hasTests = individualTests.length > 0;
  const hasPackages = packages.length > 0;
  const showTabs = hasTests && hasPackages;

  const [activeTab, setActiveTab] = React.useState<'tests' | 'packages'>(
    hasTests ? 'tests' : 'packages',
  );
  const [checkedIds, setCheckedIds] = React.useState<Set<string>>(
    () => new Set(selectedTestIds.map(String)),
  );

  const alreadySubmitted = selectedTestIds.length > 0 || selectedPackageId != null;

  const toggleTest = (id: string) => {
    if (disabled || alreadySubmitted) return;
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const totalPrice = individualTests
    .filter((t) => checkedIds.has(String(t.id)))
    .reduce((sum, t) => sum + t.price, 0);

  const handleConfirmTests = () => {
    if (disabled || checkedIds.size === 0) return;
    onSelectTests?.(Array.from(checkedIds));
  };

  return (
    <Card className="overflow-hidden">
      {/* Tab Switcher */}
      {showTabs && (
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('tests')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors',
              activeTab === 'tests'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
            )}
          >
            <TestTube className="h-4 w-4" />
            Pick Tests
            {hasTests && (
              <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">
                {individualTests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('packages')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors',
              activeTab === 'packages'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
            )}
          >
            <FlaskConical className="h-4 w-4" />
            Health Packages
            {hasPackages && (
              <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">
                {packages.length}
              </span>
            )}
          </button>
        </div>
      )}

      <CardContent className="p-0">
        {/* Individual Tests Tab */}
        {(activeTab === 'tests' || !showTabs) && hasTests && (
          <div>
            {!showTabs && (
              <div className="px-4 py-2.5 border-b bg-muted/30">
                <div className="flex items-center gap-2">
                  <TestTube className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Select one or more tests
                  </span>
                </div>
              </div>
            )}

            <div className="divide-y">
              {individualTests.map((test) => {
                const idStr = String(test.id);
                const isChecked = checkedIds.has(idStr);
                const isLocked = alreadySubmitted;

                return (
                  <button
                    key={`test-${test.id}`}
                    onClick={() => toggleTest(idStr)}
                    disabled={disabled || isLocked}
                    className={cn(
                      'w-full text-left p-4 transition-colors',
                      !isLocked && 'hover:bg-accent/50 cursor-pointer',
                      isChecked && 'bg-primary/5',
                      (disabled || isLocked) && !isChecked && 'opacity-60',
                    )}
                  >
                    <div className="flex gap-3">
                      {/* Checkbox */}
                      <div className="flex-shrink-0 mt-0.5">
                        {isChecked ? (
                          <CheckSquare className="h-5 w-5 text-primary" />
                        ) : (
                          <Square className="h-5 w-5 text-muted-foreground/50" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={cn('text-sm font-medium', isChecked && 'text-primary')}>
                              {test.name}
                            </span>
                            {test.requires_fasting && (
                              <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-100 text-[10px] px-1.5 py-0">
                                Fasting {test.fasting_hours}h
                              </Badge>
                            )}
                          </div>
                          <span className="text-sm font-semibold whitespace-nowrap">
                            ₹{test.price.toLocaleString()}
                          </span>
                        </div>

                        <p className="text-xs text-muted-foreground mb-1.5">{test.description}</p>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {test.turnaround_hours && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {test.turnaround_hours}h results
                            </span>
                          )}
                          {test.category && (
                            <span className="flex items-center gap-1">
                              <FlaskConical className="h-3 w-3" />
                              {test.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Confirm button */}
            {!alreadySubmitted && (
              <div className="p-3 border-t bg-muted/20">
                <Button
                  onClick={handleConfirmTests}
                  disabled={disabled || checkedIds.size === 0}
                  className="w-full"
                  size="sm"
                >
                  {checkedIds.size === 0
                    ? 'Select tests to continue'
                    : `Continue with ${checkedIds.size} test${checkedIds.size > 1 ? 's' : ''} — ₹${totalPrice.toLocaleString()}`}
                </Button>
              </div>
            )}

            {alreadySubmitted && selectedTestIds.length > 0 && (
              <div className="px-4 py-2.5 border-t bg-primary/5">
                <div className="flex items-center gap-2 text-sm text-primary">
                  <Check className="h-4 w-4" />
                  <span className="font-medium">
                    {selectedTestIds.length} test{selectedTestIds.length > 1 ? 's' : ''} selected
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Health Packages Tab */}
        {(activeTab === 'packages' || !showTabs) && hasPackages && (
          <div className="divide-y">
            {!showTabs && !hasTests && null}
            {packages.map((pkg) => {
              const isSelected = selectedPackageId != null && String(selectedPackageId) === String(pkg.id);

              return (
                <div
                  key={pkg.id}
                  className={cn(
                    'p-4 transition-colors hover:bg-accent',
                    isSelected && 'bg-accent border-l-4 border-l-primary',
                  )}
                >
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
                          ₹{pkg.original_price.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3">{pkg.description}</p>

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
                        variant={isSelected ? 'default' : 'secondary'}
                        onClick={() => !disabled && onSelect(pkg.id)}
                        disabled={disabled || alreadySubmitted}
                      >
                        Book
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" disabled={disabled}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
