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
import { getAvatarColor } from '@/Lib/avatar-colors';
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


const relationColorIndices: Record<string, number> = {
  self: 0, mother: 1, father: 2, brother: 3, sister: 4,
  spouse: 1, son: 2, daughter: 3, grandmother: 4, grandfather: 0, other: 2,
};

function getRelationColor(relation: string) {
  const idx = relationColorIndices[relation] ?? 2;
  return getAvatarColor(idx);
}

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
    <div className="w-full max-w-[800px]">
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-2">
          <Pulse className="h-9 w-48" />
          <Pulse className="h-4 w-24" />
        </div>
        <Pulse className="h-10 w-32 rounded-full" />
      </div>
      <div className="rounded-xl border border-border overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-border last:border-0">
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
      <div className="w-full max-w-[800px] min-h-full flex flex-col">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1
              className="font-bold"
              style={{
                fontSize: '36px',
                lineHeight: '44px',
                letterSpacing: '-1px',
                color: 'hsl(var(--foreground))',
              }}
            >
              Family Members
            </h1>
            {!canCreate && memberCount >= 12 && (
              <p className="text-body text-muted-foreground mt-1">
                You've reached the maximum of 12 family members.
              </p>
            )}
          </div>
          {canCreate && members.length > 0 && (
            <Button
              onClick={openAddForm}
              size="lg"
            >
              <AddTeam className="h-[20px] w-[20px]" />
              Add member
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
          <div className="divide-y divide-border rounded-3xl border border-border bg-card overflow-hidden">
            {members.map(member => {
              const colors = getRelationColor(member.relation);

              return (
                <div
                  key={member.id}
                  onClick={() => router.visit(`/family-members/${member.id}`)}
                  className="flex items-center gap-4 px-4 py-3.5 cursor-pointer transition-colors hover:bg-accent"
                >
                  {/* Avatar */}
                  <div
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-card-title"
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
                    <span className="truncate text-base font-medium text-foreground">
                      {member.name}
                    </span>
                    {member.alert_count > 0 && (
                      <Badge variant="warning">Needs attention</Badge>
                    )}
                  </div>

                  {/* Chevron */}
                  <Button variant="secondary" iconOnly size="md"><ChevronRight className="h-5 w-5" /></Button>
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
