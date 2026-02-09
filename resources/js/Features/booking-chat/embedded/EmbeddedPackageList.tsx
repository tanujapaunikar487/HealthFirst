import * as React from 'react';
import { Alert } from '@/Components/ui/alert';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Checkbox } from '@/Components/ui/checkbox';
import { cn } from '@/Lib/utils';
import { FlaskConical, ChevronRight, ChevronDown, TestTube, CheckCircle2, Calendar, Clock, User, AlertCircle } from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';

interface TestGroup {
  name: string;
  tests_included: string[];
}

interface PreparationInstruction {
  icon: 'fasting' | 'water' | 'alcohol' | 'medication';
  text: string;
}

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
  // Enhanced metadata for expanded view
  collection_time?: string;
  report_turnaround?: string;
  test_groups?: TestGroup[];
  preparation_instructions?: PreparationInstruction[];
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
  sub_tests?: string[];
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
  const [expandedTestGroupId, setExpandedTestGroupId] = React.useState<string | null>(null);

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
    <div>
      {/* Tab Switcher */}
      {showTabs && (
        <div className="flex items-center gap-1 mb-4">
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

      <Card className="overflow-hidden">
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

            <div className="divide-y overflow-y-auto max-h-scroll-list">
              {sortedTests.map((test) => {
                const idStr = String(test.id);
                const isChecked = checkedIds.has(idStr);
                const isLocked = alreadySubmitted;
                const isExpanded = expandedTestId === idStr;

                return (
                  <div key={`test-${test.id}`} className="w-full">
                    <Button
                      variant="ghost"
                      onClick={() => toggleTest(idStr)}
                      disabled={disabled || isLocked}
                      className={cn(
                        'w-full h-auto rounded-none justify-start px-6 py-4 hover:bg-muted/50',
                        'flex items-start gap-3 text-left',
                        (disabled || isLocked) && 'disabled:opacity-60',
                      )}
                    >
                      {/* Checkbox */}
                      <div className="flex-shrink-0 mt-0.5">
                        <Checkbox
                          checked={isChecked}
                          disabled={disabled || isLocked}
                          className="pointer-events-none"
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 overflow-hidden text-left">
                        {/* Title */}
                        <div className="mb-1">
                          <span className={cn('text-label', isChecked && 'text-primary')}>
                            {test.name}
                          </span>
                        </div>

                        {/* Description */}
                        <p className="text-body text-muted-foreground mb-1.5 break-words">{test.description}</p>

                        {/* Metadata */}
                        <div className="flex items-center gap-2 flex-wrap w-full">
                          {test.requires_fasting && test.fasting_hours && (
                            <span className="text-body text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                              Fasting {test.fasting_hours}h
                            </span>
                          )}
                          {test.turnaround_hours && (
                            <span className="text-body text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                              Report in {test.turnaround_hours}h
                            </span>
                          )}
                          {test.category && (
                            <span className="text-body text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                              {test.category}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Price */}
                      <div className="flex-shrink-0 ml-4">
                        <span className="text-card-title">₹{test.price.toLocaleString()}</span>
                      </div>

                      {/* Expand button */}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedTestId(isExpanded ? null : idStr);
                        }}
                        className="flex-shrink-0 h-8 w-8 p-0 rounded-full ml-2"
                      >
                        <Icon icon={isExpanded ? ChevronDown : ChevronRight} size={16} />
                      </Button>
                    </Button>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="w-full px-6 py-4 bg-muted/20 space-y-4 overflow-hidden border-t">
                        {/* Sub-tests */}
                        {test.sub_tests && test.sub_tests.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <Icon icon={TestTube} size={16} />
                              <span className="text-card-title text-foreground">
                                Includes ({test.sub_tests.length} tests)
                              </span>
                            </div>
                            <div className="space-y-1.5">
                              {test.sub_tests.map((subTest, i) => (
                                <div key={i} className="flex items-center gap-2 text-body">
                                  <Icon icon={CheckCircle2} size={20} className="text-success-subtle-foreground flex-shrink-0" />
                                  <span>{subTest}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Preparation info */}
                        {test.requires_fasting && test.fasting_hours && (
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <Icon icon={User} size={16} />
                              <span className="text-card-title text-foreground">
                                Preparation Required
                              </span>
                            </div>
                            <Alert variant="warning" hideIcon>
                              <p>Fasting for {test.fasting_hours} hours before the test.</p>
                              <p>Water is allowed during fasting period.</p>
                            </Alert>
                          </div>
                        )}
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
                  variant="accent"
                  size="md"
                  onClick={handleConfirmTests}
                  disabled={disabled || checkedIds.size === 0}
                >
                  {checkedIds.size === 0
                    ? 'Select tests to continue'
                    : `Continue with ${checkedIds.size} test${checkedIds.size > 1 ? 's' : ''} — ₹${totalPrice.toLocaleString()}`}
                </Button>
              </div>
            )}

            {!isGuided && alreadySubmitted && selectedTestIds.length > 0 && (
              <div className="px-4 py-2.5 border-t bg-primary/10">
                <div className="flex items-center gap-2 text-body text-primary">
                  <Icon icon={CheckCircle2} size={20} />
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
          <div className="divide-y overflow-y-auto max-h-scroll-list">
            {!showTabs && !hasTests && null}
            {packages.map((pkg) => {
              const isExpanded = expandedPkgId === String(pkg.id);

              return (
                <div
                  key={pkg.id}
                  className="w-full transition-colors"
                >
                  <Button
                    variant="ghost"
                    onClick={() => !disabled && !alreadySubmitted && onSelect(pkg.id)}
                    disabled={disabled || alreadySubmitted}
                    className={cn(
                      'w-full h-auto rounded-none justify-start px-6 py-4 hover:bg-muted/50',
                      'flex items-start gap-3 text-left',
                      (disabled || alreadySubmitted) && 'disabled:opacity-60',
                    )}
                  >
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon icon={FlaskConical} size={20} className="text-blue-800" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 overflow-hidden text-left">
                      {/* Title and badges */}
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-label">
                          {pkg.name}
                        </span>
                        {pkg.is_recommended && (
                          <Badge variant="warning">
                            Recommended
                          </Badge>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-body text-muted-foreground mb-1.5 break-words">{pkg.description}</p>

                      {/* Metadata */}
                      <div className="flex items-center gap-2 flex-wrap w-full">
                        {pkg.requires_fasting && pkg.fasting_hours && (
                          <span className="text-body text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            Fasting {pkg.fasting_hours}h
                          </span>
                        )}
                        <span className="text-body text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          {pkg.duration_hours} hrs
                        </span>
                        <span className="text-body text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          {pkg.tests_count} tests
                        </span>
                        <span className="text-body text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          {pkg.age_range} age
                        </span>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="flex-shrink-0 ml-4 text-right">
                      <div className="text-card-title">₹{pkg.price.toLocaleString()}</div>
                      {pkg.original_price > pkg.price && (
                        <div className="text-body text-muted-foreground line-through mt-0.5">
                          ₹{pkg.original_price.toLocaleString()}
                        </div>
                      )}
                    </div>

                    {/* Chevron button */}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedPkgId(isExpanded ? null : String(pkg.id));
                      }}
                      className="flex-shrink-0 h-8 w-8 p-0 rounded-full ml-2"
                    >
                      <Icon icon={isExpanded ? ChevronDown : ChevronRight} size={16} />
                    </Button>
                  </Button>

                  {/* Expanded detail section */}
                  {isExpanded && (
                    <div className="w-full px-6 py-4 bg-muted/20 space-y-5 overflow-hidden border-t">
                      {/* Metadata section */}
                      {(pkg.collection_time || pkg.report_turnaround || pkg.requires_fasting || pkg.duration_hours) && (
                        <div className="bg-warning/5 rounded-xl px-6 py-4 space-y-3">
                          {pkg.collection_time && (
                            <div className="flex items-center gap-3 text-body">
                              <Icon icon={Calendar} size={20} />
                              <span>Sample collection at <span className="text-warning">{pkg.collection_time}</span></span>
                            </div>
                          )}
                          {pkg.report_turnaround && (
                            <div className="flex items-center gap-3 text-body">
                              <Icon icon={Clock} size={20} />
                              <span>Earliest report available within <span className="text-warning">{pkg.report_turnaround}</span></span>
                            </div>
                          )}
                          {pkg.requires_fasting && pkg.fasting_hours && (
                            <div className="flex items-center gap-3 text-body">
                              <Icon icon={AlertCircle} size={20} />
                              <span>{pkg.fasting_hours} hrs fasting is required</span>
                            </div>
                          )}
                          {pkg.duration_hours && (
                            <div className="flex items-center gap-3 text-body">
                              <Icon icon={Clock} size={20} />
                              <span>Duration {pkg.duration_hours} hrs</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Tests Included section with expandable groups */}
                      {(pkg.test_groups || pkg.included_test_names) && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Icon icon={FlaskConical} size={16} />
                            <span className="text-card-title text-foreground">
                              Tests Included ({pkg.tests_count})
                            </span>
                          </div>

                          <div className="space-y-3">
                            {pkg.test_groups ? (
                              // Enhanced view with expandable test groups
                              pkg.test_groups.map((group, index) => {
                                const groupId = `${pkg.id}-group-${index}`;
                                const isGroupExpanded = expandedTestGroupId === groupId;

                                return (
                                  <div key={groupId}>
                                    <button
                                      onClick={() => setExpandedTestGroupId(isGroupExpanded ? null : groupId)}
                                      className="w-full flex items-center gap-2 text-left text-body hover:text-foreground transition-colors"
                                    >
                                      <Icon icon={CheckCircle2} size={20} className="text-success-subtle-foreground flex-shrink-0" />
                                      <span className="flex-1">{group.name}</span>
                                      {group.tests_included.length > 0 && (
                                        <>
                                          <span className="text-caption text-muted-foreground">{group.tests_included.length} tests included</span>
                                          <Icon
                                            icon={isGroupExpanded ? ChevronDown : ChevronRight}
                                            size={16}
                                            className="text-muted-foreground flex-shrink-0"
                                          />
                                        </>
                                      )}
                                    </button>

                                    {/* Expanded test list */}
                                    {isGroupExpanded && group.tests_included.length > 0 && (
                                      <div className="mt-2 ml-6 space-y-1">
                                        {group.tests_included.map((testName, i) => (
                                          <div key={i} className="text-body text-muted-foreground">
                                            • {testName}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            ) : (
                              // Simple list fallback
                              pkg.included_test_names?.map((testName, i) => (
                                <div key={i} className="flex items-center gap-2 text-body">
                                  <Icon icon={CheckCircle2} size={20} className="text-success-subtle-foreground flex-shrink-0" />
                                  <span>{testName}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}

                      {/* Preparation Instructions section */}
                      {(pkg.preparation_instructions || pkg.preparation_notes) && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Icon icon={User} size={16} />
                            <span className="text-card-title text-foreground">
                              Preparation Instructions
                            </span>
                          </div>

                          {pkg.preparation_instructions ? (
                            // Structured instructions
                            <div className="space-y-3">
                              {pkg.preparation_instructions.map((instruction, i) => (
                                <div key={i} className="flex items-center gap-3 text-body">
                                  <Icon
                                    icon={
                                      instruction.icon === 'fasting' ? AlertCircle :
                                      instruction.icon === 'water' ? AlertCircle :
                                      instruction.icon === 'alcohol' ? AlertCircle :
                                      AlertCircle
                                    }
                                    size={20}
                                  />
                                  <span>{instruction.text}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            // Fallback to preparation notes
                            <Alert variant="warning" hideIcon>
                              {pkg.preparation_notes!.split('.').filter(Boolean).map((note, i) => (
                                <p key={i}>{note.trim()}.</p>
                              ))}
                            </Alert>
                          )}
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
    </div>
  );
}
