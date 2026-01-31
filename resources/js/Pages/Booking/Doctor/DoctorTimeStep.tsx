import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import { router } from '@inertiajs/react';
import { GuidedBookingLayout } from '@/Layouts/GuidedBookingLayout';
import { AppointmentModeSelector } from '@/Components/Booking/AppointmentModeSelector';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
import { Card } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Components/ui/select';
import { cn } from '@/Lib/utils';
import { Calendar, Search, Star, User } from 'lucide-react';

const doctorSteps = [
  { id: 'concerns', label: 'Concerns' },
  { id: 'doctor_time', label: 'Doctor & Time' },
  { id: 'confirm', label: 'Confirm' },
];

interface TimeSlot {
  time: string;
  available: boolean;
  preferred: boolean;
}

interface Doctor {
  id: string;
  name: string;
  avatar: string | null;
  specialization: string;
  experience_years: number;
  appointment_modes: string[];
  video_fee: number;
  in_person_fee: number;
  slots: TimeSlot[];
}

interface DateOption {
  date: string;
  label: string;
  sublabel: string;
  doctorCount?: number;
}

interface UrgencyOption {
  value: string;
  label: string;
  description: string;
  doctorCount?: number;
}

interface Props {
  availableDates: DateOption[];
  doctors: Doctor[];
  urgencyOptions: UrgencyOption[];
  patientName?: string;
  appointmentType?: 'new' | 'followup';
  followupReason?: string;
  followupNotes?: string;
  symptoms?: string;
  savedData?: {
    urgency?: string;
    selectedDate?: string;
    selectedDoctorId?: string;
    selectedTime?: string;
    appointmentMode?: 'video' | 'in_person';
  };
}

