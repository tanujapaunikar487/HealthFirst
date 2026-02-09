import { Link, usePage, router } from "@inertiajs/react";
import { useState, useEffect } from "react";
import SearchModal from "@/Components/SearchModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/Components/ui/avatar";
import { Button, buttonVariants } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import { cn } from "@/Lib/utils";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetBody,
    SheetEdgeContent,
    SheetTitle,
    SheetDescription,
} from "@/Components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import {
    Bell,
    Search,
    CheckCheck,
    Calendar,
    CalendarClock,
    Video,
    ClipboardCheck,
    TestTube2,
    FlaskConical,
    ShieldCheck,
    Pill,
    Users,
    UserPlus,
    Receipt,
    CreditCard,
    Info,
} from "@/Lib/icons";
import { Icon } from "@/Components/ui/icon";
import { Alert } from "@/Components/ui/alert";
import { SupportFooter } from "@/Components/SupportFooter";
import { getAvatarColor } from "@/Lib/avatar-colors";

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
    doctor?: {
        name: string;
        avatar_url?: string | null;
    } | null;
}

interface AppLayoutProps {
    children: React.ReactNode;
    pageTitle?: string;
    pageIcon?: string | typeof Icon | any;
}

// --- Notification Helpers ---

type NotificationCategory = 'appointment' | 'update' | 'billing';

function getNotificationCategory(type: string): NotificationCategory {
    if (type.startsWith('appointment_') || type === 'checkin_available' || type === 'video_link_ready') {
        return 'appointment';
    }
    if (
        type === 'lab_results_ready' ||
        type === 'abnormal_results' ||
        type === 'prescription_expiring' ||
        type === 'followup_required' ||
        type.startsWith('insurance_') ||
        type === 'policy_expiring_soon' ||
        type === 'policy_expired' ||
        type === 'member_verification_pending' ||
        type === 'member_added'
    ) {
        return 'update';
    }
    return 'billing';
}

function timeAgo(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "1 day";
    if (days < 7) return `${days} days`;
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function getTimeGroup(dateStr: string): 'today' | 'this-week' | 'older' {
    const now = new Date();
    const date = new Date(dateStr);
    const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) return 'today';
    if (daysDiff < 7) return 'this-week';
    return 'older';
}

function getNotificationIcon(type: string) {
    // Map notification types to their corresponding icons
    if (type.startsWith('appointment_')) {
        if (type === 'appointment_confirmed') return Calendar;
        if (type === 'appointment_reminder') return CalendarClock;
        if (type === 'appointment_cancelled') return CalendarClock;
        return Calendar;
    }
    if (type === 'checkin_available') return ClipboardCheck;
    if (type === 'video_link_ready') return Video;
    if (type === 'lab_results_ready') return TestTube2;
    if (type === 'abnormal_results') return FlaskConical;
    if (type === 'prescription_expiring') return Pill;
    if (type === 'followup_required') return CalendarClock;
    if (type.startsWith('insurance_')) return ShieldCheck;
    if (type === 'policy_expiring_soon' || type === 'policy_expired') return ShieldCheck;
    if (type === 'member_verification_pending') return UserPlus;
    if (type === 'member_added') return Users;
    if (type.startsWith('billing_') || type.startsWith('payment_')) return Receipt;
    // Default icon for unknown types
    return Info;
}

function getAvatarColorByName(name: string) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return getAvatarColor(Math.abs(hash));
}

