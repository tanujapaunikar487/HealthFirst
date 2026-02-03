import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Download, Lock, Trash2, AlertTriangle, ChevronRight } from '@/Lib/icons';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Label } from '@/Components/ui/label';
import { Input } from '@/Components/ui/input';
import { Switch } from '@/Components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import { toast } from 'sonner';

interface FamilyMember {
    id: number;
    name: string;
    relation: string;
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

interface PreferencesTabProps {
    settings: PreferenceSettings;
    bookingDefaults: BookingDefaults;
    familyMembers: FamilyMember[];
    onOpenPasswordModal: () => void;
}

export function PreferencesTab({
    settings,
    bookingDefaults,
    familyMembers,
    onOpenPasswordModal,
}: PreferencesTabProps) {
    const [prefs, setPrefs] = useState(settings);
    const [defaults, setDefaults] = useState(bookingDefaults);
    const [downloadFormat, setDownloadFormat] = useState('pdf');
    const [saving, setSaving] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleting, setDeleting] = useState(false);

    const handlePrefChange = <K extends keyof PreferenceSettings>(
        key: K,
        value: PreferenceSettings[K]
    ) => {
        setPrefs((prev) => ({ ...prev, [key]: value }));
    };

    const handleAccessibilityChange = <K extends keyof PreferenceSettings['accessibility']>(
        key: K,
        value: PreferenceSettings['accessibility'][K]
    ) => {
        setPrefs((prev) => ({
            ...prev,
            accessibility: { ...prev.accessibility, [key]: value },
        }));
    };

    const handleDefaultChange = <K extends keyof BookingDefaults>(key: K, value: string | null) => {
        setDefaults((prev) => ({ ...prev, [key]: value === 'none' ? null : (value || null) }));
    };

    const handleSaveAll = () => {
        setSaving(true);

        // Save preferences
        router.put('/settings/preferences', prefs, {
            preserveState: true,
            onSuccess: () => {
                // Save booking defaults
                router.put('/settings/booking-defaults', defaults, {
                    preserveState: true,
                    onSuccess: () => {
                        toast.success('Settings saved');
                    },
                    onError: () => toast.error('Failed to save settings'),
                    onFinish: () => setSaving(false),
                });
            },
            onError: () => {
                toast.error('Failed to save settings');
                setSaving(false);
            },
        });
    };

    const handleDownloadData = () => {
        window.location.href = '/settings/download-data';
        toast.success('Downloading your data...');
    };

    const handleDeleteAccount = () => {
        setDeleting(true);
        router.delete('/settings/account', {
            data: { password: deletePassword },
            onSuccess: () => {
                toast.success('Account deleted successfully');
                window.location.href = '/';
            },
            onError: (errors) => {
                toast.error(errors.password || 'Failed to delete account');
            },
            onFinish: () => setDeleting(false),
        });
    };

    // Map text size to segmented control value
    const getTextSizeOption = (size: number) => {
        if (size <= 14) return 'small';
        if (size <= 18) return 'medium';
        return 'large';
    };

    const setTextSizeFromOption = (option: string) => {
        const sizes = { small: 14, medium: 18, large: 22 };
        handleAccessibilityChange('text_size', sizes[option as keyof typeof sizes]);
    };

