import { useState } from 'react';
import { router } from '@inertiajs/react';
import { GuidedBookingLayout } from '@/Layouts/GuidedBookingLayout';
import { ConsultationModeSelector } from '@/Components/Booking/ConsultationModeSelector';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
import { Input } from '@/Components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Components/ui/select';
import { cn } from '@/Lib/utils';
import { Search, Star } from 'lucide-react';

const doctorSteps = [
  { id: 'patient', label: 'Patient' },
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
}

interface DateOption {
  date: string;
  label: string;
  sublabel: string;
}

interface Props {
  availableDates: DateOption[];
  doctors: Doctor[];
  savedData?: {
    selectedDate?: string;
    selectedDoctorId?: string;
    selectedTime?: string;
    consultationMode?: 'video' | 'in_person';
  };
}

export default function DoctorTimeStep({ availableDates, doctors, savedData }: Props) {
  const [selectedDate, setSelectedDate] = useState<string>(
    savedData?.selectedDate || availableDates[0]?.date || ''
  );
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(
    savedData?.selectedDoctorId || null
  );
  const [selectedTime, setSelectedTime] = useState<string | null>(savedData?.selectedTime || null);
  const [consultationMode, setConsultationMode] = useState<'video' | 'in_person' | null>(
    savedData?.consultationMode || null
  );
  const [sortBy, setSortBy] = useState('recommended');
  const [searchQuery, setSearchQuery] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId);

  // Filter doctors
  const filteredDoctors = doctors.filter((doctor) => {
    if (!searchQuery) return true;
    return (
      doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.specialization.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    // Reset doctor/time selection when date changes
    setSelectedDoctorId(null);
    setSelectedTime(null);
    setConsultationMode(null);
    // In real app, trigger server reload for new availability
    router.reload({ only: ['doctors'], data: { date } });
  };

  const handleDoctorTimeSelect = (doctorId: string, time: string) => {
    setSelectedDoctorId(doctorId);
    setSelectedTime(time);
    // Reset consultation mode when changing doctor
    if (selectedDoctorId !== doctorId) {
      setConsultationMode(null);
    }
  };

  const handleBack = () => {
    router.get('/booking/doctor/concerns');
  };

  const handleContinue = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedDoctorId || !selectedTime) {
      newErrors.doctor = 'Please select a doctor and time slot';
    }
    if (!consultationMode) {
      newErrors.mode = 'Please select how you want to consult';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      router.post('/booking/doctor/doctor-time', {
        selectedDate,
        selectedDoctorId,
        selectedTime,
        consultationMode,
      });
    }
  };

  // Get consultation modes for selected doctor
  const getModes = () => {
    if (!selectedDoctor) return [];
    const modes = [];
    if (selectedDoctor.consultation_modes.includes('video')) {
      modes.push({
        type: 'video' as const,
        label: 'Video Consultation',
        description: 'Connect from home via video call',
        price: selectedDoctor.video_fee,
      });
    }
    if (selectedDoctor.consultation_modes.includes('in_person')) {
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
    if (selectedDoctor && consultationMode) {
      const fee =
        consultationMode === 'video' ? selectedDoctor.video_fee : selectedDoctor.in_person_fee;
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
      continueDisabled={!selectedDoctorId || !selectedTime || !consultationMode}
      priceEstimate={getPriceEstimate()}
    >
      <div className="space-y-10">
        {/* Date Selection */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Available {selectedDateLabel}</h2>

          <div className="flex gap-2 overflow-x-auto pb-2">
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
                    selectedDate === dateOption.date ? 'text-background/70' : 'text-muted-foreground'
                  )}
                >
                  {dateOption.sublabel}
                </p>
              </button>
            ))}
          </div>
        </section>

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
                  className="pl-9 w-64"
                />
              </div>
            </div>
          </div>

          <div className="border rounded-xl overflow-hidden divide-y">
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

          {errors.doctor && <p className="text-sm text-destructive mt-2">{errors.doctor}</p>}
        </section>

        {/* Consultation Mode */}
        {selectedDoctor && (
          <section>
            <h2 className="text-xl font-semibold mb-4">How would you like to consult?</h2>

            <ConsultationModeSelector
              modes={getModes()}
              selectedMode={consultationMode}
              onSelect={(mode) => setConsultationMode(mode as 'video' | 'in_person')}
            />

            {errors.mode && <p className="text-sm text-destructive mt-2">{errors.mode}</p>}
          </section>
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
    if (doctor.consultation_modes.includes('video')) {
      fees.push(doctor.video_fee);
    }
    if (doctor.consultation_modes.includes('in_person')) {
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
            {formatConsultationModes(doctor.consultation_modes)}
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
