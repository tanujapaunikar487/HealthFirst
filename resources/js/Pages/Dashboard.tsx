import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { ChevronRight, AlertCircle, RefreshCw, Check, Stethoscope, FlaskConical } from 'lucide-react';
import { Toast } from '@/Components/ui/toast';
import { CtaBanner } from '@/Components/ui/cta-banner';

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
  id: number;
  number: number;
  title: string;
  subtitle: string;
  completed: boolean;
  href?: string;
}

interface UpcomingAppointment {
  id: number;
  type: string;
  title: string;
  subtitle: string;
  patient_name: string;
  date_formatted: string;
  time: string;
  mode: string;
  fee: number;
}

interface DashboardProps {
  user: User & { patient?: Patient };
  profileSteps: ProfileStep[];
  upcomingAppointments?: UpcomingAppointment[];
}

// --- Skeleton Components ---

function Pulse({ className }: { className?: string }) {
  return <div className={`bg-muted animate-pulse rounded ${className ?? ''}`} />;
}

function DashboardSkeleton() {
  return (
    <div style={{ width: '738px', minHeight: '720px', padding: '40px 0', display: 'flex', flexDirection: 'column', gap: '48px' }}>
      {/* Header skeleton */}
      <div style={{ display: 'flex', flexDirection: 'row', width: '100%', height: '68px', gap: '12px', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
          <Pulse className="h-10 w-48" />
          <Pulse className="h-5 w-56" />
        </div>
        <Pulse className="h-12 w-60 rounded-full" />
      </div>

      {/* Section header skeleton */}
      <div style={{ display: 'flex', flexDirection: 'column', width: '738px', gap: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '738px' }}>
          <Pulse className="h-7 w-48" />
          <Pulse className="h-5 w-20" />
        </div>

        {/* Profile steps card skeleton */}
        <Card style={{ width: '738px', borderRadius: '24px', border: '1px solid #E5E5E5', overflow: 'hidden' }}>
          <CardContent className="p-0">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: '738px',
                  height: '96px',
                  padding: '20px',
                  borderBottom: i === 2 ? 'none' : '1px solid #E5E5E5',
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: '16px',
                }}
              >
                <Pulse className="h-10 w-10 rounded-full flex-shrink-0" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
                  <Pulse className="h-5 w-44" />
                  <Pulse className="h-4 w-64" />
                </div>
                <Pulse className="h-10 w-10 rounded-full flex-shrink-0" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Banner skeleton */}
      <Pulse className="w-full rounded-3xl" style={{ height: '216px' }} />
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div style={{ width: '738px', minHeight: '720px', padding: '40px 0' }}>
      <div className="flex flex-col items-center justify-center gap-4 py-32">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
          <AlertCircle className="h-7 w-7 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-600">Unable to load dashboard</p>
        <p className="text-xs text-gray-400">Please check your connection and try again.</p>
        <Button variant="outline" className="mt-2 gap-2" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    </div>
  );
}

// --- Main Dashboard ---

