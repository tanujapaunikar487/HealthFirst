import { useState, useRef, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { GuidedBookingLayout } from '@/Layouts/GuidedBookingLayout';
import { Avatar, AvatarImage, AvatarFallback } from '@/Components/ui/avatar';
import { Card } from '@/Components/ui/card';
import { Textarea } from '@/Components/ui/textarea';
import { Button } from '@/Components/ui/button';
import { ArrowRight, User } from 'lucide-react';
import { cn } from '@/Lib/utils';

const labSteps = [
  { id: 'patient_test', label: 'Patient & Test' },
  { id: 'packages_schedule', label: 'Packages & Schedule' },
  { id: 'confirm', label: 'Confirm' },
];

const testTypes = [
  { id: 'annual_checkup', name: 'Annual checkup' },
  { id: 'diabetes_screening', name: 'Diabetes screening' },
  { id: 'heart_health', name: 'Heart health check' },
  { id: 'thyroid_profile', name: 'Thyroid profile' },
  { id: 'kidney_function', name: 'Kidney function' },
  { id: 'liver_function', name: 'Liver function' },
  { id: 'lipid_profile', name: 'Lipid profile' },
];

interface FamilyMember {
  id: string;
  name: string;
  avatar: string | null;
  relationship: string;
}

interface UrgencyOption {
  value: string;
  label: string;
  description: string;
  packagesCount?: number;
}

interface Props {
  familyMembers: FamilyMember[];
  urgencyOptions: UrgencyOption[];
  savedData?: {
    patientId?: string;
    selectedTestTypes?: string[];
    testNotes?: string;
    urgency?: string;
  };
}

export default function PatientTestStep({ familyMembers, urgencyOptions, savedData }: Props) {
  const [patientId, setPatientId] = useState<string | null>(savedData?.patientId || null);
  const [selectedTestTypes, setSelectedTestTypes] = useState<string[]>(
    savedData?.selectedTestTypes || []
  );
  const [testNotes, setTestNotes] = useState(savedData?.testNotes || '');
  const [urgency, setUrgency] = useState<string | null>(savedData?.urgency || null);
  const [showUrgency, setShowUrgency] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedPatient = familyMembers.find((f) => f.id === patientId);
  const urgencySectionRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to urgency section when it becomes visible
  useEffect(() => {
    if (showUrgency && urgencySectionRef.current) {
      setTimeout(() => {
        urgencySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [showUrgency]);

  const handleTestTypeToggle = (testId: string) => {
    const test = testTypes.find((t) => t.id === testId);
    if (!test) return;

    const isCurrentlySelected = selectedTestTypes.includes(testId);

    if (isCurrentlySelected) {
      // Remove from selection and remove from textarea
      setSelectedTestTypes((prev) => prev.filter((id) => id !== testId));
      setTestNotes((prev) => {
        // Remove the test name from textarea
        const testName = test.name;
        // Handle various cases: at start, middle, or end with commas
        let updated = prev
          .replace(new RegExp(`${testName},\\s*`, 'g'), '') // "Test, " -> ""
          .replace(new RegExp(`,\\s*${testName}`, 'g'), '') // ", Test" -> ""
          .replace(new RegExp(`${testName}`, 'g'), '');     // "Test" -> ""
        return updated.trim();
      });
    } else {
      // Add to selection and append to textarea
      setSelectedTestTypes((prev) => [...prev, testId]);
      setTestNotes((prev) => {
        const testName = test.name;
        // If textarea is empty, just add the test name
        if (!prev.trim()) return testName;
        // If textarea has content, append with comma separator
        return prev.trim() + ', ' + testName;
      });
    }
  };

  const handleTestContinue = () => {
    setShowUrgency(true);
  };

  const handleBack = () => {
    router.get('/booking');
  };

  const handleContinue = () => {
    const newErrors: Record<string, string> = {};

    if (!patientId) {
      newErrors.patient = 'Please select a patient';
    }
    if (!urgency) {
      newErrors.urgency = 'Please select how soon you need the test';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      router.post('/booking/lab/patient-test', {
        patientId,
        selectedTestTypes,
        testNotes,
        urgency,
      });
    }
  };

  return (
    <GuidedBookingLayout
      steps={labSteps}
      currentStepId="patient_test"
      onBack={handleBack}
      onContinue={handleContinue}
      continueDisabled={!patientId || !urgency}
    >
      <div className="space-y-10">
        {/* Patient Selection - Always visible */}
        <section>
          <h2 className="text-xl font-semibold mb-2">Who is this for?</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Select a family member or add a new patient
          </p>

          <div className="grid grid-cols-2 gap-3">
            {familyMembers.map((member) => (
              <button
                key={member.id}
                onClick={() => setPatientId(member.id)}
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

          {errors.patient && <p className="text-sm text-destructive mt-2">{errors.patient}</p>}
        </section>

        {/* Test Type Selection - Show only after patient is selected */}
        {patientId && (
          <section>
            <h2 className="text-xl font-semibold mb-2">What kind of test are you looking for?</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Select a common test or describe your needs
            </p>

            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {testTypes.map((test) => (
                  <button
                    key={test.id}
                    onClick={() => handleTestTypeToggle(test.id)}
                    className={cn(
                      'px-4 py-2 rounded-full border text-sm transition-all',
                      'hover:border-primary/50 hover:bg-primary/5',
                      selectedTestTypes.includes(test.id)
                        ? 'bg-primary/10 border-primary text-primary font-medium'
                        : 'bg-background border-border text-foreground'
                    )}
                  >
                    {test.name}
                  </button>
                ))}
              </div>

              <Textarea
                placeholder="Describe your symptoms, concerns, or tests you're looking for.."
                value={testNotes}
                onChange={(e) => setTestNotes(e.target.value)}
                rows={4}
              />

              {/* Continue button - Show when tests are selected or notes entered, hide when urgency is visible */}
              {(selectedTestTypes.length > 0 || testNotes.trim().length > 0) && !showUrgency && (
                <Button
                  onClick={handleTestContinue}
                  variant="outline"
                  className="border-border hover:bg-accent"
                >
                  Continue
                </Button>
              )}
            </div>
          </section>
        )}

        {/* Urgency - Show after continue button is clicked */}
        {showUrgency && (
          <section ref={urgencySectionRef}>
            <h2 className="text-xl font-semibold mb-2">How soon do you want your test done?</h2>
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
                      option.value === 'urgent' ? 'bg-red-500' : 'bg-amber-500'
                    )}
                  />
                  <div className="flex-1">
                    <p className="font-medium">{option.label}</p>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                  {option.packagesCount !== undefined ? (
                    <span className="text-sm text-muted-foreground">{option.packagesCount} packages</span>
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
