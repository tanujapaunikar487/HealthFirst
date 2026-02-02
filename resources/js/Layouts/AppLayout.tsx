import { Link, usePage, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import SearchModal from '@/Components/SearchModal';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetDivider,
} from '@/Components/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import {
  Bell, Search, CheckCheck,
  Receipt, Clock, CheckCircle2, XCircle,
  ShieldCheck, ShieldAlert, MessageSquare, CreditCard,
  AlertTriangle,
} from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';

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
}

interface AppLayoutProps {
  children: React.ReactNode;
  user: User;
  pageTitle?: string;
  pageIcon?: string;
}

// --- Notification Helpers ---

const notificationIconMap: Record<string, { icon: React.ComponentType<any>; color: string; bg: string }> = {
  bill_generated:           { icon: Receipt,        color: '#3B82F6', bg: '#EFF6FF' },
  payment_due_reminder:     { icon: Clock,          color: '#F59E0B', bg: '#FFFBEB' },
  payment_successful:       { icon: CheckCircle2,   color: '#22C55E', bg: '#F0FDF4' },
  payment_failed:           { icon: XCircle,        color: '#EF4444', bg: '#FEF2F2' },
  insurance_claim_approved:       { icon: ShieldCheck,    color: '#22C55E', bg: '#F0FDF4' },
  insurance_claim_rejected:       { icon: ShieldAlert,    color: '#EF4444', bg: '#FEF2F2' },
  insurance_preauth_approved:     { icon: ShieldCheck,    color: '#22C55E', bg: '#F0FDF4' },
  insurance_preauth_rejected:     { icon: ShieldAlert,    color: '#EF4444', bg: '#FEF2F2' },
  insurance_enhancement_required: { icon: ShieldAlert,    color: '#F59E0B', bg: '#FFFBEB' },
  insurance_enhancement_approved: { icon: ShieldCheck,    color: '#22C55E', bg: '#F0FDF4' },
  insurance_claim_settled:        { icon: ShieldCheck,    color: '#22C55E', bg: '#F0FDF4' },
  dispute_update:                 { icon: MessageSquare,  color: '#F59E0B', bg: '#FFFBEB' },
  emi_due_reminder:         { icon: CreditCard,     color: '#3B82F6', bg: '#EFF6FF' },
};

