import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { User, Bell, Settings2, Link2, LogOut } from '@/Lib/icons';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/Components/ui/button';
import { Icon } from '@/Components/ui/icon';
import { SideNav, SideNavItem } from '@/Components/SideNav';
import { ProfileTab } from './components/ProfileTab';
import { NotificationsTab } from './components/NotificationsTab';
import { PreferencesTab } from './components/PreferencesTab';
import { ConnectionsTab } from './components/ConnectionsTab';
import { PasswordModal } from './components/PasswordModal';

interface FamilyMember {
    id: number;
    name: string;
    relation: string;
    phone: string | null;
}

interface DoctorOption {
    id: number;
    name: string;
    specialization: string;
}

interface User {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    date_of_birth: string | null;
    gender: string | null;
    avatar_url: string | null;
    address_line_1: string | null;
    address_line_2: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;
    emergency_contact_type: 'family_member' | 'custom' | null;
    emergency_contact_member_id: number | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    emergency_contact_relation: string | null;
    // Health fields (synced with self FamilyMember)
    blood_group: string | null;
    primary_doctor_id: number | null;
    medical_conditions: string[];
    allergies: string[];
}

interface NotificationSettings {
    channels: {
        email: boolean;
        sms: boolean;
        whatsapp: boolean;
    };
    categories: {
        appointments: boolean;
        health_alerts: boolean;
        billing: boolean;
        insurance: boolean;
        promotions: boolean;
    };
}

interface PreferenceSettings {
    language: string;
    date_format: string;
    time_format: string;
    accessibility: {
        text_size: number;
        high_contrast: boolean;
    };
}

interface BookingDefaults {
    default_patient_id: string | null;
    default_consultation_mode: string | null;
    default_lab_collection_method: string | null;
}

interface CalendarSettings {
    preferred?: 'google' | 'apple' | null;
    google: {
        connected: boolean;
        enabled: boolean;
        email?: string;
    };
    apple: {
        enabled: boolean;
    };
}

interface Props {
    user: User;
    familyMembers: FamilyMember[];
    doctors: DoctorOption[];
    notifications: NotificationSettings;
    preferences: PreferenceSettings;
    bookingDefaults: BookingDefaults;
    calendarSettings: CalendarSettings;
}

type Tab = 'profile' | 'notifications' | 'preferences' | 'connections';

const NAV_ITEMS: SideNavItem[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'Preferences', icon: Settings2 },
    { id: 'connections', label: 'Connections', icon: Link2 },
];

export default function SettingsIndex({
    user,
    familyMembers,
    doctors,
    notifications,
    preferences,
    bookingDefaults,
    calendarSettings,
}: Props) {
    const [activeTab, setActiveTab] = useState<Tab>('profile');
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    // Handle URL parameter for direct tab navigation
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get('tab');
        if (tab && ['profile', 'notifications', 'preferences', 'connections'].includes(tab)) {
            setActiveTab(tab as Tab);
        }
    }, []);

    const handleLogout = () => {
        setLoggingOut(true);
        router.post('/logout');
    };

    return (
        <AppLayout user={user}>
            <Head title="Settings" />

            <div className="w-full max-w-page pb-20">
                <h1 className="text-page-title mb-6 text-foreground">
                    Settings
                </h1>

                <div className="flex gap-24">
                    {/* Sidebar Navigation */}
                    <div className="min-w-sidebar flex-shrink-0">
                        <div className="sticky top-6">
                            <SideNav
                                items={NAV_ITEMS}
                                activeId={activeTab}
                                onSelect={(id) => setActiveTab(id as Tab)}
                                sticky={false}
                            />

                            {/* Logout Button */}
                            <div className="mt-6 pt-6 border-t">
                                <Button
                                    variant="ghost"
                                    className="w-full flex items-center gap-3 text-label transition-all text-left rounded-full cursor-pointer bg-destructive/10 text-destructive hover:bg-destructive/15 h-auto py-2 px-3"
                                    onClick={handleLogout}
                                    disabled={loggingOut}
                                >
                                    <Icon icon={LogOut} className="h-5 w-5 flex-shrink-0" />
                                    <span className="truncate">{loggingOut ? 'Logging out...' : 'Logout'}</span>
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 min-w-0 pb-20">
                        {activeTab === 'profile' && (
                            <ProfileTab user={user} familyMembers={familyMembers} doctors={doctors} />
                        )}

                        {activeTab === 'notifications' && (
                            <NotificationsTab settings={notifications} />
                        )}

                        {activeTab === 'preferences' && (
                            <PreferencesTab
                                settings={preferences}
                                bookingDefaults={bookingDefaults}
                                familyMembers={familyMembers}
                                onOpenPasswordModal={() => setShowPasswordModal(true)}
                            />
                        )}

                        {activeTab === 'connections' && (
                            <ConnectionsTab
                                calendarSettings={calendarSettings}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Password Change Modal */}
            <PasswordModal
                open={showPasswordModal}
                onOpenChange={setShowPasswordModal}
            />
        </AppLayout>
    );
}
