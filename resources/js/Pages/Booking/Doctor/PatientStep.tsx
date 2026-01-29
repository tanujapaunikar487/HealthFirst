import { useState } from 'react';
import { router } from '@inertiajs/react';
import { GuidedBookingLayout } from '@/Layouts/GuidedBookingLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
import { Card } from '@/Components/ui/card';
import { cn } from '@/Lib/utils';
import { ArrowRight, User, Video, MapPin, Star } from 'lucide-react';

const doctorSteps = [
  { id: 'patient', label: 'Patient' },
  { id: 'concerns', label: 'Concerns' },
  { id: 'doctor_time', label: 'Doctor & Time' },
  { id: 'confirm', label: 'Confirm' },
];

interface FamilyMember {
  id: string;
  name: string;
  avatar: string | null;
  relationship: string;
}

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
}

interface PreviousConsultation {
  patientId: string;
  doctor: Doctor;
  symptoms: string[];
  date: string;
  slots: TimeSlot[];
}

interface Props {
  familyMembers: FamilyMember[];
  previousConsultations: PreviousConsultation[];
  savedData?: {
    patientId?: string;
    consultationType?: 'new' | 'followup';
    quickBookDoctorId?: string;
    quickBookTime?: string;
  };
}

export default function PatientStep({ familyMembers, previousConsultations, savedData }: Props) {
  const [patientId, setPatientId] = useState<string | null>(savedData?.patientId || null);
  const [consultationType, setConsultationType] = useState<'new' | 'followup' | null>(
    savedData?.consultationType || null
  );
  const [quickBookDoctorId, setQuickBookDoctorId] = useState<string | null>(
    savedData?.quickBookDoctorId || null
  );
  const [quickBookTime, setQuickBookTime] = useState<string | null>(
    savedData?.quickBookTime || null
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedPatient = familyMembers.find((f) => f.id === patientId);

  // Filter previous consultations for selected patient
  const patientPreviousConsultations = previousConsultations.filter(
    (c) => c.patientId === patientId
  );

  const handleBack = () => {
    router.get('/booking');
  };

  const handleContinue = () => {
    const newErrors: Record<string, string> = {};

    if (!patientId) {
      newErrors.patient = 'Please select a patient';
    }
    if (!consultationType) {
      newErrors.consultationType = 'Please select consultation type';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      router.post('/booking/doctor/patient', {
        patientId,
        consultationType,
        quickBookDoctorId,
        quickBookTime,
      });
    }
  };

  const handleQuickBook = (doctorId: string, time: string) => {
    setQuickBookDoctorId(doctorId);
    setQuickBookTime(time);
  };

  const handlePatientSelect = (id: string) => {
    setPatientId(id);
    // Reset follow-up selection when changing patient
    if (consultationType === 'followup') {
      setQuickBookDoctorId(null);
      setQuickBookTime(null);
    }
  };

  return (
    <GuidedBookingLayout
      steps={doctorSteps}
      currentStepId="patient"
      onBack={handleBack}
      onContinue={handleContinue}
      continueDisabled={!patientId || !consultationType}
    >
      <div className="space-y-10">
        {/* Patient Selection */}
        <section>
          <h2 className="text-xl font-semibold mb-2">Who is this appointment for?</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Select a family member or add a new patient
          </p>

          <div className="grid grid-cols-2 gap-3">
            {familyMembers.map((member) => (
              <button
                key={member.id}
                onClick={() => handlePatientSelect(member.id)}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl border text-left transition-all',
                  'hover:border-primary/50 hover:bg-primary/5',
                  patientId === member.id && 'border-primary bg-primary/5'
                )}
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src={member.avatar || undefined} />
                  <AvatarFallback className="bg-orange-400 text-white text-sm font-medium">
                    {member.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-sm">{member.name}</span>
              </button>
            ))}
          </div>

          <button className="mt-3 inline-flex items-center gap-1 text-sm text-foreground hover:text-primary transition-colors">
            Add family member or guest
            <ArrowRight className="h-4 w-4" />
          </button>

          {errors.patient && (
            <p className="text-sm text-destructive mt-2">{errors.patient}</p>
          )}
        </section>

        {/* Consultation Type */}
        <section>
          <h2 className="text-xl font-semibold mb-2">
            Is this a new consultation or a follow-up?
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Follow-ups will show your previous doctors
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setConsultationType('new')}
              className={cn(
                'p-4 rounded-xl border text-left transition-all',
                'hover:border-primary/50 hover:bg-primary/5',
                consultationType === 'new' && 'border-primary bg-primary/5'
              )}
            >
              <span className="font-medium">New Consultation</span>
            </button>
            <button
              onClick={() => setConsultationType('followup')}
              disabled={!patientId}
              className={cn(
                'p-4 rounded-xl border text-left transition-all',
                'hover:border-primary/50 hover:bg-primary/5',
                consultationType === 'followup' && 'border-primary bg-primary/5',
                !patientId && 'opacity-50 cursor-not-allowed'
              )}
            >
              <span className="font-medium">Follow-up</span>
            </button>
          </div>

          {errors.consultationType && (
            <p className="text-sm text-destructive mt-2">{errors.consultationType}</p>
          )}
        </section>

        {/* Previous Consultations (if follow-up and patient selected) */}
        {consultationType === 'followup' &&
          patientId &&
          patientPreviousConsultations.length > 0 && (
            <section>
              <h3 className="text-sm font-medium text-muted-foreground mb-4">
                {selectedPatient?.name}'s previous consultations
              </h3>

              <Card className="space-y-0 overflow-hidden divide-y">
                {patientPreviousConsultations.map((consultation) => (
                  <DoctorCard
                    key={consultation.doctor.id}
                    doctor={consultation.doctor}
                    slots={consultation.slots}
                    selectedTime={
                      quickBookDoctorId === consultation.doctor.id ? quickBookTime : null
                    }
                    isSelected={quickBookDoctorId === consultation.doctor.id}
                    onSelectTime={(time) => handleQuickBook(consultation.doctor.id, time)}
                  />
                ))}
              </Card>
            </section>
          )}
      </div>
    </GuidedBookingLayout>
  );
}

// DoctorCard component for previous consultations
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
    const modeLabels: Record<string, string> = {
      video: 'Video',
      in_person: 'In-hospital',
    };
    return modes.map((m) => modeLabels[m] || m).join(' and ');
  };

  return (
    <div
      className={cn(
        'p-4 bg-white transition-all',
        isSelected && 'bg-primary/5 border-2 border-primary'
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
        <div className="flex-shrink-0">
          <span className="inline-block px-2 py-1 text-xs font-medium text-primary bg-primary/10 rounded">
            {formatConsultationModes(doctor.consultation_modes)}
          </span>
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
              'px-3 py-1.5 text-sm rounded-lg border transition-all',
              'hover:border-primary/50 hover:bg-primary/5',
              slot.preferred && 'relative',
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
