import { useState } from 'react';
import { router } from '@inertiajs/react';
import { GuidedBookingLayout } from '@/Layouts/GuidedBookingLayout';
import { Avatar, AvatarImage, AvatarFallback } from '@/Components/ui/avatar';
import { Card } from '@/Components/ui/card';
import InlineMemberTypeSelector from '@/Features/booking-chat/embedded/InlineMemberTypeSelector';
import { Button } from '@/Components/ui/button';
import { ArrowRight } from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';
import { cn } from '@/Lib/utils';
import { getAvatarColorByName } from '@/Lib/avatar-colors';

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

          <Card className="overflow-hidden">
            <div className="divide-y">
              {members.map((member) => {
                const avatarColor = getAvatarColorByName(member.name);
                return (
                  <Button
                    key={member.id}
                    variant="ghost"
                    onClick={() => setPatientId(member.id)}
                    className={cn(
                      'w-full h-auto px-6 py-4 rounded-none text-left transition-all flex items-center gap-3',
                      'hover:bg-muted/50',
                      patientId === member.id && 'bg-primary/5'
                    )}
                  >
                    <Avatar className="w-10 h-10 shrink-0">
                      <AvatarImage src={member.avatar || undefined} />
                      <AvatarFallback
                        className="text-label"
                        style={{
                          backgroundColor: `hsl(${avatarColor.bg})`,
                          color: `hsl(${avatarColor.text})`,
                        }}
                      >
                        {member.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-label text-foreground">{member.name}</p>
                      <p className="text-body text-muted-foreground">{member.relationship}</p>
                    </div>
                  </Button>
                );
              })}
            </div>
          </Card>

          {!showAddMemberInline && (
            <Button
              variant="outline"
              onClick={() => setShowAddMemberInline(true)}
              className="mt-3 h-auto inline-flex items-center gap-1 px-4 py-2.5 rounded-full text-body text-foreground hover:border-primary/50 hover:bg-primary/5 transition-all"
            >
              Add family member or guest
              <Icon icon={ArrowRight} className="h-4 w-4" />
            </Button>
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

          {errors.patient && <p className="text-body text-destructive mt-2">{errors.patient}</p>}
        </section>
      </div>
    </GuidedBookingLayout>
  );
}