export default function Dashboard({
  user,
  profileSteps,
  upcomingAppointments = [],
}: DashboardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const mountTime = useRef(Date.now());

  useEffect(() => {
    const MIN_SKELETON_MS = 300;

    // Ensure minimum skeleton display time
    const elapsed = Date.now() - mountTime.current;
    const remaining = Math.max(0, MIN_SKELETON_MS - elapsed);

    const revealTimer = setTimeout(() => {
      setIsLoading(false);
    }, remaining);

    // 10-second timeout for error state
    const errorTimer = setTimeout(() => {
      setIsLoading((current) => {
        if (current) setHasError(true);
        return current;
      });
    }, 10000);

    return () => {
      clearTimeout(revealTimer);
      clearTimeout(errorTimer);
    };
  }, []);

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    mountTime.current = Date.now();
    router.reload();
  };

  // Error state
  if (hasError) {
    return (
      <AppLayout user={user}>
        <Head title="Dashboard" />
        <ErrorState onRetry={handleRetry} />
      </AppLayout>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <AppLayout user={user}>
        <Head title="Dashboard" />
        <DashboardSkeleton />
      </AppLayout>
    );
  }

  // Get current date
  const today = new Date();
  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  };
  const formattedDate = today.toLocaleDateString('en-US', dateOptions);

  // Get first name only
  const firstName = user.patient?.first_name || user.name.split(' ')[0];

  // Check if all profile steps are completed
  const allStepsCompleted = profileSteps.every(step => step.completed);

  return (
    <AppLayout user={user}>
      <Head title="Dashboard" />

      <div style={{ width: '738px', minHeight: '720px', padding: '40px 0', display: 'flex', flexDirection: 'column', gap: '48px' }}>
        {/* Page Header */}
        <div style={{ display: 'flex', flexDirection: 'row', width: '100%', height: '68px', gap: '12px', alignItems: 'flex-start' }}>
          {/* Left Section - Text */}
          <div style={{ display: 'flex', flexDirection: 'column', width: '485px', height: '68px', gap: '4px', flexGrow: 1 }}>
            <h1 className="font-bold" style={{ fontSize: '36px', lineHeight: '44px', letterSpacing: '-1px', color: '#171717', margin: 0, width: '384px', height: '44px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Hi, {firstName}
            </h1>
            <p className="font-medium" style={{ fontSize: '14px', fontWeight: 500, lineHeight: '20px', letterSpacing: '0px', color: '#737373', margin: 0, width: '100%', height: '20px', display: 'flex', alignItems: 'center' }}>
              {formattedDate}
            </p>
          </div>

          {/* Right Section - Button (hide when all steps completed) */}
          {!allStepsCompleted && (
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
              <Button
                asChild
                className="h-12 font-semibold text-white rounded-full"
                style={{ width: '241px', height: '48px', backgroundColor: '#0052FF', fontSize: '16px', fontWeight: 600, lineHeight: '24px', paddingLeft: '32px', paddingRight: '32px', gap: '8px' }}
              >
                <Link href="/booking">
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
          )}
        </div>

        {/* Up next section (shown when appointments exist AND profile incomplete) */}
        {!allStepsCompleted && upcomingAppointments.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', width: '738px', gap: '24px' }}>
            <h2 className="font-semibold" style={{ fontSize: '20px', fontWeight: 600, lineHeight: '28px', color: '#171717' }}>
              Up next
            </h2>
            <Card style={{ width: '738px', borderRadius: '24px', border: '1px solid #E5E5E5', overflow: 'hidden' }}>
              <CardContent className="p-0">
                {upcomingAppointments.map((appt, index) => (
                  <Link key={appt.id} href="/appointments" className="block">
                    <div
                      className="transition-colors hover:bg-[#F7F8F9]"
                      style={{
                        width: '738px',
                        height: '96px',
                        backgroundColor: '#FFFFFF',
                        padding: '20px',
                        borderBottom: index === upcomingAppointments.length - 1 ? 'none' : '1px solid #E5E5E5',
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: '16px',
                      }}
                    >
                      <div
                        className="flex items-center justify-center flex-shrink-0"
                        style={{ width: '40px', height: '40px', borderRadius: '9999px', backgroundColor: '#BFDBFE' }}
                      >
                        {appt.type === 'doctor' ? (
                          <Stethoscope className="h-5 w-5" style={{ color: '#1E40AF' }} />
                        ) : (
                          <FlaskConical className="h-5 w-5" style={{ color: '#1E40AF' }} />
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexGrow: 1 }}>
                        <h3 className="font-semibold" style={{ fontSize: '18px', fontWeight: 600, lineHeight: '28px', color: '#171717', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {appt.title}
                        </h3>
                        <p className="font-medium" style={{ fontSize: '14px', fontWeight: 500, lineHeight: '20px', color: '#737373' }}>
                          {appt.date_formatted} · {appt.patient_name}
                        </p>
                      </div>
                      <div
                        className="flex items-center justify-center flex-shrink-0"
                        style={{ width: '40px', height: '40px', borderRadius: '9999px', backgroundColor: '#EEF0F3', border: '1px solid #DEE1E7' }}
                      >
                        <ChevronRight className="h-5 w-5" style={{ color: '#00184D', strokeWidth: 1.25 }} />
                      </div>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Conditional: Show profile completion OR appointment booking banner */}
        {!allStepsCompleted ? (
          /* Complete your profile Section */
          <div style={{ display: 'flex', flexDirection: 'column', width: '738px', gap: '24px' }}>
            {/* Section Header */}
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '738px', height: '28px' }}>
              <h2 className="font-semibold" style={{ fontSize: '20px', fontWeight: 600, lineHeight: '28px', color: '#171717' }}>
                Complete your profile
              </h2>
              <p className="font-medium" style={{ fontSize: '14px', fontWeight: 500, lineHeight: '20px', color: '#737373' }}>
                {profileSteps.filter(step => step.completed).length} of {profileSteps.length} done
              </p>
            </div>

            {/* Profile Steps Card */}
            <Card style={{ width: '738px', borderRadius: '24px', border: '1px solid #E5E5E5', overflow: 'hidden' }}>
              <CardContent className="p-0">
                {profileSteps.map((step, index) => (
                  <ProfileStepItem
                    key={step.id}
                    step={step}
                    isLast={index === profileSteps.length - 1}
                  />
                ))}
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Book your first appointment Banner (when all steps completed) */
          <CtaBanner
            heading="Book your first appointment"
            description="Find doctors, book appointments, and manage your family's health — all in one place."
            buttonText="Book Appointment"
            buttonHref="/booking"
            imageSrc="/assets/images/booking.png"
            imageAlt="Booking illustration"
          />
        )}

        {/* Yellow Fever Vaccination Banner (only show when profile incomplete) */}
        {!allStepsCompleted && (
          <div style={{ width: '738px', height: '216px', borderRadius: '24px', background: 'linear-gradient(to bottom right, #00184D 0%, #0242B3 83.86%)', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '4px', position: 'relative', overflow: 'hidden' }}>
            {/* Left Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '32px', flexGrow: 1, zIndex: 10 }}>
              {/* Text Frame */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '450px' }}>
                <h2 className="font-semibold" style={{ fontSize: '24px', fontWeight: 600, lineHeight: '32px', letterSpacing: '-0.5px', color: '#FFFFFF', margin: 0 }}>
                  Yellow Fever vaccination now available
                </h2>
                <p className="font-medium" style={{ fontSize: '14px', fontWeight: 500, lineHeight: '20px', letterSpacing: '0px', color: 'rgba(255, 255, 255, 0.7)', margin: 0 }}>
                  Required for travel to Africa & South America. Certificate valid for life. ₹2,500
                </p>
              </div>

              {/* Button */}
              <Button
                asChild
                className="font-semibold rounded-full"
                style={{ width: '126px', height: '48px', backgroundColor: '#FFFFFF', color: '#00184D', fontSize: '16px', fontWeight: 600, lineHeight: '24px', paddingLeft: '24px', paddingRight: '24px', border: 'none', whiteSpace: 'nowrap' }}
              >
                <Link href="/vaccinations/yellow-fever">
                  Book Now
                </Link>
              </Button>
            </div>

            {/* Right Illustration */}
            <div style={{ width: '220px', height: '216px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
              <img
                src="/assets/images/vaccination.png"
                alt="Yellow Fever Vaccination"
                style={{ width: '700px', height: '700px', position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', objectFit: 'contain' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      <Toast
        show={false}
        message="Profile successfully completed!"
        onHide={() => {}}
      />
    </AppLayout>
  );
}

/**
 * Profile Step Item Component
 */
interface ProfileStepItemProps {
  step: ProfileStep;
  isLast: boolean;
}

function ProfileStepItem({ step, isLast }: ProfileStepItemProps) {
  const content = (
    <div
      className={`transition-colors duration-300 ${step.completed ? '' : 'hover:bg-[#F7F8F9]'}`}
      style={{
        width: '738px',
        height: '96px',
        backgroundColor: step.completed ? '#F0FDF4' : '#FFFFFF',
        padding: '20px',
        borderBottom: isLast ? 'none' : '1px solid #E5E5E5',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '16px'
      }}
    >
      {/* Numbered Circle or Checkmark */}
      {step.completed ? (
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '9999px',
            backgroundColor: '#DCFCE7',
            animation: 'checkmark-pop 0.3s ease-out',
          }}
        >
          <Check className="h-5 w-5" style={{ color: '#16A34A' }} />
        </div>
      ) : (
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '9999px',
            backgroundColor: '#EEF0F3'
          }}
        >
          <span className="font-semibold" style={{ fontSize: '14px', fontWeight: 600, lineHeight: '22px', color: '#737373' }}>
            {step.number}
          </span>
        </div>
      )}

      {/* Text Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexGrow: 1, height: '56px' }}>
        <h3 className="font-semibold" style={{ fontSize: '18px', fontWeight: 600, lineHeight: '28px', color: '#171717', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {step.title}
        </h3>
        <p className="font-medium" style={{ fontSize: '16px', fontWeight: 500, lineHeight: '24px', color: '#737373', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {step.subtitle}
        </p>
      </div>

      {/* Arrow Button (only show for incomplete steps) */}
      {!step.completed && (
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '9999px',
            backgroundColor: '#EEF0F3',
            border: '1px solid #DEE1E7'
          }}
        >
          <ChevronRight className="h-5 w-5" style={{ color: '#00184D', strokeWidth: 1.25 }} />
        </div>
      )}
    </div>
  );

  // Only wrap incomplete steps in Link
  if (step.href && !step.completed) {
    return (
      <Link href={step.href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
