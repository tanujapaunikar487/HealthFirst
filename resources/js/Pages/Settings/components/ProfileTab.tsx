import { useState, useRef, ChangeEvent } from 'react';
import { router } from '@inertiajs/react';
import { Camera, User, Phone, Heart, Pencil, X } from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
import { InfoCard } from '@/Components/ui/info-card';
import { Input } from '@/Components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetBody } from '@/Components/ui/sheet';
import { PhoneInput } from '@/Components/ui/phone-input';
import { DatePicker } from '@/Components/ui/date-picker';
import { toast } from 'sonner';

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
    doctors: DoctorOption[];
}

const genderOptions = ['male', 'female', 'other'];
const bloodGroupOptions = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Chandigarh', 'Puducherry',
];

const STATE_CITIES: Record<string, string[]> = {
    'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad'],
    'Karnataka': ['Bangalore', 'Mysore', 'Hubli', 'Mangalore', 'Belgaum'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem'],
    'Delhi': ['New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi'],
    'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar'],
    'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri'],
    'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam'],
    'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Bikaner', 'Ajmer'],
    'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Noida', 'Ghaziabad'],
    'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam'],
};

function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

/* ─── TagInput Component ─── */

function TagInput({
    value,
    onChange,
    placeholder,
    variant = 'default',
}: {
    value: string[];
    onChange: (tags: string[]) => void;
    placeholder: string;
    variant?: 'default' | 'destructive';
}) {
    const [inputValue, setInputValue] = useState('');

    function addTag() {
        // Split by comma and add each as separate tag
        const newTags = inputValue
            .split(',')
            .map(t => t.trim())
            .filter(t => t && !value.includes(t));

        if (newTags.length > 0) {
            onChange([...value, ...newTags]);
        }
        setInputValue('');
    }

    function removeTag(index: number) {
        onChange(value.filter((_, i) => i !== index));
    }

    return (
        <div>
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
            />
            {value.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                    {value.map((tag, i) => (
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

export function ProfileTab({ user, doctors = [] }: ProfileTabProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar_url);
    const [uploading, setUploading] = useState(false);
    const [removing, setRemoving] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        date_of_birth: user.date_of_birth || '',
        gender: user.gender || '',
        blood_group: user.blood_group || '',
        address_line_1: user.address_line_1 || '',
        address_line_2: user.address_line_2 || '',
        city: user.city || '',
        state: user.state || '',
        pincode: user.pincode || '',
        primary_doctor_id: user.primary_doctor_id?.toString() || '',
        medical_conditions: user.medical_conditions || [],
        allergies: user.allergies || [],
        emergency_contact_type: user.emergency_contact_type || 'custom',
        emergency_contact_name: user.emergency_contact_name || '',
        emergency_contact_phone: user.emergency_contact_phone || '',
        emergency_contact_relation: user.emergency_contact_relation || '',
    });

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

    const handleRemoveAvatar = async () => {
        if (!avatarPreview) return;

        setRemoving(true);

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
                toast.success('Profile photo removed');
                router.reload({ only: ['auth'] });
            } else {
                toast.error('Failed to remove profile photo');
            }
        } catch {
            toast.error('Failed to remove profile photo');
        } finally {
            setRemoving(false);
        }
    };

    const handleStateChange = (value: string) => {
        setFormData({ ...formData, state: value, city: '' });
    };

    const handleSave = () => {
        if (!formData.name.trim()) {
            toast.error('Name is required');
            return;
        }

        setSaving(true);

        router.put('/settings/profile', {
            ...formData,
            primary_doctor_id: formData.primary_doctor_id ? parseInt(formData.primary_doctor_id) : null,
            medical_conditions: formData.medical_conditions.length > 0 ? formData.medical_conditions : null,
            allergies: formData.allergies.length > 0 ? formData.allergies : null,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Profile updated successfully');
                setShowEditForm(false);
                setSaving(false);
            },
            onError: (errors) => {
                const firstError = Object.values(errors)[0];
                toast.error(typeof firstError === 'string' ? firstError : 'Failed to update profile');
                setSaving(false);
            },
        });
    };

    // Format date for display
    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return undefined;
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    // Capitalize helper
    const capitalize = (s: string | null) => {
        if (!s) return undefined;
        return s.charAt(0).toUpperCase() + s.slice(1);
    };

    // Get primary doctor name
    const getPrimaryDoctorName = () => {
        if (!user.primary_doctor_id) return undefined;
        const doctor = doctors.find(d => d.id === user.primary_doctor_id);
        return doctor ? doctor.name : undefined;
    };

    // Get full address
    const getFullAddress = () => {
        const parts = [
            user.address_line_1,
            user.address_line_2,
            user.city,
            user.state,
            user.pincode,
        ].filter(Boolean);
        return parts.length > 0 ? parts.join(', ') : undefined;
    };

    const availableCities = formData.state ? (STATE_CITIES[formData.state] || []) : [];

    return (
        <div className="space-y-12">
            {/* Profile Header with Avatar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div className="relative">
                        <Avatar className="h-20 w-20 bg-muted">
                            <AvatarImage src={avatarPreview || undefined} />
                            <AvatarFallback className="text-xl text-muted-foreground bg-muted">
                                {getInitials(user.name)}
                            </AvatarFallback>
                        </Avatar>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading || removing}
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
                        <h2 className="text-[16px] font-semibold leading-5 text-foreground">
                            {user.name}
                        </h2>
                        <p className="text-[14px] leading-5 text-muted-foreground">{user.email}</p>
                        {avatarPreview && (
                            <button
                                onClick={handleRemoveAvatar}
                                disabled={removing || uploading}
                                className="text-[14px] text-destructive hover:underline disabled:opacity-50 mt-1"
                            >
                                {removing ? 'Removing...' : 'Remove photo'}
                            </button>
                        )}
                    </div>
                </div>
                <Button variant="outline" onClick={() => setShowEditForm(true)}>
                    <Icon icon={Pencil} className="h-4 w-4 mr-2" />
                    Edit profile
                </Button>
            </div>

            {/* Personal Information - InfoCard Style */}
            <div>
                <div className="flex items-center gap-2.5 mb-4">
                    <Icon icon={User} className="h-5 w-5 text-foreground" />
                    <h2 className="font-semibold" style={{ color: 'hsl(var(--foreground))', fontSize: '20px', lineHeight: '28px', letterSpacing: '0' }}>
                        Personal information
                    </h2>
                </div>
                <InfoCard
                    items={[
                        {
                            label: 'Name',
                            value: user.name,
                            avatar: {
                                url: user.avatar_url ?? undefined,
                                initials: getInitials(user.name),
                            },
                        },
                        {
                            label: 'Email',
                            value: user.email,
                        },
                        {
                            label: 'Phone',
                            value: user.phone ?? undefined,
                        },
                        {
                            label: 'Date of birth',
                            value: formatDate(user.date_of_birth),
                        },
                        {
                            label: 'Gender',
                            value: capitalize(user.gender),
                        },
                    ]}
                />
            </div>

            {/* Contact & Address - InfoCard Style */}
            <div>
                <div className="flex items-center gap-2.5 mb-4">
                    <Icon icon={Phone} className="h-5 w-5 text-foreground" />
                    <h2 className="font-semibold" style={{ color: 'hsl(var(--foreground))', fontSize: '20px', lineHeight: '28px', letterSpacing: '0' }}>
                        Contact & address
                    </h2>
                </div>
                <InfoCard
                    items={[
                        {
                            label: 'Phone',
                            value: user.phone ?? undefined,
                        },
                        {
                            label: 'Email',
                            value: user.email ?? undefined,
                        },
                        {
                            label: 'Address',
                            value: getFullAddress(),
                        },
                    ]}
                />
            </div>

            {/* Health Information - InfoCard Style */}
            <div>
                <div className="flex items-center gap-2.5 mb-4">
                    <Icon icon={Heart} className="h-5 w-5 text-foreground" />
                    <h2 className="font-semibold" style={{ color: 'hsl(var(--foreground))', fontSize: '20px', lineHeight: '28px', letterSpacing: '0' }}>
                        Health information
                    </h2>
                </div>
                <InfoCard
                    items={[
                        {
                            label: 'Blood group',
                            value: user.blood_group ?? undefined,
                        },
                        {
                            label: 'Primary doctor',
                            value: getPrimaryDoctorName(),
                        },
                        {
                            label: 'Conditions',
                            value: user.medical_conditions && user.medical_conditions.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                    {user.medical_conditions.map((c, i) => (
                                        <Badge key={i} variant="secondary">{c}</Badge>
                                    ))}
                                </div>
                            ) : undefined,
                        },
                        {
                            label: 'Allergies',
                            value: user.allergies && user.allergies.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                    {user.allergies.map((a, i) => (
                                        <Badge key={i} variant="destructive">{a}</Badge>
                                    ))}
                                </div>
                            ) : undefined,
                        },
                    ]}
                />
            </div>

            {/* Emergency Contact - InfoCard Style */}
            <div>
                <div className="flex items-center gap-2.5 mb-4">
                    <Icon icon={Phone} className="h-5 w-5 text-foreground" />
                    <h2 className="font-semibold" style={{ color: 'hsl(var(--foreground))', fontSize: '20px', lineHeight: '28px', letterSpacing: '0' }}>
                        Emergency contact
                    </h2>
                </div>
                <InfoCard
                    items={[
                        {
                            label: 'Name',
                            value: user.emergency_contact_name ?? undefined,
                        },
                        {
                            label: 'Relationship',
                            value: user.emergency_contact_relation ?? undefined,
                        },
                        {
                            label: 'Phone',
                            value: user.emergency_contact_phone ?? undefined,
                        },
                    ]}
                />
            </div>

            {/* Edit Profile Sheet */}
            <Sheet open={showEditForm} onOpenChange={setShowEditForm}>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>Edit profile</SheetTitle>
                    </SheetHeader>

                    <SheetBody>
                        {/* Personal Details */}
                        <div>
                            <p className="mb-3 text-[14px] font-medium text-muted-foreground">Personal details</p>
                            <div className="space-y-4">
                                <div>
                                    <label className="mb-1.5 block text-[14px] font-medium text-muted-foreground">
                                        Name <span className="text-destructive">*</span>
                                    </label>
                                    <Input
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Full name"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-[14px] font-medium text-muted-foreground">Phone</label>
                                    <PhoneInput
                                        value={formData.phone}
                                        onChange={value => setFormData({ ...formData, phone: value })}
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-[14px] font-medium text-muted-foreground">Date of birth</label>
                                    <DatePicker
                                        value={formData.date_of_birth}
                                        onChange={(value) => setFormData({ ...formData, date_of_birth: value })}
                                        max={new Date()}
                                        placeholder="Select date of birth"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-[14px] font-medium text-muted-foreground">Gender</label>
                                    <Select
                                        value={formData.gender}
                                        onValueChange={val => setFormData({ ...formData, gender: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select gender" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {genderOptions.map(g => (
                                                <SelectItem key={g} value={g}>{capitalize(g)}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Contact & Address */}
                        <div>
                            <p className="mb-3 text-[14px] font-medium text-muted-foreground">Contact & address</p>
                            <div className="space-y-4">
                                <div>
                                    <label className="mb-1.5 block text-[14px] font-medium text-muted-foreground">Address line 1</label>
                                    <Input
                                        value={formData.address_line_1}
                                        onChange={e => setFormData({ ...formData, address_line_1: e.target.value })}
                                        placeholder="Street address"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-[14px] font-medium text-muted-foreground">Address line 2</label>
                                    <Input
                                        value={formData.address_line_2}
                                        onChange={e => setFormData({ ...formData, address_line_2: e.target.value })}
                                        placeholder="Landmark, area"
                                    />
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="mb-1.5 block text-[14px] font-medium text-muted-foreground">State</label>
                                        <Select value={formData.state} onValueChange={handleStateChange}>
                                            <SelectTrigger className={!formData.state ? 'text-muted-foreground' : ''}>
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-[300px]">
                                                {INDIAN_STATES.map((s) => (
                                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-[14px] font-medium text-muted-foreground">City</label>
                                        <Select
                                            value={formData.city}
                                            onValueChange={(value: string) => setFormData({ ...formData, city: value })}
                                            disabled={!formData.state}
                                        >
                                            <SelectTrigger className={!formData.city && formData.state ? 'text-muted-foreground' : ''}>
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableCities.map((c) => (
                                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-[14px] font-medium text-muted-foreground">Pincode</label>
                                        <Input
                                            value={formData.pincode}
                                            onChange={e => setFormData({ ...formData, pincode: e.target.value })}
                                            placeholder="Pincode"
                                            maxLength={6}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Health Information */}
                        <div>
                            <p className="mb-3 text-[14px] font-medium text-muted-foreground">Health information</p>
                            <div className="space-y-4">
                                <div>
                                    <label className="mb-1.5 block text-[14px] font-medium text-muted-foreground">Blood group</label>
                                    <Select
                                        value={formData.blood_group}
                                        onValueChange={val => setFormData({ ...formData, blood_group: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select blood group" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {bloodGroupOptions.map(bg => (
                                                <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-[14px] font-medium text-muted-foreground">Primary doctor</label>
                                    <Select
                                        value={formData.primary_doctor_id}
                                        onValueChange={val => setFormData({ ...formData, primary_doctor_id: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select doctor" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {doctors.map(d => (
                                                <SelectItem key={d.id} value={d.id.toString()}>
                                                    {d.name} - {d.specialization}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-[14px] font-medium text-muted-foreground">Medical conditions</label>
                                    <TagInput
                                        value={formData.medical_conditions}
                                        onChange={tags => setFormData({ ...formData, medical_conditions: tags })}
                                        placeholder="Add condition"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-[14px] font-medium text-muted-foreground">Allergies</label>
                                    <TagInput
                                        value={formData.allergies}
                                        onChange={tags => setFormData({ ...formData, allergies: tags })}
                                        placeholder="Add allergy"
                                        variant="destructive"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Emergency Contact */}
                        <div>
                            <p className="mb-3 text-[14px] font-medium text-muted-foreground">Emergency contact</p>
                            <div className="space-y-4">
                                <div>
                                    <label className="mb-1.5 block text-[14px] font-medium text-muted-foreground">Name</label>
                                    <Input
                                        value={formData.emergency_contact_name}
                                        onChange={e => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                                        placeholder="Emergency contact name"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-[14px] font-medium text-muted-foreground">Relationship</label>
                                    <Input
                                        value={formData.emergency_contact_relation}
                                        onChange={e => setFormData({ ...formData, emergency_contact_relation: e.target.value })}
                                        placeholder="e.g., Spouse, Parent"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-[14px] font-medium text-muted-foreground">Phone</label>
                                    <PhoneInput
                                        value={formData.emergency_contact_phone}
                                        onChange={value => setFormData({ ...formData, emergency_contact_phone: value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </SheetBody>

                    <SheetFooter>
                        <Button size="lg" className="flex-1" onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving...' : 'Save changes'}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );
}
