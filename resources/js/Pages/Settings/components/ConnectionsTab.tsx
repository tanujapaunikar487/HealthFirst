import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Check } from '@/Lib/icons';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { toast } from 'sonner';

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

interface ConnectionsTabProps {
    calendarSettings: CalendarSettings;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <h3
            className="font-semibold"
            style={{
                color: 'hsl(var(--foreground))',
                fontSize: '20px',
                lineHeight: '28px',
                letterSpacing: '0',
            }}
        >
            {children}
        </h3>
    );
}

function RadioIndicator({ selected }: { selected: boolean }) {
    return (
        <div
            className="flex-shrink-0"
            style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                border: selected ? '2px solid hsl(var(--primary))' : '2px solid hsl(var(--border))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            {selected && (
                <div
                    style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: 'hsl(var(--primary))',
                    }}
                />
            )}
        </div>
    );
}

export function ConnectionsTab({ calendarSettings }: ConnectionsTabProps) {
    const [disconnecting, setDisconnecting] = useState(false);

    const preferred = calendarSettings?.preferred ?? null;
    const isGoogleConnected = calendarSettings?.google?.connected ?? false;
    const googleEmail = calendarSettings?.google?.email;

    const handleSetPreferred = (calendar: 'google' | 'apple') => {
        const newPreferred = preferred === calendar ? null : calendar;
        router.put('/settings/calendar/preferred', { preferred: newPreferred }, {
            preserveScroll: true,
            onSuccess: () => {
                if (newPreferred) {
                    toast.success(`${newPreferred === 'google' ? 'Google Calendar' : 'Apple Calendar'} set as preferred`);
                } else {
                    toast.success('Calendar preference cleared');
                }
            },
            onError: () => {
                toast.error('Failed to update calendar preference');
            },
        });
    };

    const handleConnectGoogle = () => {
        window.location.href = '/settings/calendar/google/connect';
    };

    const handleDisconnectGoogle = () => {
        setDisconnecting(true);
        router.delete('/settings/calendar/google', {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Google Calendar disconnected');
            },
            onError: () => {
                toast.error('Failed to disconnect Google Calendar');
            },
            onFinish: () => setDisconnecting(false),
        });
    };

    return (
        <div className="space-y-12">
            {/* Calendar Section */}
            <div>
                <div className="mb-4">
                    <SectionTitle>Calendar</SectionTitle>
                    <p className="text-[14px] text-muted-foreground mt-1">
                        Sync appointments to your preferred calendar
                    </p>
                </div>

                <Card>
                    <CardContent className="p-0 divide-y">
                        {/* Google Calendar */}
                        <div
                            className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-neutral-50 transition-colors"
                            onClick={() => handleSetPreferred('google')}
                        >
                            <div className="flex items-center gap-3">
                                <RadioIndicator selected={preferred === 'google'} />
                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                    <img src="/assets/icons/google-calendar.svg" alt="Google Calendar" className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-[14px] font-semibold leading-5 text-foreground">Google Calendar</p>
                                    <p className="text-[14px] font-normal leading-5 text-muted-foreground">
                                        {isGoogleConnected && googleEmail
                                            ? googleEmail
                                            : 'Auto-sync appointments to Google Calendar'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                                {isGoogleConnected ? (
                                    <>
                                        <Badge variant="outline" className="border-success/20 bg-success/10 text-success">
                                            <Check className="h-3 w-3 mr-1" /> Connected
                                        </Badge>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleDisconnectGoogle}
                                            disabled={disconnecting}
                                            className="text-[14px] text-muted-foreground hover:text-destructive"
                                        >
                                            {disconnecting ? 'Disconnecting...' : 'Disconnect'}
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        variant="outline"
                                        size="md"
                                        onClick={handleConnectGoogle}
                                    >
                                        Connect
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Apple Calendar */}
                        <div
                            className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-neutral-50 transition-colors"
                            onClick={() => handleSetPreferred('apple')}
                        >
                            <div className="flex items-center gap-3">
                                <RadioIndicator selected={preferred === 'apple'} />
                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                    <img src="/assets/icons/apple-calendar.svg" alt="Apple Calendar" className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-[14px] font-semibold leading-5 text-foreground">Apple Calendar</p>
                                    <p className="text-[14px] font-normal leading-5 text-muted-foreground">
                                        Download .ics file after each booking
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
