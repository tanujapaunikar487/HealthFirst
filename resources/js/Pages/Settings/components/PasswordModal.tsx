import { useState, useEffect } from 'react';
import { Eye, EyeOff, Check, AlertCircle, Loader2, ArrowLeft } from '@/Lib/icons';
import { Alert } from '@/Components/ui/alert';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogBody,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/Components/ui/dialog';

interface PasswordModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

type Step = 'verify' | 'create' | 'success';

interface PasswordStrength {
    score: number; // 0-5
    label: string;
    color: string;
}

function calculateStrength(password: string): PasswordStrength {
    let score = 0;

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    const labels: Record<number, { label: string; color: string }> = {
        0: { label: 'Very Weak', color: 'bg-destructive' },
        1: { label: 'Weak', color: 'bg-warning' },
        2: { label: 'Fair', color: 'bg-warning' },
        3: { label: 'Good', color: 'bg-success' },
        4: { label: 'Strong', color: 'bg-success' },
        5: { label: 'Very Strong', color: 'bg-success' },
    };

    return {
        score,
        ...labels[score],
    };
}

export function PasswordModal({ open, onOpenChange }: PasswordModalProps) {
    const [step, setStep] = useState<Step>('verify');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const strength = calculateStrength(newPassword);
    const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0;
    const canCreate = strength.score >= 2 && passwordsMatch;

    // Reset state when dialog closes
    useEffect(() => {
        if (!open) {
            setTimeout(() => {
                setStep('verify');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setError('');
                setShowCurrentPassword(false);
                setShowNewPassword(false);
                setShowConfirmPassword(false);
            }, 200);
        }
    }, [open]);

    // Auto-close after success
    useEffect(() => {
        if (step === 'success') {
            const timer = setTimeout(() => {
                onOpenChange(false);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [step, onOpenChange]);

    const handleVerify = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/settings/verify-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN':
                        document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ current_password: currentPassword }),
            });

            const data = await response.json();

            if (data.valid) {
                setStep('create');
            } else {
                setError(data.message || 'Incorrect password. Please try again.');
            }
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/settings/password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN':
                        document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    current_password: currentPassword,
                    password: newPassword,
                    password_confirmation: confirmPassword,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setStep('success');
            } else {
                setError(data.message || 'Failed to change password.');
            }
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                {step === 'verify' && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Verify your identity</DialogTitle>
                            <DialogDescription className="sr-only">Verify your identity to change password</DialogDescription>
                        </DialogHeader>

                        <DialogBody>
                            <div className="px-5 py-5 space-y-4">
                                <p className="text-body text-muted-foreground">
                                    Enter your current password to continue
                                </p>

                                {error && (
                                    <Alert variant="error">{error}</Alert>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="current-password">Current Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="current-password"
                                            type={showCurrentPassword ? 'text' : 'password'}
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            placeholder="Enter your current password"
                                            className="pr-10"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            iconOnly
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 h-auto p-0 text-muted-foreground hover:text-foreground hover:bg-transparent"
                                        >
                                            {showCurrentPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </DialogBody>

                        <DialogFooter>
                            <Button
                                onClick={handleVerify}
                                disabled={!currentPassword || loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    'Continue'
                                )}
                            </Button>
                        </DialogFooter>
                    </>
                )}

                {step === 'create' && (
                    <>
                        <DialogHeader>
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="ghost"
                                    iconOnly
                                    onClick={() => setStep('verify')}
                                    className="h-auto p-0 text-foreground hover:bg-transparent"
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                                <DialogTitle>Create new password</DialogTitle>
                            </div>
                            <DialogDescription className="sr-only">Create a new password for your account</DialogDescription>
                        </DialogHeader>

                        <DialogBody>
                            <div className="px-5 py-5 space-y-4">
                                <p className="text-body text-muted-foreground">
                                    Choose a strong password with at least 8 characters
                                </p>

                                {error && (
                                    <Alert variant="error">{error}</Alert>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="new-password">New Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="new-password"
                                            type={showNewPassword ? 'text' : 'password'}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Enter new password"
                                            className="pr-10"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            iconOnly
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 h-auto p-0 text-muted-foreground hover:text-foreground hover:bg-transparent"
                                        >
                                            {showNewPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>

                                    {/* Strength Meter */}
                                    {newPassword && (
                                        <div className="space-y-2">
                                            <div className="flex gap-1">
                                                {[0, 1, 2, 3, 4].map((i) => (
                                                    <div
                                                        key={i}
                                                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                                                            i < strength.score
                                                                ? strength.color
                                                                : 'bg-muted'
                                                        }`}
                                                    />
                                                ))}
                                            </div>
                                            <p className="text-body text-muted-foreground">
                                                Password strength: <span className="font-medium">{strength.label}</span>
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirm-password">Confirm Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="confirm-password"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Confirm new password"
                                            className={`pr-10 ${
                                                confirmPassword && !passwordsMatch
                                                    ? 'border-destructive'
                                                    : ''
                                            }`}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            iconOnly
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 h-auto p-0 text-muted-foreground hover:text-foreground hover:bg-transparent"
                                        >
                                            {showConfirmPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                    {confirmPassword && !passwordsMatch && (
                                        <p className="text-body text-destructive">Passwords do not match</p>
                                    )}
                                </div>
                            </div>
                        </DialogBody>

                        <DialogFooter>
                            <Button
                                onClick={handleChangePassword}
                                disabled={!canCreate || loading}
                                size="lg"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Changing...
                                    </>
                                ) : (
                                    'Change password'
                                )}
                            </Button>
                        </DialogFooter>
                    </>
                )}

                {step === 'success' && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Password changed</DialogTitle>
                            <DialogDescription className="sr-only">Password changed successfully</DialogDescription>
                        </DialogHeader>
                        <DialogBody>
                            <div className="px-5 py-8 text-center space-y-4">
                                <div className="mx-auto h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
                                    <Check className="h-8 w-8 text-success" />
                                </div>
                                <div>
                                    <h3 className="text-subheading">Password changed!</h3>
                                    <p className="text-body text-muted-foreground mt-1">
                                        Your password has been updated successfully
                                    </p>
                                </div>
                            </div>
                        </DialogBody>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