function NotificationItem({
    notification,
    onClick,
    index,
}: {
    notification: NotificationItem;
    onClick: () => void;
    index: number;
}) {
    const isUnread = !notification.read_at;

    // Check if this is a doctor appointment notification (not lab test)
    const isAppointmentNotification =
        notification.type.startsWith('appointment_') ||
        notification.type === 'checkin_available' ||
        notification.type === 'video_link_ready';

    const isDoctorNotification = isAppointmentNotification;
    const NotificationIcon = getNotificationIcon(notification.type);

    // Generate initials from doctor name or notification title
    const getInitials = (name: string) => {
        const words = name.split(' ').filter(w => w.length > 0);
        if (words.length >= 2) {
            return (words[0][0] + words[1][0]).toUpperCase();
        }
        return words[0]?.slice(0, 2).toUpperCase() || 'D';
    };

    return (
        <button
            onClick={onClick}
            className="w-full flex items-start gap-3 px-5 py-4 hover:bg-muted/50 transition-colors text-left"
        >
            {/* Show avatar for doctor appointment notifications, otherwise show icon */}
            {isDoctorNotification ? (
                <Avatar className="h-10 w-10 flex-shrink-0">
                    {notification.doctor?.avatar_url && (
                        <AvatarImage src={notification.doctor.avatar_url} alt={notification.doctor.name} />
                    )}
                    <AvatarFallback
                        className="text-body font-medium"
                        style={(() => {
                            const name = notification.doctor?.name || notification.title;
                            const color = getAvatarColorByName(name);
                            return { backgroundColor: color.bg, color: color.text };
                        })()}
                    >
                        {getInitials(notification.doctor?.name || notification.title)}
                    </AvatarFallback>
                </Avatar>
            ) : (
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon icon={NotificationIcon} className="h-5 w-5 text-primary" />
                </div>
            )}
            <div className="flex-1 min-w-0">
                <p className="text-label text-foreground mb-1">{notification.title}</p>
                <p className="text-body text-muted-foreground">{notification.message}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-caption text-muted-foreground whitespace-nowrap">
                    {timeAgo(notification.created_at)}
                </span>
                {isUnread && (
                    <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                )}
            </div>
        </button>
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

export default function AppLayout({
    children,
    pageTitle,
    pageIcon,
}: AppLayoutProps) {
    const { props } = usePage<{
        auth: { user: User | null; check: boolean };
        notificationUnreadCount: number;
        allNotifications: NotificationItem[];
        profileWarnings: Array<{ key: string; label: string; href: string }>;
        userPreferences: UserPreferences | null;
    }>();

    const user = props.auth?.user;

    const [notifOpen, setNotifOpen] = useState(false);
    const [notifFilter, setNotifFilter] = useState<"all" | "appointments" | "updates">("all");
    const [searchOpen, setSearchOpen] = useState(false);
    const [profileBannerDismissed, setProfileBannerDismissed] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("profileBannerDismissed") === "true";
        }
        return false;
    });

    const dismissProfileBanner = () => {
        setProfileBannerDismissed(true);
        localStorage.setItem("profileBannerDismissed", "true");
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
                document.documentElement.classList.add("high-contrast");
            } else {
                document.documentElement.classList.remove("high-contrast");
            }
        }

        // Cleanup on unmount
        return () => {
            document.documentElement.style.zoom = "";
            document.documentElement.classList.remove("high-contrast");
        };
    }, [props.userPreferences]);

    // Cmd+K / Ctrl+K keyboard shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setSearchOpen((prev) => !prev);
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    const unreadCount = props.notificationUnreadCount || 0;
    const allNotifications = props.allNotifications || [];
    const profileWarnings = props.profileWarnings || [];

    const displayedNotifications = allNotifications.filter((n) => {
        if (notifFilter === 'all') return true;
        return getNotificationCategory(n.type) === notifFilter.replace('s', '') as NotificationCategory;
    });

    const handleNotificationClick = (notification: NotificationItem) => {
        if (!notification.read_at) {
            router.post(
                `/notifications/${notification.id}/read`,
                {},
                { preserveScroll: true },
            );
        }
        setNotifOpen(false);

        // Insurance claim notifications
        const isInsuranceClaimNotif =
            notification.type.startsWith("insurance_");
        if (isInsuranceClaimNotif && notification.insurance_claim_id) {
            router.visit(
                `/insurance/claims/${notification.insurance_claim_id}`,
            );
            return;
        }

        // Insurance policy notifications
        const isPolicyNotif =
            notification.type === "policy_expiring_soon" ||
            notification.type === "policy_expired";
        if (isPolicyNotif && notification.insurance_policy_id) {
            router.visit(`/insurance/${notification.insurance_policy_id}`);
            return;
        }

        // Appointment notifications
        const isAppointmentNotif =
            notification.type.startsWith("appointment_") ||
            notification.type === "checkin_available" ||
            notification.type === "video_link_ready";
        if (isAppointmentNotif && notification.appointment_id) {
            router.visit(`/appointments/${notification.appointment_id}`);
            return;
        }

        // Health record notifications
        const isHealthRecordNotif =
            notification.type === "lab_results_ready" ||
            notification.type === "abnormal_results" ||
            notification.type === "prescription_expiring" ||
            notification.type === "followup_required";
        if (isHealthRecordNotif && notification.health_record_id) {
            router.visit(`/health-records/${notification.health_record_id}`);
            return;
        }

        // Family member notifications
        const isFamilyMemberNotif =
            notification.type === "member_verification_pending" ||
            notification.type === "member_added";
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
        router.post(
            "/notifications/mark-all-read",
            {},
            { preserveScroll: true },
        );
    };

    return (
        <div className="flex h-screen bg-background">
            {/* Sidebar Navigation */}
            <Sidebar user={user} />

            {/* Main Content Area */}
            <div className="flex flex-col flex-1 overflow-hidden">
                {/* Top Header */}
                <header
                    className="bg-background"
                    style={{
                        height: "80px",
                        borderBottom: "1px solid hsl(var(--border))",
                    }}
                >
                    <div className="h-full flex items-center justify-between px-6">
                        {/* Page Title */}
                        <div className="flex items-center gap-3">
                            {typeof pageIcon === "string" ? (
                                <img
                                    src={
                                        pageIcon.startsWith("/")
                                            ? pageIcon
                                            : `/assets/icons/${pageIcon}.svg`
                                    }
                                    alt={pageTitle || "Home"}
                                    className="h-6 w-6"
                                />
                            ) : pageIcon ? (
                                <Icon
                                    icon={pageIcon}
                                    className="h-6 w-6 text-foreground"
                                />
                            ) : (
                                <img
                                    src="/assets/icons/home.svg"
                                    alt={pageTitle || "Home"}
                                    className="h-6 w-6"
                                />
                            )}
                            <h2 className="text-subheading text-foreground">
                                {pageTitle || "Home"}
                            </h2>
                        </div>

                        {/* Right Side Actions */}
                        <div className="flex items-center gap-3">
                            {/* Search Icon Button */}
                            <Button
                                variant="ghost"
                                iconOnly
                                size="lg"
                                className="hover:bg-accent"
                                style={{
                                    backgroundColor:
                                        "hsl(var(--background))",
                                    border: "1px solid hsl(var(--border))",
                                }}
                                onClick={() => setSearchOpen(true)}
                            >
                                <Icon
                                    icon={Search}
                                    className="h-5 w-5 text-foreground"
                                />
                            </Button>

                            {/* Notifications Bell → Opens Sheet */}
                            <Button
                                variant="ghost"
                                iconOnly
                                size="lg"
                                className="hover:bg-accent relative"
                                style={{
                                    backgroundColor:
                                        "hsl(var(--background))",
                                    border: "1px solid hsl(var(--border))",
                                }}
                                onClick={() => setNotifOpen(true)}
                            >
                                <Icon
                                    icon={Bell}
                                    className="h-5 w-5 text-foreground"
                                />
                                {unreadCount > 0 && (
                                    <span className="absolute top-2.5 right-2.5 h-2.5 w-2.5 rounded-full bg-destructive ring-2 ring-background" />
                                )}
                            </Button>
                        </div>
                    </div>
                </header>

                {/* Profile Warning Banner */}
                {profileWarnings.length > 0 && !profileBannerDismissed && (
                    <Alert
                        variant="warning"
                        mode="sticky"
                        onDismiss={dismissProfileBanner}
                    >
                        <span className="font-medium">
                            Your profile is incomplete. Add{" "}
                            {profileWarnings.map((w, i) => (
                                <span key={w.key}>
                                    {i > 0 &&
                                        i < profileWarnings.length - 1 &&
                                        ", "}
                                    {i > 0 &&
                                        i === profileWarnings.length - 1 &&
                                        " and "}
                                    <Link
                                        href={w.href}
                                        className="underline font-semibold text-foreground hover:text-foreground/80"
                                    >
                                        {w.label}
                                    </Link>
                                </span>
                            ))}{" "}
                            for hassle-free claims.
                        </span>
                    </Alert>
                )}

                {/* Page Content */}
                <main
                    className="flex-1 overflow-y-auto flex flex-col pt-20 pb-5"
                    style={{
                        background:
                            "linear-gradient(180deg, hsl(var(--primary) / 0.1) 0%, hsl(var(--background) / 0.5) 13.94%, hsl(var(--background)) 30.77%)",
                    }}
                >
                    <div className="flex-1 flex justify-center">
                        {children}
                    </div>
                    <SupportFooter pageName={pageTitle || "this page"} />
                </main>
            </div>

            {/* Notifications Side Sheet */}
            <Sheet open={notifOpen} onOpenChange={setNotifOpen}>
                <SheetContent side="right">
                    <SheetHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <SheetTitle>Notifications</SheetTitle>
                                {unreadCount > 0 && (
                                    <Badge variant="danger" size="sm">
                                        {unreadCount}
                                    </Badge>
                                )}
                            </div>
                            {unreadCount > 0 && (
                                <div className="flex items-center gap-1.5 text-label text-primary cursor-pointer hover:underline" onClick={handleMarkAllAsRead}>
                                    <Icon icon={CheckCheck} className="h-3.5 w-3.5" />
                                    <span>Mark all read</span>
                                </div>
                            )}
                        </div>
                        <SheetDescription className="sr-only">
                            Billing notifications
                        </SheetDescription>

                        <Tabs
                            value={notifFilter}
                            onValueChange={(v) =>
                                setNotifFilter(v as "all" | "appointments" | "updates")
                            }
                            className="mt-4"
                        >
                            <TabsList>
                                <TabsTrigger value="all">All</TabsTrigger>
                                <TabsTrigger value="appointments">Appointments</TabsTrigger>
                                <TabsTrigger value="updates">Updates</TabsTrigger>
                            </TabsList>
                        </Tabs>
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
                                    No notifications yet
                                </p>
                                <p className="text-body text-muted-foreground mt-1">
                                    Updates about appointments, billing, and more will appear here.
                                </p>
                            </div>
                        ) : (
                            <SheetEdgeContent>
                                {/* Today */}
                                {displayedNotifications.filter((n) => getTimeGroup(n.created_at) === 'today').length > 0 && (
                                    <div>
                                        <h3 className="text-label text-muted-foreground px-5 py-3">Today</h3>
                                        <div className="divide-y divide-border">
                                            {displayedNotifications
                                                .filter((n) => getTimeGroup(n.created_at) === 'today')
                                                .map((n, idx) => (
                                                    <NotificationItem
                                                        key={n.id}
                                                        notification={n}
                                                        onClick={() => handleNotificationClick(n)}
                                                        index={idx}
                                                    />
                                                ))}
                                        </div>
                                    </div>
                                )}

                                {/* This Week */}
                                {displayedNotifications.filter((n) => getTimeGroup(n.created_at) === 'this-week').length > 0 && (
                                    <div className="mt-6">
                                        <h3 className="text-label text-muted-foreground px-5 py-3">This Week</h3>
                                        <div className="divide-y divide-border">
                                            {displayedNotifications
                                                .filter((n) => getTimeGroup(n.created_at) === 'this-week')
                                                .map((n, idx) => (
                                                    <NotificationItem
                                                        key={n.id}
                                                        notification={n}
                                                        onClick={() => handleNotificationClick(n)}
                                                        index={idx}
                                                    />
                                                ))}
                                        </div>
                                    </div>
                                )}

                                {/* Older */}
                                {displayedNotifications.filter((n) => getTimeGroup(n.created_at) === 'older').length > 0 && (
                                    <div className="mt-6">
                                        <h3 className="text-label text-muted-foreground px-5 py-3">Older</h3>
                                        <div className="divide-y divide-border">
                                            {displayedNotifications
                                                .filter((n) => getTimeGroup(n.created_at) === 'older')
                                                .map((n, idx) => (
                                                    <NotificationItem
                                                        key={n.id}
                                                        notification={n}
                                                        onClick={() => handleNotificationClick(n)}
                                                        index={idx}
                                                    />
                                                ))}
                                        </div>
                                    </div>
                                )}
                            </SheetEdgeContent>
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
        if (href === "/dashboard")
            return url === "/" || url.startsWith("/dashboard");
        return url.startsWith(href);
    };

    const getInitials = (name: string) =>
        name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

    return (
        <aside
            className="w-80 bg-background flex flex-col"
            style={{ borderRight: "1px solid hsl(var(--border))" }}
        >
            {/* Logo */}
            <div className="px-6 py-8">
                <Link
                    href={user ? "/dashboard" : "/"}
                    className="flex items-center gap-3"
                >
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
                    <NavLink
                        href="/dashboard"
                        iconName="home"
                        label="Home"
                        active={isActive("/dashboard")}
                    />
                    <NavLink
                        href="/appointments"
                        iconName="appointment"
                        label="Appointments"
                        active={isActive("/appointments")}
                    />
                    <NavLink
                        href="/health-records"
                        iconName="records"
                        label="Health Records"
                        active={isActive("/health-records")}
                    />
                    <NavLink
                        href="/insurance"
                        iconName="insurance"
                        label="Insurance"
                        active={isActive("/insurance")}
                    />
                    <NavLink
                        href="/billing"
                        iconName="billing"
                        label="Billing"
                        active={isActive("/billing")}
                    />
                    <NavLink
                        href="/family-members"
                        iconName="family"
                        label="Family Members"
                        active={isActive("/family-members")}
                    />
                </nav>
            )}

            {/* Spacer for guest mode */}
            {!user && <div className="flex-1" />}

            {/* User Profile Section - authenticated */}
            {user && (
                <div
                    className="px-6 py-4 border-t"
                    style={{ borderColor: "hsl(var(--border))" }}
                >
                    <Link
                        href="/settings"
                        className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted transition-colors"
                        style={{ borderRadius: "24px" }}
                    >
                        <Avatar className="h-10 w-10 flex-shrink-0">
                            <AvatarImage src={user.avatar_url} />
                            <AvatarFallback className="text-body">
                                {getInitials(user.name)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-card-title truncate text-foreground">
                                {user.name}
                            </p>
                            <p className="text-body text-muted-foreground truncate">
                                {user.email}
                            </p>
                        </div>
                    </Link>
                </div>
            )}

            {/* Guest actions - not authenticated */}
            {!user && (
                <div
                    className="px-6 py-4 border-t space-y-2"
                    style={{ borderColor: "hsl(var(--border))" }}
                >
                    <Link
                        href="/login"
                        className={cn(buttonVariants(), "w-full")}
                    >
                        Sign In
                    </Link>
                    <Link
                        href="/register"
                        className={cn(
                            buttonVariants({ variant: "secondary" }),
                            "w-full",
                        )}
                    >
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
        "flex items-center gap-3 px-4 py-3 text-subheading transition-all h-[50px]";

    const shapeClasses = "rounded-full";
    const restClasses = !active ? "text-foreground hover:bg-muted" : "";

    const iconSrc = active
        ? `/assets/icons/${iconName}-selected.svg`
        : `/assets/icons/${iconName}.svg`;

    const activeStyle = active
        ? {
              backgroundColor: "hsl(var(--primary) / 0.05)",
              color: "hsl(var(--primary))",
          }
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
