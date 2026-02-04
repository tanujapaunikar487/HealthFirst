import { useState, useRef, ChangeEvent, useMemo } from 'react';
import { router } from '@inertiajs/react';
import { Camera, X } from '@/Lib/icons';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Badge } from '@/Components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { PhoneInput } from '@/Components/ui/phone-input';
import { DatePicker } from '@/Components/ui/date-picker';
import { INDIAN_STATES, getCitiesForState } from '@/Lib/locations';
import { toast } from 'sonner';
import { cn } from '@/Lib/utils';

interface FamilyMember {
    id: number;
    name: string;
    relation: string;
    phone: string | null;
}

interface DoctorOption {
    id: number;
    name: string;
    specialization: string;
}

interface User {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    date_of_birth: string | null;
    gender: string | null;
    blood_group: string | null;
    avatar_url: string | null;
    address_line_1: string | null;
    address_line_2: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;
    patient_id?: string;
    primary_doctor_id: number | null;
    medical_conditions: string[];
    allergies: string[];
    emergency_contact_type: 'family_member' | 'custom' | null;
    emergency_contact_member_id: number | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    emergency_contact_relation: string | null;
}

interface ProfileTabProps {
    user: User;
    familyMembers: FamilyMember[];
    doctors: DoctorOption[];
}

const bloodGroupOptions = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <h3
            className="font-semibold"
            style={{
                color: '#171717',
                fontSize: '20px',
                lineHeight: '28px',
                letterSpacing: '0',
            }}
        >
            {children}
        </h3>
    );
}

function FormCard({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={cn('rounded-[20px] border border-border bg-white p-6', className)}>
            {children}
        </div>
    );
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

function splitName(fullName: string): { firstName: string; lastName: string } {
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) {
        return { firstName: parts[0], lastName: '' };
    }
    return {
        firstName: parts[0],
        lastName: parts.slice(1).join(' '),
    };
}

/* ─── Tag Input ─── */