const channelLabels: Record<string, string> = {
  push: 'Push',
  email: 'Email',
  sms: 'SMS',
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
  const config = notificationIconMap[type] || { icon: Bell, color: '#6B7280', bg: '#F3F4F6' };
  return (
    <div
      className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: config.bg }}
    >
      <Icon icon={config.icon} className="h-[18px] w-[18px]" style={{ color: config.color }} />
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
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl p-3.5 transition-colors hover:bg-gray-50"
      style={{
        backgroundColor: isUnread ? '#F8FAFF' : '#FFFFFF',
        border: `1px solid ${isUnread ? '#DBEAFE' : '#F0F0F0'}`,
      }}
    >
      <div className="flex gap-3">
        <NotificationIcon type={notification.type} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[13px] font-semibold truncate" style={{ color: '#00184D' }}>
              {notification.title}
            </p>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                {timeAgo(notification.created_at)}
              </span>
              {isUnread && (
                <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
            {notification.message}
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            {notification.channels.map((ch) => (
              <Badge
                key={ch}
                variant="secondary"
                className="text-[9px] px-1.5 py-0 h-[16px] font-medium rounded"
                style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}
              >
                {channelLabels[ch] || ch}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </button>
  );
}

// --- Main Layout ---

export default function AppLayout({ children, user, pageTitle, pageIcon }: AppLayoutProps) {
  const { props } = usePage<{
    notificationUnreadCount: number;
    allNotifications: NotificationItem[];
    profileWarnings: Array<{ key: string; label: string; href: string }>;
  }>();

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread'>('all');
  const [searchOpen, setSearchOpen] = useState(false);

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
    const isInsuranceNotif = notification.type.startsWith('insurance_');
    if (isInsuranceNotif && notification.insurance_claim_id) {
      router.visit(`/insurance/claims/${notification.insurance_claim_id}`);
    } else if (notification.appointment_id) {
      router.visit(`/billing/${notification.appointment_id}`);
    }
  };

  const handleMarkAllAsRead = () => {
    router.post('/notifications/mark-all-read', {}, { preserveScroll: true });
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Header */}
        <header className="bg-white" style={{ height: '80px', borderBottom: '1px solid #E5E5E5' }}>
          <div className="h-full flex items-center justify-between px-6">
            {/* Page Title */}
            <div className="flex items-center gap-3">
              <img src={pageIcon || '/assets/icons/home-3.svg'} alt={pageTitle || 'Home'} className="h-6 w-6" />
              <h2 className="text-base font-semibold" style={{ color: '#00184D' }}>{pageTitle || 'Home'}</h2>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
              {/* Search Icon Button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 hover:bg-gray-100"
                style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E5E5' }}
                onClick={() => setSearchOpen(true)}
              >
                <Icon icon={Search} className="h-5 w-5" style={{ color: '#171717' }} />
              </Button>

              {/* Notifications Bell → Opens Sheet */}
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 hover:bg-gray-100 relative"
                style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E5E5' }}
                onClick={() => setNotifOpen(true)}
              >
                <Icon icon={Bell} className="h-5 w-5" style={{ color: '#171717' }} />
                {unreadCount > 0 && (
                  <span className="absolute top-2.5 right-2.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
                )}
              </Button>
            </div>
          </div>
        </header>

        {/* Profile Warning Banner */}
        {profileWarnings.length > 0 && (
          <div
            className="flex items-center gap-3"
            style={{ backgroundColor: '#FFF8E1', borderBottom: '1px solid #FFE082', padding: '12px 24px' }}
          >
            <div
              className="flex h-6 w-6 items-center justify-center rounded-full flex-shrink-0"
              style={{ backgroundColor: '#FFE082' }}
            >
              <Icon icon={AlertTriangle} className="h-3.5 w-3.5" style={{ color: '#F57F17' }} />
            </div>
            <p className="text-sm font-medium" style={{ color: '#5D4037' }}>
              Your profile is incomplete. Add{' '}
              {profileWarnings.map((w, i) => (
                <span key={w.key}>
                  {i > 0 && i < profileWarnings.length - 1 && ', '}
                  {i > 0 && i === profileWarnings.length - 1 && ' and '}
                  <Link
                    href={w.href}
                    className="underline font-semibold hover:text-amber-900"
                    style={{ color: '#5D4037' }}
                  >
                    {w.label}
                  </Link>
                </span>
              ))}{' '}
              for hassle-free claims.
            </p>
          </div>
        )}

        {/* Page Content */}
        <main
          className="flex-1 overflow-y-auto flex justify-center"
          style={{
            background: 'linear-gradient(180deg, rgba(211, 225, 255, 0.5) 0%, rgba(255, 255, 255, 0.5) 13.94%, rgba(255, 255, 255, 1) 30.77%)',
            paddingTop: '60px'
          }}
        >
          {children}
        </main>
      </div>

      {/* Notifications Side Sheet */}
      <Sheet open={notifOpen} onOpenChange={setNotifOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
          <SheetHeader className="mx-0 px-5 pt-5 mb-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <SheetTitle className="text-lg font-bold" style={{ color: '#00184D' }}>
                  Notifications
                </SheetTitle>
                {unreadCount > 0 && (
                  <span className="text-[11px] font-semibold text-white bg-red-500 rounded-full px-2 py-0.5 leading-none">
                    {unreadCount}
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-1 text-xs font-medium hover:underline"
                  style={{ color: '#0052FF' }}
                >
                  <Icon icon={CheckCheck} className="h-3.5 w-3.5" />
                  Mark all read
                </button>
              )}
            </div>
            <SheetDescription className="sr-only">Billing notifications</SheetDescription>

            {/* Filter Tabs */}
            <Tabs
              value={notifFilter}
              onValueChange={(v) => setNotifFilter(v as 'all' | 'unread')}
              className="mt-3"
            >
              <TabsList className="w-full">
                <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
                <TabsTrigger value="unread" className="flex-1">
                  Unread{unreadCount > 0 ? ` (${unreadCount})` : ''}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </SheetHeader>

          <SheetDivider />

          {/* Scrollable Notification List */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {displayedNotifications.length === 0 ? (
              <div className="text-center py-16">
                <div
                  className="h-14 w-14 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{ backgroundColor: '#F3F4F6' }}
                >
                  <Icon icon={Bell} className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-sm font-medium" style={{ color: '#00184D' }}>
                  {notifFilter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {notifFilter === 'unread'
                    ? "You're all caught up!"
                    : 'Billing notifications will appear here.'}
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
          </div>
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
function Sidebar() {
  const { url } = usePage();

  const isActive = (href: string) => {
    if (href === '/dashboard') return url === '/' || url.startsWith('/dashboard');
    return url.startsWith(href);
  };

  return (
    <aside className="w-80 bg-background flex flex-col" style={{ borderRight: '1px solid #E5E5E5' }}>
      {/* Logo */}
      <div className="px-6 py-8">
        <Link href="/dashboard" className="flex items-center gap-3">
          <img
            src="/assets/logos/logo.svg"
            alt="Hospital Logo"
            className="h-12 w-12"
          />
        </Link>
      </div>

      {/* Navigation Links */}
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
    'flex items-center gap-3 px-4 py-3 font-semibold transition-all h-[50px]';

  const shapeClasses = active ? 'rounded-full' : 'rounded-lg';
  const restClasses = !active ? 'text-[#0A0B0D] hover:bg-muted' : '';

  const iconSrc = active
    ? `/assets/icons/${iconName}-selected.svg`
    : `/assets/icons/${iconName}.svg`;

  const activeStyle = active
    ? { backgroundColor: '#F5F8FF', color: '#0052FF' }
    : {};

  return (
    <Link
      href={href}
      className={`${baseClasses} ${shapeClasses} ${restClasses}`}
      style={{ ...activeStyle, fontSize: '16px', lineHeight: '24px' }}
    >
      <img src={iconSrc} alt={label} className="h-6 w-6 flex-shrink-0" />
      <span>{label}</span>
    </Link>
  );
}
