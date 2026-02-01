import * as React from 'react';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { cn } from '@/Lib/utils';
import { Clock, FlaskConical, User, ChevronRight, ChevronDown, TestTube, Check, Square, CheckSquare, Sparkles, ClipboardList } from 'lucide-react';

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
              {sortedTests.map((test) => {
                const idStr = String(test.id);
                const isChecked = checkedIds.has(idStr);
                const isLocked = alreadySubmitted;
                const isExpanded = expandedTestId === idStr;

                return (
                  <div key={`test-${test.id}`}>
                    <div className="flex">
                      <button
                        onClick={() => toggleTest(idStr)}
                        disabled={disabled || isLocked}
                        className={cn(
                          'flex-1 text-left p-4 transition-colors',
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

                      {/* Expand button for tests with fasting */}
                      {test.requires_fasting && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedTestId(isExpanded ? null : idStr);
                          }}
                          className={cn(
                            'flex-shrink-0 px-3 flex items-center transition-colors',
                            'hover:bg-accent/50 text-muted-foreground hover:text-foreground',
                            isChecked && 'bg-primary/5',
                          )}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Expanded fasting detail */}
                    {isExpanded && test.requires_fasting && (
                      <div className={cn(
                        'px-4 pb-4 pt-0 ml-12 border-t-0',
                        isChecked && 'bg-primary/5',
                      )}>
                        <div className="bg-orange-50 rounded-lg p-3 text-xs space-y-1">
                          <p className="font-medium text-orange-900">Preparation Required</p>
                          <p className="text-orange-800">Fasting for {test.fasting_hours} hours before the test.</p>
                          <p className="text-orange-800">Water is allowed during fasting period.</p>
                        </div>
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
              const isExpanded = expandedPkgId === String(pkg.id);
              const savings = pkg.original_price > pkg.price ? pkg.original_price - pkg.price : 0;
              const hasDetails = (pkg.included_test_names && pkg.included_test_names.length > 0) || pkg.preparation_notes;

              return (
                <div
                  key={pkg.id}
                  className={cn(
                    'transition-colors',
                    isSelected && 'border-l-4 border-l-primary',
                  )}
                >
                  <div className={cn(
                    'p-4 hover:bg-accent',
                    isSelected && 'bg-accent',
                  )}>
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium leading-none">{pkg.name}</span>
                        {pkg.is_recommended && (
                          <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                            Recommended
                          </Badge>
                        )}
                        {pkg.requires_fasting && (
                          <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-100 text-[10px] px-1.5 py-0">
                            Fasting {pkg.fasting_hours}h
                          </Badge>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
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
                          {isSelected ? 'Selected' : 'Book'}
                        </Button>
                        {hasDetails && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => setExpandedPkgId(isExpanded ? null : String(pkg.id))}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded detail section */}
                  {isExpanded && (
                    <div className="px-4 pb-4 bg-muted/20 space-y-3">
                      {/* Savings highlight */}
                      {savings > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <Sparkles className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-green-700">
                            You save ₹{savings.toLocaleString()}
                          </span>
                        </div>
                      )}

                      {/* Included tests */}
                      {pkg.included_test_names && pkg.included_test_names.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1.5 mb-2">
                            <TestTube className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                              Included Tests
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                            {pkg.included_test_names.map((testName, i) => (
                              <div key={i} className="flex items-center gap-1.5 text-xs text-foreground">
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
                            <ClipboardList className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                              Preparation
                            </span>
                          </div>
                          <div className="bg-orange-50 rounded-lg p-3 text-xs space-y-1">
                            {pkg.preparation_notes.split('.').filter(Boolean).map((note, i) => (
                              <p key={i} className="text-orange-800">{note.trim()}.</p>
                            ))}
                          </div>
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
