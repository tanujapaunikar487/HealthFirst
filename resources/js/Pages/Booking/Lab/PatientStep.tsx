import { useState } from 'react';
import { router } from '@inertiajs/react';
import { GuidedBookingLayout } from '@/Layouts/GuidedBookingLayout';
import { Avatar, AvatarImage, AvatarFallback } from '@/Components/ui/avatar';
import { Sheet, SheetContent } from '@/Components/ui/sheet';
import EmbeddedFamilyMemberFlow from '@/Features/booking-chat/embedded/EmbeddedFamilyMemberFlow';
import { ArrowRight } from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';
import { cn } from '@/Lib/utils';

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
  const [showAddMemberSheet, setShowAddMemberSheet] = useState(false);
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
    setShowAddMemberSheet(false);
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
      <div className="space-y-10">
        <section>
          <h2 className="text-xl font-semibold mb-2">Who is this for?</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Select a family member or add a new patient
          </p>

          <div className="grid grid-cols-2 gap-3">
            {members.map((member) => (
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

          <button
            onClick={() => setShowAddMemberSheet(true)}
            className="mt-3 inline-flex items-center gap-1 text-sm text-foreground hover:text-primary transition-colors"
          >
            Add family member or guest
            <Icon icon={ArrowRight} className="h-4 w-4" />
          </button>

          {errors.patient && <p className="text-sm text-destructive mt-2">{errors.patient}</p>}
        </section>
      </div>

      {/* Add Family Member Sheet */}
      <Sheet open={showAddMemberSheet} onOpenChange={setShowAddMemberSheet}>
        <SheetContent>
          <EmbeddedFamilyMemberFlow
            mode="guided"
            onComplete={handleMemberAdded}
            onCancel={() => setShowAddMemberSheet(false)}
          />
        </SheetContent>
      </Sheet>
    </GuidedBookingLayout>
  );
}
