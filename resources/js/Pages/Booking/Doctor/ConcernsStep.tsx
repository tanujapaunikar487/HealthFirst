import { useState, useRef, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { GuidedBookingLayout } from '@/Layouts/GuidedBookingLayout';
import { FollowUpBanner } from '@/Components/Booking/FollowUpBanner';
import { SymptomChips } from '@/Components/Booking/SymptomChips';
import { Card } from '@/Components/ui/card';
import { Textarea } from '@/Components/ui/textarea';
import { Button } from '@/Components/ui/button';
import { cn } from '@/Lib/utils';
import { User } from 'lucide-react';

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
    if (showUrgency && urgencySectionRef.current) {
      setTimeout(() => {
        urgencySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [showUrgency]);

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

  const dotColors: Record<string, string> = {
    urgent: 'bg-red-500',
    this_week: 'bg-amber-500',
    specific_date: 'bg-amber-500',
  };

  return (
    <GuidedBookingLayout
      steps={doctorSteps}
      currentStepId="concerns"
      onBack={handleBack}
      onContinue={handleContinue}
      continueDisabled={!urgency}
    >
      <div className="space-y-10">
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
          <h2 className="text-xl font-semibold mb-2">What symptoms are you experiencing?</h2>
          <p className="text-sm text-muted-foreground mb-4">
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

            {/* Continue button - Show when symptoms are selected or notes entered, hide when urgency is visible */}
            {(selectedSymptoms.length > 0 || symptomNotes.trim().length > 0) && !showUrgency && (
              <Button
                onClick={handleSymptomContinue}
                variant="outline"
                className="border-border hover:bg-accent"
              >
                Continue
              </Button>
            )}
          </div>
        </section>

        {/* Urgency - Show after continue button is clicked */}
        {showUrgency && (
          <section ref={urgencySectionRef}>
            <h2 className="text-xl font-semibold mb-2">How soon do you need to see a doctor?</h2>
            <p className="text-sm text-muted-foreground mb-4">
              This determines which slots you'll see
            </p>

            <Card className="overflow-hidden divide-y">
              {urgencyOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setUrgency(option.value)}
                  className={cn(
                    'w-full flex items-center gap-3 p-4 text-left transition-all',
                    'hover:bg-muted/50',
                    urgency === option.value && 'bg-primary/5'
                  )}
                >
                  <div
                    className={cn(
                      'w-3 h-3 rounded-full flex-shrink-0',
                      dotColors[option.value] || 'bg-gray-400'
                    )}
                  />
                  <div className="flex-1">
                    <p className="font-medium">{option.label}</p>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                  {option.doctorCount !== undefined ? (
                    <span className="text-sm text-muted-foreground">{option.doctorCount} doctors</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">Full flexibility</span>
                  )}
                </button>
              ))}
            </Card>

            {errors.urgency && <p className="text-sm text-destructive mt-2">{errors.urgency}</p>}
          </section>
        )}
      </div>
    </GuidedBookingLayout>
  );
}
