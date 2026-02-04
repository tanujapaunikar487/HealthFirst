import { useState, useRef, ChangeEvent } from 'react';
import { router } from '@inertiajs/react';
import { Camera, User, Phone, Heart } from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';
import { Badge } from '@/Components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
import { InfoCard } from '@/Components/ui/info-card';
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

function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

export function ProfileTab({ user, doctors = [] }: ProfileTabProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar_url);
    const [uploading, setUploading] = useState(false);

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

    return (
        <div className="space-y-16">
            {/* Profile Header with Avatar */}
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
                    <h2 className="text-[16px] font-semibold leading-5 text-[#171717]">
                        {user.name}
                    </h2>
                    <p className="text-[14px] leading-5 text-[#737373]">{user.email}</p>
                </div>
            </div>

            {/* Personal Information - InfoCard Style */}
            <div>
                <div className="flex items-center gap-2.5 mb-4">
                    <Icon icon={User} className="h-5 w-5 text-muted-foreground" />
                    <h2 className="text-lg font-semibold" style={{ color: '#00184D' }}>
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
                    <Icon icon={Phone} className="h-5 w-5 text-muted-foreground" />
                    <h2 className="text-lg font-semibold" style={{ color: '#00184D' }}>
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
                            label: 'Address line 1',
                            value: user.address_line_1 ?? undefined,
                        },
                        {
                            label: 'Address line 2',
                            value: user.address_line_2 ?? undefined,
                        },
                        {
                            label: 'City',
                            value: user.city ?? undefined,
                        },
                        {
                            label: 'State',
                            value: user.state ?? undefined,
                        },
                        {
                            label: 'Pincode',
                            value: user.pincode ?? undefined,
                        },
                    ]}
                />
            </div>

            {/* Health Information - InfoCard Style */}
            <div>
                <div className="flex items-center gap-2.5 mb-4">
                    <Icon icon={Heart} className="h-5 w-5 text-muted-foreground" />
                    <h2 className="text-lg font-semibold" style={{ color: '#00184D' }}>
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
                    <Icon icon={Phone} className="h-5 w-5 text-muted-foreground" />
                    <h2 className="text-lg font-semibold" style={{ color: '#00184D' }}>
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
        </div>
    );
}
