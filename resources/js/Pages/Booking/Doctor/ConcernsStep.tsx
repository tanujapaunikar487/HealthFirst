import { useState, useRef, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { GuidedBookingLayout } from '@/Layouts/GuidedBookingLayout';
import { FollowUpBanner } from '@/Components/Booking/FollowUpBanner';
import { SymptomChips } from '@/Components/Booking/SymptomChips';
import { EmbeddedUrgencySelector } from '@/Features/booking-chat/embedded/EmbeddedUrgencySelector';
import { Card } from '@/Components/ui/card';
import { HStack, VStack } from '@/Components/ui/stack';
import { Textarea } from '@/Components/ui/textarea';
import { Button } from '@/Components/ui/button';
import { cn } from '@/Lib/utils';

const doctorSteps = [
  { id: 'patient', label: 'Patient' },
  { id: 'concerns', label: 'Concerns' },
  { id: 'doctor_time', label: 'Doctor & Time' },
  { id: 'confirm', label: 'Confirm' },
];

interface Symptom {
  id: string;
  name: string;
}

interface UrgencyOption {
  value: string;
  label: string;
  description: string;
  doctorCount?: number;
}

interface FollowUpData {
  symptoms: string[];
  doctorName: string;
  date: string;
}

interface Props {
  symptoms: Symptom[];
  urgencyOptions: UrgencyOption[];
  followUp?: FollowUpData;
  patientName?: string;
  consultationType?: 'new' | 'followup';
  savedData?: {
    selectedSymptoms?: string[];
    symptomNotes?: string;
    urgency?: string;
  };
}

export default function ConcernsStep({
  symptoms,
  urgencyOptions,
  followUp,
  patientName,
  consultationType,
  savedData,
}: Props) {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(
    savedData?.selectedSymptoms || []
  );
  const [symptomNotes, setSymptomNotes] = useState(savedData?.symptomNotes || '');
  const [urgency, setUrgency] = useState<string | null>(savedData?.urgency || null);
  const [showUrgency, setShowUrgency] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const urgencySectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if ((selectedSymptoms.length > 0 || symptomNotes.trim().length > 0) && urgencySectionRef.current) {
      setTimeout(() => {
        urgencySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [selectedSymptoms.length, symptomNotes]);

  const handleSymptomToggle = (symptomId: string) => {
    const symptom = symptoms.find((s) => s.id === symptomId);
    if (!symptom) return;

    const isCurrentlySelected = selectedSymptoms.includes(symptomId);

    if (isCurrentlySelected) {
      // Remove from selection and remove from textarea
      setSelectedSymptoms((prev) => prev.filter((id) => id !== symptomId));
      setSymptomNotes((prev) => {
        const symptomName = symptom.name;
        let updated = prev
          .replace(new RegExp(`${symptomName},\\s*`, 'g'), '') // "Symptom, " -> ""
          .replace(new RegExp(`,\\s*${symptomName}`, 'g'), '') // ", Symptom" -> ""
          .replace(new RegExp(`${symptomName}`, 'g'), '');     // "Symptom" -> ""
        return updated.trim();
      });
    } else {
      // Add to selection and append to textarea
      setSelectedSymptoms((prev) => [...prev, symptomId]);
      setSymptomNotes((prev) => {
        const symptomName = symptom.name;
        if (!prev.trim()) return symptomName;
        return prev.trim() + ', ' + symptomName;
      });
    }
  };

  const handleSymptomContinue = () => {
    setShowUrgency(true);
  };

  const handleBack = () => {
    router.get('/booking/doctor/patient');
  };

  const handleContinue = () => {
    const newErrors: Record<string, string> = {};

    if (!urgency) {
      newErrors.urgency = 'Please select how soon you need to see a doctor';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      router.post('/booking/doctor/concerns', {
        selectedSymptoms,
        symptomNotes,
        urgency,
      });
    }
  };

  return (
    <GuidedBookingLayout
      steps={doctorSteps}
      currentStepId="concerns"
      onBack={handleBack}
      onContinue={handleContinue}
      continueDisabled={!urgency}
    >
      <VStack gap={12}>
        {/* Follow-up Banner */}
        {followUp && (
          <FollowUpBanner
            symptoms={followUp.symptoms}
            doctorName={followUp.doctorName}
            date={followUp.date}
          />
        )}

        {/* Symptoms - Always visible */}
        <section>
          <VStack gap={4}>
            <VStack gap={1}>
              <h2 className="text-section-title">What symptoms are you experiencing?</h2>
              <p className="text-body text-muted-foreground">
                Select all that apply, or describe in your own words
              </p>
            </VStack>

            <VStack gap={4}>
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
            </VStack>
          </VStack>
        </section>

        {/* Urgency - Show after symptoms are entered */}
        {(selectedSymptoms.length > 0 || symptomNotes.trim().length > 0) && (
          <section ref={urgencySectionRef}>
            <VStack gap={4}>
              <VStack gap={1}>
                <h2 className="text-section-title">How soon do you need to see a doctor?</h2>
                <p className="text-body text-muted-foreground">
                  This determines which slots you'll see
                </p>
              </VStack>

            <EmbeddedUrgencySelector
              selectedUrgency={urgency}
              onSelect={setUrgency}
              disabled={false}
            />

            {errors.urgency && <p className="text-body text-destructive">{errors.urgency}</p>}
            </VStack>
          </section>
        )}
      </VStack>
    </GuidedBookingLayout>
  );
}
