import { useState, useRef } from 'react';
import { router } from '@inertiajs/react';
import { Camera, X } from '@/Lib/icons';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Card, CardContent } from '@/Components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { PhoneInput } from '@/Components/ui/phone-input';
import { INDIAN_STATES, getCitiesForState } from '@/Lib/locations';
import { toast } from 'sonner';

interface FamilyMember {
    id: number;
    name: string;
    relation: string;
    phone: string | null;
}

interface User {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    date_of_birth: string | null;
    gender: string | null;
    avatar_url: string | null;
    address_line_1: string | null;
    address_line_2: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;
    emergency_contact_type: 'family_member' | 'custom' | null;
    emergency_contact_member_id: number | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    emergency_contact_relation: string | null;
}

interface ProfileTabProps {
    user: User;
    familyMembers: FamilyMember[];
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

export function ProfileTab({ user, familyMembers }: ProfileTabProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar_url);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [formData, setFormData] = useState({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        date_of_birth: user.date_of_birth || '',
        gender: user.gender || '',
        address_line_1: user.address_line_1 || '',
        address_line_2: user.address_line_2 || '',
        city: user.city || '',
        state: user.state || '',
        pincode: user.pincode || '',
        emergency_contact_type: user.emergency_contact_type || '',
        emergency_contact_member_id: user.emergency_contact_member_id?.toString() || '',
        emergency_contact_name: user.emergency_contact_name || '',
        emergency_contact_phone: user.emergency_contact_phone || '',
        emergency_contact_relation: user.emergency_contact_relation || '',
    });

    const cities = formData.state ? getCitiesForState(formData.state) : [];

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleStateChange = (value: string) => {
        setFormData((prev) => ({
            ...prev,
            state: value,
            city: '', // Clear city when state changes
        }));
    };

    const handleEmergencyTypeChange = (type: 'family_member' | 'custom') => {
        setFormData((prev) => ({
            ...prev,
            emergency_contact_type: type,
            // Clear the other type's fields
            ...(type === 'family_member'
                ? {
                      emergency_contact_name: '',
                      emergency_contact_phone: '',
                      emergency_contact_relation: '',
                  }
                : { emergency_contact_member_id: '' }),
        }));
    };

