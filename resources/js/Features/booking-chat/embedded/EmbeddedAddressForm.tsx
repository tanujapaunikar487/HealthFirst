import * as React from 'react';
import { cn } from '@/Lib/utils';
import { Button } from '@/Components/ui/button';
import { MapPin } from 'lucide-react';

interface Props {
  onSelect: (value: {
    new_address_label: string;
    new_address_line_1: string;
    new_address_line_2?: string;
    new_address_city: string;
    new_address_state: string;
    new_address_pincode: string;
    display_message: string;
  }) => void;
  disabled: boolean;
}

export function EmbeddedAddressForm({ onSelect, disabled }: Props) {
  const [label, setLabel] = React.useState('');
  const [line1, setLine1] = React.useState('');
  const [line2, setLine2] = React.useState('');
  const [city, setCity] = React.useState('');
  const [state, setState] = React.useState('');
  const [pincode, setPincode] = React.useState('');
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};
    if (!label.trim()) newErrors.label = 'Label is required';
    if (!line1.trim()) newErrors.line1 = 'Address is required';
    if (!city.trim()) newErrors.city = 'City is required';
    if (!state.trim()) newErrors.state = 'State is required';
    if (!pincode.trim()) newErrors.pincode = 'Pincode is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const parts = [line1.trim(), line2.trim(), city.trim(), pincode.trim()].filter(Boolean);
    const fullAddress = parts.join(', ');

    onSelect({
      new_address_label: label.trim(),
      new_address_line_1: line1.trim(),
      ...(line2.trim() ? { new_address_line_2: line2.trim() } : {}),
      new_address_city: city.trim(),
      new_address_state: state.trim(),
      new_address_pincode: pincode.trim(),
      display_message: `Added ${label.trim()}: ${fullAddress}`,
    });
  };

  const clearError = (field: string) => {
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const inputClasses = cn(
    'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm',
    'placeholder:text-muted-foreground',
    'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  );

  const errorClass = 'border-destructive focus:ring-destructive/20';

  return (
    <div className="border rounded-xl p-4 space-y-4 max-w-md">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <MapPin className="h-4 w-4 text-primary" />
        </div>
        <h4 className="font-semibold text-sm text-foreground">Add new address</h4>
      </div>

      {/* Label */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Label <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          value={label}
          onChange={(e) => { setLabel(e.target.value); clearError('label'); }}
          placeholder="e.g. Home, Office, Parent's House"
          disabled={disabled}
          className={cn(inputClasses, errors.label && errorClass)}
        />
        {errors.label && <p className="text-xs text-destructive">{errors.label}</p>}
      </div>

      {/* Address Line 1 */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Address <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          value={line1}
          onChange={(e) => { setLine1(e.target.value); clearError('line1'); }}
          placeholder="Flat/House no., Building, Street"
          disabled={disabled}
          className={cn(inputClasses, errors.line1 && errorClass)}
        />
        {errors.line1 && <p className="text-xs text-destructive">{errors.line1}</p>}
      </div>

      {/* Address Line 2 */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Landmark / Area</label>
        <input
          type="text"
          value={line2}
          onChange={(e) => setLine2(e.target.value)}
          placeholder="Near mall, opposite park, etc. (optional)"
          disabled={disabled}
          className={inputClasses}
        />
      </div>

      {/* City + State row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            City <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={city}
            onChange={(e) => { setCity(e.target.value); clearError('city'); }}
            placeholder="City"
            disabled={disabled}
            className={cn(inputClasses, errors.city && errorClass)}
          />
          {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            State <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={state}
            onChange={(e) => { setState(e.target.value); clearError('state'); }}
            placeholder="State"
            disabled={disabled}
            className={cn(inputClasses, errors.state && errorClass)}
          />
          {errors.state && <p className="text-xs text-destructive">{errors.state}</p>}
        </div>
      </div>

      {/* Pincode */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Pincode <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          value={pincode}
          onChange={(e) => { setPincode(e.target.value); clearError('pincode'); }}
          placeholder="6-digit pincode"
          maxLength={6}
          disabled={disabled}
          className={cn(inputClasses, errors.pincode && errorClass, 'max-w-[140px]')}
        />
        {errors.pincode && <p className="text-xs text-destructive">{errors.pincode}</p>}
      </div>

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={disabled}
        className="w-full"
        size="sm"
      >
        Save & Continue
      </Button>
    </div>
  );
}