function TagInput({
    tags,
    onChange,
    placeholder,
    variant = 'default',
}: {
    tags: string[];
    onChange: (tags: string[]) => void;
    placeholder: string;
    variant?: 'default' | 'destructive';
}) {
    const [inputValue, setInputValue] = useState('');

    function addTag() {
        const trimmed = inputValue.trim();
        if (trimmed && !tags.includes(trimmed)) {
            onChange([...tags, trimmed]);
        }
        setInputValue('');
    }

    function removeTag(index: number) {
        onChange(tags.filter((_, i) => i !== index));
    }

    const hasValue = inputValue.trim().length > 0;

    return (
        <div>
            <div className="relative">
                <Input
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            addTag();
                        }
                    }}
                    placeholder={placeholder}
                    className="pr-12"
                />
                <button
                    type="button"
                    onClick={addTag}
                    disabled={!hasValue}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium transition-colors disabled:cursor-default"
                    style={{ color: hasValue ? '#2563EB' : '#737373' }}
                >
                    Add
                </button>
            </div>
            {tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                    {tags.map((tag, i) => (
                        <Badge key={i} variant={variant} className="gap-1 pr-1">
                            {tag}
                            <button
                                type="button"
                                onClick={() => removeTag(i)}
                                className="ml-0.5 rounded-full p-0.5 hover:bg-black/10"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    );
}

export function ProfileTab({ user, familyMembers: _familyMembers, doctors = [] }: ProfileTabProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar_url);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const { firstName: initialFirstName, lastName: initialLastName } = splitName(user.name);

    const [formData, setFormData] = useState({
        first_name: initialFirstName,
        last_name: initialLastName,
        email: user.email || '',
        phone: user.phone || '',
        date_of_birth: user.date_of_birth || '',
        gender: user.gender || '',
        blood_group: user.blood_group || '',
        address_line_1: user.address_line_1 || '',
        address_line_2: user.address_line_2 || '',
        state: user.state || '',
        city: user.city || '',
        pincode: user.pincode || '',
        primary_doctor_id: user.primary_doctor_id?.toString() || '',
        medical_conditions: user.medical_conditions || [],
        allergies: user.allergies || [],
        emergency_contact_name: user.emergency_contact_name || '',
        emergency_contact_relation: user.emergency_contact_relation || '',
        emergency_contact_phone: user.emergency_contact_phone || '',
    });

    // Get available cities based on selected state
    const availableCities = useMemo(() => {
        return formData.state ? getCitiesForState(formData.state) : [];
    }, [formData.state]);

    // Handle state change - clear city when state changes
    const handleStateChange = (newState: string) => {
        setFormData({ ...formData, state: newState, city: '' });
        if (errors.state) {
            setErrors({ ...errors, state: '' });
        }
    };

    const handleInputChange = (field: string, value: string | string[]) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleAvatarSelect = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            toast.error('Please select a JPG, PNG, or WebP image');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image must be less than 5MB');
            return;
        }

        setUploading(true);

        const reader = new FileReader();
        reader.onload = (ev) => {
            setAvatarPreview(ev.target?.result as string);
        };
        reader.readAsDataURL(file);

        const uploadData = new FormData();
        uploadData.append('avatar', file);

        try {
            const response = await fetch('/settings/avatar', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN':
                        document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: uploadData,
            });

            if (response.ok) {
                const data = await response.json();
                setAvatarPreview(data.avatar_url);
                toast.success('Avatar uploaded successfully');
                // Refresh Inertia shared data so sidebar avatar updates
                router.reload({ only: ['auth'] });
            } else {
                toast.error('Failed to upload avatar');
                setAvatarPreview(user.avatar_url);
            }
        } catch {
            toast.error('Failed to upload avatar');
            setAvatarPreview(user.avatar_url);
        } finally {
            setUploading(false);
        }
    };

    const handleSave = () => {
        setSaving(true);

        // Combine first and last name for backend
        const fullName = `${formData.first_name} ${formData.last_name}`.trim();

        router.put(
            '/settings/profile',
            {
                name: fullName,
                email: formData.email,
                phone: formData.phone,
                date_of_birth: formData.date_of_birth,
                gender: formData.gender,
                blood_group: formData.blood_group,
                address_line_1: formData.address_line_1,
                address_line_2: formData.address_line_2,
                state: formData.state,
                city: formData.city,
                pincode: formData.pincode,
                primary_doctor_id: formData.primary_doctor_id ? Number(formData.primary_doctor_id) : null,
                medical_conditions: formData.medical_conditions.length > 0 ? formData.medical_conditions : null,
                allergies: formData.allergies.length > 0 ? formData.allergies : null,
                emergency_contact_type: 'custom',
                emergency_contact_name: formData.emergency_contact_name,
                emergency_contact_relation: formData.emergency_contact_relation,
                emergency_contact_phone: formData.emergency_contact_phone,
            },
            {
                onSuccess: () => {
                    toast.success('Profile updated successfully');
                },
                onError: (errs) => {
                    setErrors(errs as Record<string, string>);
                    toast.error('Please fix the errors and try again');
                },
                onFinish: () => setSaving(false),
            }
        );
    };

    const patientId = user.patient_id || `CRH-${new Date().getFullYear()}-${user.id.toString().slice(0, 5).toUpperCase()}`;

    return (
        <div className="space-y-10">
            {/* Header with Avatar and Name */}
            <div className="flex items-center gap-6">
                <div className="relative">
                    <Avatar className="h-24 w-24 bg-muted">
                        <AvatarImage src={avatarPreview || undefined} />
                        <AvatarFallback className="text-2xl text-muted-foreground bg-muted">
                            {getInitials(user.name)}
                        </AvatarFallback>
                    </Avatar>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                        <Camera className="h-4 w-4" />
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleAvatarSelect}
                    />
                </div>
                <div>
                    <h2 className="text-2xl font-semibold text-foreground">
                        {formData.first_name} {formData.last_name}
                    </h2>
                    <p className="text-muted-foreground">Patient ID: {patientId}</p>
                </div>
            </div>

            {/* Personal Information */}
            <div className="space-y-4">
                <SectionTitle>Personal information</SectionTitle>
                <FormCard>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                        {/* First Name */}
                        <div className="space-y-2">
                            <Label htmlFor="first_name">First name</Label>
                            <Input
                                id="first_name"
                                value={formData.first_name}
                                onChange={(e) => handleInputChange('first_name', e.target.value)}
                                className={errors.name ? 'border-destructive' : ''}
                            />
                        </div>

                        {/* Last Name */}
                        <div className="space-y-2">
                            <Label htmlFor="last_name">Last name</Label>
                            <Input
                                id="last_name"
                                value={formData.last_name}
                                onChange={(e) => handleInputChange('last_name', e.target.value)}
                            />
                        </div>

                        {/* Email Address */}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email address</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                className={errors.email ? 'border-destructive' : ''}
                            />
                        </div>

                        {/* Phone Number */}
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone number</Label>
                            <PhoneInput
                                value={formData.phone}
                                onChange={(value) => handleInputChange('phone', value)}
                                error={!!errors.phone}
                            />
                        </div>

                        {/* Date of Birth */}
                        <div className="space-y-2">
                            <Label htmlFor="dob">Date of birth</Label>
                            <DatePicker
                                id="dob"
                                value={formData.date_of_birth}
                                onChange={(value) => handleInputChange('date_of_birth', value)}
                                max={new Date()}
                                placeholder="Select date of birth"
                            />
                        </div>

                        {/* Gender */}
                        <div className="space-y-2">
                            <Label>Gender</Label>
                            <Select
                                value={formData.gender}
                                onValueChange={(v) => handleInputChange('gender', v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="male">Male</SelectItem>
                                    <SelectItem value="female">Female</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </FormCard>
            </div>

            {/* Contact & Address */}
            <div className="space-y-4">
                <SectionTitle>Contact & address</SectionTitle>
                <FormCard>
                    <div className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="address_line_1">Address line 1</Label>
                                <Input
                                    id="address_line_1"
                                    value={formData.address_line_1}
                                    onChange={(e) => handleInputChange('address_line_1', e.target.value)}
                                    placeholder="Street address"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address_line_2">Address line 2</Label>
                                <Input
                                    id="address_line_2"
                                    value={formData.address_line_2}
                                    onChange={(e) => handleInputChange('address_line_2', e.target.value)}
                                    placeholder="Landmark, area"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-5">
                            <div className="space-y-2">
                                <Label>State</Label>
                                <Select value={formData.state} onValueChange={handleStateChange}>
                                    <SelectTrigger className={!formData.state ? 'text-muted-foreground' : ''}>
                                        <SelectValue placeholder="Select state" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[300px]">
                                        {INDIAN_STATES.map((s) => (
                                            <SelectItem key={s} value={s}>{s}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>City</Label>
                                <Select
                                    value={formData.city}
                                    onValueChange={(v) => handleInputChange('city', v)}
                                    disabled={!formData.state}
                                >
                                    <SelectTrigger className={!formData.city && formData.state ? 'text-muted-foreground' : ''}>
                                        <SelectValue placeholder={formData.state ? "Select city" : "Select state first"} />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[300px]">
                                        {availableCities.map((c: string) => (
                                            <SelectItem key={c} value={c}>{c}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pincode">Pincode</Label>
                                <Input
                                    id="pincode"
                                    value={formData.pincode}
                                    onChange={(e) => handleInputChange('pincode', e.target.value)}
                                    placeholder="Pincode"
                                />
                            </div>
                        </div>
                    </div>
                </FormCard>
            </div>

            {/* Health Information */}
            <div className="space-y-4">
                <SectionTitle>Health information</SectionTitle>
                <FormCard>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                        {/* Blood Group */}
                        <div className="space-y-2">
                            <Label>Blood group</Label>
                            <Select
                                value={formData.blood_group}
                                onValueChange={(v) => handleInputChange('blood_group', v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select blood group" />
                                </SelectTrigger>
                                <SelectContent>
                                    {bloodGroupOptions.map((bg) => (
                                        <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Primary Doctor */}
                        {doctors.length > 0 && (
                            <div className="space-y-2">
                                <Label>Primary doctor</Label>
                                <Select
                                    value={formData.primary_doctor_id}
                                    onValueChange={(v) => handleInputChange('primary_doctor_id', v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select doctor (optional)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {doctors.map((d) => (
                                            <SelectItem key={d.id} value={d.id.toString()}>
                                                {d.name} — {d.specialization}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Medical conditions</Label>
                            <TagInput
                                tags={formData.medical_conditions}
                                onChange={(tags) => handleInputChange('medical_conditions', tags)}
                                placeholder="e.g. Diabetes, Hypertension"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Allergies</Label>
                            <TagInput
                                tags={formData.allergies}
                                onChange={(tags) => handleInputChange('allergies', tags)}
                                placeholder="e.g. Penicillin, Peanuts"
                                variant="destructive"
                            />
                        </div>
                    </div>
                </FormCard>
            </div>

            {/* Emergency Contact */}
            <div className="space-y-4">
                <div>
                    <SectionTitle>Emergency contact</SectionTitle>
                    <p className="text-sm text-muted-foreground mt-1">Required for procedures</p>
                </div>
                <FormCard>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-5">
                        {/* Contact Name */}
                        <div className="space-y-2">
                            <Label htmlFor="emergency_name">Contact name</Label>
                            <Input
                                id="emergency_name"
                                value={formData.emergency_contact_name}
                                onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                                placeholder="Enter name"
                            />
                        </div>

                        {/* Relationship */}
                        <div className="space-y-2">
                            <Label htmlFor="emergency_relation">Relationship</Label>
                            <Input
                                id="emergency_relation"
                                value={formData.emergency_contact_relation}
                                onChange={(e) => handleInputChange('emergency_contact_relation', e.target.value)}
                                placeholder="e.g., Spouse, Parent"
                            />
                        </div>

                        {/* Phone Number */}
                        <div className="space-y-2">
                            <Label htmlFor="emergency_phone">Phone number</Label>
                            <PhoneInput
                                value={formData.emergency_contact_phone}
                                onChange={(v) => handleInputChange('emergency_contact_phone', v)}
                                error={!!errors.emergency_contact_phone}
                            />
                        </div>
                    </div>
                </FormCard>
            </div>

            {/* Save Button */}
            <div>
                <Button onClick={handleSave} disabled={saving} className="px-8">
                    {saving ? 'Saving...' : 'Save changes'}
                </Button>
            </div>
        </div>
    );
}
