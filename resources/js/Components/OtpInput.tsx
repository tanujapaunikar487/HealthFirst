import React, { useRef, useState, useEffect } from 'react';
import { cn } from '@/Lib/utils';
import { Button } from '@/Components/ui/button';

interface OtpInputProps {
    value: string;
    onChange: (value: string) => void;
    onComplete?: (value: string) => void;
    onResend?: () => void;
    error?: string;
    length?: number;
}

export function OtpInput({
    value,
    onChange,
    onComplete,
    onResend,
    error,
    length = 6,
}: OtpInputProps) {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [resendTimer, setResendTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);

    // Resend timer countdown
    useEffect(() => {
        if (resendTimer > 0) {
            const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setCanResend(true);
        }
    }, [resendTimer]);

    const handleChange = (index: number, digit: string) => {
        // Only allow digits
        if (!/^\d*$/.test(digit)) return;

        const newValue = value.split('');
        newValue[index] = digit;
        const newOtp = newValue.join('');

        onChange(newOtp);

        // Auto-focus next field
        if (digit && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit on complete
        if (newOtp.length === length && onComplete) {
            onComplete(newOtp);
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !value[index] && index > 0) {
            // Move to previous field on backspace if current is empty
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);

        if (pastedData.length === length) {
            onChange(pastedData);
            inputRefs.current[length - 1]?.focus();

            // Auto-submit on paste complete
            if (onComplete) {
                onComplete(pastedData);
            }
        }
    };

    const handleResend = () => {
        if (canResend && onResend) {
            onResend();
            setResendTimer(60);
            setCanResend(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-2 justify-center">
                {Array.from({ length }).map((_, index) => (
                    <input
                        key={index}
                        ref={(el) => (inputRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={value[index] || ''}
                        onChange={(e) => handleChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={handlePaste}
                        className={cn(
                            'w-12 h-14 text-center text-2xl font-semibold rounded-xl border-2 transition-all',
                            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                            error
                                ? 'border-destructive'
                                : value[index]
                                ? 'border-primary bg-primary/5'
                                : 'border-border'
                        )}
                        autoFocus={index === 0}
                    />
                ))}
            </div>

            {error && (
                <p className="text-[14px] text-destructive text-center">{error}</p>
            )}

            {onResend && (
                <div className="text-center">
                    {canResend ? (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleResend}
                        >
                            Resend OTP
                        </Button>
                    ) : (
                        <p className="text-[14px] text-muted-foreground">
                            Resend OTP in {resendTimer}s
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
