import { useState, useRef, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { GuidedBookingLayout } from '@/Layouts/GuidedBookingLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
import { Card } from '@/Components/ui/card';
import { Textarea } from '@/Components/ui/textarea';
import { FollowUpBanner } from '@/Components/Booking/FollowUpBanner';
import InlineMemberTypeSelector from '@/Features/booking-chat/embedded/InlineMemberTypeSelector';
import { cn } from '@/Lib/utils';
import { ArrowRight, Star, CalendarClock, RefreshCw, AlertCircle } from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';

const doctorSteps = [
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

interface Symptom {
  id: string;
  name: string;
}

interface FollowUpData {
  symptoms: string[];
  doctorName: string;
  date: string;
}

interface FollowUpReasonOption {
  value: string;
  label: string;
  description: string;
}

interface Props {
  familyMembers: FamilyMember[];
  previousConsultations: PreviousConsultation[];
  symptoms: Symptom[];
  followUpReasonOptions: FollowUpReasonOption[];
  followUp?: FollowUpData;
  savedData?: {
    patientId?: string;
    appointmentType?: 'new' | 'followup';
    followupReason?: string;
    followupNotes?: string;
    quickBookDoctorId?: string;
    quickBookTime?: string;
    selectedSymptoms?: string[];
    symptomNotes?: string;
  };
}

export default function PatientStep({
  familyMembers,
  previousConsultations,
  symptoms,
  followUpReasonOptions,
  followUp,
  savedData
}: Props) {
  const [patientId, setPatientId] = useState<string | null>(savedData?.patientId || null);
  const [appointmentType, setAppointmentType] = useState<'new' | 'followup' | null>(
    savedData?.appointmentType || null
  );
  const [followupReason, setFollowupReason] = useState<string | null>(
    savedData?.followupReason || null
  );
  const [followupNotes, setFollowupNotes] = useState(savedData?.followupNotes || '');
  const [quickBookDoctorId, setQuickBookDoctorId] = useState<string | null>(
    savedData?.quickBookDoctorId || null
  );
  const [quickBookTime, setQuickBookTime] = useState<string | null>(
    savedData?.quickBookTime || null
  );
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(
    savedData?.selectedSymptoms || []
  );
  const [symptomNotes, setSymptomNotes] = useState(savedData?.symptomNotes || '');
  const [showAppointmentType, setShowAppointmentType] = useState(false);
  const [showFollowupReason, setShowFollowupReason] = useState(false);
  const [showFollowupNotes, setShowFollowupNotes] = useState(false);
  const [showSymptoms, setShowSymptoms] = useState(false);
  const [showPreviousDoctors, setShowPreviousDoctors] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Add member inline state
  const [showAddMemberInline, setShowAddMemberInline] = useState(false);
  const [members, setMembers] = useState(familyMembers);

  const selectedPatient = members.find((f) => f.id === patientId);

  const appointmentTypeSectionRef = useRef<HTMLDivElement>(null);
  const followupReasonRef = useRef<HTMLDivElement>(null);
  const followupNotesRef = useRef<HTMLDivElement>(null);
  const previousDoctorsRef = useRef<HTMLDivElement>(null);
  const symptomsSectionRef = useRef<HTMLDivElement>(null);

  // Filter previous consultations for selected patient
  const patientPreviousConsultations = previousConsultations.filter(
    (c) => c.patientId === patientId
  );

  // Auto-scroll helpers
  useEffect(() => {
    if (patientId && showAppointmentType && appointmentTypeSectionRef.current) {
      setTimeout(() => {
        appointmentTypeSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [patientId, showAppointmentType]);

  useEffect(() => {
    if (showFollowupReason && followupReasonRef.current) {
      setTimeout(() => {
        followupReasonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [showFollowupReason]);

  useEffect(() => {
    if (showFollowupNotes && followupNotesRef.current) {
      setTimeout(() => {
        followupNotesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [showFollowupNotes]);

  useEffect(() => {
    if (showPreviousDoctors && previousDoctorsRef.current) {
      setTimeout(() => {
        previousDoctorsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [showPreviousDoctors]);

  useEffect(() => {
    if (showSymptoms && symptomsSectionRef.current) {
      setTimeout(() => {
        symptomsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [showSymptoms]);

  // Auto-advance: show next section after follow-up notes are typed
  useEffect(() => {
    if (showFollowupNotes && followupNotes.trim().length > 0) {
      if (patientPreviousConsultations.length > 0) {
        setShowPreviousDoctors(true);
      }
    }
  }, [showFollowupNotes, followupNotes, patientPreviousConsultations.length]);

  const handleMemberAdded = (data: {
    member_type: 'guest' | 'family';
    member_id?: number;
    member_name: string;
    relation?: string;
  }) => {
    const newMember = {
      id: data.member_id?.toString() || `temp-${Date.now()}`,
      name: data.member_name,
      avatar: null,
      relationship: data.relation ? data.relation.charAt(0).toUpperCase() + data.relation.slice(1) : 'Guest',
    };

    setMembers((prev) => [...prev, newMember]);
    setPatientId(newMember.id);
    setShowAddMemberInline(false);
    setShowAppointmentType(true);
  };

  const handleSymptomToggle = (symptomId: string) => {
    const symptom = symptoms.find((s) => s.id === symptomId);
    if (!symptom) return;

    const isCurrentlySelected = selectedSymptoms.includes(symptomId);

    if (isCurrentlySelected) {
      setSelectedSymptoms((prev) => prev.filter((id) => id !== symptomId));
      setSymptomNotes((prev) => {
        const symptomName = symptom.name;
        let updated = prev
          .replace(new RegExp(`${symptomName},\\s*`, 'g'), '')
          .replace(new RegExp(`,\\s*${symptomName}`, 'g'), '')
          .replace(new RegExp(`${symptomName}`, 'g'), '');
        return updated.trim();
      });
    } else {
      setSelectedSymptoms((prev) => [...prev, symptomId]);
      setSymptomNotes((prev) => {
        const symptomName = symptom.name;
        if (!prev.trim()) return symptomName;
        return prev.trim() + ', ' + symptomName;
      });
    }
  };

  const handleAppointmentTypeSelect = (type: 'new' | 'followup') => {
    setAppointmentType(type);
    if (type === 'followup') {
      // Follow-up: show follow-up reason first
      setShowFollowupReason(true);
      setShowSymptoms(false);
    } else {
      // New: show symptoms directly
      setShowFollowupReason(false);
      setShowFollowupNotes(false);
      setShowPreviousDoctors(false);
      setFollowupReason(null);
      setFollowupNotes('');
      setShowSymptoms(true);
    }
  };

  const handleFollowupReasonSelect = (reason: string) => {
    setFollowupReason(reason);
    setShowFollowupNotes(true);
  };

  const handleFollowupNotesContinue = () => {
    if (patientPreviousConsultations.length > 0) {
      setShowPreviousDoctors(true);
    }
  };

  const handleFollowupNotesSkip = () => {
    setFollowupNotes('');
    handleFollowupNotesContinue();
  };

  const handleBack = () => {
    router.get('/booking');
  };

  const handleContinue = () => {
    const newErrors: Record<string, string> = {};

    if (!patientId) {
      newErrors.patient = 'Please select a patient';
    }
    if (!appointmentType) {
      newErrors.appointmentType = 'Please select appointment type';
    }
    if (appointmentType === 'followup' && !followupReason) {
      newErrors.followupReason = 'Please select a follow-up reason';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      router.post('/booking/doctor/patient', {
        patientId,
        appointmentType,
        followupReason,
        followupNotes,
        quickBookDoctorId,
        quickBookTime,
        selectedSymptoms,
        symptomNotes,
      });
    }
  };

  const handleQuickBook = (doctorId: string, time: string) => {
    setQuickBookDoctorId(doctorId);
    setQuickBookTime(time);
  };

  const handlePatientSelect = (id: string) => {
    setPatientId(id);
    if (appointmentType === 'followup') {
      setQuickBookDoctorId(null);
      setQuickBookTime(null);
    }
    // Auto-advance to next section
    setShowAppointmentType(true);
  };

  // Context-aware follow-up notes prompt
  const getFollowupNotesPrompt = () => {
    switch (followupReason) {
      case 'scheduled':
        return {
          heading: "Any updates for the doctor?",
          description: "Share any changes since your last visit. This helps the doctor prepare.",
          placeholder: "e.g., Symptoms improved, new prescriptions started...",
        };
      case 'new_concern':
        return {
          heading: "What new symptoms have you noticed?",
          description: "Describe any changes or new concerns since your last visit.",
          placeholder: "e.g., New rash appeared, headaches started...",
        };
      case 'ongoing_issue':
        return {
          heading: "How are your symptoms now?",
          description: "Describe what's still bothering you so the doctor can adjust treatment.",
          placeholder: "e.g., Pain hasn't improved, prescription side effects...",
        };
      default:
        return {
          heading: "Any notes for the doctor?",
          description: "Share anything that will help the doctor prepare for your visit.",
          placeholder: "Describe your concerns...",
        };
    }
  };

  // Follow-up reason icons
  const getReasonIcon = (value: string) => {
    switch (value) {
      case 'scheduled':
        return <Icon icon={CalendarClock} className="h-5 w-5 text-primary" />;
      case 'new_concern':
        return <Icon icon={AlertCircle} className="h-5 w-5 text-primary" />;
      case 'ongoing_issue':
        return <Icon icon={RefreshCw} className="h-5 w-5 text-primary" />;
      default:
        return null;
    }
  };

  const isFollowup = appointmentType === 'followup';
  const continueDisabled = !patientId || !appointmentType ||
    (isFollowup && !followupReason);

  return (
    <GuidedBookingLayout
      steps={doctorSteps}
      currentStepId="concerns"
      onBack={handleBack}
      onContinue={handleContinue}
      continueDisabled={continueDisabled}
    >
      <div className="space-y-12">
        {/* 1. Patient Selection - Always visible */}
        <section>
          <h2 className="text-xl font-semibold mb-2">Who is this appointment for?</h2>
          <p className="text-[14px] text-muted-foreground mb-4">
            Select a family member or add a new patient
          </p>

          <div className="grid grid-cols-2 gap-3">
            {members.map((member) => (
              <button
                key={member.id}
                onClick={() => handlePatientSelect(member.id)}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-full border text-left transition-all',
                  'hover:border-primary/50 hover:bg-primary/5',
                  patientId === member.id && 'border-primary bg-primary/5'
                )}
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src={member.avatar || undefined} />
                  <AvatarFallback className="bg-warning text-warning-foreground text-[14px] font-medium">
                    {member.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-[14px]">{member.name}</span>
              </button>
            ))}
          </div>

          {!showAddMemberInline && (
            <button
              onClick={() => setShowAddMemberInline(true)}
              className="mt-3 inline-flex items-center gap-1 px-4 py-2.5 rounded-full border text-[14px] text-foreground hover:border-primary/50 hover:bg-primary/5 transition-all"
            >
              Add family member or guest
              <Icon icon={ArrowRight} className="h-4 w-4" />
            </button>
          )}

          {/* Inline Member Type Selector */}
          {showAddMemberInline && (
            <div className="mt-4 p-4 border rounded-xl bg-muted/30">
              <InlineMemberTypeSelector
                onComplete={handleMemberAdded}
                onCancel={() => setShowAddMemberInline(false)}
              />
            </div>
          )}

          {errors.patient && (
            <p className="text-[14px] text-destructive mt-2">{errors.patient}</p>
          )}

        </section>

        {/* 2. Appointment Type */}
        {patientId && showAppointmentType && (
          <section ref={appointmentTypeSectionRef}>
            <h2 className="text-xl font-semibold mb-2">
              Is this a new consultation or a follow-up?
            </h2>
            <p className="text-[14px] text-muted-foreground mb-4">
              Follow-ups will show your previous doctors
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleAppointmentTypeSelect('new')}
                className={cn(
                  'px-5 py-3 rounded-full border text-left transition-all',
                  'hover:border-primary/50 hover:bg-primary/5',
                  appointmentType === 'new' && 'border-primary bg-primary/5'
                )}
              >
                <span className="font-medium">New Consultation</span>
              </button>
              <button
                onClick={() => handleAppointmentTypeSelect('followup')}
                className={cn(
                  'px-5 py-3 rounded-full border text-left transition-all',
                  'hover:border-primary/50 hover:bg-primary/5',
                  appointmentType === 'followup' && 'border-primary bg-primary/5'
                )}
              >
                <span className="font-medium">Follow-up</span>
              </button>
            </div>

            {errors.appointmentType && (
              <p className="text-[14px] text-destructive mt-2">{errors.appointmentType}</p>
            )}
          </section>
        )}

        {/* 3. Follow-up Reason - Only for follow-up appointments */}
        {isFollowup && showFollowupReason && (
          <section ref={followupReasonRef}>
            <h2 className="text-xl font-semibold mb-2">What brings you back?</h2>
            <p className="text-[14px] text-muted-foreground mb-4">
              This helps us prepare for your visit
            </p>

            <Card className="overflow-hidden">
              {followUpReasonOptions.map((option, index) => (
                <button
                  key={option.value}
                  onClick={() => handleFollowupReasonSelect(option.value)}
                  className={cn(
                    'w-full p-4 text-left transition-all flex items-center gap-4',
                    'hover:bg-muted/50',
                    followupReason === option.value && 'bg-primary/5'
                  )}
                  style={{
                    borderBottom: index < followUpReasonOptions.length - 1 ? '1px solid hsl(var(--border))' : 'none'
                  }}
                >
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    {getReasonIcon(option.value)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-[14px] text-foreground leading-tight mb-0.5">{option.label}</p>
                    <p className="text-[14px] text-muted-foreground leading-tight">{option.description}</p>
                  </div>
                </button>
              ))}
            </Card>

            {errors.followupReason && (
              <p className="text-[14px] text-destructive mt-2">{errors.followupReason}</p>
            )}
          </section>
        )}

        {/* 4. Follow-up Notes - Only for follow-up after reason selected */}
        {isFollowup && followupReason && showFollowupNotes && (
          <section ref={followupNotesRef}>
            {followUp && (
              <FollowUpBanner
                symptoms={followUp.symptoms}
                doctorName={followUp.doctorName}
                date={followUp.date}
                className="mb-6"
              />
            )}

            <h2 className="text-xl font-semibold mb-2">
              {getFollowupNotesPrompt().heading}
            </h2>
            <p className="text-[14px] text-muted-foreground mb-4">
              {getFollowupNotesPrompt().description}
            </p>

            <div className="space-y-4">
              <Textarea
                placeholder={getFollowupNotesPrompt().placeholder}
                value={followupNotes}
                onChange={(e) => setFollowupNotes(e.target.value)}
                rows={4}
              />

              {!showPreviousDoctors && !followupNotes.trim() && (
                <button
                  onClick={handleFollowupNotesSkip}
                  className="text-[14px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  Skip this step
                </button>
              )}
            </div>
          </section>
        )}

        {/* 5. Previous Consultations Quick Book - Follow-up only, after notes */}
        {isFollowup &&
          showPreviousDoctors &&
          patientPreviousConsultations.length > 0 && (
            <section ref={previousDoctorsRef}>
              <h2 className="text-xl font-semibold mb-2">
                Book with a previous doctor?
              </h2>
              <p className="text-[14px] text-muted-foreground mb-4">
                {selectedPatient?.name}'s previous appointments
              </p>

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

        {/* 6. Symptoms Section - New appointments: after type, Follow-up: skipped (notes replace it) */}
        {appointmentType === 'new' && showSymptoms && (
          <section ref={symptomsSectionRef}>
            <h2 className="text-xl font-semibold mb-2">What symptoms are you experiencing?</h2>
            <p className="text-[14px] text-muted-foreground mb-4">
              Select all that apply, or describe in your own words
            </p>

            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {symptoms.map((symptom) => (
                  <button
                    key={symptom.id}
                    onClick={() => handleSymptomToggle(symptom.id)}
                    className={cn(
                      'px-4 py-2 rounded-full border text-[14px] transition-all',
                      'hover:border-primary/50 hover:bg-primary/5',
                      selectedSymptoms.includes(symptom.id)
                        ? 'bg-primary/10 border-primary text-primary font-medium'
                        : 'bg-background border-border text-foreground'
                    )}
                  >
                    {symptom.name}
                  </button>
                ))}
              </div>

              <Textarea
                placeholder="Describe your symptoms or concerns.."
                value={symptomNotes}
                onChange={(e) => setSymptomNotes(e.target.value)}
                rows={4}
              />
            </div>
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

  const formatAppointmentModes = (modes: string[]) => {
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
        isSelected && 'bg-primary/5 border border-primary'
      )}
    >
      {/* Doctor Info */}
      <div className="flex items-start gap-3 mb-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={doctor.avatar || undefined} />
          <AvatarFallback className="bg-warning text-warning-foreground font-medium">
            {getInitial(doctor.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground">{doctor.name}</h3>
          <p className="text-[14px] text-muted-foreground">
            {doctor.specialization} &bull; {doctor.experience_years} years of experience
          </p>
        </div>
        <div className="flex-shrink-0">
          <span className="inline-block px-2 py-1 text-[14px] font-medium text-primary bg-primary/10 rounded">
            {formatAppointmentModes(doctor.consultation_modes)}
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
              'px-3 py-1.5 text-[14px] rounded-lg border transition-all',
              'hover:border-primary/50 hover:bg-primary/5',
              slot.preferred && 'relative',
              selectedTime === slot.time &&
                'bg-black text-white border-black hover:bg-black hover:border-black',
              !slot.available && 'opacity-40 cursor-not-allowed'
            )}
          >
            {slot.time}
            {slot.preferred && selectedTime !== slot.time && (
              <Icon icon={Star} className="absolute -top-1 -right-1 h-3 w-3 fill-black text-black" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