    return (
        <div className="space-y-8">
            {/* Language & Region */}
            <div>
                <h3 className="text-lg font-semibold mb-4">Language & Region</h3>
                <Card>
                    <CardContent className="p-0 divide-y">
                        {/* Language Row */}
                        <div className="flex items-center justify-between p-4">
                            <div>
                                <p className="font-medium">Language</p>
                                <p className="text-sm text-muted-foreground">
                                    Choose your preferred language
                                </p>
                            </div>
                            <Select
                                value={prefs.language}
                                onValueChange={(v) => handlePrefChange('language', v)}
                            >
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="en">English</SelectItem>
                                    <SelectItem value="hi">Hindi</SelectItem>
                                    <SelectItem value="mr">Marathi</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Date Format Row */}
                        <div className="flex items-center justify-between p-4">
                            <div>
                                <p className="font-medium">Date Format</p>
                                <p className="text-sm text-muted-foreground">
                                    How dates appear throughout the app
                                </p>
                            </div>
                            <Select
                                value={prefs.date_format}
                                onValueChange={(v) => handlePrefChange('date_format', v)}
                            >
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Time Format Row */}
                        <div className="flex items-center justify-between p-4">
                            <div>
                                <p className="font-medium">Time Format</p>
                                <p className="text-sm text-muted-foreground">
                                    12-hour or 24-hour clock
                                </p>
                            </div>
                            <div className="flex rounded-full border bg-muted p-1">
                                <button
                                    onClick={() => handlePrefChange('time_format', '24h')}
                                    className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
                                        prefs.time_format === '24h'
                                            ? 'bg-background text-primary shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    24 hrs
                                </button>
                                <button
                                    onClick={() => handlePrefChange('time_format', '12h')}
                                    className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
                                        prefs.time_format === '12h'
                                            ? 'bg-background text-primary shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    12 hrs
                                </button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Accessibility */}
            <div>
                <h3 className="text-lg font-semibold mb-4">Accessibility</h3>
                <Card>
                    <CardContent className="p-0 divide-y">
                        {/* Text Size Row */}
                        <div className="flex items-center justify-between p-4">
                            <div>
                                <p className="font-medium">Text Size</p>
                                <p className="text-sm text-muted-foreground">
                                    Adjust the font size throughout the app
                                </p>
                            </div>
                            <div className="flex rounded-full border bg-muted p-1">
                                <button
                                    onClick={() => setTextSizeFromOption('small')}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                                        getTextSizeOption(prefs.accessibility.text_size) === 'small'
                                            ? 'bg-background text-primary shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    A
                                </button>
                                <button
                                    onClick={() => setTextSizeFromOption('medium')}
                                    className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                                        getTextSizeOption(prefs.accessibility.text_size) === 'medium'
                                            ? 'bg-background text-primary shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    A
                                </button>
                                <button
                                    onClick={() => setTextSizeFromOption('large')}
                                    className={`px-3 py-1.5 text-base font-medium rounded-full transition-colors ${
                                        getTextSizeOption(prefs.accessibility.text_size) === 'large'
                                            ? 'bg-background text-primary shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    A
                                </button>
                            </div>
                        </div>

                        {/* High Contrast Row */}
                        <div className="flex items-center justify-between p-4">
                            <div>
                                <p className="font-medium">High Contrast Mode</p>
                                <p className="text-sm text-muted-foreground">
                                    Increase contrast for better visibility
                                </p>
                            </div>
                            <Switch
                                checked={prefs.accessibility.high_contrast}
                                onCheckedChange={(v) => handleAccessibilityChange('high_contrast', v)}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Default Settings */}
            <div>
                <h3 className="text-lg font-semibold mb-4">Default Settings</h3>
                <Card>
                    <CardContent className="p-0 divide-y">
                        {/* Default Family Member Row */}
                        <div className="flex items-center justify-between p-4">
                            <div>
                                <p className="font-medium">Default Family Member</p>
                                <p className="text-sm text-muted-foreground">
                                    Pre-select when booking appointments
                                </p>
                            </div>
                            <Select
                                value={defaults.default_patient_id || 'none'}
                                onValueChange={(v) => handleDefaultChange('default_patient_id', v)}
                            >
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Always ask</SelectItem>
                                    <SelectItem value="self">Myself</SelectItem>
                                    {familyMembers.map((m) => (
                                        <SelectItem key={m.id} value={m.id.toString()}>
                                            {m.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Download Format Row */}
                        <div className="flex items-center justify-between p-4">
                            <div>
                                <p className="font-medium">Download Format</p>
                                <p className="text-sm text-muted-foreground">
                                    Preferred format for health records
                                </p>
                            </div>
                            <Select
                                value={downloadFormat}
                                onValueChange={setDownloadFormat}
                            >
                                <SelectTrigger className="w-[100px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pdf">PDF</SelectItem>
                                    <SelectItem value="json">JSON</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Account */}
            <div>
                <h3 className="text-lg font-semibold mb-4">Account</h3>
                <Card>
                    <CardContent className="p-0 divide-y">
                        {/* Change Password Row */}
                        <button
                            onClick={onOpenPasswordModal}
                            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                    <Lock className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <span className="font-medium">Change Password</span>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </button>

                        {/* Download My Data Row */}
                        <button
                            onClick={handleDownloadData}
                            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                    <Download className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <span className="font-medium">Download My Data</span>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </button>

                        {/* Delete Account Row */}
                        <button
                            onClick={() => setShowDeleteDialog(true)}
                            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                    <Trash2 className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <span className="font-medium">Delete Account</span>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </button>
                    </CardContent>
                </Card>
            </div>

            {/* Save Changes Button */}
            <div>
                <Button onClick={handleSaveAll} disabled={saving} className="px-8">
                    {saving ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>

            {/* Delete Account Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            Delete Account
                        </DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently delete your account and
                            remove all your data from our servers.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
                            <p className="font-medium mb-2">The following data will be deleted:</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Your profile and personal information</li>
                                <li>All family member records</li>
                                <li>Appointment history</li>
                                <li>Health records and prescriptions</li>
                                <li>Insurance policies and claims</li>
                                <li>Billing history</li>
                            </ul>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="delete-password">Enter your password to confirm</Label>
                            <Input
                                id="delete-password"
                                type="password"
                                value={deletePassword}
                                onChange={(e) => setDeletePassword(e.target.value)}
                                placeholder="Your password"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteAccount}
                            disabled={!deletePassword || deleting}
                        >
                            {deleting ? 'Deleting...' : 'Delete Account'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
