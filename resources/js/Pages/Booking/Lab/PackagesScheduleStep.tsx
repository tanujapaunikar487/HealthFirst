import { useState } from 'react';
import { router } from '@inertiajs/react';
import { GuidedBookingLayout } from '@/Layouts/GuidedBookingLayout';
import { PackageCard } from '@/Components/Booking/PackageCard';
import { LocationSelector } from '@/Components/Booking/LocationSelector';
import { FastingAlert } from '@/Components/Booking/FastingAlert';
import { TimeSlotGrid } from '@/Components/Booking/TimeSlotGrid';
import { Card } from '@/Components/ui/card';
import { cn } from '@/Lib/utils';

const labSteps = [
  { id: 'patient_test', label: 'Patient & Test' },
  { id: 'packages_schedule', label: 'Packages & Schedule' },
  { id: 'confirm', label: 'Confirm' },
];

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
  requires_fasting: boolean;
  fasting_hours?: number;
}

interface TimeSlot {
  time: string;
  available: boolean;
  preferred: boolean;
}

interface DateOption {
  date: string;
  label: string;
  sublabel: string;
}

interface LocationOption {
  type: 'home' | 'center';
  label: string;
  description: string;
  address?: string;
  distance?: string;
  fee: number;
}

interface Props {
  packages: Package[];
  locations: LocationOption[];
  availableDates: DateOption[];
  timeSlots: TimeSlot[];
  savedData?: {
    selectedPackageId?: string;
    selectedLocation?: string;
    selectedDate?: string;
    selectedTime?: string;
  };
}

export default function PackagesScheduleStep({
  packages,
  locations,
  availableDates,
  timeSlots,
  savedData,
}: Props) {
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(
    savedData?.selectedPackageId || null
  );
  const [selectedLocation, setSelectedLocation] = useState<string | null>(
    savedData?.selectedLocation || null
  );
  const [selectedDate, setSelectedDate] = useState<string>(
    savedData?.selectedDate || availableDates[0]?.date || ''
  );
  const [selectedTime, setSelectedTime] = useState<string | null>(savedData?.selectedTime || null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedPackage = packages.find((p) => p.id === selectedPackageId);
  const selectedLocationOption = locations.find((l) => l.type === selectedLocation);

  const handlePackageSelect = (packageId: string) => {
    setSelectedPackageId(packageId);
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSelectedTime(null);
    // In real app, reload time slots for new date
    router.reload({ only: ['timeSlots'], data: { date } });
  };

  const handleBack = () => {
    router.get('/booking/lab/patient-test');
  };

  const handleContinue = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedPackageId) {
      newErrors.package = 'Please select a package';
    }
    if (!selectedLocation) {
      newErrors.location = 'Please select a collection location';
    }
    if (!selectedTime) {
      newErrors.time = 'Please select a time slot';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      router.post('/booking/lab/packages-schedule', {
        selectedPackageId,
        selectedLocation,
        selectedDate,
        selectedTime,
      });
    }
  };

  // Price estimate for footer
  const getPriceEstimate = () => {
    if (selectedPackage && selectedLocationOption) {
      const total = selectedPackage.price + selectedLocationOption.fee;
      return `Total: ₹${total.toLocaleString()}`;
    }
    if (selectedPackage) {
      const minFee = Math.min(...locations.map((l) => l.fee));
      const maxFee = Math.max(...locations.map((l) => l.fee));
      const minTotal = selectedPackage.price + minFee;
      const maxTotal = selectedPackage.price + maxFee;
      return `Est: ₹${minTotal.toLocaleString()} - ₹${maxTotal.toLocaleString()}`;
    }
    return undefined;
  };

  const selectedDateLabel =
    availableDates.find((d) => d.date === selectedDate)?.label || 'today';

  const showFastingAlert =
    selectedPackage?.requires_fasting && selectedPackage?.fasting_hours;

  return (
    <GuidedBookingLayout
      steps={labSteps}
      currentStepId="packages_schedule"
      onBack={handleBack}
      onContinue={handleContinue}
      continueDisabled={!selectedPackageId || !selectedLocation || !selectedTime}
      priceEstimate={getPriceEstimate()}
    >
      <div className="space-y-10">
        {/* Section 1: Recommended Packages - Always visible */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Recommended packages</h2>

          <Card className="overflow-hidden divide-y">
            {packages.map((pkg) => (
              <PackageCard
                key={pkg.id}
                package={pkg}
                isSelected={selectedPackageId === pkg.id}
                onSelect={() => handlePackageSelect(pkg.id)}
              />
            ))}
          </Card>

          {errors.package && <p className="text-sm text-destructive mt-2">{errors.package}</p>}
        </section>

        {/* Section 2: Location Selection - Only show after package is selected */}
        {selectedPackageId && (
          <section>
            <h2 className="text-xl font-semibold mb-4">Where should we collect the sample?</h2>

            <LocationSelector
              locations={locations}
              selectedLocation={selectedLocation}
              onSelect={(type) => setSelectedLocation(type)}
            />

            {errors.location && <p className="text-sm text-destructive mt-2">{errors.location}</p>}
          </section>
        )}

        {/* Section 3: Date & Time Selection - Only show after location is selected */}
        {selectedPackageId && selectedLocation && (
          <section>
            <h2 className="text-xl font-semibold mb-4">Select Date</h2>

            {showFastingAlert && (
              <FastingAlert hours={selectedPackage.fasting_hours!} className="mb-4" />
            )}

            {/* Date Selector */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
              {availableDates.map((dateOption) => (
                <button
                  key={dateOption.date}
                  onClick={() => handleDateChange(dateOption.date)}
                  className={cn(
                    'flex-shrink-0 px-4 py-3 rounded-xl border transition-all min-w-[100px]',
                    selectedDate === dateOption.date
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-background hover:border-primary/50'
                  )}
                >
                  <p className="font-medium text-sm">{dateOption.label}</p>
                  <p
                    className={cn(
                      'text-xs',
                      selectedDate === dateOption.date
                        ? 'text-background/70'
                        : 'text-muted-foreground'
                    )}
                  >
                    {dateOption.sublabel}
                  </p>
                </button>
              ))}
            </div>

            {/* Time Slots */}
            <TimeSlotGrid
              slots={timeSlots}
              selectedTime={selectedTime}
              onSelect={(time) => setSelectedTime(time)}
            />

            {errors.time && <p className="text-sm text-destructive mt-2">{errors.time}</p>}
          </section>
        )}
      </div>
    </GuidedBookingLayout>
  );
}
