import { useState, useEffect, useRef, useCallback } from 'react';
import { router } from '@inertiajs/react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/Components/ui/dialog';
import {
  Search, X, Loader2, AlertTriangle,
  Stethoscope, FileText, Receipt, FlaskConical,
  Clock, ArrowRight, Calendar, ClipboardList, CreditCard,
} from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';

// --- Types ---

interface DoctorResult {
  id: number;
  name: string;
  specialization: string;
  department: string;
  experience_years: number;
  avatar_url: string | null;
}

interface AppointmentResult {
  id: number;
  type: string;
  title: string;
  subtitle: string;
  patient_name: string;
  date_formatted: string;
  time: string;
  status: string;
  consultation_mode: string;
}

interface HealthRecordResult {
  id: number;
  category: string;
  title: string;
  doctor_name: string | null;
  record_date_formatted: string;
  patient_name: string;
}

interface BillResult {
  id: number;
  invoice_number: string;
  title: string;
  patient_name: string;
  date_formatted: string;
  amount: number;
  payment_status: string;
}

interface SearchResults {
  doctors?: DoctorResult[];
  doctors_total?: number;
  appointments?: AppointmentResult[];
  appointments_total?: number;
  health_records?: HealthRecordResult[];
  health_records_total?: number;
  bills?: BillResult[];
  bills_total?: number;
}

type Category = 'all' | 'doctors' | 'appointments' | 'health_records' | 'bills';

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// --- Hooks ---

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// --- Recent Searches ---

const RECENT_SEARCHES_KEY = 'healthcare_recent_searches';
const MAX_RECENT = 5;

function getRecentSearches(): string[] {
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function addRecentSearch(query: string) {
  const recent = getRecentSearches().filter((s) => s !== query);
  recent.unshift(query);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
}

function clearRecentSearches() {
  localStorage.removeItem(RECENT_SEARCHES_KEY);
}

// --- Category Config ---

const categories: { value: Category; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'doctors', label: 'Doctors' },
  { value: 'appointments', label: 'Appointments' },
  { value: 'health_records', label: 'Records' },
  { value: 'bills', label: 'Bills' },
];

const quickLinks = [
  { label: 'View all appointments', href: '/appointments', icon: Calendar },
  { label: 'View health records', href: '/health-records', icon: ClipboardList },
  { label: 'View bills', href: '/billing', icon: CreditCard },
  { label: 'Book appointment', href: '/booking', icon: ArrowRight },
];

// --- Component ---

