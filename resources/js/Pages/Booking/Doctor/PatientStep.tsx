import { useState, useRef, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { GuidedBookingLayout } from '@/Layouts/GuidedBookingLayout';
import { Card } from '@/Components/ui/card';
import { Textarea } from '@/Components/ui/textarea';
import { FollowUpBanner } from '@/Components/Booking/FollowUpBanner';
import { SymptomChips } from '@/Components/Booking/SymptomChips';
import { PatientSelector } from '@/Components/Booking/PatientSelector';
import InlineMemberTypeSelector from '@/Features/booking-chat/embedded/InlineMemberTypeSelector';
import { EmbeddedFollowUpReason, type FollowUpReasonOption } from '@/Features/booking-chat/embedded/EmbeddedFollowUpReason';
import { EmbeddedAppointmentType } from '@/Features/booking-chat/embedded/EmbeddedAppointmentType';
import { Button } from '@/Components/ui/button';
import { cn } from '@/Lib/utils';
import { ArrowRight } from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';
import { DoctorCard, type Doctor as DoctorCardDoctor, type TimeSlot as DoctorCardTimeSlot } from '@/Components/Booking/DoctorCard';

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

interface TimeSlot extends DoctorCardTimeSlot {}

interface Doctor extends DoctorCardDoctor {}

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
          <h2 className="text-step-title mb-2">Who is this appointment for?</h2>
          <p className="text-body text-muted-foreground mb-4">
            Select a family member or add a new patient
          </p>

          <PatientSelector
            patients={members.map(m => ({
              id: m.id,
              name: m.name,
              avatar: m.avatar,
              relation: m.relationship
            }))}
            selected={patientId}
            onSelect={handlePatientSelect}
            onAddMember={() => setShowAddMemberInline(true)}
            disabled={false}
          />

          {/* Inline Member Type Selector */}
          {showAddMemberInline && (
            <div className="mt-4">
              <InlineMemberTypeSelector
                onComplete={handleMemberAdded}
                onCancel={() => setShowAddMemberInline(false)}
              />
            </div>
          )}

          {errors.patient && (
            <p className="text-body text-destructive mt-2">{errors.patient}</p>
          )}

        </section>

        {/* 2. Appointment Type */}
        {patientId && showAppointmentType && (
          <section ref={appointmentTypeSectionRef}>
            <h2 className="text-step-title mb-2">
              Is this a new consultation or a follow-up?
            </h2>
            <p className="text-body text-muted-foreground mb-4">
              Follow-ups will show your previous doctors
            </p>

            <EmbeddedAppointmentType
              selectedType={appointmentType}
              onSelect={handleAppointmentTypeSelect}
              disabled={false}
            />

            {errors.appointmentType && (
              <p className="text-body text-destructive mt-2">{errors.appointmentType}</p>
            )}
          </section>
        )}

        {/* 3. Follow-up Reason - Only for follow-up appointments */}
        {isFollowup && showFollowupReason && (
          <section ref={followupReasonRef}>
            <h2 className="text-step-title mb-2">What brings you back?</h2>
            <p className="text-body text-muted-foreground mb-4">
              This helps us prepare for your visit
            </p>

            <EmbeddedFollowUpReason
              selectedReason={followupReason}
              onSelect={handleFollowupReasonSelect}
              disabled={false}
              reasons={followUpReasonOptions}
            />

            {errors.followupReason && (
              <p className="text-body text-destructive mt-2">{errors.followupReason}</p>
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

            <h2 className="text-step-title mb-2">
              {getFollowupNotesPrompt().heading}
            </h2>
            <p className="text-body text-muted-foreground mb-4">
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
                <Button
                  variant="link"
                  onClick={handleFollowupNotesSkip}
                  className="h-auto p-0 text-body text-muted-foreground hover:text-foreground transition-colors"
                >
                  Skip this step
                </Button>
              )}
            </div>
          </section>
        )}

        {/* 5. Previous Consultations Quick Book - Follow-up only, after notes */}
        {isFollowup &&
          showPreviousDoctors &&
          patientPreviousConsultations.length > 0 && (
            <section ref={previousDoctorsRef}>
              <h2 className="text-step-title mb-2">
                Book with a previous doctor?
              </h2>
              <p className="text-body text-muted-foreground mb-4">
                {selectedPatient?.name}'s previous appointments
              </p>

              <Card className="overflow-hidden">
                <div className="divide-y">
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
                </div>
              </Card>

            </section>
          )}

        {/* 6. Symptoms Section - New appointments: after type, Follow-up: skipped (notes replace it) */}
        {appointmentType === 'new' && showSymptoms && (
          <section ref={symptomsSectionRef}>
            <h2 className="text-step-title mb-2">What symptoms are you experiencing?</h2>
            <p className="text-body text-muted-foreground mb-4">
              Select all that apply, or describe in your own words
            </p>

            <div className="space-y-4">
              <SymptomChips
                symptoms={symptoms}
                selectedIds={selectedSymptoms}
                onToggle={handleSymptomToggle}
              />

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

