import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { ChevronRight } from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  avatar_url?: string;
}

interface Patient {
  id: number;
  first_name: string;
  last_name: string;
}

interface ProfileStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

interface ProfileCompletion {
  steps: ProfileStep[];
  completed: number;
  total: number;
}

interface FamilyMember {
  id: number;
  name: string;
  avatar_url?: string;
}

interface DashboardProps {
  user: User & { patient?: Patient };
  profileCompletion: ProfileCompletion;
  familyMembers: FamilyMember[];
  upcomingAppointmentsCount: number;
}

export default function Dashboard({
  user,
  profileCompletion,
  familyMembers,
  upcomingAppointmentsCount,
}: DashboardProps) {
  // Get first name for greeting
  const firstName = user.patient?.first_name || user.name.split(' ')[0];

  return (
    <AppLayout user={user}>
      <Head title="Dashboard" />

      <div className="p-6" style={{ minWidth: '739px', maxWidth: '738px', display: 'flex', flexDirection: 'column', gap: '60px', paddingBottom: '80px' }}>
        {/* Welcome Header */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="flex items-start justify-between">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <h1 className="font-bold" style={{ fontSize: '28px', lineHeight: '36px', letterSpacing: '-0.14px', color: '#00184D' }}>Hi, {user.name}</h1>
              <p className="font-normal" style={{ fontSize: '14px', lineHeight: '22px', letterSpacing: '0.014px', color: '#5B636E' }}>Let's get you set up!</p>
            </div>
            <div className="flex-shrink-0">
              <Button
                asChild
                className="h-12 font-semibold text-white rounded-full"
                style={{ width: '241px', backgroundColor: '#0052FF', fontSize: '16px', letterSpacing: '0.04px', paddingLeft: '32px', paddingRight: '32px' }}
              >
                <Link href="/appointments/create">
                  <span className="flex items-center gap-2 text-white">
                    <img
                      src="/assets/icons/appointment-2.svg"
                      alt="Appointment"
                      className="h-6 w-6"
                    />
                    Book Appointment
                  </span>
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Profile Completion Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Header outside card */}
          <div className="flex items-center justify-between">
            <h2 className="font-semibold" style={{ fontSize: '20px', lineHeight: '28px', letterSpacing: '-0.05px', color: '#00184D' }}>
              Complete your profile
            </h2>
            <p className="font-medium" style={{ fontSize: '14px', lineHeight: '22px', letterSpacing: '0px', color: '#5B636E' }}>
              {profileCompletion.completed} of {profileCompletion.total} done
            </p>
          </div>

          {/* Steps Card */}
          <Card className="overflow-hidden" style={{ borderRadius: '16px', border: '1px solid #CED2DB' }}>
            <CardContent className="space-y-0 p-0">
              {profileCompletion.steps.map((step, index) => (
                <ProfileStepItem
                  key={step.id}
                  step={step}
                  stepNumber={index + 1}
                  isLast={index === profileCompletion.steps.length - 1}
                />
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Book Appointment CTA Card */}
        <Card className="overflow-visible border-0" style={{ borderRadius: '16px', background: 'radial-gradient(circle at center, #003EC1 0%, #00184D 100%)' }}>
          <CardContent className="p-0">
            <div className="flex items-center justify-between relative" style={{ height: '240px' }}>
              <div className="flex-1" style={{ paddingLeft: '32px', paddingRight: '16px' }}>
                <h2 className="font-semibold text-white mb-3" style={{ fontSize: '24px', lineHeight: '32px', letterSpacing: '-0.12px' }}>
                  Book your first appointment
                </h2>
                <p className="font-medium mb-6" style={{ fontSize: '14px', lineHeight: '22px', letterSpacing: '0px', color: 'rgba(255, 255, 255, 0.8)', maxWidth: '320px' }}>
                  Find doctors, book consultations, and manage your family's health — all in one place.
                </p>
                <Button
                  asChild
                  className="h-12 font-semibold rounded-full"
                  style={{ backgroundColor: '#0052FF', color: '#FFFFFF', fontSize: '16px', paddingLeft: '32px', paddingRight: '32px' }}
                >
                  <Link href="/appointments/create">Book Appointment</Link>
                </Button>
              </div>

              {/* Booking Illustration */}
              <div className="absolute right-0 bottom-0" style={{ height: '240px', width: 'auto' }}>
                <img
                  src="/assets/icons/booking-cta.svg"
                  alt="Booking illustration"
                  style={{ height: '100%', width: 'auto', objectFit: 'contain' }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Family Overview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Header outside card */}
          <div className="flex items-center justify-between">
            <h2 className="font-semibold" style={{ fontSize: '20px', lineHeight: '28px', letterSpacing: '-0.05px', color: '#00184D' }}>
              Family Overview
            </h2>
            <Link
              href="/family-members/create"
              className="font-medium hover:underline"
              style={{ fontSize: '14px', lineHeight: '22px', color: '#0052FF' }}
            >
              Add Family Member
            </Link>
          </div>

          {familyMembers.length === 0 ? (
            <Card style={{ borderRadius: '16px', border: '1px solid #CED2DB' }}>
              <CardContent className="p-6">
                <div className="py-8 text-center">
                  <p className="text-base text-muted-foreground mb-4">
                    No family members added yet
                  </p>
                  <Button asChild variant="outline">
                    <Link href="/family-members/create">Add Family Member</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {familyMembers.map((member) => (
                <Card key={member.id} style={{ borderRadius: '16px', border: '1px solid #CED2DB' }}>
                  <CardContent className="p-4">
                    <FamilyMemberItem member={member} />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

/**
 * Profile Step Item Component
 */
interface ProfileStepItemProps {
  step: ProfileStep;
  stepNumber: number;
  isLast: boolean;
}

function ProfileStepItem({ step, stepNumber, isLast }: ProfileStepItemProps) {
  const linkMap: Record<string, string> = {
    add_family_members: '/family-members/create',
    link_insurance: '/insurance/setup',
  };

  const href = linkMap[step.id];

  const content = (
    <div
      className={`flex items-center justify-between transition-colors ${
        step.completed
          ? 'bg-[#EEFBF4]'
          : 'bg-white hover:bg-[#F7F8F9]'
      }`}
      style={{
        paddingTop: '16px',
        paddingRight: '24px',
        paddingBottom: '16px',
        paddingLeft: '24px',
        ...(isLast ? {} : { borderBottom: '1px solid #CED2DB' })
      }}
    >
      <div className="flex items-center" style={{ gap: '16px' }}>
        {/* Step Number / Check Icon */}
        <div
          className={`flex items-center justify-center flex-shrink-0 ${
            step.completed
              ? ''
              : 'h-10 w-10 rounded-full bg-[#EEF0F3]'
          }`}
        >
          {step.completed ? (
            <img src="/assets/icons/check-account.svg" alt="Completed" className="h-10 w-10" />
          ) : (
            <span className="text-sm font-semibold text-[#5B636E]">{stepNumber}</span>
          )}
        </div>

        {/* Step Content */}
        <div className="flex flex-col" style={{ gap: '4px' }}>
          <h3 className="font-semibold" style={{ fontSize: '16px', lineHeight: '24px', letterSpacing: '0px', color: '#0A0B0D' }}>{step.title}</h3>
          <p className="font-medium" style={{ fontSize: '14px', lineHeight: '22px', letterSpacing: '0px', color: '#5B636E' }}>{step.description}</p>
        </div>
      </div>

      {/* Arrow Icon (only for incomplete steps) */}
      {!step.completed && href && (
        <div
          className="flex items-center justify-center h-10 w-10 rounded-full bg-white flex-shrink-0"
          style={{ border: '1px solid #CED2DB' }}
        >
          <ChevronRight className="h-5 w-5 text-[#0A0B0D]" />
        </div>
      )}
    </div>
  );

  // Wrap in Link if not completed and has a link
  if (!step.completed && href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

/**
 * Family Member Item Component
 */
interface FamilyMemberItemProps {
  member: FamilyMember;
}

function FamilyMemberItem({ member }: FamilyMemberItemProps) {
  return (
    <div className="flex items-center gap-3">
      <img
        src={member.avatar_url}
        alt={member.name}
        className="h-10 w-10 rounded-full"
      />
      <p className="text-base font-medium">{member.name}</p>
    </div>
  );
}
