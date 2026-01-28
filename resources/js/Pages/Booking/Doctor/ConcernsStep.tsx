import { useState } from 'react';
import { router } from '@inertiajs/react';
import { GuidedBookingLayout } from '@/Layouts/GuidedBookingLayout';
import { FollowUpBanner } from '@/Components/Booking/FollowUpBanner';
import { SymptomChips } from '@/Components/Booking/SymptomChips';
import { Textarea } from '@/Components/ui/textarea';
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
  savedData,
}: Props) {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(
    savedData?.selectedSymptoms || []
  );
  const [symptomNotes, setSymptomNotes] = useState(savedData?.symptomNotes || '');
  const [urgency, setUrgency] = useState<string | null>(savedData?.urgency || null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSymptomToggle = (symptomId: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptomId) ? prev.filter((id) => id !== symptomId) : [...prev, symptomId]
    );
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

        {/* Symptoms */}
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
          </div>
        </section>

        {/* Urgency */}
        <section>
          <h2 className="text-xl font-semibold mb-2">How soon do you need to see a doctor?</h2>
          <p className="text-sm text-muted-foreground mb-4">
            This determines which slots you'll see
          </p>

          <div className="border rounded-xl overflow-hidden divide-y">
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
          </div>

          {errors.urgency && <p className="text-sm text-destructive mt-2">{errors.urgency}</p>}
        </section>
      </div>
    </GuidedBookingLayout>
  );
}
