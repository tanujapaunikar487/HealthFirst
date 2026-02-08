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

interface VideoSettings {
    preferred?: 'zoom' | 'google_meet' | null;
}

interface ConnectionsTabProps {
    calendarSettings: CalendarSettings;
    videoSettings: VideoSettings;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <h3 className="text-section-title text-foreground">
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

export function ConnectionsTab({ calendarSettings, videoSettings }: ConnectionsTabProps) {
    const [disconnecting, setDisconnecting] = useState(false);

    const preferred = calendarSettings?.preferred ?? null;
    const isGoogleConnected = calendarSettings?.google?.connected ?? false;
    const googleEmail = calendarSettings?.google?.email;

    const videoPreferred = videoSettings?.preferred ?? null;

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

    const handleSetVideoPreferred = (platform: 'zoom' | 'google_meet') => {
        const newPreferred = videoPreferred === platform ? null : platform;
        router.put('/settings/video/preferred', { preferred: newPreferred }, {
            preserveScroll: true,
            onSuccess: () => {
                if (newPreferred) {
                    const platformName = newPreferred === 'zoom' ? 'Zoom' : 'Google Meet';
                    toast.success(`${platformName} set as preferred`);
                } else {
                    toast.success('Video preference cleared');
                }
            },
            onError: () => {
                toast.error('Failed to update video preference');
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
            {/* Video Section */}
            <div>
                <div className="mb-4">
                    <SectionTitle>Video Consultation</SectionTitle>
                    <p className="text-body text-muted-foreground mt-1">
                        Choose your preferred platform for video consultations
                    </p>
                </div>

                <Card>
                    <CardContent className="p-0 divide-y">
                        {/* Google Meet */}
                        <div
                            className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-neutral-50 transition-colors"
                            onClick={() => handleSetVideoPreferred('google_meet')}
                        >
                            <div className="flex items-center gap-3">
                                <RadioIndicator selected={videoPreferred === 'google_meet'} />
                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                    <img src="/assets/icons/google-meet.svg" alt="Google Meet" className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-card-title text-foreground">Google Meet</p>
                                    <p className="text-body text-muted-foreground">
                                        Join consultations via Google Meet
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Zoom */}
                        <div
                            className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-neutral-50 transition-colors"
                            onClick={() => handleSetVideoPreferred('zoom')}
                        >
                            <div className="flex items-center gap-3">
                                <RadioIndicator selected={videoPreferred === 'zoom'} />
                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                    <img src="/assets/icons/zoom.svg" alt="Zoom" className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-card-title text-foreground">Zoom</p>
                                    <p className="text-body text-muted-foreground">
                                        Join consultations via Zoom
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Calendar Section */}
            <div>
                <div className="mb-4">
                    <SectionTitle>Calendar</SectionTitle>
                    <p className="text-body text-muted-foreground mt-1">
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
                                    <p className="text-card-title text-foreground">Google Calendar</p>
                                    <p className="text-body text-muted-foreground">
                                        {isGoogleConnected && googleEmail
                                            ? googleEmail
                                            : 'Auto-sync appointments to Google Calendar'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                                {isGoogleConnected ? (
                                    <>
                                        <Badge variant="success" icon={Check}>
                                            Connected
                                        </Badge>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleDisconnectGoogle}
                                            disabled={disconnecting}
                                            className="text-body text-muted-foreground hover:text-destructive"
                                        >
                                            {disconnecting ? 'Disconnecting...' : 'Disconnect'}
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        variant="secondary"
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
                                    <p className="text-card-title text-foreground">Apple Calendar</p>
                                    <p className="text-body text-muted-foreground">
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
