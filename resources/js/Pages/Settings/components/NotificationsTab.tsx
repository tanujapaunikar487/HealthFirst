import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Mail, MessageSquare, Phone } from '@/Lib/icons';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Switch } from '@/Components/ui/switch';
import { toast } from 'sonner';

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

interface NotificationsTabProps {
    settings: NotificationSettings;
}

const channelIcons = {
    email: Mail,
    sms: Phone,
    whatsapp: MessageSquare,
};

const channelLabels = {
    email: { name: 'Email', description: 'Receive notifications via email' },
    sms: { name: 'SMS', description: 'Receive notifications via text message' },
    whatsapp: { name: 'WhatsApp', description: 'Receive notifications via WhatsApp' },
};

const categoryLabels = {
    appointments: {
        name: 'Appointments',
        description: 'Reminders, confirmations, and cancellations',
    },
    health_alerts: {
        name: 'Health Alerts',
        description: 'Abnormal results and medication reminders',
    },
    billing: {
        name: 'Billing',
        description: 'Due dates and payment confirmations',
    },
    insurance: {
        name: 'Insurance',
        description: 'Claim updates and policy renewals',
    },
    promotions: {
        name: 'Promotions',
        description: 'Health camps and special offers',
    },
};

export function NotificationsTab({ settings }: NotificationsTabProps) {
    const [channels, setChannels] = useState(settings.channels);
    const [categories, setCategories] = useState(settings.categories);
    const [saving, setSaving] = useState(false);

    const handleChannelToggle = (channel: keyof typeof channels, value: boolean) => {
        setChannels((prev) => ({ ...prev, [channel]: value }));
    };

    const handleCategoryToggle = (category: keyof typeof categories, value: boolean) => {
        setCategories((prev) => ({ ...prev, [category]: value }));
    };

    const handleSave = () => {
        setSaving(true);
        router.put(
            '/settings/notifications',
            { channels, categories },
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

    const hasChanges =
        JSON.stringify(channels) !== JSON.stringify(settings.channels) ||
        JSON.stringify(categories) !== JSON.stringify(settings.categories);

    return (
        <div className="space-y-6">
            {/* Channel Preferences */}
            <Card>
                <CardContent className="pt-6">
                    <h4 className="font-medium text-lg mb-4">Notification Channels</h4>
                    <p className="text-sm text-muted-foreground mb-6">
                        Choose how you want to receive notifications
                    </p>
                    <div className="space-y-4">
                        {(Object.keys(channelLabels) as Array<keyof typeof channelLabels>).map((channel) => {
                            const Icon = channelIcons[channel];
                            const label = channelLabels[channel];
                            return (
                                <div key={channel} className="flex items-center justify-between py-2">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <Icon className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{label.name}</p>
                                            <p className="text-sm text-muted-foreground">{label.description}</p>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={channels[channel]}
                                        onCheckedChange={(v) => handleChannelToggle(channel, v)}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Category Preferences */}
            <Card>
                <CardContent className="pt-6">
                    <h4 className="font-medium text-lg mb-4">Notification Categories</h4>
                    <p className="text-sm text-muted-foreground mb-6">
                        Choose which types of notifications you want to receive
                    </p>
                    <div className="space-y-4">
                        {(Object.keys(categoryLabels) as Array<keyof typeof categoryLabels>).map(
                            (category) => {
                                const label = categoryLabels[category];
                                return (
                                    <div key={category} className="flex items-center justify-between py-2">
                                        <div>
                                            <p className="font-medium">{label.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {label.description}
                                            </p>
                                        </div>
                                        <Switch
                                            checked={categories[category]}
                                            onCheckedChange={(v) => handleCategoryToggle(category, v)}
                                        />
                                    </div>
                                );
                            }
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving || !hasChanges} className="min-w-[120px]">
                    {saving ? 'Saving...' : 'Save Preferences'}
                </Button>
            </div>
        </div>
    );
}
