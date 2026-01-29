import { useState } from 'react';
import { router } from '@inertiajs/react';
import { GuidedBookingLayout } from '@/Layouts/GuidedBookingLayout';
import { Avatar, AvatarImage, AvatarFallback } from '@/Components/ui/avatar';
import { Card } from '@/Components/ui/card';
import { Textarea } from '@/Components/ui/textarea';
import { ArrowRight } from 'lucide-react';
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

interface Props {
  familyMembers: FamilyMember[];
  savedData?: {
    patientId?: string;
    selectedTestTypes?: string[];
    testNotes?: string;
  };
}

export default function PatientTestStep({ familyMembers, savedData }: Props) {
  const [patientId, setPatientId] = useState<string | null>(savedData?.patientId || null);
  const [selectedTestTypes, setSelectedTestTypes] = useState<string[]>(
    savedData?.selectedTestTypes || []
  );
  const [testNotes, setTestNotes] = useState(savedData?.testNotes || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleTestTypeToggle = (testId: string) => {
    setSelectedTestTypes((prev) =>
      prev.includes(testId) ? prev.filter((id) => id !== testId) : [...prev, testId]
    );
  };

  const handleBack = () => {
    router.get('/booking');
  };

  const handleContinue = () => {
    const newErrors: Record<string, string> = {};

    if (!patientId) {
      newErrors.patient = 'Please select a patient';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      router.post('/booking/lab/patient-test', {
        patientId,
        selectedTestTypes,
        testNotes,
      });
    }
  };

  return (
    <GuidedBookingLayout
      steps={labSteps}
      currentStepId="patient_test"
      onBack={handleBack}
      onContinue={handleContinue}
      continueDisabled={!patientId}
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

        {/* Test Type Selection - Only show after patient is selected */}
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
            </div>
          </section>
        )}
      </div>
    </GuidedBookingLayout>
  );
}
