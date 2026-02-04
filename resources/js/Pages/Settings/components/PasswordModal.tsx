import { useState, useEffect } from 'react';
import { Eye, EyeOff, Check, AlertCircle, Loader2 } from '@/Lib/icons';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
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
        0: { label: 'Very Weak', color: 'bg-red-500' },
        1: { label: 'Weak', color: 'bg-orange-500' },
        2: { label: 'Fair', color: 'bg-yellow-500' },
        3: { label: 'Good', color: 'bg-lime-500' },
        4: { label: 'Strong', color: 'bg-green-500' },
        5: { label: 'Very Strong', color: 'bg-emerald-500' },
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

    // Reset state when modal closes
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
                    'X-CSRF-TOKEN':
                        document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ password: currentPassword }),
            });

            const data = await response.json();

            if (data.verified) {
                setStep('create');
            } else {
                setError('Incorrect password. Please try again.');
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
                    'X-CSRF-TOKEN':
                        document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    current_password: currentPassword,
                    password: newPassword,
                    password_confirmation: confirmPassword,
                }),
            });

            if (response.ok) {
                setStep('success');
            } else {
                const data = await response.json();
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
                            <DialogTitle>Verify Your Identity</DialogTitle>
                            <DialogDescription>
                                Enter your current password to continue
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            {error && (
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-[14px]">
                                    <AlertCircle className="h-4 w-4" />
                                    {error}
                                </div>
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
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showCurrentPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <Button
                                onClick={handleVerify}
                                disabled={!currentPassword || loading}
                                className="w-full"
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
                        </div>
                    </>
                )}

                {step === 'create' && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Create New Password</DialogTitle>
                            <DialogDescription>
                                Choose a strong password with at least 8 characters
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            {error && (
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-[14px]">
                                    <AlertCircle className="h-4 w-4" />
                                    {error}
                                </div>
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
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showNewPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
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
                                        <p className="text-[14px] text-muted-foreground">
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
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                                {confirmPassword && !passwordsMatch && (
                                    <p className="text-[14px] text-destructive">Passwords do not match</p>
                                )}
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setStep('verify')}
                                    className="flex-1"
                                >
                                    Back
                                </Button>
                                <Button
                                    onClick={handleChangePassword}
                                    disabled={!canCreate || loading}
                                    className="flex-1"
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
                            </div>
                        </div>
                    </>
                )}

                {step === 'success' && (
                    <div className="py-8 text-center space-y-4">
                        <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                            <Check className="h-8 w-8 text-green-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">Password Changed!</h3>
                            <p className="text-[14px] text-muted-foreground mt-1">
                                Your password has been updated successfully
                            </p>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
