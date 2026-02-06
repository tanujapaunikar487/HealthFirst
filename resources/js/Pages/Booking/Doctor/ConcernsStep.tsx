import { useState, useRef, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { GuidedBookingLayout } from '@/Layouts/GuidedBookingLayout';
import { FollowUpBanner } from '@/Components/Booking/FollowUpBanner';
import { SymptomChips } from '@/Components/Booking/SymptomChips';
import { Card } from '@/Components/ui/card';
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

  const dotStyles: Record<string, { dot: string; ring: string }> = {
    urgent: { dot: 'bg-destructive', ring: 'ring-destructive/15' },
    this_week: { dot: 'bg-warning', ring: 'ring-warning/15' },
    specific_date: { dot: 'bg-primary', ring: 'ring-primary/15' },
  };

  return (
    <GuidedBookingLayout
      steps={doctorSteps}
      currentStepId="concerns"
      onBack={handleBack}
      onContinue={handleContinue}
      continueDisabled={!urgency}
    >
      <div className="space-y-12">
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
          <p className="text-[14px] text-muted-foreground mb-4">
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
                variant="secondary"
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
            <p className="text-[14px] text-muted-foreground mb-4">
              This determines which slots you'll see
            </p>

            <Card className="overflow-hidden">
              {urgencyOptions.map((option, index) => {
                const style = dotStyles[option.value] || { dot: 'bg-muted-foreground', ring: 'ring-muted-foreground/15' };
                return (
                  <Button
                    key={option.value}
                    variant="ghost"
                    onClick={() => setUrgency(option.value)}
                    className={cn(
                      'w-full h-auto flex items-start gap-3 px-6 py-4 rounded-none justify-start text-left transition-all font-normal text-[14px]',
                      'hover:bg-muted/50',
                      urgency === option.value && 'bg-primary/5'
                    )}
                    style={{
                      borderBottom: index < urgencyOptions.length - 1 ? '1px solid hsl(var(--border))' : 'none'
                    }}
                  >
                    <div
                      className={cn(
                        'mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ring-4 ring-offset-0',
                        style.dot,
                        style.ring
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[14px] leading-tight mb-0.5">{option.label}</p>
                      <p className="text-[14px] text-muted-foreground leading-tight">{option.description}</p>
                    </div>
                    {option.doctorCount !== undefined ? (
                      <span className="text-[14px] text-muted-foreground">{option.doctorCount} doctors</span>
                    ) : (
                      <span className="text-[14px] text-muted-foreground">Full flexibility</span>
                    )}
                  </Button>
                );
              })}
            </Card>

            {errors.urgency && <p className="text-[14px] text-destructive mt-2">{errors.urgency}</p>}
          </section>
        )}
      </div>
    </GuidedBookingLayout>
  );
}
