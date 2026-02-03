import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Download, Lock, Trash2, AlertTriangle } from '@/Lib/icons';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Label } from '@/Components/ui/label';
import { Input } from '@/Components/ui/input';
import { Switch } from '@/Components/ui/switch';
import { Slider } from '@/Components/ui/slider';
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
    const [saving, setSaving] = useState(false);
    const [savingDefaults, setSavingDefaults] = useState(false);
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
        setDefaults((prev) => ({ ...prev, [key]: value || null }));
    };

    const handleSavePreferences = () => {
        setSaving(true);
        router.put('/settings/preferences', prefs, {
            onSuccess: () => toast.success('Preferences updated'),
            onError: () => toast.error('Failed to update preferences'),
            onFinish: () => setSaving(false),
        });
    };

    const handleSaveDefaults = () => {
        setSavingDefaults(true);
        router.put('/settings/booking-defaults', defaults, {
            onSuccess: () => toast.success('Booking defaults updated'),
            onError: () => toast.error('Failed to update defaults'),
            onFinish: () => setSavingDefaults(false),
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

    const prefsChanged = JSON.stringify(prefs) !== JSON.stringify(settings);
    const defaultsChanged = JSON.stringify(defaults) !== JSON.stringify(bookingDefaults);

    return (
        <div className="space-y-6">
            {/* Regional Settings */}
            <Card>
                <CardContent className="pt-6 space-y-4">
                    <h4 className="font-medium text-lg mb-4">Regional Settings</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Language</Label>
                            <Select
                                value={prefs.language}
                                onValueChange={(v) => handlePrefChange('language', v)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="en">English</SelectItem>
                                    <SelectItem value="hi">Hindi</SelectItem>
                                    <SelectItem value="mr">Marathi</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Date Format</Label>
                            <Select
                                value={prefs.date_format}
                                onValueChange={(v) => handlePrefChange('date_format', v)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (31/12/2026)</SelectItem>
                                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (12/31/2026)</SelectItem>
                                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (2026-12-31)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Time Format</Label>
                            <Select
                                value={prefs.time_format}
                                onValueChange={(v) => handlePrefChange('time_format', v)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="12h">12-hour (2:30 PM)</SelectItem>
                                    <SelectItem value="24h">24-hour (14:30)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Accessibility */}
            <Card>
                <CardContent className="pt-6 space-y-6">
                    <h4 className="font-medium text-lg mb-4">Accessibility</h4>

                    <div className="space-y-4">
                        <div className="space-y-3">
                            <Label>Text Size</Label>
                            <div className="flex items-center gap-4">
                                <span className="text-xs font-medium">A</span>
                                <Slider
                                    value={[prefs.accessibility.text_size]}
                                    min={14}
                                    max={24}
                                    step={2}
                                    onValueChange={(v) => handleAccessibilityChange('text_size', v[0])}
                                    className="flex-1"
                                />
                                <span className="text-lg font-medium">A</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Current: {prefs.accessibility.text_size}px
                            </p>
                        </div>

                        <div className="flex items-center justify-between py-2">
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
                    </div>
                </CardContent>
            </Card>

            {/* Save Preferences Button */}
            <div className="flex justify-end">
                <Button
                    onClick={handleSavePreferences}
                    disabled={saving || !prefsChanged}
                    className="min-w-[120px]"
                >
                    {saving ? 'Saving...' : 'Save Preferences'}
                </Button>
            </div>

            {/* Booking Defaults */}
            <Card>
                <CardContent className="pt-6 space-y-4">
                    <h4 className="font-medium text-lg mb-4">Booking Defaults</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                        Set default values for quicker booking
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Default Patient</Label>
                            <Select
                                value={defaults.default_patient_id || ''}
                                onValueChange={(v) => handleDefaultChange('default_patient_id', v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Always ask" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">Always ask</SelectItem>
                                    <SelectItem value="self">Myself</SelectItem>
                                    {familyMembers.map((m) => (
                                        <SelectItem key={m.id} value={m.id.toString()}>
                                            {m.name} ({m.relation})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Consultation Mode</Label>
                            <Select
                                value={defaults.default_consultation_mode || ''}
                                onValueChange={(v) => handleDefaultChange('default_consultation_mode', v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Always ask" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">Always ask</SelectItem>
                                    <SelectItem value="video">Video Consultation</SelectItem>
                                    <SelectItem value="in_person">In-Person Visit</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Lab Collection Method</Label>
                            <Select
                                value={defaults.default_lab_collection_method || ''}
                                onValueChange={(v) =>
                                    handleDefaultChange('default_lab_collection_method', v)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Always ask" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">Always ask</SelectItem>
                                    <SelectItem value="home">Home Collection</SelectItem>
                                    <SelectItem value="center">Visit Lab Center</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Save Defaults Button */}
            <div className="flex justify-end">
                <Button
                    onClick={handleSaveDefaults}
                    disabled={savingDefaults || !defaultsChanged}
                    className="min-w-[120px]"
                >
                    {savingDefaults ? 'Saving...' : 'Save Defaults'}
                </Button>
            </div>

            {/* Account Actions */}
            <Card className="border-amber-200 bg-amber-50/30">
                <CardContent className="pt-6 space-y-4">
                    <h4 className="font-medium text-lg text-amber-800">Account Actions</h4>
                    <div className="flex flex-wrap gap-3">
                        <Button variant="outline" onClick={onOpenPasswordModal}>
                            <Lock className="h-4 w-4 mr-2" />
                            Change Password
                        </Button>
                        <Button variant="outline" onClick={handleDownloadData}>
                            <Download className="h-4 w-4 mr-2" />
                            Download My Data
                        </Button>
                        <Button
                            variant="outline"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => setShowDeleteDialog(true)}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Account
                        </Button>
                    </div>
                </CardContent>
            </Card>

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

                    <div className="py-4 space-y-4">
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
