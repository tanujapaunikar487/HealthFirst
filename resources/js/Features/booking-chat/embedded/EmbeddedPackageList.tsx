import * as React from 'react';
import { Alert } from '@/Components/ui/alert';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { cn } from '@/Lib/utils';
import { Clock, FlaskConical, ChevronRight, ChevronDown, TestTube, Check, Square, CheckSquare, Sparkles, ClipboardList } from '@/Lib/icons';
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
  preparation_notes?: string | null;
  requires_fasting?: boolean;
  fasting_hours?: number | null;
  included_test_names?: string[];
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
  onCheckedChange?: (checkedIds: string[], totalPrice: number) => void;
  disabled: boolean;
  mode?: 'chat' | 'guided';
}

export function EmbeddedPackageList({
  packages,
  individualTests = [],
  selectedPackageId,
  selectedTestIds = [],
  onSelect,
  onSelectTests,
  onCheckedChange,
  disabled,
  mode = 'chat',
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
  const [expandedPkgId, setExpandedPkgId] = React.useState<string | null>(null);
  const [expandedTestId, setExpandedTestId] = React.useState<string | null>(null);

  const isGuided = mode === 'guided';
  const alreadySubmitted = isGuided ? false : (selectedTestIds.length > 0 || selectedPackageId != null);

  const toggleTest = (id: string) => {
    if (disabled || alreadySubmitted) return;
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      if (isGuided && onCheckedChange) {
        const ids = Array.from(next);
        const price = individualTests
          .filter((t) => next.has(String(t.id)))
          .reduce((sum, t) => sum + t.price, 0);
        onCheckedChange(ids, price);
      }
      return next;
    });
  };

  const totalPrice = individualTests
    .filter((t) => checkedIds.has(String(t.id)))
    .reduce((sum, t) => sum + t.price, 0);

  // In guided mode, float checked tests to the top
  const sortedTests = isGuided
    ? [...individualTests].sort((a, b) => {
        const aChecked = checkedIds.has(String(a.id)) ? 1 : 0;
        const bChecked = checkedIds.has(String(b.id)) ? 1 : 0;
        return bChecked - aChecked;
      })
    : individualTests;

  const handleConfirmTests = () => {
    if (disabled || checkedIds.size === 0) return;
    onSelectTests?.(Array.from(checkedIds));
  };

  return (
    <Card className="overflow-hidden">
      {/* Tab Switcher */}
      {showTabs && (
        <div className="flex items-center gap-1 px-4 py-3">
          <button
            onClick={() => setActiveTab('tests')}
            className={cn(
              'flex items-center justify-center gap-2 rounded-full px-4 py-2 text-label transition-all',
              activeTab === 'tests'
                ? 'bg-background text-foreground shadow-[0_1px_3px_0_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.04)]'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon icon={TestTube} />
            Pick Tests
            {hasTests && (
              <Badge variant="neutral">{individualTests.length}</Badge>
            )}
          </button>
          <button
            onClick={() => setActiveTab('packages')}
            className={cn(
              'flex items-center justify-center gap-2 rounded-full px-4 py-2 text-label transition-all',
              activeTab === 'packages'
                ? 'bg-background text-foreground shadow-[0_1px_3px_0_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.04)]'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon icon={FlaskConical} />
            Health Packages
            {hasPackages && (
              <Badge variant="neutral">{packages.length}</Badge>
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
                  <Icon icon={TestTube} className="text-primary" />
                  <span className="text-card-title text-muted-foreground uppercase tracking-wide">
                    Select one or more tests
                  </span>
                </div>
              </div>
            )}

            <div className="divide-y">
              {sortedTests.map((test) => {
                const idStr = String(test.id);
                const isChecked = checkedIds.has(idStr);
                const isLocked = alreadySubmitted;
                const isExpanded = expandedTestId === idStr;

                return (
                  <div key={`test-${test.id}`}>
                    <div className="flex">
                      <Button
                        variant="ghost"
                        onClick={() => toggleTest(idStr)}
                        disabled={disabled || isLocked}
                        className={cn(
                          'w-full h-auto rounded-none justify-start px-6 py-4 text-body hover:bg-muted/50',
                          isChecked && 'bg-primary/5',
                          (disabled || isLocked) && !isChecked && 'disabled:opacity-60',
                        )}
                      >
                        <div className="flex gap-3">
                          {/* Checkbox */}
                          <div className="flex-shrink-0 mt-0.5">
                            {isChecked ? (
                              <Icon icon={CheckSquare} size={20} className="text-primary" />
                            ) : (
                              <Icon icon={Square} size={20} className="text-foreground/50" />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3 mb-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={cn('text-label', isChecked && 'text-primary')}>
                                  {test.name}
                                </span>
                                {test.requires_fasting && (
                                  <Badge variant="warning">
                                    Fasting {test.fasting_hours}h
                                  </Badge>
                                )}
                              </div>
                              <span className="text-card-title whitespace-nowrap">
                                ₹{test.price.toLocaleString()}
                              </span>
                            </div>

                            <p className="text-body text-muted-foreground mb-1.5">{test.description}</p>

                            <div className="flex items-center gap-2 flex-wrap">
                              {test.turnaround_hours && (
                                <span className="text-body text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                  Report in {test.turnaround_hours}h
                                </span>
                              )}
                              {test.requires_fasting && test.fasting_hours && (
                                <Badge variant="warning">
                                  {test.fasting_hours}h fasting
                                </Badge>
                              )}
                              {test.category && (
                                <span className="text-body text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                  {test.category}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Button>

                      {/* Expand button for tests with fasting */}
                      {test.requires_fasting && (
                        <Button
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedTestId(isExpanded ? null : idStr);
                          }}
                          className={cn(
                            'flex-shrink-0 h-auto px-3 rounded-none',
                            'text-muted-foreground hover:text-foreground',
                            isChecked && 'bg-primary/5',
                          )}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>

                    {/* Expanded fasting detail */}
                    {isExpanded && test.requires_fasting && (
                      <div className={cn(
                        'px-4 pb-4 pt-0 ml-12 border-t-0',
                        isChecked && 'bg-primary/5',
                      )}>
                        <Alert variant="warning" hideIcon title="Preparation Required">
                          <p>Fasting for {test.fasting_hours} hours before the test.</p>
                          <p>Water is allowed during fasting period.</p>
                        </Alert>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Confirm button (chat mode only) */}
            {!isGuided && !alreadySubmitted && (
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

            {!isGuided && alreadySubmitted && selectedTestIds.length > 0 && (
              <div className="px-4 py-2.5 border-t bg-primary/5">
                <div className="flex items-center gap-2 text-body text-primary">
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
              const isExpanded = expandedPkgId === String(pkg.id);
              const savings = pkg.original_price > pkg.price ? pkg.original_price - pkg.price : 0;
              const hasDetails = (pkg.included_test_names && pkg.included_test_names.length > 0) || pkg.preparation_notes;

              return (
                <div
                  key={pkg.id}
                  className="transition-colors"
                >
                  <div className="flex">
                    <Button
                      variant="ghost"
                      onClick={() => !disabled && !alreadySubmitted && onSelect(pkg.id)}
                      disabled={disabled || alreadySubmitted}
                      className={cn(
                        'w-full h-auto rounded-none justify-start px-6 py-4 text-body hover:bg-muted/50',
                        isSelected && 'bg-primary/5',
                        (disabled || alreadySubmitted) && !isSelected && 'disabled:opacity-60',
                      )}
                    >
                      <div className="flex gap-3">
                        {/* Checkbox */}
                        <div className="flex-shrink-0 mt-0.5">
                          {isSelected ? (
                            <CheckSquare className="h-5 w-5 text-primary" />
                          ) : (
                            <Square className="h-5 w-5 text-foreground/50" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={cn('text-label', isSelected && 'text-primary')}>
                                {pkg.name}
                              </span>
                              {pkg.is_recommended && (
                                <Badge variant="warning">
                                  Recommended
                                </Badge>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <span className="text-card-title">₹{pkg.price.toLocaleString()}</span>
                              {pkg.original_price > pkg.price && (
                                <span className="text-body text-muted-foreground line-through ml-1.5">
                                  ₹{pkg.original_price.toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>

                          <p className="text-body text-muted-foreground mb-1.5">{pkg.description}</p>

                          {/* Info badges */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-body text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                              {pkg.duration_hours} hrs
                            </span>
                            <span className="text-body text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                              {pkg.tests_count} tests
                            </span>
                            {pkg.requires_fasting && pkg.fasting_hours && (
                              <Badge variant="warning">
                                {pkg.fasting_hours}h fasting
                              </Badge>
                            )}
                            <span className="text-body text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                              {pkg.age_range} age
                            </span>
                          </div>
                        </div>
                      </div>
                    </Button>

                    {/* Expand button */}
                    {hasDetails && (
                      <Button
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedPkgId(isExpanded ? null : String(pkg.id));
                        }}
                        className={cn(
                          'flex-shrink-0 h-auto px-3 rounded-none',
                          'text-muted-foreground hover:text-foreground',
                          isSelected && 'bg-primary/5',
                        )}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Expanded detail section */}
                  {isExpanded && (
                    <div className="px-4 pb-4 bg-muted/20 space-y-3">
                      {/* Savings highlight */}
                      {savings > 0 && (
                        <div className="flex items-center gap-2 text-body">
                          <Sparkles className="h-4 w-4 text-success" />
                          <span className="font-medium text-success">
                            You save ₹{savings.toLocaleString()}
                          </span>
                        </div>
                      )}

                      {/* Included tests */}
                      {pkg.included_test_names && pkg.included_test_names.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1.5 mb-2">
                            <TestTube className="h-3.5 w-3.5 text-foreground" />
                            <span className="text-card-title text-muted-foreground uppercase tracking-wide">
                              Included Tests
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                            {pkg.included_test_names.map((testName, i) => (
                              <div key={i} className="flex items-center gap-1.5 text-body text-foreground">
                                <Check className="h-3 w-3 text-primary flex-shrink-0" />
                                <span>{testName}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Preparation notes */}
                      {pkg.preparation_notes && (
                        <div>
                          <div className="flex items-center gap-1.5 mb-2">
                            <ClipboardList className="h-3.5 w-3.5 text-foreground" />
                            <span className="text-card-title text-muted-foreground uppercase tracking-wide">
                              Preparation
                            </span>
                          </div>
                          <Alert variant="warning" hideIcon>
                            {pkg.preparation_notes.split('.').filter(Boolean).map((note, i) => (
                              <p key={i}>{note.trim()}.</p>
                            ))}
                          </Alert>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
