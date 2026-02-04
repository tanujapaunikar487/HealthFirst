import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Download, Info, Check, GoogleMeet, ZoomIcon, GoogleCalendar, AppleIcon } from '@/Lib/icons';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { toast } from 'sonner';

interface VideoSettings {
    provider: 'google_meet' | 'zoom';
    google_meet: { enabled: boolean; email?: string };
    zoom: { enabled: boolean };
}

interface CalendarSettings {
    google: {
        enabled: boolean;
        email?: string;
    };
    apple: {
        enabled: boolean;
    };
}

interface ConnectionsTabProps {
    videoSettings: VideoSettings;
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

export function ConnectionsTab({ videoSettings, calendarSettings: _calendarSettings }: ConnectionsTabProps) {
    const [selectedProvider, setSelectedProvider] = useState<'google_meet' | 'zoom'>(
        videoSettings.provider || 'google_meet'
    );
    const [saving, setSaving] = useState(false);
    const [exporting, setExporting] = useState(false);

    const handleProviderChange = (provider: 'google_meet' | 'zoom') => {
        if (provider === selectedProvider) return;

        setSelectedProvider(provider);
        setSaving(true);

        router.put('/settings/video', { provider }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`Video provider changed to ${provider === 'google_meet' ? 'Google Meet' : 'Zoom'}`);
            },
            onError: () => {
                toast.error('Failed to update video provider');
                setSelectedProvider(videoSettings.provider); // Revert on error
            },
            onFinish: () => setSaving(false),
        });
    };

    const handleExportCalendar = () => {
        setExporting(true);

        fetch('/settings/calendar/apple/export')
            .then(response => response.json())
            .then(data => {
                if (data.download_url) {
                    window.open(data.download_url, '_blank');
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

    return (
        <div className="space-y-8">
            {/* Video Appointment Section */}
            <div>
                <div className="mb-4">
                    <SectionTitle>Video appointment</SectionTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                        Choose your preferred video platform for online appointments
                    </p>
                </div>

                <Card>
                    <CardContent className="p-0 divide-y">
                        {/* Google Meet Option */}
                        <button
                            onClick={() => handleProviderChange('google_meet')}
                            disabled={saving}
                            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                                    <GoogleMeet className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold leading-5 text-[#171717]">Google Meet</p>
                                    <p className="text-sm font-normal leading-5 text-[#737373]">
                                        Free video calls, no download required
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {selectedProvider === 'google_meet' && (
                                    <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
                                        <Check className="h-3 w-3 mr-1" /> Active
                                    </Badge>
                                )}
                                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                                    selectedProvider === 'google_meet'
                                        ? 'border-primary bg-primary'
                                        : 'border-muted-foreground/30'
                                }`}>
                                    {selectedProvider === 'google_meet' && (
                                        <div className="h-2 w-2 rounded-full bg-white" />
                                    )}
                                </div>
                            </div>
                        </button>

                        {/* Zoom Option */}
                        <button
                            onClick={() => handleProviderChange('zoom')}
                            disabled={saving}
                            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                                    <ZoomIcon className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold leading-5 text-[#171717]">Zoom</p>
                                    <p className="text-sm font-normal leading-5 text-[#737373]">
                                        Popular video conferencing platform
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {selectedProvider === 'zoom' && (
                                    <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
                                        <Check className="h-3 w-3 mr-1" /> Active
                                    </Badge>
                                )}
                                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                                    selectedProvider === 'zoom'
                                        ? 'border-primary bg-primary'
                                        : 'border-muted-foreground/30'
                                }`}>
                                    {selectedProvider === 'zoom' && (
                                        <div className="h-2 w-2 rounded-full bg-white" />
                                    )}
                                </div>
                            </div>
                        </button>
                    </CardContent>
                </Card>
            </div>

            {/* Calendar Section */}
            <div>
                <div className="mb-4">
                    <SectionTitle>Calendar</SectionTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                        Export appointments to your personal calendar
                    </p>
                </div>

                <Card>
                    <CardContent className="p-0 divide-y">
                        {/* Google Calendar - Coming Soon */}
                        <div className="flex items-center justify-between p-4 opacity-60">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                                    <GoogleCalendar className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold leading-5 text-[#171717]">Google Calendar</p>
                                    <p className="text-sm font-normal leading-5 text-[#737373]">
                                        Auto-sync appointments to Google Calendar
                                    </p>
                                </div>
                            </div>
                            <Badge variant="secondary">Coming Soon</Badge>
                        </div>

                        {/* Apple Calendar / ICS Export */}
                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                                    <AppleIcon className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold leading-5 text-[#171717]">Apple Calendar / Other</p>
                                    <p className="text-sm font-normal leading-5 text-[#737373]">
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

            {/* Security Info Box */}
            <div className="rounded-xl border-2 border-cyan-200 bg-cyan-50/50 p-4">
                <div className="flex gap-3">
                    <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-cyan-100 flex items-center justify-center">
                            <Info className="h-4 w-4 text-cyan-600" />
                        </div>
                    </div>
                    <div>
                        <p className="text-sm font-semibold leading-5 text-[#171717]">Your data is secure</p>
                        <p className="text-sm font-normal leading-5 text-[#737373] mt-0.5">
                            Video calls are generated on-demand for each appointment. No third-party account linking is required.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
