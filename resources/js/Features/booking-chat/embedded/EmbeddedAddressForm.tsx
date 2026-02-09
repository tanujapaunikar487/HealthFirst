import * as React from 'react';
import { cn } from '@/Lib/utils';
import { Button } from '@/Components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { MapPin } from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';
import { INDIAN_STATES, getCitiesForState } from '@/Lib/locations';

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

  // Get available cities based on selected state
  const availableCities = React.useMemo(() => {
    return state ? getCitiesForState(state) : [];
  }, [state]);

  // Handle state change - clear city when state changes
  const handleStateChange = (newState: string) => {
    setState(newState);
    setCity(''); // Reset city when state changes
    clearError('state');
    clearError('city');
  };

  const inputClasses = cn(
    'w-full rounded-lg border border-border bg-background px-3 py-2 text-body',
    'placeholder:text-muted-foreground',
    'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  );

  const errorClass = 'border-destructive focus:ring-destructive/20';

  return (
    <div className="border rounded-xl p-4 space-y-4 max-w-md">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0">
          <Icon icon={MapPin} size={16} className="text-primary" />
        </div>
        <h4 className="text-card-title text-foreground">Add new address</h4>
      </div>

      {/* Label */}
      <div className="space-y-1.5">
        <label className="text-label text-muted-foreground">
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
        {errors.label && <p className="text-body text-destructive">{errors.label}</p>}
      </div>

      {/* Address Line 1 */}
      <div className="space-y-1.5">
        <label className="text-label text-muted-foreground">
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
        {errors.line1 && <p className="text-body text-destructive">{errors.line1}</p>}
      </div>

      {/* Address Line 2 */}
      <div className="space-y-1.5">
        <label className="text-label text-muted-foreground">Landmark / Area</label>
        <input
          type="text"
          value={line2}
          onChange={(e) => setLine2(e.target.value)}
          placeholder="Near mall, opposite park, etc. (optional)"
          disabled={disabled}
          className={inputClasses}
        />
      </div>

      {/* State + City row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-label text-muted-foreground">
            State <span className="text-destructive">*</span>
          </label>
          <Select value={state} onValueChange={handleStateChange} disabled={disabled}>
            <SelectTrigger className={cn(inputClasses, errors.state && errorClass, !state && 'text-muted-foreground')}>
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {INDIAN_STATES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.state && <p className="text-body text-destructive">{errors.state}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="text-label text-muted-foreground">
            City <span className="text-destructive">*</span>
          </label>
          <Select
            value={city}
            onValueChange={(value) => { setCity(value); clearError('city'); }}
            disabled={disabled || !state}
          >
            <SelectTrigger className={cn(inputClasses, errors.city && errorClass, !city && 'text-muted-foreground', !state && 'opacity-50 cursor-not-allowed')}>
              <SelectValue placeholder={state ? "Select city" : "Select state first"} />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {availableCities.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.city && <p className="text-body text-destructive">{errors.city}</p>}
        </div>
      </div>

      {/* Pincode */}
      <div className="space-y-1.5">
        <label className="text-label text-muted-foreground">
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
        {errors.pincode && <p className="text-body text-destructive">{errors.pincode}</p>}
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
