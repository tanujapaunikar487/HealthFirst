import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { User, Bell, Settings2, Link2, LogOut } from '@/Lib/icons';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/Components/ui/button';
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
}

type Tab = 'profile' | 'notifications' | 'preferences' | 'connections';

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
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
    videoSettings,
    calendarSettings,
}: Props) {
    const [activeTab, setActiveTab] = useState<Tab>('profile');
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    const handleLogout = () => {
        setLoggingOut(true);
        router.post('/logout');
    };

    return (
        <AppLayout user={user}>
            <Head title="Settings" />

            <div className="w-full max-w-[960px]">
                <h1 className="text-2xl font-bold mb-6">Settings</h1>

                <div className="flex gap-8">
                    {/* Sidebar Navigation */}
                    <div className="w-48 flex-shrink-0">
                        <nav className="space-y-1">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                                            activeTab === tab.id
                                                ? 'bg-primary/10 text-primary font-medium'
                                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                        }`}
                                    >
                                        <Icon className="h-5 w-5" />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </nav>

                        {/* Logout Button */}
                        <div className="mt-6 pt-6 border-t">
                            <Button
                                variant="outline"
                                onClick={handleLogout}
                                disabled={loggingOut}
                                className="w-full justify-start text-muted-foreground hover:text-destructive hover:border-destructive"
                            >
                                <LogOut className="h-5 w-5 mr-3" />
                                {loggingOut ? 'Logging out...' : 'Logout'}
                            </Button>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 min-w-0">
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