export default function SearchModal({ open, onOpenChange }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category>('all');
  const [results, setResults] = useState<SearchResults>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const debouncedQuery = useDebounce(query, 300);

  // Load recent searches on open
  useEffect(() => {
    if (open) {
      setRecentSearches(getRecentSearches());
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setCategory('all');
      setResults({});
      setActiveIndex(-1);
      setLoading(false);
      setError(null);
    }
  }, [open]);

  // Fetch logic extracted for retry support
  const performSearch = useCallback(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults({});
      setLoading(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    setActiveIndex(-1);

    const params = new URLSearchParams({ q: debouncedQuery });
    if (category !== 'all') params.set('category', category);

    fetch(`/search?${params}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('Search request failed');
        return res.json();
      })
      .then((data) => {
        setResults(data);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setLoading(false);
          setError('Search unavailable. Please try again.');
        }
      });
  }, [debouncedQuery, category]);

  // Trigger search on debounced query or category change
  useEffect(() => {
    performSearch();
    return () => abortRef.current?.abort();
  }, [performSearch]);

  // Set loading immediately when query changes
  useEffect(() => {
    if (query.length >= 2) setLoading(true);
  }, [query]);

  // Flatten results for keyboard navigation
  const flatResults = useCallback((): { type: string; item: any }[] => {
    const flat: { type: string; item: any }[] = [];
    if (results.doctors?.length) results.doctors.forEach((d) => flat.push({ type: 'doctor', item: d }));
    if (results.appointments?.length) results.appointments.forEach((a) => flat.push({ type: 'appointment', item: a }));
    if (results.health_records?.length) results.health_records.forEach((r) => flat.push({ type: 'health_record', item: r }));
    if (results.bills?.length) results.bills.forEach((b) => flat.push({ type: 'bill', item: b }));
    return flat;
  }, [results]);

  const navigateToResult = (type: string, item: any) => {
    addRecentSearch(query);
    onOpenChange(false);
    switch (type) {
      case 'doctor':
        router.visit(`/booking`);
        break;
      case 'appointment':
        router.visit(`/appointments/${item.id}`);
        break;
      case 'health_record':
        router.visit(`/health-records?record=${item.id}`);
        break;
      case 'bill':
        router.visit(`/billing/${item.id}`);
        break;
    }
  };

  const handleViewAll = (href: string) => {
    onOpenChange(false);
    router.visit(href);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const flat = flatResults();
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < flat.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : flat.length - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0 && flat[activeIndex]) {
      e.preventDefault();
      navigateToResult(flat[activeIndex].type, flat[activeIndex].item);
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && resultsRef.current) {
      const items = resultsRef.current.querySelectorAll('[data-result-item]');
      items[activeIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  const hasQuery = query.length >= 2;
  const flat = flatResults();
  const totalResults = flat.length;
  const noResults = hasQuery && !loading && !error && totalResults === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 gap-0 overflow-hidden max-h-[480px] flex flex-col"
        style={{
          width: '714px',
          maxWidth: '90vw',
          borderRadius: '20px',
          border: '1px solid #E5E5E5',
          background: '#FFFFFF',
          boxShadow: '0 5px 10px 0 rgba(0, 0, 0, 0.10), 0 15px 30px 0 rgba(0, 0, 0, 0.10), 0 20px 40px 0 rgba(0, 0, 0, 0.15)',
          backdropFilter: 'blur(10px)',
        }}
        onKeyDown={handleKeyDown}
      >
        <DialogTitle className="sr-only">Search</DialogTitle>

        {/* Search Input */}
        <div className="flex items-center gap-2 px-4" style={{ borderBottom: '1px solid #E5E5E5', height: '56px' }}>
          <Icon icon={Search} className="h-5 w-5 flex-shrink-0 text-muted-foreground" />

          {/* Category Tag (when not 'all') */}
          {category !== 'all' && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-gray-100 text-sm flex-shrink-0">
              <span className="text-gray-500">in:</span>
              <span className="font-medium text-gray-900">
                @{category === 'health_records' ? 'health records' : category === 'appointments' ? 'appointment' : category}
              </span>
            </div>
          )}

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={category !== 'all'
              ? `Search ${category === 'health_records' ? 'health records' : category}...`
              : "search reports, prescriptions.."}
            className="flex-1 bg-transparent text-sm outline-none border-none focus:outline-none focus:ring-0 placeholder:text-muted-foreground"
            style={{ boxShadow: 'none' }}
            autoComplete="off"
          />
          {loading && <Icon icon={Loader2} className="h-4 w-4 animate-spin text-muted-foreground flex-shrink-0" />}
          {/* Single Clear Button - clears query first, then category */}
          {(query || category !== 'all') && !loading && (
            <button
              onClick={() => {
                if (query) {
                  setQuery('');
                } else {
                  setCategory('all');
                }
              }}
              className="flex-shrink-0 text-muted-foreground hover:text-foreground"
            >
              <Icon icon={X} className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Results Area */}
        <div ref={resultsRef} className="flex-1 overflow-y-auto">
          {/* Initial State (no query) - Category Search Buttons */}
          {!hasQuery && category === 'all' && (
            <div className="px-4 py-5">
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    setCategory('appointments');
                    inputRef.current?.focus();
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-gray-200 bg-white text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  <Icon icon={Calendar} className="h-4 w-4 text-gray-500" />
                  Search in <span className="font-semibold">appointment</span>
                </button>
                <button
                  onClick={() => {
                    setCategory('health_records');
                    inputRef.current?.focus();
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-gray-200 bg-white text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  <Icon icon={ClipboardList} className="h-4 w-4 text-gray-500" />
                  Search in <span className="font-semibold">health records</span>
                </button>
                <button
                  onClick={() => {
                    setCategory('bills');
                    inputRef.current?.focus();
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-gray-200 bg-white text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  <Icon icon={FileText} className="h-4 w-4 text-gray-500" />
                  Search in <span className="font-semibold">bills</span>
                </button>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="text-center py-10 px-4">
              <Icon icon={AlertTriangle} className="h-8 w-8 text-amber-500 mx-auto mb-3" />
              <p className="text-sm font-medium" style={{ color: '#00184D' }}>
                {error}
              </p>
              <button
                onClick={performSearch}
                className="mt-3 text-sm font-medium px-4 py-2 rounded-lg transition-colors hover:bg-gray-100"
                style={{ backgroundColor: '#F5F5F5', color: '#00184D' }}
              >
                Retry
              </button>
            </div>
          )}

          {/* No Results */}
          {noResults && (
            <div className="text-center py-12 px-4">
              <Icon icon={Search} className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-medium" style={{ color: '#00184D' }}>
                No results for "{query}"
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Try a different search term or browse by category
              </p>
            </div>
          )}

          {/* Results */}
          {hasQuery && !noResults && !error && !loading && (
            <div className="py-2">
              {/* Doctors Section */}
              {results.doctors && results.doctors.length > 0 && (
                <ResultSection
                  title="Doctors"
                  total={results.doctors_total}
                  shownCount={results.doctors.length}
                  onViewAll={() => handleViewAll('/booking')}
                >
                  {results.doctors.map((doctor) => {
                    const idx = flat.findIndex((f) => f.type === 'doctor' && f.item.id === doctor.id);
                    return (
                      <ResultItem
                        key={`d-${doctor.id}`}
                        active={activeIndex === idx}
                        onClick={() => navigateToResult('doctor', doctor)}
                      >
                        <ResultIcon color="#1E40AF" bg="#BFDBFE">
                          <Icon icon={Stethoscope} className="h-4 w-4" />
                        </ResultIcon>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate" style={{ color: '#00184D' }}>{doctor.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {doctor.specialization} &middot; {doctor.experience_years} years
                          </p>
                        </div>
                      </ResultItem>
                    );
                  })}
                </ResultSection>
              )}

              {/* Appointments Section */}
              {results.appointments && results.appointments.length > 0 && (
                <ResultSection
                  title="Appointments"
                  total={results.appointments_total}
                  shownCount={results.appointments.length}
                  onViewAll={() => handleViewAll('/appointments')}
                >
                  {results.appointments.map((appt) => {
                    const idx = flat.findIndex((f) => f.type === 'appointment' && f.item.id === appt.id);
                    const apptIcon = appt.type === 'lab_test' ? FlaskConical : Stethoscope;
                    return (
                      <ResultItem
                        key={`a-${appt.id}`}
                        active={activeIndex === idx}
                        onClick={() => navigateToResult('appointment', appt)}
                      >
                        <ResultIcon color="#1E40AF" bg="#BFDBFE">
                          <Icon icon={apptIcon} className="h-4 w-4" />
                        </ResultIcon>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate" style={{ color: '#00184D' }}>{appt.title}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {appt.subtitle} &middot; {appt.date_formatted} &middot; {appt.patient_name}
                          </p>
                        </div>
                      </ResultItem>
                    );
                  })}
                </ResultSection>
              )}

              {/* Health Records Section */}
              {results.health_records && results.health_records.length > 0 && (
                <ResultSection
                  title="Health Records"
                  total={results.health_records_total}
                  shownCount={results.health_records.length}
                  onViewAll={() => handleViewAll('/health-records')}
                >
                  {results.health_records.map((record) => {
                    const idx = flat.findIndex((f) => f.type === 'health_record' && f.item.id === record.id);
                    return (
                      <ResultItem
                        key={`r-${record.id}`}
                        active={activeIndex === idx}
                        onClick={() => navigateToResult('health_record', record)}
                      >
                        <ResultIcon color="#1E40AF" bg="#BFDBFE">
                          <Icon icon={FileText} className="h-4 w-4" />
                        </ResultIcon>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate" style={{ color: '#00184D' }}>{record.title}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {record.doctor_name || record.category} &middot; {record.record_date_formatted} &middot; {record.patient_name}
                          </p>
                        </div>
                      </ResultItem>
                    );
                  })}
                </ResultSection>
              )}

              {/* Bills Section */}
              {results.bills && results.bills.length > 0 && (
                <ResultSection
                  title="Bills"
                  total={results.bills_total}
                  shownCount={results.bills.length}
                  onViewAll={() => handleViewAll('/billing')}
                >
                  {results.bills.map((bill) => {
                    const idx = flat.findIndex((f) => f.type === 'bill' && f.item.id === bill.id);
                    return (
                      <ResultItem
                        key={`b-${bill.id}`}
                        active={activeIndex === idx}
                        onClick={() => navigateToResult('bill', bill)}
                      >
                        <ResultIcon color="#1E40AF" bg="#BFDBFE">
                          <Icon icon={Receipt} className="h-4 w-4" />
                        </ResultIcon>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate" style={{ color: '#00184D' }}>
                            {bill.title} &middot; {bill.invoice_number}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {bill.patient_name} &middot; {bill.date_formatted} &middot; ₹{bill.amount}
                          </p>
                        </div>
                      </ResultItem>
                    );
                  })}
                </ResultSection>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// --- Sub-Components ---

function ResultSection({
  title,
  children,
  total,
  shownCount,
  onViewAll,
}: {
  title: string;
  children: React.ReactNode;
  total?: number;
  shownCount?: number;
  onViewAll?: () => void;
}) {
  return (
    <div className="mb-1">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-1.5">
        {title}
      </p>
      {children}
      {total !== undefined && shownCount !== undefined && total > shownCount && onViewAll && (
        <button
          onClick={onViewAll}
          className="flex items-center gap-1.5 w-full px-4 py-2 text-xs font-medium transition-colors hover:bg-muted"
          style={{ color: '#1E40AF' }}
        >
          <span>View all {total} results</span>
          <Icon icon={ArrowRight} className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

function ResultItem({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      data-result-item
      onClick={onClick}
      className="flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors"
      style={{ backgroundColor: active ? '#F5F8FF' : 'transparent' }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = active ? '#F5F8FF' : '#FAFAFA')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = active ? '#F5F8FF' : 'transparent')}
    >
      {children}
    </button>
  );
}

function ResultIcon({ color, bg, children }: { color: string; bg: string; children: React.ReactNode }) {
  return (
    <div
      className="h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: bg, color }}
    >
      {children}
    </div>
  );
}
