import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Download, Check } from '@/Lib/icons';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { toast } from 'sonner';

interface CalendarSettings {
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

export function ConnectionsTab({ calendarSettings }: ConnectionsTabProps) {
    const [exporting, setExporting] = useState(false);
    const [disconnecting, setDisconnecting] = useState(false);

    const handleExportCalendar = () => {
        setExporting(true);

        fetch('/settings/calendar/apple/export', {
            credentials: 'same-origin',
            headers: {
                'Accept': 'application/json',
            },
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Export failed');
                }
                return response.json();
            })
            .then(data => {
                if (data.download_url) {
                    const link = document.createElement('a');
                    link.href = data.download_url;
                    link.download = `appointments-${new Date().toISOString().split('T')[0]}.ics`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    toast.success('Calendar exported successfully');
                } else {
                    toast.error('Failed to export calendar');
                }
            })
            .catch(() => {
                toast.error('Failed to export calendar');
            })
            .finally(() => setExporting(false));
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

    const isGoogleConnected = calendarSettings?.google?.connected ?? false;
    const googleEmail = calendarSettings?.google?.email;

    return (
        <div className="space-y-12">
            {/* Calendar Section */}
            <div>
                <div className="mb-4">
                    <SectionTitle>Calendar</SectionTitle>
                    <p className="text-[14px] text-muted-foreground mt-1">
                        Sync appointments to your personal calendar
                    </p>
                </div>

                <Card>
                    <CardContent className="p-0 divide-y">
                        {/* Google Calendar */}
                        <div className="flex items-center justify-between px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                    <img src="/assets/icons/google-calendar.svg" alt="Google Calendar" className="h-8 w-8" />
                                </div>
                                <div>
                                    <p className="text-[14px] font-semibold leading-5 text-[#171717]">Google Calendar</p>
                                    <p className="text-[14px] font-normal leading-5 text-[#737373]">
                                        {isGoogleConnected && googleEmail
                                            ? googleEmail
                                            : 'Auto-sync appointments to Google Calendar'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {isGoogleConnected ? (
                                    <>
                                        <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
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
                                        onClick={handleConnectGoogle}
                                    >
                                        Connect
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Apple Calendar / ICS Export */}
                        <div className="flex items-center justify-between px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                    <img src="/assets/icons/apple-calendar.svg" alt="Apple Calendar" className="h-8 w-8" />
                                </div>
                                <div>
                                    <p className="text-[14px] font-semibold leading-5 text-[#171717]">Apple Calendar / Other</p>
                                    <p className="text-[14px] font-normal leading-5 text-[#737373]">
                                        Download .ics file for any calendar app
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                onClick={handleExportCalendar}
                                disabled={exporting}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                {exporting ? 'Exporting...' : 'Export'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
