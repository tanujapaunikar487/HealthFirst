import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { User, Bell, Settings2, Link2, LogOut, CreditCard } from '@/Lib/icons';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/Components/ui/button';
import { Icon } from '@/Components/ui/icon';
import { SideNav, SideNavItem } from '@/Components/SideNav';
import { ProfileTab } from './components/ProfileTab';
import { NotificationsTab } from './components/NotificationsTab';
import { PreferencesTab } from './components/PreferencesTab';
import { ConnectionsTab } from './components/ConnectionsTab';
import { PaymentsTab, PaymentMethod, UpiId } from './components/PaymentsTab';
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

interface VideoSettings {
    provider: 'google_meet' | 'zoom';
    google_meet: { enabled: boolean };
    zoom: { enabled: boolean };
}

interface CalendarSettings {
    google: {
        connected: boolean;
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
    videoSettings: VideoSettings;
    calendarSettings: CalendarSettings;
    paymentMethods?: PaymentMethod[];
    upiIds?: UpiId[];
}

type Tab = 'profile' | 'notifications' | 'preferences' | 'payments' | 'connections';

const NAV_ITEMS: SideNavItem[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'Preferences', icon: Settings2 },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'connections', label: 'Connections', icon: Link2 },
];

export default function SettingsIndex({
    user,
    familyMembers,
    doctors,
    notifications,
    preferences,
    bookingDefaults,
    videoSettings,
    calendarSettings,
    paymentMethods,
    upiIds,
}: Props) {
    const [activeTab, setActiveTab] = useState<Tab>('profile');
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    // Handle URL parameter for direct tab navigation
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get('tab');
        if (tab && ['profile', 'notifications', 'preferences', 'payments', 'connections'].includes(tab)) {
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

            <div className="w-full max-w-[960px] pb-20">
                <h1 className="text-2xl font-bold mb-6">Settings</h1>

                <div className="flex gap-8">
                    {/* Sidebar Navigation */}
                    <div className="w-48 flex-shrink-0">
                        <SideNav
                            items={NAV_ITEMS}
                            activeId={activeTab}
                            onSelect={(id) => setActiveTab(id as Tab)}
                            sticky={false}
                        />

                        {/* Logout Button */}
                        <div className="mt-6 pt-6 border-t">
                            <button
                                type="button"
                                onClick={handleLogout}
                                disabled={loggingOut}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium transition-all text-left rounded-full cursor-pointer text-neutral-900 hover:bg-red-50 hover:text-red-600"
                            >
                                <Icon icon={LogOut} className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate">{loggingOut ? 'Logging out...' : 'Logout'}</span>
                            </button>
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

                        {activeTab === 'payments' && (
                            <PaymentsTab paymentMethods={paymentMethods} upiIds={upiIds} />
                        )}

                        {activeTab === 'connections' && (
                            <ConnectionsTab
                                videoSettings={videoSettings}
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
