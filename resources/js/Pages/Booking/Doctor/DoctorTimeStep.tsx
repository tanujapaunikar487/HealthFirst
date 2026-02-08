import { useState, useRef, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { GuidedBookingLayout } from '@/Layouts/GuidedBookingLayout';
import { AppointmentModeSelector } from '@/Components/Booking/AppointmentModeSelector';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
import { getAvatarColorByName } from '@/Lib/avatar-colors';
import { Card } from '@/Components/ui/card';
import { HStack, VStack } from '@/Components/ui/stack';
import { Input } from '@/Components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Components/ui/select';
import { Button } from '@/Components/ui/button';
import { cn } from '@/Lib/utils';
import { Search, Star } from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';

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

interface Props {
  availableDates: DateOption[];
  doctors: Doctor[];
  patientName?: string;
  appointmentType?: 'new' | 'followup';
  followupReason?: string;
  followupNotes?: string;
  symptoms?: string;
  savedData?: {
    selectedDate?: string;
    selectedDoctorId?: string;
    selectedTime?: string;
    appointmentMode?: 'video' | 'in_person';
  };
}

export default function DoctorTimeStep({
  availableDates,
  doctors,
  patientName,
  appointmentType,
  followupReason,
  followupNotes,
  symptoms,
  savedData
}: Props) {
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

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    // Reset doctor/time selection when date changes
    setSelectedDoctorId(null);
    setSelectedTime(null);
    setConsultationMode(null);
    // Trigger server reload for new availability
    router.reload({ only: ['doctors'], data: { date } });
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
    const newErrors: Record<string, string> = {};

    if (!selectedDoctorId || !selectedTime) {
      newErrors.doctor = 'Please select a doctor and time slot';
    }
    if (!appointmentMode) {
      newErrors.mode = 'Please select how you want to consult';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      router.post('/booking/doctor/doctor-time', {
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
      continueDisabled={!selectedDoctorId || !selectedTime || !appointmentMode}
      priceEstimate={getPriceEstimate()}
    >
      <VStack gap={12}>
        {/* Date Selection - 14 date pills */}
        <section>
          <VStack gap={4}>
            <h2 className="text-section-title">Available {selectedDateLabel}</h2>
            <HStack gap={2} className="overflow-x-auto pb-2">
            {availableDates.map((dateOption) => {
              const isSelected = selectedDate === dateOption.date;
              const noDoctors = dateOption.doctorCount === 0;
              return (
                <Button
                  key={dateOption.date}
                  variant={isSelected ? 'accent' : 'outline'}
                  onClick={() => handleDateChange(dateOption.date)}
                  className={cn(
                    'h-auto flex-shrink-0 px-6 py-3 rounded-2xl transition-all min-w-[100px]',
                    isSelected
                      ? 'border-foreground'
                      : noDoctors
                        ? 'bg-card border-dashed opacity-60'
                        : 'bg-card hover:border-primary/50'
                  )}
                >
                  <VStack gap={0} className="w-full text-left">
                    <p className="text-label">{dateOption.label}</p>
                    <p className={cn(
                      'text-body',
                      isSelected ? 'text-background/70' : 'text-muted-foreground'
                    )}>
                      {dateOption.sublabel}
                    </p>
                    {dateOption.doctorCount !== undefined && (
                      <p className={cn(
                        'text-body',
                        isSelected ? 'text-background/60' : noDoctors ? 'text-destructive/70' : 'text-muted-foreground'
                      )}>
                        {noDoctors ? 'No doctors' : `${dateOption.doctorCount} doctors`}
                      </p>
                    )}
                  </VStack>
                </Button>
              );
            })}
            </HStack>
          </VStack>
        </section>

        {/* Doctor List */}
        <section>
          <VStack gap={4}>
            <HStack className="justify-between">
              <VStack gap={0}>
                <h2 className="text-section-title">{filteredDoctors.length} doctors available</h2>
                <p className="text-body text-muted-foreground">
                  Based on your symptoms and selected date
                </p>
              </VStack>

              <HStack gap={2}>
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
                <Icon icon={Search} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground" />
                <Input
                  placeholder="Search patient, doctor, date"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-48"
                />
              </div>
              </HStack>
            </HStack>

          {filteredDoctors.length === 0 ? (
            <Card className="px-6 py-8 text-center">
              <VStack gap={1}>
                <p className="text-label text-foreground">No doctors available on this date</p>
                <p className="text-body text-muted-foreground">
                  Some doctors don't work on {selectedDateLabel}s. Try selecting a different date.
                </p>
              </VStack>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <div className="divide-y">
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
              </div>
            </Card>
          )}

          {errors.doctor && <p className="text-body text-destructive">{errors.doctor}</p>}
          </VStack>
        </section>

        {/* Consultation Mode */}
        {selectedDoctor && (
          <section ref={appointmentModeSectionRef}>
            <VStack gap={4}>
              <h2 className="text-section-title">How would you like to consult?</h2>

              <AppointmentModeSelector
                modes={getModes()}
                selectedMode={appointmentMode}
                onSelect={(mode) => setConsultationMode(mode as 'video' | 'in_person')}
              />

              {errors.mode && <p className="text-body text-destructive">{errors.mode}</p>}
            </VStack>
          </section>
        )}
      </VStack>
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
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    return parts.length > 1
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
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

  const avatarColor = getAvatarColorByName(doctor.name);

  return (
    <div
      className={cn(
        'px-6 py-4 transition-all hover:bg-muted/50',
        isSelected && 'bg-primary/5'
      )}
    >
      <VStack gap={4}>
        {/* Doctor Info */}
        <HStack gap={3} className="items-start">
          <Avatar className="h-12 w-12">
            <AvatarImage src={doctor.avatar || undefined} />
            <AvatarFallback
              className="text-label"
              style={{
                backgroundColor: `hsl(${avatarColor.bg})`,
                color: `hsl(${avatarColor.text})`,
              }}
            >
              {getInitials(doctor.name)}
            </AvatarFallback>
          </Avatar>
          <VStack gap={0} className="flex-1 min-w-0">
            <h3 className="text-label text-foreground">{doctor.name}</h3>
            <p className="text-body text-muted-foreground">
              {doctor.specialization} • {doctor.experience_years} years of experience
            </p>
          </VStack>
          <VStack gap={1} className="items-end">
            <span className="px-2 py-1 text-label text-primary bg-primary/10 rounded whitespace-nowrap">
              {formatConsultationModes(doctor.appointment_modes)}
            </span>
            <span className="text-card-title">{getFeeRange()}</span>
          </VStack>
        </HStack>

        {/* Time Slots */}
        <HStack gap={2} className="flex-wrap">
          {slots.map((slot) => (
            <Button
              key={slot.time}
              variant={selectedTime === slot.time ? 'accent' : 'outline'}
              onClick={() => slot.available && onSelectTime(slot.time)}
              disabled={!slot.available}
              className={cn(
                'h-auto px-4 py-2 rounded-full transition-all relative',
                selectedTime !== slot.time && 'hover:border-primary/50 hover:bg-primary/5',
                selectedTime === slot.time && 'border-foreground',
                !slot.available && 'opacity-40 cursor-not-allowed'
              )}
            >
              {slot.time}
              {slot.preferred && selectedTime !== slot.time && (
                <Icon icon={Star} size={12} className="absolute -top-1 -right-1 fill-black text-black" />
              )}
            </Button>
          ))}
        </HStack>
      </VStack>
    </div>
  );
}
