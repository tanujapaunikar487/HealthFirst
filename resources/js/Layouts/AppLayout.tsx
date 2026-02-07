import { Link, usePage, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import SearchModal from '@/Components/SearchModal';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
import { Button, buttonVariants } from '@/Components/ui/button';
import { cn } from '@/Lib/utils';
import { Badge } from '@/Components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetBody,
  SheetTitle,
  SheetDescription,
} from '@/Components/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import {
  Bell, Search, CheckCheck,
  Receipt, Clock, CheckCircle2, XCircle, X,
  ShieldCheck, ShieldAlert, MessageSquare, CreditCard,
  AlertTriangle, Sparkles,
  // Notification icons
  Calendar, Video, TestTube, AlertCircle, Pill, User, UserPlus, Stethoscope,
} from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';
import { Alert } from '@/Components/ui/alert';
import { SupportFooter } from '@/Components/SupportFooter';

// --- Types ---

interface User {
  id: number;
  name: string;
  email: string;
  avatar_url?: string;
}

interface NotificationItem {
  id: number;
  type: string;
  title: string;
  message: string;
  channels: string[];
  read_at: string | null;
  created_at: string;
  appointment_id: number | null;
  insurance_claim_id: number | null;
  health_record_id?: number | null;
  family_member_id?: number | null;
  insurance_policy_id?: number | null;
}

interface AppLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
  pageIcon?: string | typeof Icon | any;
}

// --- Notification Helpers ---

type NotificationVariant = 'success' | 'warning' | 'destructive' | 'info';

const notificationIconMap: Record<string, { icon: React.ComponentType<any>; variant: NotificationVariant }> = {
  // Billing Notifications
  bill_generated:           { icon: Receipt,        variant: 'info' },
  payment_due_reminder:     { icon: Clock,          variant: 'warning' },
  payment_successful:       { icon: CheckCircle2,   variant: 'success' },
  payment_failed:           { icon: XCircle,        variant: 'destructive' },
  dispute_update:           { icon: MessageSquare,  variant: 'warning' },
  emi_due_reminder:         { icon: CreditCard,     variant: 'info' },

  // Insurance Claims Notifications
  insurance_claim_approved:       { icon: ShieldCheck,    variant: 'success' },
  insurance_claim_rejected:       { icon: ShieldAlert,    variant: 'destructive' },
  insurance_preauth_approved:     { icon: ShieldCheck,    variant: 'success' },
  insurance_preauth_rejected:     { icon: ShieldAlert,    variant: 'destructive' },
  insurance_enhancement_required: { icon: ShieldAlert,    variant: 'warning' },
  insurance_enhancement_approved: { icon: ShieldCheck,    variant: 'success' },
  insurance_claim_settled:        { icon: ShieldCheck,    variant: 'success' },

  // Appointment Notifications
  appointment_reminder:     { icon: Calendar,       variant: 'info' },
  appointment_confirmed:    { icon: CheckCircle2,   variant: 'success' },
  appointment_cancelled:    { icon: XCircle,        variant: 'destructive' },
  appointment_rescheduled:  { icon: Calendar,       variant: 'warning' },
  checkin_available:        { icon: Clock,          variant: 'success' },
  video_link_ready:         { icon: Video,          variant: 'info' },

  // Health Records Notifications
  lab_results_ready:        { icon: TestTube,       variant: 'success' },
  abnormal_results:         { icon: AlertCircle,    variant: 'destructive' },
  prescription_expiring:    { icon: Pill,           variant: 'warning' },
  followup_required:        { icon: Stethoscope,    variant: 'warning' },

  // Family Members Notifications
  member_verification_pending: { icon: User,        variant: 'warning' },
  member_added:                { icon: UserPlus,    variant: 'success' },

  // Insurance Policy Notifications
  policy_expiring_soon:     { icon: ShieldAlert,    variant: 'warning' },
  policy_expired:           { icon: ShieldAlert,    variant: 'destructive' },

  // Promotions
  promotion:                { icon: Sparkles,       variant: 'info' },
};

