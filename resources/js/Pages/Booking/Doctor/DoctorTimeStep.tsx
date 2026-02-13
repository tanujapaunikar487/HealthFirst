import { useState, useRef, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { GuidedBookingLayout } from '@/Layouts/GuidedBookingLayout';
import { useNavigation } from '@/Hooks/useNavigation';
import { EmbeddedDoctorList } from '@/Features/booking-chat/embedded/EmbeddedDoctorList';
import { EmbeddedAppointmentMode } from '@/Features/booking-chat/embedded/EmbeddedAppointmentMode';
import { Card } from '@/Components/ui/card';
import { HStack, VStack } from '@/Components/ui/stack';
import { Button } from '@/Components/ui/button';
import { cn } from '@/Lib/utils';

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
  consultation_modes: string[];
  video_fee: number;
  in_person_fee: number;
  slots: TimeSlot[];
  rating?: number;
  total_reviews?: number;
  education?: string[];
  languages?: string[];
  appointment_modes: string[];
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
    savedData?.selectedDate || ''
  );
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(
    savedData?.selectedDoctorId || null
  );
  const [selectedTime, setSelectedTime] = useState<string | null>(savedData?.selectedTime || null);
  const [appointmentMode, setConsultationMode] = useState<'video' | 'in_person' | null>(
    savedData?.appointmentMode || null
  );
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

  const { goBack } = useNavigation();

  const handleBack = () => {
    goBack('/booking/doctor/patient');
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
    if (selectedDoctor.appointment_modes.includes('video') || selectedDoctor.consultation_modes.includes('video')) {
      modes.push({
        type: 'video' as const,
        price: selectedDoctor.video_fee,
      });
    }
    if (selectedDoctor.appointment_modes.includes('in_person') || selectedDoctor.consultation_modes.includes('in_person')) {
      modes.push({
        type: 'in_person' as const,
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
                  variant="outline"
                  onClick={() => handleDateChange(dateOption.date)}
                  className={cn(
                    'h-auto flex-shrink-0 px-6 py-3 rounded-2xl transition-all min-w-[100px]',
                    isSelected
                      ? 'border-2 border-primary bg-primary/10'
                      : noDoctors
                        ? 'bg-card border-dashed opacity-60'
                        : 'bg-card hover:border-primary/50'
                  )}
                >
                  <VStack gap={0} className="w-full text-left">
                    <p className={cn('text-label', isSelected && 'text-primary')}>{dateOption.label}</p>
                    <p className={cn(
                      'text-body',
                      isSelected ? 'text-primary/70' : 'text-muted-foreground'
                    )}>
                      {dateOption.sublabel}
                    </p>
                  </VStack>
                </Button>
              );
            })}
            </HStack>
          </VStack>
        </section>

        {/* Doctor List */}
        {selectedDate && (
          <section>
            <VStack gap={4}>
              <VStack gap={0}>
                <h2 className="text-section-title">{doctors.length} doctors available</h2>
                <p className="text-body text-muted-foreground">
                  Based on your symptoms and selected date
                </p>
              </VStack>

              <EmbeddedDoctorList
                doctors={doctors}
                selectedDoctorId={selectedDoctorId}
                selectedTime={selectedTime}
                onSelect={handleDoctorTimeSelect}
                disabled={false}
              />

              {errors.doctor && <p className="text-body text-destructive">{errors.doctor}</p>}
            </VStack>
          </section>
        )}

        {/* Consultation Mode */}
        {selectedDate && selectedDoctor && selectedTime && (
          <section ref={appointmentModeSectionRef}>
            <VStack gap={4}>
              <h2 className="text-section-title">How would you like to consult?</h2>

              <EmbeddedAppointmentMode
                modes={getModes()}
                selectedMode={appointmentMode}
                onSelect={(mode) => setConsultationMode(mode as 'video' | 'in_person')}
                disabled={false}
              />

              {errors.mode && <p className="text-body text-destructive">{errors.mode}</p>}
            </VStack>
          </section>
        )}
      </VStack>
    </GuidedBookingLayout>
  );
}

