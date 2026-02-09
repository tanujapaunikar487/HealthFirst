import { useState } from 'react';
import { router } from '@inertiajs/react';
import { GuidedBookingLayout } from '@/Layouts/GuidedBookingLayout';
import { PatientSelector } from '@/Components/Booking/PatientSelector';
import InlineMemberTypeSelector from '@/Features/booking-chat/embedded/InlineMemberTypeSelector';

const labSteps = [
  { id: 'patient', label: 'Patient' },
  { id: 'test_search', label: 'Find Tests' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'confirm', label: 'Confirm' },
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
  };
}

export default function PatientStep({ familyMembers, savedData }: Props) {
  const [patientId, setPatientId] = useState<string | null>(savedData?.patientId || null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAddMemberInline, setShowAddMemberInline] = useState(false);
  const [members, setMembers] = useState(familyMembers);

  const handleBack = () => {
    router.get('/booking');
  };

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
  };

  const handleContinue = () => {
    if (!patientId) {
      setErrors({ patient: 'Please select a patient' });
      return;
    }

    router.post('/booking/lab/patient', { patientId });
  };

  return (
    <GuidedBookingLayout
      steps={labSteps}
      currentStepId="patient"
      onBack={handleBack}
      onContinue={handleContinue}
      continueDisabled={!patientId}
    >
      <div className="space-y-12">
        <section>
          <h2 className="text-step-title mb-2">Who is this for?</h2>
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
            onSelect={setPatientId}
            onAddMember={() => setShowAddMemberInline(true)}
            disabled={false}
          />

          {/* Inline Member Type Selector */}
          {showAddMemberInline && (
            <div className="mt-4 p-4 border rounded-xl bg-muted/30">
              <InlineMemberTypeSelector
                onComplete={handleMemberAdded}
                onCancel={() => setShowAddMemberInline(false)}
              />
            </div>
          )}

          {errors.patient && <p className="text-body text-destructive mt-2">{errors.patient}</p>}
        </section>
      </div>
    </GuidedBookingLayout>
  );
}
