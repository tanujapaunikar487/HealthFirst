import { useState, useRef, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { GuidedBookingLayout } from '@/Layouts/GuidedBookingLayout';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Alert } from '@/Components/ui/alert';
import { EmbeddedPackageList } from '@/Features/booking-chat/embedded/EmbeddedPackageList';
import { Search, Loader2 } from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';

const labSteps = [
  { id: 'patient', label: 'Patient' },
  { id: 'test_search', label: 'Find Tests' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'confirm', label: 'Confirm' },
];

const suggestionChips = [
  'Blood test',
  'Diabetes',
  'Thyroid',
  'Full body checkup',
  'Liver',
  'Kidney',
];

interface SearchResults {
  packages: Array<{
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
  }>;
  individual_tests: Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    price: number;
    turnaround_hours: number | null;
    requires_fasting: boolean;
    fasting_hours: number | null;
  }>;
  query: string;
  isSymptomQuery?: boolean;
}

interface Props {
  savedData?: {
    selectedPackageId?: number;
    selectedPackageName?: string;
    selectedTestIds?: number[];
    selectedTestNames?: string[];
    searchQuery?: string;
  };
}

export default function TestSearchStep({ savedData }: Props) {
  const [searchQuery, setSearchQuery] = useState(savedData?.searchQuery || '');
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedChips, setSelectedChips] = useState<string[]>([]);

  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(
    savedData?.selectedPackageId ? String(savedData.selectedPackageId) : null
  );
  const [selectedPackageName, setSelectedPackageName] = useState<string | null>(
    savedData?.selectedPackageName ?? null
  );
  const [checkedTestIds, setCheckedTestIds] = useState<string[]>(
    savedData?.selectedTestIds?.map(String) || []
  );
  const [checkedTestPrice, setCheckedTestPrice] = useState<number>(0);

  const hasSelection = selectedPackageId !== null || checkedTestIds.length > 0;
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resultsSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchResults && resultsSectionRef.current) {
      setTimeout(() => {
        resultsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [searchResults]);

  const handleSearch = async (query?: string) => {
    const q = (query ?? searchQuery).trim();
    if (q.length < 2) return;

    setSearchQuery(q);
    setIsSearching(true);
    setHasSearched(true);

    // Clear previous selection
    setSelectedPackageId(null);
    setSelectedPackageName(null);
    setCheckedTestIds([]);
    setCheckedTestPrice(0);

    try {
      const csrfToken =
        document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
      const response = await fetch('/booking/lab/search-tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken,
          Accept: 'application/json',
        },
        body: JSON.stringify({ query: q }),
      });
      const data: SearchResults = await response.json();
      setSearchResults(data);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleChipToggle = (chip: string) => {
    setSelectedChips((prev) => {
      const newSelection = prev.includes(chip)
        ? prev.filter((c) => c !== chip)
        : [...prev, chip];

      // Auto-update search query with selected chips
      const query = newSelection.join(', ');
      setSearchQuery(query);

      // Auto-search if chips are selected
      if (newSelection.length > 0) {
        handleSearch(query);
      }

      return newSelection;
    });
  };

  const handlePackageSelect = (pkgId: string) => {
    const pkg = searchResults?.packages.find((p) => String(p.id) === String(pkgId));
    setSelectedPackageId(pkgId);
    setSelectedPackageName(pkg?.name || null);
    setCheckedTestIds([]);
    setCheckedTestPrice(0);
  };

  const handleCheckedChange = (ids: string[], totalPrice: number) => {
    setCheckedTestIds(ids);
    setCheckedTestPrice(totalPrice);
    if (ids.length > 0) {
      setSelectedPackageId(null);
      setSelectedPackageName(null);
    }
  };

  const handleBack = () => {
    router.get('/booking/lab/patient');
  };

  const handleContinue = () => {
    if (!hasSelection) {
      setErrors({ selection: 'Please search and select a test or package' });
      return;
    }

    const testNames = checkedTestIds
      .map((id) => searchResults?.individual_tests.find((t) => String(t.id) === String(id))?.name || '')
      .filter(Boolean);

    router.post('/booking/lab/test-search', {
      searchQuery,
      selectedPackageId: selectedPackageId ? parseInt(selectedPackageId) : null,
      selectedPackageName,
      selectedTestIds: checkedTestIds.map(Number),
      selectedTestNames: testNames,
    });
  };

  const noResults =
    hasSearched &&
    searchResults &&
    searchResults.packages.length === 0 &&
    searchResults.individual_tests.length === 0;

  const getContinueLabel = () => {
    if (checkedTestIds.length > 0) {
      return `Continue with ${checkedTestIds.length} test${checkedTestIds.length > 1 ? 's' : ''} — ₹${checkedTestPrice.toLocaleString()}`;
    }
    if (selectedPackageId && selectedPackageName) {
      return `Continue with ${selectedPackageName}`;
    }
    return 'Continue';
  };

  return (
    <GuidedBookingLayout
      steps={labSteps}
      currentStepId="test_search"
      onBack={handleBack}
      onContinue={handleContinue}
      continueDisabled={!hasSelection}
      continueLabel={getContinueLabel()}
    >
      <div className="space-y-6">
        <section>
          <h2 className="text-step-title mb-2">What test are you looking for?</h2>
          <p className="text-body text-muted-foreground mb-4">
            Search by test name, condition, or symptoms
          </p>

          {/* Search input */}
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Icon icon={Search} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="e.g., CBC, thyroid, diabetes, fatigue, headache..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button
              variant="secondary"
              size="md"
              onClick={() => handleSearch()}
              disabled={isSearching || searchQuery.trim().length < 2}
            >
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
            </Button>
          </div>

          {/* Suggestion chips */}
          <div className="flex flex-wrap gap-2 mb-6">
            {suggestionChips.map((chip) => {
              const isSelected = selectedChips.includes(chip);

              return (
                <Button
                  key={chip}
                  variant="outline"
                  onClick={() => handleChipToggle(chip)}
                  className={
                    isSelected
                      ? "h-auto px-3 py-1.5 rounded-full text-label transition-all bg-primary/10 border-2 border-primary text-primary"
                      : "h-auto px-3 py-1.5 rounded-full text-body transition-all hover:border-primary/50 hover:bg-primary/5"
                  }
                >
                  {chip}
                </Button>
              );
            })}
          </div>

          {/* Search Results */}
          {searchResults && !noResults && (
            <div ref={resultsSectionRef}>
              {/* Symptom query banner */}
              {searchResults.isSymptomQuery && (
                <Alert variant="info" className="mb-3">
                  Based on your symptoms, here are relevant tests. Select the ones your doctor has advised, or pick a health package for a comprehensive check.
                </Alert>
              )}
              <EmbeddedPackageList
                packages={searchResults.packages}
                individualTests={searchResults.individual_tests}
                selectedPackageId={selectedPackageId}
                selectedTestIds={checkedTestIds}
                onSelect={handlePackageSelect}
                onCheckedChange={handleCheckedChange}
                disabled={false}
                mode="guided"
              />
            </div>
          )}

          {/* No results */}
          {noResults && (
            <Card className="p-6 text-center space-y-4">
              <p className="text-muted-foreground">
                No tests or packages found for &ldquo;{searchQuery}&rdquo;.
              </p>
              <p className="text-body text-muted-foreground">
                Try searching by test name or condition:
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {suggestionChips.map((chip) => {
                  const isSelected = selectedChips.includes(chip);

                  return (
                    <button
                      key={chip}
                      onClick={() => handleChipToggle(chip)}
                      className={
                        isSelected
                          ? "px-3 py-1.5 rounded-full border-2 border-primary bg-primary/10 text-primary transition-all"
                          : "px-3 py-1.5 rounded-full border text-body hover:border-primary/50 hover:bg-primary/5 transition-all"
                      }
                    >
                      {chip}
                    </button>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Loading state */}
          {isSearching && (
            <div className="flex items-center justify-center py-8">
              <Icon icon={Loader2} className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-body text-muted-foreground">Searching...</span>
            </div>
          )}

          {errors.selection && (
            <p className="text-body text-destructive mt-2">{errors.selection}</p>
          )}
        </section>
      </div>
    </GuidedBookingLayout>
  );
}
