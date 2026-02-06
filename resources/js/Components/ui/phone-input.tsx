import * as React from 'react';
import { cn } from '@/Lib/utils';

export interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, value, onChange, error, disabled, ...props }, ref) => {
    // Extract the phone number without country code
    const phoneNumber = value?.replace(/^\+91/, '').replace(/^91/, '').trim() || '';

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      // Remove any non-digit characters
      const digitsOnly = input.replace(/\D/g, '');
      // Limit to 10 digits
      const limitedDigits = digitsOnly.slice(0, 10);
      // Always return with +91 prefix
      onChange(limitedDigits ? `+91${limitedDigits}` : '');
    };

    return (
      <div className={cn('flex items-center', className)}>
        {/* Country Code Badge */}
        <div className={cn(
          'flex h-10 items-center justify-center rounded-l-lg border border-r-0 bg-muted px-3 text-label',
          error ? 'border-destructive' : 'border-border',
          disabled && 'opacity-50 cursor-not-allowed'
        )}>
          +91
        </div>

        {/* Phone Number Input */}
        <input
          type="tel"
          ref={ref}
          value={phoneNumber}
          onChange={handleChange}
          disabled={disabled}
          className={cn(
            'flex h-10 w-full rounded-r-lg border bg-background px-3 py-2 text-body ring-offset-background file:border-0 file:bg-transparent file:text-label placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error ? 'border-destructive focus-visible:ring-destructive/20' : 'border-border',
            // Remove left border radius since it connects to the country code badge
            'rounded-l-none'
          )}
          placeholder="XXXXX XXXXX"
          pattern="[6-9][0-9]{9}"
          inputMode="numeric"
          {...props}
        />
      </div>
    );
  }
);

PhoneInput.displayName = 'PhoneInput';

export { PhoneInput };
