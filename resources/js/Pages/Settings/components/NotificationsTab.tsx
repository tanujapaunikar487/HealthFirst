import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Mail, MessageSquare, Phone } from '@/Lib/icons';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Switch } from '@/Components/ui/switch';
import { toast } from 'sonner';

interface HealthAlertSettings {
    lab_results: boolean;
    medication_reminders: boolean;
    doctor_messages: boolean;
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
    health_alerts?: HealthAlertSettings;
}

interface NotificationsTabProps {
    settings: NotificationSettings;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <h3
            className="font-semibold"
            style={{
                color: '#171717',
                fontSize: '20px',
                lineHeight: '28px',
                letterSpacing: '0',
            }}
        >
            {children}
        </h3>
    );
}

export function NotificationsTab({ settings }: NotificationsTabProps) {
    const [channels, setChannels] = useState(settings.channels);
    const [categories, setCategories] = useState(settings.categories);
    const [saving, setSaving] = useState(false);

    // Initialize from settings prop with defaults
    const [healthAlerts, setHealthAlerts] = useState<HealthAlertSettings>(
        settings.health_alerts ?? {
            lab_results: true,
            medication_reminders: true,
            doctor_messages: true,
        }
    );

    const handleChannelToggle = (channel: keyof typeof channels, value: boolean) => {
        setChannels((prev) => ({ ...prev, [channel]: value }));
    };

    const handleCategoryToggle = (category: keyof typeof categories, value: boolean) => {
        setCategories((prev) => ({ ...prev, [category]: value }));
    };

    const handleHealthAlertToggle = (key: keyof HealthAlertSettings, value: boolean) => {
        setHealthAlerts((prev) => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        setSaving(true);
        router.put(
            '/settings/notifications',
            { channels, categories, health_alerts: healthAlerts },
            {
                onSuccess: () => {
                    toast.success('Notification preferences updated');
                },
                onError: () => {
                    toast.error('Failed to update preferences');
                },
                onFinish: () => setSaving(false),
            }
        );
    };

    return (
        <div className="space-y-8">
            {/* Notification Channels */}
            <div>
                <SectionTitle>Notification channels</SectionTitle>
                <Card className="mt-4">
                    <CardContent className="p-0 divide-y">
                        {/* Email */}
                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                    <Mail className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold leading-5 text-[#171717]">Email</p>
                                    <p className="text-sm font-normal leading-5 text-[#737373]">
                                        Receive notifications via email
                                    </p>
                                </div>
                            </div>
                            <Switch
                                checked={channels.email}
                                onCheckedChange={(v) => handleChannelToggle('email', v)}
                            />
                        </div>

                        {/* WhatsApp */}
                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                    <MessageSquare className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold leading-5 text-[#171717]">WhatsApp</p>
                                    <p className="text-sm font-normal leading-5 text-[#737373]">
                                        Receive notifications via WhatsApp
                                    </p>
                                </div>
                            </div>
                            <Switch
                                checked={channels.whatsapp}
                                onCheckedChange={(v) => handleChannelToggle('whatsapp', v)}
                            />
                        </div>

                        {/* SMS */}
                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                    <Phone className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold leading-5 text-[#171717]">SMS</p>
                                    <p className="text-sm font-normal leading-5 text-[#737373]">
                                        Receive notifications via SMS
                                    </p>
                                </div>
                            </div>
                            <Switch
                                checked={channels.sms}
                                onCheckedChange={(v) => handleChannelToggle('sms', v)}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Appointments */}
            <div>
                <SectionTitle>Appointments</SectionTitle>
                <Card className="mt-4">
                    <CardContent className="p-0">
                        <div className="flex items-center justify-between p-4">
                            <div>
                                <p className="text-sm font-semibold leading-5 text-[#171717]">Appointment Reminders</p>
                                <p className="text-sm font-normal leading-5 text-[#737373]">
                                    Get reminded before your scheduled appointments
                                </p>
                            </div>
                            <Switch
                                checked={categories.appointments}
                                onCheckedChange={(v) => handleCategoryToggle('appointments', v)}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Health Alerts */}
            <div>
                <SectionTitle>Health alerts</SectionTitle>
                <Card className="mt-4">
                    <CardContent className="p-0 divide-y">
                        {/* Lab Results */}
                        <div className="flex items-center justify-between p-4">
                            <div>
                                <p className="text-sm font-semibold leading-5 text-[#171717]">Lab Results Available</p>
                                <p className="text-sm font-normal leading-5 text-[#737373]">
                                    Get notified when new lab results are ready
                                </p>
                            </div>
                            <Switch
                                checked={healthAlerts.lab_results}
                                onCheckedChange={(v) => handleHealthAlertToggle('lab_results', v)}
                            />
                        </div>

                        {/* Prescription Reminders */}
                        <div className="flex items-center justify-between p-4">
                            <div>
                                <p className="text-sm font-semibold leading-5 text-[#171717]">Prescription Reminders</p>
                                <p className="text-sm font-normal leading-5 text-[#737373]">
                                    Daily reminders for your prescriptions
                                </p>
                            </div>
                            <Switch
                                checked={healthAlerts.medication_reminders}
                                onCheckedChange={(v) => handleHealthAlertToggle('medication_reminders', v)}
                            />
                        </div>

                        {/* Doctor Messages */}
                        <div className="flex items-center justify-between p-4">
                            <div>
                                <p className="text-sm font-semibold leading-5 text-[#171717]">Doctor Messages</p>
                                <p className="text-sm font-normal leading-5 text-[#737373]">
                                    Notifications when your doctor sends a message
                                </p>
                            </div>
                            <Switch
                                checked={healthAlerts.doctor_messages}
                                onCheckedChange={(v) => handleHealthAlertToggle('doctor_messages', v)}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Billing & Payments */}
            <div>
                <SectionTitle>Billing & payments</SectionTitle>
                <Card className="mt-4">
                    <CardContent className="p-0">
                        <div className="flex items-center justify-between p-4">
                            <div>
                                <p className="text-sm font-semibold leading-5 text-[#171717]">Bill Payment Reminders</p>
                                <p className="text-sm font-normal leading-5 text-[#737373]">
                                    Reminders for pending and upcoming bills
                                </p>
                            </div>
                            <Switch
                                checked={categories.billing}
                                onCheckedChange={(v) => handleCategoryToggle('billing', v)}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Updates & Offers */}
            <div>
                <SectionTitle>Updates & offers</SectionTitle>
                <Card className="mt-4">
                    <CardContent className="p-0">
                        <div className="flex items-center justify-between p-4">
                            <div>
                                <p className="text-sm font-semibold leading-5 text-[#171717]">Health Tips & Promotions</p>
                                <p className="text-sm font-normal leading-5 text-[#737373]">
                                    Occasional emails about health camps and special offers
                                </p>
                            </div>
                            <Switch
                                checked={categories.promotions}
                                onCheckedChange={(v) => handleCategoryToggle('promotions', v)}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Save Button */}
            <div>
                <Button onClick={handleSave} disabled={saving} className="px-8">
                    {saving ? 'Saving...' : 'Save changes'}
                </Button>
            </div>
        </div>
    );
}
