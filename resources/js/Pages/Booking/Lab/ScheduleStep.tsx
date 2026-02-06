import { useState, useRef, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { GuidedBookingLayout } from '@/Layouts/GuidedBookingLayout';
import { FastingAlert } from '@/Components/Booking/FastingAlert';
import { TimeSlotGrid } from '@/Components/Booking/TimeSlotGrid';
import { EmbeddedAddressSelector } from '@/Features/booking-chat/embedded/EmbeddedAddressSelector';
import { EmbeddedAddressForm } from '@/Features/booking-chat/embedded/EmbeddedAddressForm';
import { EmbeddedCenterList } from '@/Features/booking-chat/embedded/EmbeddedCenterList';
import { Button } from '@/Components/ui/button';
import { Card } from '@/Components/ui/card';
import { cn } from '@/Lib/utils';
import { Home, Building2 } from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';

const labSteps = [
  { id: 'patient', label: 'Patient' },
  { id: 'test_search', label: 'Find Tests' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'confirm', label: 'Confirm' },
];

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

interface UserAddress {
  id: number;
  label: string;
  address: string;
  is_default: boolean;
}

interface LabCenter {
  id: number;
  name: string;
  address: string;
  city: string;
  rating: number;
  distance_km: number;
}

interface Props {
  locations: LocationOption[];
  availableDates: DateOption[];
  timeSlots: TimeSlot[];
  userAddresses: UserAddress[];
  labCenters: LabCenter[];
  savedData?: {
    selectedLocation?: string;
    selectedDate?: string;
    selectedTime?: string;
    selectedAddressId?: number;
    selectedCenterId?: number;
  };
  requiresFasting: boolean;
  fastingHours?: number | null;
}

export default function ScheduleStep({
  locations,
  availableDates,
  timeSlots,
  userAddresses: initialAddresses,
  labCenters,
  savedData,
  requiresFasting,
  fastingHours,
}: Props) {
  const [selectedDate, setSelectedDate] = useState<string>(
    savedData?.selectedDate || ''
  );
  const [selectedTime, setSelectedTime] = useState<string | null>(savedData?.selectedTime || null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(
    savedData?.selectedLocation || null
  );
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    savedData?.selectedAddressId || null
  );
  const [selectedAddressLabel, setSelectedAddressLabel] = useState<string | null>(null);
  const [selectedAddressText, setSelectedAddressText] = useState<string | null>(null);
  const [selectedCenterId, setSelectedCenterId] = useState<number | null>(
    savedData?.selectedCenterId || null
  );
  const [selectedCenterName, setSelectedCenterName] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [userAddresses, setUserAddresses] = useState<UserAddress[]>(initialAddresses);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const timeSectionRef = useRef<HTMLDivElement>(null);
  const collectionSectionRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to time section when date is selected
  useEffect(() => {
    if (selectedDate && !savedData?.selectedDate && timeSectionRef.current) {
      setTimeout(() => {
        timeSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [selectedDate]);

  // Auto-scroll to collection section when time is selected
  useEffect(() => {
    if (selectedTime && collectionSectionRef.current) {
      setTimeout(() => {
        collectionSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [selectedTime]);

  // Resolve saved address/center names on mount
  useEffect(() => {
    if (savedData?.selectedAddressId) {
      const addr = userAddresses.find((a) => a.id === savedData.selectedAddressId);
      if (addr) {
        setSelectedAddressLabel(addr.label);
        setSelectedAddressText(addr.address);
      }
    }
    if (savedData?.selectedCenterId) {
      const center = labCenters.find((c) => c.id === savedData.selectedCenterId);
      if (center) {
        setSelectedCenterName(center.name);
      }
    }
  }, []);

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSelectedTime(null);
    router.reload({ only: ['timeSlots'], data: { date } });
  };

  const handleLocationChange = (type: string) => {
    setSelectedLocation(type);
    setSelectedAddressId(null);
    setSelectedAddressLabel(null);
    setSelectedAddressText(null);
    setSelectedCenterId(null);
    setSelectedCenterName(null);
    setShowAddressForm(false);
  };

  const handleAddressSelect = (id: number, label: string, address: string) => {
    setSelectedAddressId(id);
    setSelectedAddressLabel(label);
    setSelectedAddressText(address);
    setShowAddressForm(false);
  };

  const handleCenterSelect = (centerId: number) => {
    setSelectedCenterId(centerId);
    const center = labCenters.find((c) => c.id === centerId);
    setSelectedCenterName(center?.name || null);
  };

  const handleAddAddressSubmit = async (data: {
    new_address_label: string;
    new_address_line_1: string;
    new_address_line_2?: string;
    new_address_city: string;
    new_address_state: string;
    new_address_pincode: string;
    display_message: string;
  }) => {
    const csrfToken =
      document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

    try {
      const response = await fetch('/booking/lab/add-address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken,
          Accept: 'application/json',
        },
        body: JSON.stringify({
          label: data.new_address_label,
          address_line_1: data.new_address_line_1,
          address_line_2: data.new_address_line_2 || null,
          city: data.new_address_city,
          state: data.new_address_state,
          pincode: data.new_address_pincode,
        }),
      });

      if (!response.ok) throw new Error('Failed to add address');

      const newAddr = await response.json();
      setUserAddresses((prev) => [...prev, newAddr]);
      setSelectedAddressId(newAddr.id);
      setSelectedAddressLabel(newAddr.label);
      setSelectedAddressText(newAddr.address);
      setShowAddressForm(false);
    } catch (err) {
      console.error('Failed to add address:', err);
    }
  };

  const handleBack = () => {
    router.get('/booking/lab/test-search');
  };

  const isCollectionComplete = () => {
    if (selectedLocation === 'home') return selectedAddressId !== null;
    if (selectedLocation === 'center') return selectedCenterId !== null;
    return false;
  };

  const handleContinue = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedTime) newErrors.time = 'Please select a time slot';
    if (!selectedLocation) newErrors.location = 'Please select a collection method';
    if (selectedLocation === 'home' && !selectedAddressId) {
      newErrors.address = 'Please select an address for home collection';
    }
    if (selectedLocation === 'center' && !selectedCenterId) {
      newErrors.center = 'Please select a lab center';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      router.post('/booking/lab/schedule', {
        selectedLocation,
        selectedDate,
        selectedTime,
        selectedAddressId: selectedLocation === 'home' ? selectedAddressId : null,
        selectedCenterId: selectedLocation === 'center' ? selectedCenterId : null,
      });
    }
  };

  return (
    <GuidedBookingLayout
      steps={labSteps}
      currentStepId="schedule"
      onBack={handleBack}
      onContinue={handleContinue}
      continueDisabled={!selectedTime || !isCollectionComplete()}
    >
      <div className="space-y-12">
        {/* Date Selection */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Select Date</h2>

          {requiresFasting && fastingHours && (
            <FastingAlert hours={fastingHours} className="mb-4" />
          )}

          <div className="flex gap-2 overflow-x-auto pb-2">
            {availableDates.map((dateOption) => (
              <Button
                key={dateOption.date}
                variant={selectedDate === dateOption.date ? 'accent' : 'outline'}
                onClick={() => handleDateChange(dateOption.date)}
                className={cn(
                  'h-auto flex-shrink-0 px-6 py-3 rounded-2xl transition-all min-w-[100px] font-normal',
                  selectedDate === dateOption.date
                    ? 'border-foreground'
                    : 'bg-background hover:border-primary/50'
                )}
              >
                <div className="w-full text-left">
                  <p className="font-medium text-[14px]">{dateOption.label}</p>
                  <p
                    className={cn(
                      'text-[14px]',
                      selectedDate === dateOption.date
                        ? 'text-background/70'
                        : 'text-muted-foreground'
                    )}
                  >
                    {dateOption.sublabel}
                  </p>
                </div>
              </Button>
            ))}
          </div>
        </section>

        {/* Time Selection */}
        {selectedDate && (
          <section ref={timeSectionRef}>
            <h2 className="text-xl font-semibold mb-4">Select Time</h2>

            <TimeSlotGrid
              slots={timeSlots}
              selectedTime={selectedTime}
              onSelect={(time) => setSelectedTime(time)}
            />

            {errors.time && <p className="text-[14px] text-destructive mt-2">{errors.time}</p>}
          </section>
        )}

        {/* Section 4: Collection Method */}
        {selectedTime && (
          <section ref={collectionSectionRef}>
            <h2 className="text-xl font-semibold mb-4">Where should we collect the sample?</h2>

            <Card className="overflow-hidden">
              {locations.map((loc, index) => {
                const isSelected = selectedLocation === loc.type;
                return (
                  <Button
                    key={loc.type}
                    variant="ghost"
                    onClick={() => handleLocationChange(loc.type)}
                    className={cn(
                      'w-full h-auto flex items-center gap-4 px-6 py-4 rounded-none justify-start text-left transition-all font-normal text-[14px]',
                      'hover:bg-muted/50',
                      isSelected && 'bg-primary/5'
                    )}
                    style={{
                      borderBottom: index < locations.length - 1 ? '1px solid hsl(var(--border))' : 'none'
                    }}
                  >
                    {/* Icon with rounded background */}
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      {loc.type === 'home' ? (
                        <Icon icon={Home} className="h-5 w-5 text-foreground" />
                      ) : (
                        <Icon icon={Building2} className="h-5 w-5 text-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[14px] leading-tight mb-0.5">{loc.label}</p>
                      <p className="text-[14px] text-muted-foreground leading-tight">{loc.description}</p>
                      {loc.fee > 0 && (
                        <p className="text-[14px] text-muted-foreground mt-1">
                          +₹{loc.fee} collection fee
                        </p>
                      )}
                    </div>
                  </Button>
                );
              })}
            </Card>

            {errors.location && (
              <p className="text-[14px] text-destructive mt-2">{errors.location}</p>
            )}

            {/* Address Selection (Home Collection) */}
            {selectedLocation === 'home' && !showAddressForm && (
              <div className="mt-6">
                <h3 className="text-base font-semibold mb-3">Select delivery address</h3>

                {userAddresses.length > 0 ? (
                  <EmbeddedAddressSelector
                    addresses={userAddresses}
                    selectedAddressId={selectedAddressId}
                    onSelect={handleAddressSelect}
                    onAddAddress={() => setShowAddressForm(true)}
                    disabled={false}
                  />
                ) : (
                  <div className="text-center py-4">
                    <p className="text-[14px] text-muted-foreground mb-3">No saved addresses yet</p>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowAddressForm(true)}
                    >
                      Add new address
                    </Button>
                  </div>
                )}

                {errors.address && (
                  <p className="text-[14px] text-destructive mt-2">{errors.address}</p>
                )}
              </div>
            )}

            {/* Add Address Form */}
            {selectedLocation === 'home' && showAddressForm && (
              <div className="mt-6">
                <h3 className="text-base font-semibold mb-3">Add new address</h3>
                <EmbeddedAddressForm
                  onSelect={handleAddAddressSubmit}
                  disabled={false}
                />
                {userAddresses.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddressForm(false)}
                    className="mt-2 text-muted-foreground"
                  >
                    Back to saved addresses
                  </Button>
                )}
              </div>
            )}

            {/* Center Selection (Hospital Visit) */}
            {selectedLocation === 'center' && (
              <div className="mt-6">
                <h3 className="text-base font-semibold mb-3">Select lab center</h3>

                <EmbeddedCenterList
                  centers={labCenters}
                  selectedCenterId={selectedCenterId}
                  onSelect={handleCenterSelect}
                  disabled={false}
                />

                {errors.center && (
                  <p className="text-[14px] text-destructive mt-2">{errors.center}</p>
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </GuidedBookingLayout>
  );
}
