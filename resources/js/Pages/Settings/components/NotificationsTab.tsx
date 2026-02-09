import { useState, useRef, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Mail, MessageSquare, Phone } from '@/Lib/icons';
import { Card, CardContent } from '@/Components/ui/card';
import { Switch } from '@/Components/ui/switch';
import { CardTitle, CardSubtext } from '@/Components/ui/card-typography';
import { useToast } from '@/Contexts/ToastContext';

interface HealthAlertSettings {
    lab_results: boolean;
    medication_reminders: boolean;
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
        <h3 className="text-section-title text-foreground">
            {children}
        </h3>
    );
}

export function NotificationsTab({ settings }: NotificationsTabProps) {
    const { showToast } = useToast();
    const [channels, setChannels] = useState(settings.channels);
    const [categories, setCategories] = useState(settings.categories);

    // Initialize from settings prop with defaults
    const [healthAlerts, setHealthAlerts] = useState<HealthAlertSettings>(
        settings.health_alerts ?? {
            lab_results: true,
            medication_reminders: true,
        }
    );

    // Debounced auto-save
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const timeout = setTimeout(() => {
            router.put(
                '/settings/notifications',
                { channels, categories, health_alerts: healthAlerts },
                {
                    preserveState: true,
                    preserveScroll: true,
                    onError: () => showToast('Failed to save notification preferences', 'error'),
                }
            );
        }, 1000);

        return () => clearTimeout(timeout);
    }, [channels, categories, healthAlerts]);

    const handleChannelToggle = (channel: keyof typeof channels, value: boolean) => {
        setChannels((prev) => ({ ...prev, [channel]: value }));
    };

    const handleCategoryToggle = (category: keyof typeof categories, value: boolean) => {
        setCategories((prev) => ({ ...prev, [category]: value }));
    };

    const handleHealthAlertToggle = (key: keyof HealthAlertSettings, value: boolean) => {
        setHealthAlerts((prev) => ({ ...prev, [key]: value }));
    };

    return (
        <div className="space-y-12">
            {/* Notification Channels */}
            <div>
                <SectionTitle>Notification channels</SectionTitle>
                <Card className="mt-4">
                    <CardContent className="p-0 divide-y">
                        {/* Email */}
                        <div className="flex items-center justify-between px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                    <Mail className="h-5 w-5 text-foreground" />
                                </div>
                                <div>
                                    <CardTitle>Email</CardTitle>
                                    <CardSubtext>Receive notifications via email</CardSubtext>
                                </div>
                            </div>
                            <Switch
                                checked={channels.email}
                                onCheckedChange={(v) => handleChannelToggle('email', v)}
                            />
                        </div>

                        {/* WhatsApp */}
                        <div className="flex items-center justify-between px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                    <MessageSquare className="h-5 w-5 text-foreground" />
                                </div>
                                <div>
                                    <CardTitle>WhatsApp</CardTitle>
                                    <CardSubtext>Receive notifications via WhatsApp</CardSubtext>
                                </div>
                            </div>
                            <Switch
                                checked={channels.whatsapp}
                                onCheckedChange={(v) => handleChannelToggle('whatsapp', v)}
                            />
                        </div>

                        {/* SMS */}
                        <div className="flex items-center justify-between px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                    <Phone className="h-5 w-5 text-foreground" />
                                </div>
                                <div>
                                    <CardTitle>SMS</CardTitle>
                                    <CardSubtext>Receive notifications via SMS</CardSubtext>
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
                        <div className="flex items-center justify-between px-6 py-4">
                            <div>
                                <CardTitle>Appointment Reminders</CardTitle>
                                <CardSubtext>Get reminded before your scheduled appointments</CardSubtext>
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
                        {/* Master Health Alerts Toggle */}
                        <div className="flex items-center justify-between px-6 py-4">
                            <div>
                                <CardTitle>Health Alerts</CardTitle>
                                <CardSubtext>Enable all health-related notifications</CardSubtext>
                            </div>
                            <Switch
                                checked={categories.health_alerts}
                                onCheckedChange={(v) => handleCategoryToggle('health_alerts', v)}
                            />
                        </div>

                        {/* Lab Results */}
                        <div className="flex items-center justify-between px-6 py-4">
                            <div>
                                <CardTitle>Lab Results Available</CardTitle>
                                <CardSubtext>Get notified when new lab results are ready</CardSubtext>
                            </div>
                            <Switch
                                checked={healthAlerts.lab_results}
                                onCheckedChange={(v) => handleHealthAlertToggle('lab_results', v)}
                                disabled={!categories.health_alerts}
                            />
                        </div>

                        {/* Prescription Reminders */}
                        <div className="flex items-center justify-between px-6 py-4">
                            <div>
                                <CardTitle>Prescription Reminders</CardTitle>
                                <CardSubtext>Get notified when medications are expiring and may need a refill</CardSubtext>
                            </div>
                            <Switch
                                checked={healthAlerts.medication_reminders}
                                onCheckedChange={(v) => handleHealthAlertToggle('medication_reminders', v)}
                                disabled={!categories.health_alerts}
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
                        <div className="flex items-center justify-between px-6 py-4">
                            <div>
                                <CardTitle>Bill Payment Reminders</CardTitle>
                                <CardSubtext>Reminders for pending and upcoming bills</CardSubtext>
                            </div>
                            <Switch
                                checked={categories.billing}
                                onCheckedChange={(v) => handleCategoryToggle('billing', v)}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Insurance */}
            <div>
                <SectionTitle>Insurance</SectionTitle>
                <Card className="mt-4">
                    <CardContent className="p-0">
                        <div className="flex items-center justify-between px-6 py-4">
                            <div>
                                <CardTitle>Insurance Claim Updates</CardTitle>
                                <CardSubtext>Get notified about claim status changes and approvals</CardSubtext>
                            </div>
                            <Switch
                                checked={categories.insurance}
                                onCheckedChange={(v) => handleCategoryToggle('insurance', v)}
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
                        <div className="flex items-center justify-between px-6 py-4">
                            <div>
                                <CardTitle>Health Tips & Promotions</CardTitle>
                                <CardSubtext>Occasional emails about health camps and special offers</CardSubtext>
                            </div>
                            <Switch
                                checked={categories.promotions}
                                onCheckedChange={(v) => handleCategoryToggle('promotions', v)}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
