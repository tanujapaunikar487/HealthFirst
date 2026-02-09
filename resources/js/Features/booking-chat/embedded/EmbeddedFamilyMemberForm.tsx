import * as React from 'react';
import { cn } from '@/Lib/utils';
import { Button } from '@/Components/ui/button';
import { PhoneInput } from '@/Components/ui/phone-input';
import { DatePicker } from '@/Components/ui/date-picker';
import { UserPlus } from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';

const RELATION_OPTIONS = [
  'mother', 'father', 'brother', 'sister',
  'son', 'daughter', 'spouse',
  'grandmother', 'grandfather',
  'friend', 'other',
];

const GENDER_OPTIONS = ['male', 'female', 'other'];

interface Props {
  onSelect: (value: {
    new_member_name: string;
    new_member_relation: string;
    new_member_phone: string;
    new_member_age?: number;
    new_member_gender?: string;
    display_message: string;
  }) => void;
  disabled: boolean;
}

export function EmbeddedFamilyMemberForm({ onSelect, disabled }: Props) {
  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [relation, setRelation] = React.useState('');
  const [dateOfBirth, setDateOfBirth] = React.useState('');
  const [age, setAge] = React.useState('');
  const [gender, setGender] = React.useState('');
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!phone.trim() || phone === '+91') {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+91[6-9]\d{9}$/.test(phone.trim())) {
      newErrors.phone = 'Enter a valid 10-digit phone number';
    }
    if (!relation) newErrors.relation = 'Please select a relation';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSelect({
      new_member_name: name.trim(),
      new_member_phone: phone.trim(),
      new_member_relation: relation,
      ...(dateOfBirth ? { new_member_date_of_birth: dateOfBirth } : {}),
      ...(age && !dateOfBirth ? { new_member_age: parseInt(age, 10) } : {}),
      ...(gender ? { new_member_gender: gender } : {}),
      display_message: `Added ${name.trim()} (${relation})`,
    });
  };

  const inputClasses = cn(
    'w-full rounded-lg border border-border bg-background px-3 py-2 text-body',
    'placeholder:text-muted-foreground',
    'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  );

  const selectClasses = cn(
    inputClasses,
    'appearance-none bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E")] bg-[length:16px] bg-[right_8px_center] bg-no-repeat pr-8',
  );

  return (
    <div className="border rounded-xl p-4 space-y-4 max-w-md">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0">
          <UserPlus className="h-4 w-4 text-primary" />
        </div>
        <h4 className="text-card-title text-foreground">Add family member or guest</h4>
      </div>

      {/* Name */}
      <div className="space-y-1.5">
        <label className="text-label text-muted-foreground">
          Name <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setErrors((prev) => ({ ...prev, name: '' })); }}
          placeholder="Enter full name"
          disabled={disabled}
          className={cn(inputClasses, errors.name && 'border-destructive focus:ring-destructive/20')}
        />
        {errors.name && <p className="text-body text-destructive">{errors.name}</p>}
      </div>

      {/* Phone */}
      <div className="space-y-1.5">
        <label className="text-label text-muted-foreground">
          Phone Number <span className="text-destructive">*</span>
        </label>
        <PhoneInput
          value={phone}
          onChange={(value) => { setPhone(value); setErrors((prev) => ({ ...prev, phone: '' })); }}
          disabled={disabled}
          error={!!errors.phone}
        />
        {errors.phone && <p className="text-body text-destructive">{errors.phone}</p>}
      </div>

      {/* Relation */}
      <div className="space-y-1.5">
        <label className="text-label text-muted-foreground">
          Relation <span className="text-destructive">*</span>
        </label>
        <select
          value={relation}
          onChange={(e) => { setRelation(e.target.value); setErrors((prev) => ({ ...prev, relation: '' })); }}
          disabled={disabled}
          className={cn(selectClasses, !relation && 'text-muted-foreground', errors.relation && 'border-destructive focus:ring-destructive/20')}
        >
          <option value="">Select relation</option>
          {RELATION_OPTIONS.map((r) => (
            <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
          ))}
        </select>
        {errors.relation && <p className="text-body text-destructive">{errors.relation}</p>}
      </div>

      {/* Date of Birth + Age */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-label text-muted-foreground">
            Date of Birth <span className="text-body">(Recommended)</span>
          </label>
          <DatePicker
            value={dateOfBirth}
            onChange={(value) => { setDateOfBirth(value); setAge(''); setErrors((prev) => ({ ...prev, age: '' })); }}
            max={new Date()}
            disabled={disabled}
            placeholder="Select date"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-label text-muted-foreground">
            Age <span className="text-body">(If DOB unknown)</span>
          </label>
          <input
            type="number"
            value={age}
            onChange={(e) => { setAge(e.target.value); setDateOfBirth(''); setErrors((prev) => ({ ...prev, age: '' })); }}
            placeholder="Enter age"
            min="0"
            max="120"
            disabled={disabled || !!dateOfBirth}
            className={cn(inputClasses, dateOfBirth && 'opacity-50 cursor-not-allowed')}
          />
        </div>
      </div>

      {/* Gender */}
      <div className="space-y-1.5">
        <label className="text-label text-muted-foreground">Gender</label>
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          disabled={disabled}
          className={cn(selectClasses, !gender && 'text-muted-foreground')}
        >
          <option value="">Optional</option>
          {GENDER_OPTIONS.map((g) => (
            <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={disabled}
        className="w-full"
        size="sm"
      >
        Add & Continue
      </Button>
    </div>
  );
}