    const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type and size
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            toast.error('Please select a JPG, PNG, or WebP image');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image must be less than 5MB');
            return;
        }

        setUploading(true);

        // Show preview immediately
        const reader = new FileReader();
        reader.onload = (ev) => {
            setAvatarPreview(ev.target?.result as string);
        };
        reader.readAsDataURL(file);

        // Upload to server
        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const response = await fetch('/settings/avatar', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN':
                        document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                setAvatarPreview(data.avatar_url);
                toast.success('Avatar uploaded successfully');
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

    const handleRemoveAvatar = async () => {
        try {
            const response = await fetch('/settings/avatar', {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN':
                        document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            if (response.ok) {
                setAvatarPreview(null);
                toast.success('Avatar removed');
            }
        } catch {
            toast.error('Failed to remove avatar');
        }
    };

    const handleSave = () => {
        setSaving(true);
        router.put('/settings/profile', formData, {
            onSuccess: () => {
                toast.success('Profile updated successfully');
            },
            onError: (errs) => {
                setErrors(errs as Record<string, string>);
                toast.error('Please fix the errors and try again');
            },
            onFinish: () => setSaving(false),
        });
    };

    return (
        <div className="space-y-6">
            {/* Avatar Upload Section */}
            <div className="flex items-center gap-6">
                <div className="relative">
                    <Avatar className="h-24 w-24">
                        <AvatarImage src={avatarPreview || undefined} />
                        <AvatarFallback className="text-xl">{getInitials(user.name)}</AvatarFallback>
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
                    <h3 className="font-medium">Profile Photo</h3>
                    <p className="text-sm text-muted-foreground">JPG, PNG, or WebP up to 5MB</p>
                    {avatarPreview && (
                        <button
                            onClick={handleRemoveAvatar}
                            className="text-sm text-destructive hover:underline mt-1"
                        >
                            Remove photo
                        </button>
                    )}
                </div>
            </div>

            {/* Personal Information */}
            <Card>
                <CardContent className="pt-6 space-y-4">
                    <h4 className="font-medium text-lg mb-4">Personal Information</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                className={errors.name ? 'border-destructive' : ''}
                            />
                            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email *</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                className={errors.email ? 'border-destructive' : ''}
                            />
                            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <PhoneInput
                                value={formData.phone}
                                onChange={(value) => handleInputChange('phone', value)}
                                hasError={!!errors.phone}
                            />
                            {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dob">Date of Birth</Label>
                            <Input
                                id="dob"
                                type="date"
                                value={formData.date_of_birth}
                                onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                                max={new Date().toISOString().split('T')[0]}
                            />
                        </div>
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
                </CardContent>
            </Card>

            {/* Address Section */}
            <Card>
                <CardContent className="pt-6 space-y-4">
                    <h4 className="font-medium text-lg mb-4">Address</h4>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="address1">Address Line 1</Label>
                            <Input
                                id="address1"
                                value={formData.address_line_1}
                                onChange={(e) => handleInputChange('address_line_1', e.target.value)}
                                placeholder="House/Flat No., Building Name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address2">Address Line 2</Label>
                            <Input
                                id="address2"
                                value={formData.address_line_2}
                                onChange={(e) => handleInputChange('address_line_2', e.target.value)}
                                placeholder="Street, Landmark"
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>State</Label>
                                <Select value={formData.state} onValueChange={handleStateChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select state" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {INDIAN_STATES.map((state) => (
                                            <SelectItem key={state} value={state}>
                                                {state}
                                            </SelectItem>
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
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select city" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {cities.map((city) => (
                                            <SelectItem key={city} value={city}>
                                                {city}
                                            </SelectItem>
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
                                    placeholder="6-digit pincode"
                                    maxLength={6}
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Emergency Contact Section */}
            <Card>
                <CardContent className="pt-6 space-y-4">
                    <h4 className="font-medium text-lg mb-4">Emergency Contact</h4>

                    {/* Toggle between family member and custom */}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => handleEmergencyTypeChange('family_member')}
                            className={`flex-1 px-4 py-3 rounded-lg border text-left transition-colors ${
                                formData.emergency_contact_type === 'family_member'
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border hover:border-muted-foreground/50'
                            }`}
                        >
                            <p className="font-medium">Link Family Member</p>
                            <p className="text-sm text-muted-foreground">Select from your family members</p>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleEmergencyTypeChange('custom')}
                            className={`flex-1 px-4 py-3 rounded-lg border text-left transition-colors ${
                                formData.emergency_contact_type === 'custom'
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border hover:border-muted-foreground/50'
                            }`}
                        >
                            <p className="font-medium">Enter Custom Contact</p>
                            <p className="text-sm text-muted-foreground">Add a new contact manually</p>
                        </button>
                    </div>

                    {formData.emergency_contact_type === 'family_member' && (
                        <div className="space-y-2">
                            <Label>Select Family Member</Label>
                            <Select
                                value={formData.emergency_contact_member_id}
                                onValueChange={(v) => handleInputChange('emergency_contact_member_id', v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose a family member" />
                                </SelectTrigger>
                                <SelectContent>
                                    {familyMembers.map((member) => (
                                        <SelectItem key={member.id} value={member.id.toString()}>
                                            {member.name} ({member.relation})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {formData.emergency_contact_type === 'custom' && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="emergency_name">Name *</Label>
                                <Input
                                    id="emergency_name"
                                    value={formData.emergency_contact_name}
                                    onChange={(e) =>
                                        handleInputChange('emergency_contact_name', e.target.value)
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="emergency_phone">Phone *</Label>
                                <PhoneInput
                                    value={formData.emergency_contact_phone}
                                    onChange={(v) => handleInputChange('emergency_contact_phone', v)}
                                    hasError={!!errors.emergency_contact_phone}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="emergency_relation">Relation</Label>
                                <Input
                                    id="emergency_relation"
                                    value={formData.emergency_contact_relation}
                                    onChange={(e) =>
                                        handleInputChange('emergency_contact_relation', e.target.value)
                                    }
                                    placeholder="e.g., Spouse, Parent"
                                />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving} className="min-w-[120px]">
                    {saving ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>
        </div>
    );
}