const channelLabels: Record<string, string> = {
  push: 'Push',
  email: 'Email',
  sms: 'SMS',
  whatsapp: 'WhatsApp',
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function NotificationIcon({ type }: { type: string }) {
  const config = notificationIconMap[type] || { icon: Bell, variant: 'info' as const };

  // Map variant to semantic token classes
  const variantClasses = {
    success: 'bg-success-subtle text-success-subtle-foreground',
    warning: 'bg-warning-subtle text-warning-subtle-foreground',
    destructive: 'bg-destructive-subtle text-destructive-subtle-foreground',
    info: 'bg-info-subtle text-info-subtle-foreground',
  };

  return (
    <div
      className={cn(
        "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0",
        variantClasses[config.variant]
      )}
    >
      <Icon icon={config.icon} className="h-[18px] w-[18px]" />
    </div>
  );
}

function NotificationCard({
  notification,
  onClick,
}: {
  notification: NotificationItem;
  onClick: () => void;
}) {
  const isUnread = !notification.read_at;

  return (
    <Button
      variant="ghost"
      className={cn(
        "w-full text-left rounded-xl p-4 transition-colors hover:bg-muted/50 h-auto border",
        isUnread
          ? "bg-info-subtle/50 border-info-border"
          : "bg-background border-border"
      )}
      onClick={onClick}
    >
      <div className="flex gap-3">
        <NotificationIcon type={notification.type} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-card-title truncate text-foreground">
              {notification.title}
            </p>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-micro text-muted-foreground whitespace-nowrap">
                {timeAgo(notification.created_at)}
              </span>
              {isUnread && (
                <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
              )}
            </div>
          </div>
          <p className="text-body text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
            {notification.message}
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            {notification.channels.map((ch) => (
              <Badge
                key={ch}
                variant="neutral"
                size="sm"
              >
                {channelLabels[ch] || ch}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </Button>
  );
}

// --- Main Layout ---

interface UserPreferences {
  language: string;
  date_format: string;
  time_format: string;
  accessibility: {
    text_size: number;
    high_contrast: boolean;
  };
}

export default function AppLayout({ children, pageTitle, pageIcon }: AppLayoutProps) {
  const { props } = usePage<{
    auth: { user: User | null; check: boolean };
    notificationUnreadCount: number;
    allNotifications: NotificationItem[];
    profileWarnings: Array<{ key: string; label: string; href: string }>;
    userPreferences: UserPreferences | null;
  }>();

  const user = props.auth?.user;

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread'>('all');
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileBannerDismissed, setProfileBannerDismissed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('profileBannerDismissed') === 'true';
    }
    return false;
  });

  const dismissProfileBanner = () => {
    setProfileBannerDismissed(true);
    localStorage.setItem('profileBannerDismissed', 'true');
  };

  // Apply user preferences (text size and high contrast)
  useEffect(() => {
    const prefs = props.userPreferences;
    if (prefs?.accessibility) {
      // Apply text size via CSS zoom (fixed pixel sizes don't respond to root fontSize)
      const textSize = prefs.accessibility.text_size || 14;
      const scale = textSize / 14;
      document.documentElement.style.zoom = String(scale);

      // Apply high contrast mode
      if (prefs.accessibility.high_contrast) {
        document.documentElement.classList.add('high-contrast');
      } else {
        document.documentElement.classList.remove('high-contrast');
      }
    }

    // Cleanup on unmount
    return () => {
      document.documentElement.style.zoom = '';
      document.documentElement.classList.remove('high-contrast');
    };
  }, [props.userPreferences]);

  // Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const unreadCount = props.notificationUnreadCount || 0;
  const allNotifications = props.allNotifications || [];
  const profileWarnings = props.profileWarnings || [];

  const displayedNotifications = notifFilter === 'unread'
    ? allNotifications.filter((n) => !n.read_at)
    : allNotifications;

  const handleNotificationClick = (notification: NotificationItem) => {
    if (!notification.read_at) {
      router.post(`/notifications/${notification.id}/read`, {}, { preserveScroll: true });
    }
    setNotifOpen(false);

    // Insurance claim notifications
    const isInsuranceClaimNotif = notification.type.startsWith('insurance_');
    if (isInsuranceClaimNotif && notification.insurance_claim_id) {
      router.visit(`/insurance/claims/${notification.insurance_claim_id}`);
      return;
    }

    // Insurance policy notifications
    const isPolicyNotif = notification.type === 'policy_expiring_soon' || notification.type === 'policy_expired';
    if (isPolicyNotif && notification.insurance_policy_id) {
      router.visit(`/insurance/${notification.insurance_policy_id}`);
      return;
    }

    // Appointment notifications
    const isAppointmentNotif = notification.type.startsWith('appointment_') ||
      notification.type === 'checkin_available' ||
      notification.type === 'video_link_ready';
    if (isAppointmentNotif && notification.appointment_id) {
      router.visit(`/appointments/${notification.appointment_id}`);
      return;
    }

    // Health record notifications
    const isHealthRecordNotif = notification.type === 'lab_results_ready' ||
      notification.type === 'abnormal_results' ||
      notification.type === 'prescription_expiring' ||
      notification.type === 'followup_required';
    if (isHealthRecordNotif && notification.health_record_id) {
      router.visit(`/health-records/${notification.health_record_id}`);
      return;
    }

    // Family member notifications
    const isFamilyMemberNotif = notification.type === 'member_verification_pending' ||
      notification.type === 'member_added';
    if (isFamilyMemberNotif && notification.family_member_id) {
      router.visit(`/family-members/${notification.family_member_id}`);
      return;
    }

    // Billing notifications (default for backward compatibility)
    if (notification.appointment_id) {
      router.visit(`/billing/${notification.appointment_id}`);
    }
  };

  const handleMarkAllAsRead = () => {
    router.post('/notifications/mark-all-read', {}, { preserveScroll: true });
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar Navigation */}
      <Sidebar user={user} />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Header */}
        <header className="bg-background" style={{ height: '80px', borderBottom: '1px solid hsl(var(--border))' }}>
          <div className="h-full flex items-center justify-between px-6">
            {/* Page Title */}
            <div className="flex items-center gap-3">
              {typeof pageIcon === 'string' ? (
                <img src={pageIcon.startsWith('/') ? pageIcon : `/assets/icons/${pageIcon}.svg`} alt={pageTitle || 'Home'} className="h-6 w-6" />
              ) : pageIcon ? (
                <Icon icon={pageIcon} className="h-6 w-6 text-foreground" />
              ) : (
                <img src="/assets/icons/home.svg" alt={pageTitle || 'Home'} className="h-6 w-6" />
              )}
              <h2 className="text-subheading text-foreground">{pageTitle || 'Home'}</h2>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
              {/* Search Icon Button */}
              <Button
                variant="ghost"
                iconOnly
                size="lg"
                className="hover:bg-accent"
                style={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                onClick={() => setSearchOpen(true)}
              >
                <Icon icon={Search} className="h-5 w-5 text-foreground" />
              </Button>

              {/* Notifications Bell → Opens Sheet */}
              <Button
                variant="ghost"
                iconOnly
                size="lg"
                className="hover:bg-accent relative"
                style={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                onClick={() => setNotifOpen(true)}
              >
                <Icon icon={Bell} className="h-5 w-5 text-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute top-2.5 right-2.5 h-2.5 w-2.5 rounded-full bg-destructive ring-2 ring-background" />
                )}
              </Button>
            </div>
          </div>
        </header>

        {/* Profile Warning Banner */}
        {profileWarnings.length > 0 && !profileBannerDismissed && (
          <Alert variant="warning" mode="sticky" onDismiss={dismissProfileBanner}>
            <span className="font-medium">
              Your profile is incomplete. Add{' '}
              {profileWarnings.map((w, i) => (
                <span key={w.key}>
                  {i > 0 && i < profileWarnings.length - 1 && ', '}
                  {i > 0 && i === profileWarnings.length - 1 && ' and '}
                  <Link
                    href={w.href}
                    className="underline font-semibold text-foreground hover:text-foreground/80"
                  >
                    {w.label}
                  </Link>
                </span>
              ))}{' '}
              for hassle-free claims.
            </span>
          </Alert>
        )}

        {/* Page Content */}
        <main
          className="flex-1 overflow-y-auto flex flex-col"
          style={{
            background: 'linear-gradient(180deg, hsl(var(--primary) / 0.1) 0%, hsl(var(--background) / 0.5) 13.94%, hsl(var(--background)) 30.77%)',
            paddingTop: '40px',
            paddingBottom: '20px'
          }}
        >
          <div className="flex-1 flex justify-center">
            {children}
          </div>
          <SupportFooter pageName={pageTitle || 'this page'} />
        </main>
      </div>

      {/* Notifications Side Sheet */}
      <Sheet open={notifOpen} onOpenChange={setNotifOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <SheetTitle>
                  Notifications
                </SheetTitle>
                {unreadCount > 0 && (
                  <span className="text-overline text-destructive-foreground bg-destructive rounded-full px-2 py-0.5 leading-none">
                    {unreadCount}
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 flex items-center gap-1 text-label text-primary hover:underline"
                  onClick={handleMarkAllAsRead}
                >
                  <Icon icon={CheckCheck} className="h-3.5 w-3.5" />
                  Mark all read
                </Button>
              )}
            </div>
            <SheetDescription className="sr-only">Billing notifications</SheetDescription>

            {/* Filter Tabs — hide when no notifications at all */}
            {allNotifications.length > 0 && (
              <Tabs
                value={notifFilter}
                onValueChange={(v) => setNotifFilter(v as 'all' | 'unread')}
                className="mt-3"
              >
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="unread">
                    Unread{unreadCount > 0 ? ` (${unreadCount})` : ''}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}
          </SheetHeader>

          {/* Scrollable Notification List */}
          <SheetBody>
            {displayedNotifications.length === 0 ? (
              <div className="text-center py-12">
                <img
                  src="/assets/images/notification.png"
                  alt=""
                  className="h-[120px] w-[120px] mx-auto mb-4"
                />
                <p className="text-subheading text-foreground">
                  {notifFilter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                </p>
                <p className="text-body text-muted-foreground mt-1">
                  {notifFilter === 'unread'
                    ? "You're all caught up!"
                    : 'Updates about appointments, billing, and more will appear here.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {displayedNotifications.map((n) => (
                  <NotificationCard
                    key={n.id}
                    notification={n}
                    onClick={() => handleNotificationClick(n)}
                  />
                ))}
              </div>
            )}
          </SheetBody>
        </SheetContent>
      </Sheet>

      {/* Global Search Modal */}
      <SearchModal open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}

/**
 * Sidebar Navigation Component
 */
function Sidebar({ user }: { user: User | null }) {
  const { url } = usePage();

  const isActive = (href: string) => {
    if (href === '/dashboard') return url === '/' || url.startsWith('/dashboard');
    return url.startsWith(href);
  };

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  return (
    <aside className="w-80 bg-background flex flex-col" style={{ borderRight: '1px solid hsl(var(--border))' }}>
      {/* Logo */}
      <div className="px-6 py-8">
        <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-3">
          <img
            src="/assets/logos/logo.svg"
            alt="Hospital Logo"
            className="h-12 w-12"
          />
        </Link>
      </div>

      {/* Navigation Links - only when authenticated */}
      {user && (
        <nav className="flex-1 px-6 py-4 space-y-3">
          <NavLink href="/dashboard" iconName="home" label="Home" active={isActive('/dashboard')} />
          <NavLink
            href="/appointments"
            iconName="appointment"
            label="Appointments"
            active={isActive('/appointments')}
          />
          <NavLink
            href="/health-records"
            iconName="records"
            label="Health Records"
            active={isActive('/health-records')}
          />
          <NavLink href="/insurance" iconName="insurance" label="Insurance" active={isActive('/insurance')} />
          <NavLink href="/billing" iconName="billing" label="Billing" active={isActive('/billing')} />
          <NavLink
            href="/family-members"
            iconName="family"
            label="Family Members"
            active={isActive('/family-members')}
          />
        </nav>
      )}

      {/* Spacer for guest mode */}
      {!user && <div className="flex-1" />}

      {/* User Profile Section - authenticated */}
      {user && (
        <div className="px-6 py-4 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
          <Link
            href="/settings"
            className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted transition-colors"
            style={{ borderRadius: '24px' }}
          >
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage src={user.avatar_url} />
              <AvatarFallback className="text-body">{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-card-title truncate text-foreground">
                {user.name}
              </p>
              <p className="text-body text-muted-foreground truncate">{user.email}</p>
            </div>
          </Link>
        </div>
      )}

      {/* Guest actions - not authenticated */}
      {!user && (
        <div className="px-6 py-4 border-t space-y-2" style={{ borderColor: 'hsl(var(--border))' }}>
          <Link href="/login" className={cn(buttonVariants(), 'w-full')}>
            Sign In
          </Link>
          <Link href="/register" className={cn(buttonVariants({ variant: 'secondary' }), 'w-full')}>
            Create Account
          </Link>
        </div>
      )}
    </aside>
  );
}

/**
 * Navigation Link Component
 */
interface NavLinkProps {
  href: string;
  iconName: string;
  label: string;
  active?: boolean;
}

function NavLink({ href, iconName, label, active = false }: NavLinkProps) {
  const baseClasses =
    'flex items-center gap-3 px-4 py-3 text-subheading transition-all h-[50px]';

  const shapeClasses = 'rounded-full';
  const restClasses = !active ? 'text-foreground hover:bg-muted' : '';

  const iconSrc = active
    ? `/assets/icons/${iconName}-selected.svg`
    : `/assets/icons/${iconName}.svg`;

  const activeStyle = active
    ? { backgroundColor: 'hsl(var(--primary) / 0.05)', color: 'hsl(var(--primary))' }
    : {};

  return (
    <Link
      href={href}
      className={`${baseClasses} ${shapeClasses} ${restClasses}`}
      style={activeStyle}
    >
      <img src={iconSrc} alt={label} className="h-6 w-6 flex-shrink-0" />
      <span>{label}</span>
    </Link>
  );
}