export default function DoctorTimeStep({
  availableDates,
  doctors,
  urgencyOptions = [],
  patientName,
  appointmentType,
  followupReason,
  followupNotes,
  symptoms,
  savedData
}: Props) {
  const [urgency, setUrgency] = useState<string | null>(savedData?.urgency || null);
  const [selectedDate, setSelectedDate] = useState<string>(
    savedData?.selectedDate || availableDates[0]?.date || ''
  );
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(
    savedData?.selectedDoctorId || null
  );
  const [selectedTime, setSelectedTime] = useState<string | null>(savedData?.selectedTime || null);
  const [appointmentMode, setConsultationMode] = useState<'video' | 'in_person' | null>(
    savedData?.appointmentMode || null
  );
  const [sortBy, setSortBy] = useState('recommended');
  const [searchQuery, setSearchQuery] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId);
  const appointmentModeSectionRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to appointment mode section when doctor and time are selected
  useEffect(() => {
    if (selectedDoctor && selectedTime && appointmentModeSectionRef.current) {
      setTimeout(() => {
        appointmentModeSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [selectedDoctor, selectedTime]);

  // Filter and sort doctors
  const filteredDoctors = doctors
    .filter((doctor) => {
      if (!searchQuery) return true;
      return (
        doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doctor.specialization.toLowerCase().includes(searchQuery.toLowerCase())
      );
    })
    .sort((a, b) => {
      if (sortBy === 'price_low') {
        const aMinPrice = Math.min(a.video_fee || Infinity, a.in_person_fee || Infinity);
        const bMinPrice = Math.min(b.video_fee || Infinity, b.in_person_fee || Infinity);
        return aMinPrice - bMinPrice;
      }
      if (sortBy === 'price_high') {
        const aMaxPrice = Math.max(a.video_fee || 0, a.in_person_fee || 0);
        const bMaxPrice = Math.max(b.video_fee || 0, b.in_person_fee || 0);
        return bMaxPrice - aMaxPrice;
      }
      // Default: recommended (keep original order)
      return 0;
    });

  const handleUrgencyChange = (value: string) => {
    setUrgency(value);
    setSelectedDoctorId(null);
    setSelectedTime(null);
    setConsultationMode(null);

    if (value === 'urgent') {
      // Auto-select today
      const today = availableDates[0]?.date || '';
      setSelectedDate(today);
      router.reload({ only: ['doctors'], data: { date: today } });
    } else if (value === 'this_week') {
      // Default to today
      const today = availableDates[0]?.date || '';
      setSelectedDate(today);
      router.reload({ only: ['doctors'], data: { date: today } });
    } else {
      // specific_date — clear date, wait for user input
      setSelectedDate('');
    }
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    // Reset doctor/time selection when date changes
    setSelectedDoctorId(null);
    setSelectedTime(null);
    setConsultationMode(null);
    // Trigger server reload for new availability
    router.reload({ only: ['doctors'], data: { date } });
  };

  const handleSpecificDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    if (date) {
      handleDateChange(date);
    }
  };

  const handleDoctorTimeSelect = (doctorId: string, time: string) => {
    setSelectedDoctorId(doctorId);
    setSelectedTime(time);
    // Reset appointment mode when changing doctor
    if (selectedDoctorId !== doctorId) {
      setConsultationMode(null);
    }
  };

  const handleBack = () => {
    router.get('/booking/doctor/patient');
  };

  const handleContinue = () => {
    console.log('Continue clicked', {
      selectedDate,
      selectedDoctorId,
      selectedTime,
      appointmentMode,
    });

    const newErrors: Record<string, string> = {};

    if (!urgency) {
      newErrors.urgency = 'Please select how soon you need to see a doctor';
    }
    if (!selectedDoctorId || !selectedTime) {
      newErrors.doctor = 'Please select a doctor and time slot';
    }
    if (!appointmentMode) {
      newErrors.mode = 'Please select how you want to consult';
    }

    setErrors(newErrors);

    console.log('Errors:', newErrors);

    if (Object.keys(newErrors).length === 0) {
      console.log('Submitting form...');
      router.post('/booking/doctor/doctor-time', {
        urgency,
        selectedDate,
        selectedDoctorId,
        selectedTime,
        appointmentMode,
      });
    }
  };

  // Get appointment modes for selected doctor
  const getModes = () => {
    if (!selectedDoctor) return [];
    const modes = [];
    if (selectedDoctor.appointment_modes.includes('video')) {
      modes.push({
        type: 'video' as const,
        label: 'Video Appointment',
        description: 'Connect from home via video call',
        price: selectedDoctor.video_fee,
      });
    }
    if (selectedDoctor.appointment_modes.includes('in_person')) {
      modes.push({
        type: 'in_person' as const,
        label: 'In-Person Visit',
        description: 'Visit the doctor at the clinic',
        price: selectedDoctor.in_person_fee,
      });
    }
    return modes;
  };

  // Price estimate for footer
  const getPriceEstimate = () => {
    if (selectedDoctor && appointmentMode) {
      const fee =
        appointmentMode === 'video' ? selectedDoctor.video_fee : selectedDoctor.in_person_fee;
      return `Total: ₹${fee.toLocaleString()}`;
    }
    if (selectedDoctor) {
      return `Est: ₹${selectedDoctor.video_fee.toLocaleString()} - ₹${selectedDoctor.in_person_fee.toLocaleString()}`;
    }
    return undefined;
  };

  const selectedDateLabel =
    availableDates.find((d) => d.date === selectedDate)?.label || 'today';

  return (
    <GuidedBookingLayout
      steps={doctorSteps}
      currentStepId="doctor_time"
      onBack={handleBack}
      onContinue={handleContinue}
      continueDisabled={!urgency || !selectedDoctorId || !selectedTime || !appointmentMode}
      priceEstimate={getPriceEstimate()}
    >
      <div className="space-y-10">
        {/* Urgency Selection */}
        <section>
          <h2 className="text-xl font-semibold mb-1">How soon do you need to see a doctor?</h2>
          <p className="text-sm text-muted-foreground mb-4">This helps us find the best available slots</p>

          <div className="space-y-2">
            {urgencyOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleUrgencyChange(option.value)}
                className={cn(
                  'w-full text-left px-4 py-3 rounded-xl border transition-all',
                  urgency === option.value
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-background hover:border-primary/50'
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{option.label}</p>
                    <p className={cn(
                      'text-xs',
                      urgency === option.value ? 'text-background/70' : 'text-muted-foreground'
                    )}>
                      {option.description}
                    </p>
                  </div>
                  {option.doctorCount !== undefined && (
                    <span className={cn(
                      'text-xs font-medium',
                      urgency === option.value ? 'text-background/70' : 'text-muted-foreground'
                    )}>
                      {option.doctorCount} doctors
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {errors.urgency && <p className="text-sm text-destructive mt-2">{errors.urgency}</p>}
        </section>

        {/* Date Selection - varies by urgency */}
        {urgency && (<>

        {/* Urgent: no date picker, just a note */}
        {urgency === 'urgent' && (
          <p className="text-sm text-muted-foreground">Showing today's availability</p>
        )}

        {/* This Week: date pills */}
        {urgency === 'this_week' && (
          <section>
            <h2 className="text-xl font-semibold mb-4">Available {selectedDateLabel}</h2>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {availableDates.map((dateOption) => {
                const isSelected = selectedDate === dateOption.date;
                const noDoctors = dateOption.doctorCount === 0;
                return (
                  <button
                    key={dateOption.date}
                    onClick={() => handleDateChange(dateOption.date)}
                    className={cn(
                      'flex-shrink-0 px-4 py-3 rounded-xl border transition-all min-w-[100px]',
                      isSelected
                        ? 'bg-foreground text-background border-foreground'
                        : noDoctors
                          ? 'bg-background border-dashed opacity-60'
                          : 'bg-background hover:border-primary/50'
                    )}
                  >
                    <p className="font-medium text-sm">{dateOption.label}</p>
                    <p className={cn(
                      'text-xs',
                      isSelected ? 'text-background/70' : 'text-muted-foreground'
                    )}>
                      {dateOption.sublabel}
                    </p>
                    {dateOption.doctorCount !== undefined && (
                      <p className={cn(
                        'text-xs mt-0.5',
                        isSelected ? 'text-background/60' : noDoctors ? 'text-destructive/70' : 'text-muted-foreground'
                      )}>
                        {noDoctors ? 'No doctors' : `${dateOption.doctorCount} doctors`}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Specific date: date input */}
        {urgency === 'specific_date' && (
          <section>
            <h2 className="text-xl font-semibold mb-4">Pick a date</h2>
            <div className="relative max-w-xs">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="date"
                value={selectedDate}
                onChange={handleSpecificDateChange}
                min={new Date().toISOString().split('T')[0]}
                className={cn(
                  'w-full pl-10 pr-4 py-3 rounded-xl border bg-background text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'
                )}
              />
            </div>
          </section>
        )}

        {/* Doctor List */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">{filteredDoctors.length} doctors available</h2>
              <p className="text-sm text-muted-foreground">
                Based on your symptoms and selected date
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recommended">Recommended</SelectItem>
                  <SelectItem value="price_low">Price: Low</SelectItem>
                  <SelectItem value="price_high">Price: High</SelectItem>
                </SelectContent>
              </Select>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search patient, doctor, date"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-48"
                />
              </div>
            </div>
          </div>

          {filteredDoctors.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="font-medium text-foreground">No doctors available on this date</p>
              <p className="text-sm text-muted-foreground mt-1">
                Some doctors don't work on {selectedDateLabel}s. Try selecting a different date.
              </p>
            </Card>
          ) : (
            <Card className="overflow-hidden divide-y">
              {filteredDoctors.map((doctor) => (
                <DoctorCard
                  key={doctor.id}
                  doctor={doctor}
                  slots={doctor.slots}
                  selectedTime={selectedDoctorId === doctor.id ? selectedTime : null}
                  isSelected={selectedDoctorId === doctor.id}
                  onSelectTime={(time) => handleDoctorTimeSelect(doctor.id, time)}
                />
              ))}
            </Card>
          )}

          {errors.doctor && <p className="text-sm text-destructive mt-2">{errors.doctor}</p>}
        </section>

        {/* Consultation Mode */}
        {selectedDoctor && (
          <section ref={appointmentModeSectionRef}>
            <h2 className="text-xl font-semibold mb-4">How would you like to consult?</h2>

            <AppointmentModeSelector
              modes={getModes()}
              selectedMode={appointmentMode}
              onSelect={(mode) => setConsultationMode(mode as 'video' | 'in_person')}
            />

            {errors.mode && <p className="text-sm text-destructive mt-2">{errors.mode}</p>}
          </section>
        )}
        </>
        )}
      </div>
    </GuidedBookingLayout>
  );
}

// DoctorCard component
interface DoctorCardProps {
  doctor: Doctor;
  slots: TimeSlot[];
  selectedTime: string | null;
  isSelected: boolean;
  onSelectTime: (time: string) => void;
}

function DoctorCard({ doctor, slots, selectedTime, isSelected, onSelectTime }: DoctorCardProps) {
  const getInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const formatConsultationModes = (modes: string[]) => {
    if (modes.includes('video') && modes.includes('in_person')) {
      return 'Video and In-hospital';
    }
    if (modes.includes('video')) {
      return 'Video';
    }
    if (modes.includes('in_person')) {
      return 'In-hospital';
    }
    return '';
  };

  const getFeeRange = () => {
    const fees = [];
    if (doctor.appointment_modes.includes('video')) {
      fees.push(doctor.video_fee);
    }
    if (doctor.appointment_modes.includes('in_person')) {
      fees.push(doctor.in_person_fee);
    }

    const uniqueFees = [...new Set(fees)];
    if (uniqueFees.length === 1) {
      return `₹${uniqueFees[0].toLocaleString()}`;
    }
    return `₹${Math.min(...uniqueFees).toLocaleString()} / ${Math.max(...uniqueFees).toLocaleString()}`;
  };

  return (
    <div
      className={cn(
        'p-4 bg-white transition-all',
        isSelected && 'bg-primary/5 ring-2 ring-primary ring-inset'
      )}
    >
      {/* Doctor Info */}
      <div className="flex items-start gap-3 mb-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={doctor.avatar || undefined} />
          <AvatarFallback className="bg-orange-400 text-white font-medium">
            {getInitial(doctor.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground">{doctor.name}</h3>
          <p className="text-sm text-muted-foreground">
            {doctor.specialization} • {doctor.experience_years} years of experience
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="inline-block px-2 py-1 text-xs font-medium text-primary bg-primary/10 rounded whitespace-nowrap">
            {formatConsultationModes(doctor.appointment_modes)}
          </span>
          <span className="font-semibold text-sm">{getFeeRange()}</span>
        </div>
      </div>

      {/* Time Slots */}
      <div className="flex flex-wrap gap-2">
        {slots.map((slot) => (
          <button
            key={slot.time}
            onClick={() => slot.available && onSelectTime(slot.time)}
            disabled={!slot.available}
            className={cn(
              'px-3 py-1.5 text-sm rounded-lg border transition-all relative',
              'hover:border-primary/50 hover:bg-primary/5',
              selectedTime === slot.time &&
                'bg-black text-white border-black hover:bg-black hover:border-black',
              !slot.available && 'opacity-40 cursor-not-allowed'
            )}
          >
            {slot.time}
            {slot.preferred && selectedTime !== slot.time && (
              <Star className="absolute -top-1 -right-1 h-3 w-3 fill-black text-black" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
