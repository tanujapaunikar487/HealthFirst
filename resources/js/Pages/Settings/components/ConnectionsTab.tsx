import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Video, Calendar, Check, ExternalLink, Unlink } from '@/Lib/icons';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import { toast } from 'sonner';

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

interface ConnectionsTabProps {
    videoSettings: VideoSettings;
    calendarSettings: CalendarSettings;
}

export function ConnectionsTab({ videoSettings, calendarSettings }: ConnectionsTabProps) {
    const [selectedProvider, setSelectedProvider] = useState(videoSettings.provider);
    const [savingVideo, setSavingVideo] = useState(false);
    const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
    const [disconnecting, setDisconnecting] = useState(false);

    const handleSaveVideo = () => {
        setSavingVideo(true);
        router.put('/settings/video', { provider: selectedProvider }, {
            onSuccess: () => toast.success('Video provider updated'),
            onError: () => toast.error('Failed to update video provider'),
            onFinish: () => setSavingVideo(false),
        });
    };

    const handleConnectGoogle = () => {
        // Redirect to Google OAuth
        window.location.href = '/settings/calendar/google/connect';
    };

    const handleDisconnectGoogle = () => {
        setDisconnecting(true);
        router.delete('/settings/calendar/google', {
            onSuccess: () => {
                toast.success('Google Calendar disconnected');
                setShowDisconnectDialog(false);
            },
            onError: () => toast.error('Failed to disconnect Google Calendar'),
            onFinish: () => setDisconnecting(false),
        });
    };

    const handleExportApple = () => {
        window.location.href = '/settings/calendar/apple/export';
        toast.success('Downloading calendar export...');
    };

    const videoChanged = selectedProvider !== videoSettings.provider;

    return (
        <div className="space-y-6">
            {/* Video Conferencing */}
            <Card>
                <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Video className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h4 className="font-medium text-lg">Video Conferencing</h4>
                            <p className="text-sm text-muted-foreground">
                                Choose your preferred video call provider
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <button
                            type="button"
                            onClick={() => setSelectedProvider('google_meet')}
                            className={`w-full text-left px-4 py-4 rounded-lg border transition-colors ${
                                selectedProvider === 'google_meet'
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border hover:border-muted-foreground/50'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-white border flex items-center justify-center">
                                        <svg className="h-6 w-6" viewBox="0 0 24 24">
                                            <path fill="#00832D" d="M12 12V4.5L4.5 12H12Z" />
                                            <path fill="#0066DA" d="M12 12V19.5L19.5 12H12Z" />
                                            <path fill="#E94235" d="M12 12H4.5L12 19.5V12Z" />
                                            <path fill="#2684FC" d="M12 12H19.5L12 4.5V12Z" />
                                            <path fill="#00AC47" d="M12 12L4.5 12L12 4.5V12Z" />
                                            <path fill="#FFBA00" d="M12 12L19.5 12L12 19.5V12Z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-medium">Google Meet</p>
                                        <p className="text-sm text-muted-foreground">
                                            Default provider for video consultations
                                        </p>
                                    </div>
                                </div>
                                {selectedProvider === 'google_meet' && (
                                    <Check className="h-5 w-5 text-primary" />
                                )}
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() => setSelectedProvider('zoom')}
                            className={`w-full text-left px-4 py-4 rounded-lg border transition-colors ${
                                selectedProvider === 'zoom'
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border hover:border-muted-foreground/50'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-[#2D8CFF] flex items-center justify-center">
                                        <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M4.5 4.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2H15a2 2 0 0 0 2-2v-3l4 3V7l-4 3V6.5a2 2 0 0 0-2-2H4.5z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-medium">Zoom</p>
                                        <p className="text-sm text-muted-foreground">
                                            Alternative provider for video calls
                                        </p>
                                    </div>
                                </div>
                                {selectedProvider === 'zoom' && (
                                    <Check className="h-5 w-5 text-primary" />
                                )}
                            </div>
                        </button>
                    </div>
                </CardContent>
            </Card>

            {/* Save Video Button */}
            <div className="flex justify-end">
                <Button
                    onClick={handleSaveVideo}
                    disabled={savingVideo || !videoChanged}
                    className="min-w-[120px]"
                >
                    {savingVideo ? 'Saving...' : 'Save Provider'}
                </Button>
            </div>

            {/* Calendar Sync */}
            <Card>
                <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h4 className="font-medium text-lg">Calendar Sync</h4>
                            <p className="text-sm text-muted-foreground">
                                Sync your appointments with your calendar
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Google Calendar */}
                        <div className="flex items-center justify-between py-3 px-4 rounded-lg border">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-white border flex items-center justify-center">
                                    <svg className="h-6 w-6" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12s4.48 10 10 10c5.52 0 10-4.48 10-10z" opacity="0.2" />
                                        <path fill="#4285F4" d="M12 7v5l4.25 2.52.77-1.28-3.52-2.09V7z" />
                                        <path fill="#EA4335" d="M20 12h2c0-5.52-4.48-10-10-10v2c4.42 0 8 3.58 8 8z" />
                                        <path fill="#FBBC04" d="M12 20v2c5.52 0 10-4.48 10-10h-2c0 4.42-3.58 8-8 8z" />
                                        <path fill="#34A853" d="M4 12H2c0 5.52 4.48 10 10 10v-2c-4.42 0-8-3.58-8-8z" />
                                        <path fill="#4285F4" d="M12 4V2C6.48 2 2 6.48 2 12h2c0-4.42 3.58-8 8-8z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-medium">Google Calendar</p>
                                    {calendarSettings.google.connected ? (
                                        <p className="text-sm text-muted-foreground">
                                            Connected as {calendarSettings.google.email}
                                        </p>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">
                                            Sync appointments automatically
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {calendarSettings.google.connected ? (
                                    <>
                                        <Badge variant="green">Connected</Badge>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setShowDisconnectDialog(true)}
                                            className="text-muted-foreground hover:text-destructive"
                                        >
                                            <Unlink className="h-4 w-4" />
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleConnectGoogle}
                                    >
                                        Connect
                                        <ExternalLink className="h-4 w-4 ml-2" />
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Apple Calendar */}
                        <div className="flex items-center justify-between py-3 px-4 rounded-lg border">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                                    <Calendar className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <p className="font-medium">Apple Calendar</p>
                                    <p className="text-sm text-muted-foreground">
                                        Export appointments as .ics file
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleExportApple}
                            >
                                Export .ics
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Disconnect Google Dialog */}
            <Dialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Disconnect Google Calendar</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to disconnect Google Calendar? Your appointments
                            will no longer sync automatically.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDisconnectDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDisconnectGoogle}
                            disabled={disconnecting}
                        >
                            {disconnecting ? 'Disconnecting...' : 'Disconnect'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
