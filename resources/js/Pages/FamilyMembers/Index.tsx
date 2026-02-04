import { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Pulse, ErrorState, useSkeletonLoading } from '@/Components/ui/skeleton';
import { CtaBanner } from '@/Components/ui/cta-banner';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import {
  Sheet,
  SheetContent,
} from '@/Components/ui/sheet';
import { Toast } from '@/Components/ui/toast';
import EmbeddedFamilyMemberFlow from '@/Features/booking-chat/embedded/EmbeddedFamilyMemberFlow';
import { AddTeam, Users, AlertTriangle, ChevronRight } from '@/Lib/icons';

/* ─── Types ─── */

interface FamilyMember {
  id: number;
  name: string;
  relation: string;
  age: number | null;
  gender: string | null;
  blood_group: string | null;
  avatar_url: string | null;
  alert_count: number;
}

interface Props {
  members: FamilyMember[];
  canCreate: boolean;
  memberCount: number;
  alertMemberCount: number;
}

/* ─── Constants ─── */


const relationColors: Record<string, { bg: string; text: string }> = {
  self:        { bg: '#DBEAFE', text: '#1E40AF' },
  mother:      { bg: '#FCE7F3', text: '#9D174D' },
  father:      { bg: '#E0E7FF', text: '#3730A3' },
  brother:     { bg: '#DCFCE7', text: '#166534' },
  sister:      { bg: '#F3E8FF', text: '#6B21A8' },
  spouse:      { bg: '#FFE4E6', text: '#9F1239' },
  son:         { bg: '#CCFBF1', text: '#115E59' },
  daughter:    { bg: '#FEF3C7', text: '#92400E' },
  grandmother: { bg: '#FFEDD5', text: '#9A3412' },
  grandfather: { bg: '#E2E8F0', text: '#334155' },
  other:       { bg: '#F3F4F6', text: '#374151' },
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}


/* ─── Skeleton ─── */

function FamilyMembersSkeleton() {
  return (
    <div className="w-full max-w-[800px]" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-2">
          <Pulse className="h-9 w-48" />
          <Pulse className="h-4 w-24" />
        </div>
        <Pulse className="h-10 w-32 rounded-full" />
      </div>
      <div className="rounded-xl border border-border overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-border last:border-0">
            <Pulse className="h-11 w-11 rounded-full flex-shrink-0" />
            <div className="space-y-2 flex-1">
              <Pulse className="h-5 w-32" />
              <Pulse className="h-3 w-16" />
            </div>
            <Pulse className="h-5 w-5 rounded flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Component ─── */

export default function FamilyMembersIndex({ members, canCreate, memberCount, alertMemberCount }: Props) {
  const { isLoading, hasError, retry } = useSkeletonLoading(members);
  const { props } = usePage<{ toast?: string }>();
  const user = (usePage().props as any).auth?.user;

  const [showForm, setShowForm] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Auto-open form when ?create=1 is in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('create') === '1') {
      openAddForm();
      window.history.replaceState({}, '', '/family-members');
    }
  }, []);

  // Flash toast from server
  useEffect(() => {
    if (props.toast) {
      setToastMessage(props.toast);
    }
  }, [props.toast]);

  if (hasError) {
    return (
      <AppLayout user={user} pageTitle="Family Members" pageIcon="/assets/icons/family.svg">
        <ErrorState onRetry={retry} label="Unable to load family members" />
      </AppLayout>
    );
  }

  if (isLoading) {
    return (
      <AppLayout user={user} pageTitle="Family Members" pageIcon="/assets/icons/family.svg">
        <FamilyMembersSkeleton />
      </AppLayout>
    );
  }

  function openAddForm() {
    setShowForm(true);
  }

  function handleWizardComplete() {
    // Wizard handles reload internally in standalone mode
    setShowForm(false);
  }

  return (
    <AppLayout
      user={user}
      pageTitle="Family Members"
      pageIcon={AddTeam}
    >
      <div className="w-full max-w-[800px]" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1
              className="font-bold"
              style={{
                fontSize: '36px',
                lineHeight: '44px',
                letterSpacing: '-1px',
                color: '#171717',
              }}
            >
              Family Members
            </h1>
            {!canCreate && memberCount >= 12 && (
              <p className="text-sm text-muted-foreground mt-1">
                You've reached the maximum of 12 family members.
              </p>
            )}
          </div>
          {canCreate && members.length > 0 && (
            <Button
              onClick={openAddForm}
              size="lg"
            >
              <AddTeam className="h-4 w-4" />
              Add Member
            </Button>
          )}
        </div>

        {/* Member List or Empty State */}
        {members.length === 0 ? (
          <CtaBanner
            heading="Add your first family member"
            description="Add family members to book appointments and manage health records for them."
            buttonText="Add family member"
            onButtonClick={openAddForm}
            imageSrc="/assets/images/family.png"
            imageAlt="Family members illustration"
          />
        ) : (
          <div className="divide-y divide-gray-100 rounded-[20px] border border-gray-200 bg-white overflow-hidden">
            {members.map(member => {
              const colors = relationColors[member.relation] || relationColors.other;

              return (
                <div
                  key={member.id}
                  onClick={() => router.visit(`/family-members/${member.id}`)}
                  className="flex items-center gap-4 px-4 py-3.5 cursor-pointer transition-colors hover:bg-gray-50"
                >
                  {/* Avatar */}
                  <div
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                    style={{ backgroundColor: colors.bg, color: colors.text }}
                  >
                    {member.avatar_url ? (
                      <img src={member.avatar_url} className="h-10 w-10 rounded-full object-cover" alt={member.name} />
                    ) : (
                      getInitials(member.name)
                    )}
                  </div>

                  {/* Name + Badge */}
                  <div className="flex flex-1 items-center gap-2">
                    <span className="truncate text-sm font-medium text-gray-900">
                      {member.name}
                    </span>
                    {member.alert_count > 0 && (
                      <Badge variant="warning">Needs Attention</Badge>
                    )}
                  </div>

                  {/* Chevron */}
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-400" />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Sheet */}
      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent>
          <EmbeddedFamilyMemberFlow
            mode="standalone"
            onComplete={handleWizardComplete}
            onCancel={() => setShowForm(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Toast */}
      <Toast
        message={toastMessage}
        show={!!toastMessage}
        onHide={() => setToastMessage('')}
      />
    </AppLayout>
  );
}
