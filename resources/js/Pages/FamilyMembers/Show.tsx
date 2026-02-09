import { useState, useEffect, useMemo, useRef } from 'react';
import { router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Pulse, ErrorState, useSkeletonLoading } from '@/Components/ui/skeleton';
import { EmptyState } from '@/Components/ui/empty-state';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Card } from '@/Components/ui/card';
import { InfoCard } from '@/Components/ui/info-card';
import { Alert as AlertComponent } from '@/Components/ui/alert';
import { Input } from '@/Components/ui/input';
import { PhoneInput } from '@/Components/ui/phone-input';
import { DatePicker } from '@/Components/ui/date-picker';
import { SideNav } from '@/Components/SideNav';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Components/ui/select';
import { cn } from '@/Lib/utils';
import { useToast } from '@/Contexts/ToastContext';
import { getAvatarColor } from '@/Lib/avatar-colors';
import { INDIAN_STATES, getCitiesForState } from '@/Lib/locations';
import {
  ChevronLeft,
  Pencil,
  AlertTriangle,
  Stethoscope,
  FileText,
  Pill,
  ChevronRight,
  Trash2,
  X,
  UserPlus,
  Receipt,
  ShieldAlert,
  User,
  Heart,
  Phone,
  Activity,
} from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';
import { DetailSection } from '@/Components/ui/detail-section';
import { DetailRow } from '@/Components/ui/detail-row';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/Components/ui/dialog';

/* ─── Types ─── */

interface Member {
  id: number;
  patient_id: string | null;
  name: string;
  relation: string;
  is_guest?: boolean;
  age: number | null;
  date_of_birth: string | null;
  date_of_birth_formatted: string | null;
  gender: string | null;
  blood_group: string | null;
  phone: string | null;
  email: string | null;
  full_address: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  primary_doctor_id: number | null;
  primary_doctor_name: string | null;
  medical_conditions: string[];
  allergies: string[];
  emergency_contact_name: string | null;
  emergency_contact_relation: string | null;
  emergency_contact_phone: string | null;
  avatar_url: string | null;
}

interface DoctorOption {
  id: number;
  name: string;
  specialization: string;
}

interface Alert {
  type: 'health_record' | 'billing' | 'insurance';
  category?: string;
  id: number;
  title: string;
  message: string;
  date: string;
  details?: string;
  url: string;
}

interface Props {
  member: Member;
  doctors: DoctorOption[];
  alerts: Alert[];
  canDelete: boolean;
}

/* ─── Constants ─── */

const relationOptions = [
  'self', 'mother', 'father', 'brother', 'sister',
  'spouse', 'son', 'daughter', 'grandmother', 'grandfather', 'other',
] as const;

const genderOptions = ['male', 'female', 'other'] as const;

const bloodGroupOptions = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

const relationColorIndices: Record<string, number> = {
  self: 0, mother: 1, father: 2, brother: 3, sister: 4,
  spouse: 1, son: 2, daughter: 3, grandmother: 4, grandfather: 0, other: 2,
};

function getRelationColor(relation: string) {
  const idx = relationColorIndices[relation] ?? 2;
  return getAvatarColor(idx);
}

/* ─── Sections Config ─── */

const SECTIONS = [
  { id: 'personal', label: 'Personal', icon: User },
  { id: 'contact', label: 'Contact & Address', icon: Phone },
  { id: 'health-info', label: 'Health', icon: Heart },
  { id: 'emergency', label: 'Emergency', icon: Phone },
  { id: 'health', label: 'Health Data', icon: Activity },
] as const;

/* ─── SideNav Component ─── */

function MemberSideNav({ isGuest }: { isGuest: boolean }) {
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
  const isScrollingRef = useRef(false);

  // Filter sections for guests (show personal and contact)
  const visibleSections = isGuest
    ? SECTIONS.filter((s) => s.id === 'personal' || s.id === 'contact')
    : SECTIONS;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Skip observer updates during programmatic scrolling
        if (isScrollingRef.current) return;

        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          const topmost = visible.reduce((prev, curr) =>
            prev.boundingClientRect.top < curr.boundingClientRect.top ? prev : curr
          );
          setActiveSection(topmost.target.id);
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    );

    visibleSections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [visibleSections]);

  const scrollTo = (id: string) => {
    isScrollingRef.current = true;
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Re-enable observer after scroll animation completes
    setTimeout(() => {
      isScrollingRef.current = false;
    }, 1000);
  };

  return (
    <SideNav
      items={visibleSections.map(s => ({ id: s.id, label: s.label, icon: s.icon }))}
      activeId={activeSection}
      onSelect={scrollTo}
    />
  );
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ─── Alert Banner Component ─── */

function getAlertVariant(type: Alert['type']): 'warning' | 'error' {
  return type === 'billing' ? 'error' : 'warning';
}

function AlertBanner({ alert }: { alert: Alert }) {
  const variant = getAlertVariant(alert.type);

  return (
    <AlertComponent variant={variant} mode="standalone" title={alert.message}>
      {alert.details && (
        <p className="mt-0.5">{alert.details}</p>
      )}
      <Button
        variant="link"
        size="sm"
        onClick={() => router.visit(alert.url)}
        className="h-auto p-0 flex items-center gap-1 text-label text-foreground mt-2"
      >
        View details
        <ChevronRight className="h-4 w-4" />
      </Button>
    </AlertComponent>
  );
}

/* ─── Tag Input ─── */

function TagInput({
  tags,
  onChange,
  placeholder,
  variant = 'neutral',
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
  variant?: 'neutral' | 'danger';
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

  return (
    <div>
      <div className="flex gap-2">
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
          className="flex-1"
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={addTag}
          disabled={!inputValue.trim()}
        >
          Add
        </Button>
      </div>
      {tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {tags.map((tag, i) => (
            <Badge key={i} variant={variant} className="gap-1 pr-1">
              {tag}
              <Button
                type="button"
                variant="ghost"
                onClick={() => removeTag(i)}
                className="ml-0.5 rounded-full p-0.5 h-auto hover:bg-black/10"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Skeleton ─── */

function FamilyMemberShowSkeleton() {
  return (
    <div className="w-full max-w-[960px]">
      {/* Back link */}
      <Pulse className="h-4 w-32 mb-6" />
      {/* Profile header */}
      <div className="flex items-center gap-5 mb-6">
        <Pulse className="h-20 w-20 rounded-full flex-shrink-0" />
        <div className="space-y-2 flex-1">
          <Pulse className="h-7 w-44" />
          <Pulse className="h-4 w-28" />
        </div>
        <Pulse className="h-10 w-28 rounded-lg" />
      </div>
      {/* Personal info card */}
      <div className="rounded-xl border border-border p-6 mb-4 space-y-4">
        <Pulse className="h-5 w-40" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <Pulse className="h-3 w-20" />
              <Pulse className="h-4 w-32" />
            </div>
          ))}
        </div>
      </div>
      {/* Medical conditions card */}
      <div className="rounded-xl border border-border p-6 mb-4 space-y-3">
        <Pulse className="h-5 w-40" />
        <div className="flex flex-wrap gap-2">
          {[0, 1, 2].map((i) => (
            <Pulse key={i} className="h-7 w-28 rounded-full" />
          ))}
        </div>
      </div>
      {/* Emergency contact card */}
      <div className="rounded-xl border border-border p-6 mb-4">
        <Pulse className="h-5 w-36 mb-4" />
        <div className="flex items-center gap-3">
          <Pulse className="h-10 w-10 rounded-full flex-shrink-0" />
          <div className="space-y-2">
            <Pulse className="h-4 w-32" />
            <Pulse className="h-3 w-24" />
          </div>
        </div>
      </div>
      {/* Health data links */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-border p-5 space-y-3">
            <Pulse className="h-10 w-10 rounded-xl" />
            <Pulse className="h-4 w-24" />
            <Pulse className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Component ─── */

export default function FamilyMemberShow({
  member,
  doctors,
  alerts,
  canDelete,
}: Props) {
  const { isLoading, hasError, retry } = useSkeletonLoading(member);
  const { props } = usePage<{ toast?: string }>();
  const { showToast } = useToast();
  const user = (usePage().props as any).auth?.user;

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [showUpgradeConfirm, setShowUpgradeConfirm] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [formData, setFormData] = useState({
    name: member?.name ?? '',
    relation: member?.relation ?? '',
    date_of_birth: member?.date_of_birth ?? '',
    gender: member?.gender ?? '',
    blood_group: member?.blood_group ?? '',
    phone: member?.phone ?? '',
    email: member?.email ?? '',
    address_line_1: member?.address_line_1 ?? '',
    address_line_2: member?.address_line_2 ?? '',
    city: member?.city ?? '',
    state: member?.state ?? '',
    pincode: member?.pincode ?? '',
    primary_doctor_id: member?.primary_doctor_id?.toString() ?? '',
    medical_conditions: member?.medical_conditions ?? [],
    allergies: member?.allergies ?? [],
    emergency_contact_name: member?.emergency_contact_name ?? '',
    emergency_contact_relation: member?.emergency_contact_relation ?? '',
    emergency_contact_phone: member?.emergency_contact_phone ?? '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Get available cities based on selected state in form
  const availableCities = useMemo(() => {
    return formData.state ? getCitiesForState(formData.state) : [];
  }, [formData.state]);

  // Handle state change - clear city when state changes
  const handleStateChange = (newState: string) => {
    setFormData({ ...formData, state: newState, city: '' });
    setFormErrors({ ...formErrors, state: '', city: '' });
  };

  useEffect(() => {
    if (props.toast) {
      showToast(props.toast, 'success');
    }
  }, [props.toast, showToast]);

  if (hasError) {
    return (
      <AppLayout user={user} pageTitle="Family Members" pageIcon="/assets/icons/family-selected.svg">
        <ErrorState onRetry={retry} label="Unable to load member details" />
      </AppLayout>
    );
  }

  if (isLoading) {
    return (
      <AppLayout user={user} pageTitle="Family Members" pageIcon="/assets/icons/family-selected.svg">
        <FamilyMemberShowSkeleton />
      </AppLayout>
    );
  }

  function handleSave() {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.relation) errors.relation = 'Relation is required';
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setSaving(true);

    const payload = {
      name: formData.name.trim(),
      relation: formData.relation,
      date_of_birth: formData.date_of_birth || null,
      gender: formData.gender || null,
      blood_group: formData.blood_group || null,
      phone: formData.phone || null,
      email: formData.email || null,
      address_line_1: formData.address_line_1 || null,
      address_line_2: formData.address_line_2 || null,
      city: formData.city || null,
      state: formData.state || null,
      pincode: formData.pincode || null,
      primary_doctor_id: formData.primary_doctor_id ? Number(formData.primary_doctor_id) : null,
      medical_conditions: formData.medical_conditions.length > 0 ? formData.medical_conditions : null,
      allergies: formData.allergies.length > 0 ? formData.allergies : null,
      emergency_contact_name: formData.emergency_contact_name || null,
      emergency_contact_relation: formData.emergency_contact_relation || null,
      emergency_contact_phone: formData.emergency_contact_phone || null,
    };

    router.put(`/family-members/${member.id}`, payload, {
      preserveScroll: true,
      onSuccess: () => {
        setIsEditing(false);
        setSaving(false);
        showToast('Profile updated successfully', 'success');
      },
      onError: (errors) => {
        setFormErrors(errors as Record<string, string>);
        setSaving(false);
        const firstError = Object.values(errors)[0];
        showToast(typeof firstError === 'string' ? firstError : 'Failed to update profile', 'error');
      },
    });
  }

  function handleCancel() {
    setFormData({
      name: member.name,
      relation: member.relation,
      date_of_birth: member.date_of_birth ?? '',
      gender: member.gender ?? '',
      blood_group: member.blood_group ?? '',
      phone: member.phone ?? '',
      email: member.email ?? '',
      address_line_1: member.address_line_1 ?? '',
      address_line_2: member.address_line_2 ?? '',
      city: member.city ?? '',
      state: member.state ?? '',
      pincode: member.pincode ?? '',
      primary_doctor_id: member.primary_doctor_id?.toString() ?? '',
      medical_conditions: [...(member.medical_conditions ?? [])],
      allergies: [...(member.allergies ?? [])],
      emergency_contact_name: member.emergency_contact_name ?? '',
      emergency_contact_relation: member.emergency_contact_relation ?? '',
      emergency_contact_phone: member.emergency_contact_phone ?? '',
    });
    setFormErrors({});
    setIsEditing(false);
  }

  function handleDelete() {
    router.delete(`/family-members/${member.id}`, {
      onSuccess: () => {
        setShowDeleteConfirm(false);
        setDeleteConfirmName('');
      },
    });
  }

  function handleUpgrade() {
    setUpgrading(true);
    router.put(`/family-members/${member.id}/upgrade`, {}, {
      preserveScroll: true,
      onSuccess: () => {
        setShowUpgradeConfirm(false);
        setUpgrading(false);
        showToast('Successfully upgraded to family member!', 'success');
      },
      onError: () => {
        setUpgrading(false);
        showToast('Failed to upgrade. Please try again.', 'error');
      },
    });
  }

  const colors = getRelationColor(member.relation);

  const healthDataLinks = [
    {
      title: 'Appointments',
      subtitle: 'View and book appointments',
      icon: Stethoscope,
      href: `/appointments?member=${member.id}`,
    },
    {
      title: 'Health Records',
      subtitle: 'Lab reports, diagnostics and more',
      icon: FileText,
      href: `/health-records?member=${member.id}`,
    },
    {
      title: 'Prescriptions',
      subtitle: 'Active and past prescriptions',
      icon: Pill,
      href: `/health-records?member=${member.id}&category=medication_active,medication_past`,
    },
  ];

  return (
    <AppLayout
      user={user}
      pageTitle="Family Members"
      pageIcon="/assets/icons/family.svg"
    >
      <div className="w-full max-w-[960px] pb-10">
        {/* Back Navigation */}
        <Button
          variant="link"
          size="sm"
          onClick={() => router.visit('/family-members')}
          className="mb-6 h-auto p-0 flex items-center gap-1.5 text-body text-muted-foreground transition-colors hover:text-foreground self-start"
        >
          <ChevronLeft className="h-4 w-4" />
          Family Members
        </Button>

        {/* Profile Header */}
        <div className="mb-6 flex items-center gap-4">
          <div
            className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full text-xl font-semibold"
            style={{ backgroundColor: colors.bg, color: colors.text }}
          >
            {member.avatar_url ? (
              <img src={member.avatar_url} className="h-20 w-20 rounded-full object-cover" alt={member.name} />
            ) : (
              getInitials(member.name)
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-detail-title text-foreground">
              {member.name}
            </h1>
            {member.patient_id && (
              <p className="mt-0.5 text-body text-muted-foreground">{member.patient_id}</p>
            )}
          </div>
          {member.relation !== 'self' && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {!isEditing ? (
                <>
                  <Button onClick={() => setIsEditing(true)}>
                    <Pencil className="h-4 w-4" />
                    Edit profile
                  </Button>
                  {canDelete && (
                    <Button
                      variant="secondary"
                      iconOnly
                      size="md"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button variant="secondary" onClick={handleCancel} disabled={saving}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save changes'}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Alert Banners */}
        {alerts && alerts.length > 0 && (
          <div className="mb-6 space-y-3">
            {alerts.map((alert) => (
              <AlertBanner key={`${alert.type}-${alert.id}`} alert={alert} />
            ))}
          </div>
        )}

        {/* Admin Profile Information */}
        {member.relation === 'self' && (
          <AlertComponent variant="info" className="mb-6">
            Your profile cannot be edited from Family Members.{' '}
            <Button
              variant="link"
              size="sm"
              onClick={() => router.visit('/settings#profile')}
              className="h-auto p-0 inline-flex items-center gap-1"
            >
              Edit Profile
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </AlertComponent>
        )}

        {/* Guest Information Message */}
        {member.is_guest && (
          <AlertComponent variant="warning" className="mb-6">
            Guest members have limited profile features. Only appointment booking is available.
          </AlertComponent>
        )}

        {/* Main Content with Side Nav */}
        <div className="flex gap-24">
          <MemberSideNav isGuest={!!member.is_guest} />
          <div className="flex-1 min-w-0 space-y-12 pb-12">
            {/* Personal Information Section */}
            <div id="personal" className="scroll-mt-6">
              <div className="flex items-center gap-2.5 mb-4">
                <Icon icon={User} className="h-5 w-5 text-foreground" />
                <h2 className="text-section-title text-foreground">
                  Personal Information
                </h2>
              </div>
              {!isEditing ? (
                <InfoCard
                  items={[
                    {
                      label: 'Name',
                      value: member.name,
                    },
                    {
                      label: 'Relationship',
                      value: member.relation ? capitalize(member.relation) : undefined,
                    },
                    {
                      label: 'Date of Birth',
                      value: member.date_of_birth_formatted ?? undefined,
                      subtitle: member.age ? `${member.age} years old` : undefined,
                    },
                    {
                      label: 'Gender',
                      value: member.gender ? capitalize(member.gender) : undefined,
                    },
                  ]}
                />
              ) : (
                <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                  <div>
                    <label className="mb-1.5 block text-label text-muted-foreground">
                      Name <span className="text-destructive">*</span>
                    </label>
                    <Input
                      value={formData.name}
                      onChange={e => {
                        setFormData({ ...formData, name: e.target.value });
                        if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
                      }}
                      placeholder="Full name"
                      className={cn(formErrors.name && 'border-destructive/30 focus-visible:ring-destructive/40')}
                    />
                    {formErrors.name && (
                      <p className="mt-1 text-body text-destructive">{formErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-label text-muted-foreground">
                      Relation <span className="text-destructive">*</span>
                    </label>
                    <Select
                      value={formData.relation}
                      onValueChange={val => {
                        setFormData({ ...formData, relation: val });
                        if (formErrors.relation) setFormErrors({ ...formErrors, relation: '' });
                      }}
                    >
                      <SelectTrigger className={cn(formErrors.relation && 'border-destructive/30')}>
                        <SelectValue placeholder="Select relation" />
                      </SelectTrigger>
                      <SelectContent>
                        {relationOptions.map(r => (
                          <SelectItem key={r} value={r}>{capitalize(r)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.relation && (
                      <p className="mt-1 text-body text-destructive">{formErrors.relation}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-label text-muted-foreground">Date of Birth</label>
                    <DatePicker
                      value={formData.date_of_birth}
                      onChange={(value) => setFormData({ ...formData, date_of_birth: value })}
                      max={new Date()}
                      placeholder="Select date of birth"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-label text-muted-foreground">Gender</label>
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
              )}
            </div>

            {/* Contact & Address Section */}
            <div id="contact" className="scroll-mt-6">
              <div className="flex items-center gap-2.5 mb-4">
                <Icon icon={Phone} className="h-5 w-5 text-foreground" />
                <h2 className="text-section-title text-foreground">
                  Contact & Address
                </h2>
              </div>
              {!isEditing ? (
                <InfoCard
                  items={[
                    {
                      label: 'Phone',
                      value: member.phone ?? undefined,
                    },
                    {
                      label: 'Email',
                      value: member.email ?? undefined,
                    },
                    {
                      label: 'Address',
                      value: member.full_address ?? undefined,
                    },
                  ]}
                />
              ) : (
                <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                  <div>
                    <label className="mb-1.5 block text-label text-muted-foreground">Phone</label>
                    <PhoneInput
                      value={formData.phone || ''}
                      onChange={value => setFormData({ ...formData, phone: value })}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-label text-muted-foreground">Email</label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-label text-muted-foreground">Address Line 1</label>
                    <Input
                      value={formData.address_line_1}
                      onChange={e => setFormData({ ...formData, address_line_1: e.target.value })}
                      placeholder="Street address"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-label text-muted-foreground">Address Line 2</label>
                    <Input
                      value={formData.address_line_2}
                      onChange={e => setFormData({ ...formData, address_line_2: e.target.value })}
                      placeholder="Landmark, area"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="mb-1.5 block text-label text-muted-foreground">State</label>
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
                    <div>
                      <label className="mb-1.5 block text-label text-muted-foreground">City</label>
                      <Select
                        value={formData.city}
                        onValueChange={(value: string) => setFormData({ ...formData, city: value })}
                        disabled={!formData.state}
                      >
                        <SelectTrigger className={cn(!formData.city && 'text-muted-foreground', !formData.state && 'opacity-50 cursor-not-allowed')}>
                          <SelectValue placeholder={formData.state ? "Select city" : "Select state first"} />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {availableCities.map((c: string) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-label text-muted-foreground">Pincode</label>
                      <Input
                        value={formData.pincode}
                        onChange={e => setFormData({ ...formData, pincode: e.target.value })}
                        placeholder="Pincode"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Health Information Section - Hidden for guests */}
            {!member.is_guest && (
              <div id="health-info" className="scroll-mt-6">
                <div className="flex items-center gap-2.5 mb-4">
                  <Icon icon={Heart} className="h-5 w-5 text-foreground" />
                  <h2 className="text-section-title text-foreground">
                    Health Information
                  </h2>
                </div>
                {!isEditing ? (
                  <InfoCard
                    items={[
                      {
                        label: 'Blood Group',
                        value: member.blood_group ?? undefined,
                      },
                      {
                        label: 'Primary Doctor',
                        value: member.primary_doctor_name ?? undefined,
                      },
                      {
                        label: 'Conditions',
                        value: member.medical_conditions.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {member.medical_conditions.map((c, i) => (
                              <Badge key={i} variant="neutral">{c}</Badge>
                            ))}
                          </div>
                        ) : undefined,
                      },
                      {
                        label: 'Allergies',
                        value: member.allergies.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {member.allergies.map((a, i) => (
                              <Badge key={i} variant="danger">{a}</Badge>
                            ))}
                          </div>
                        ) : undefined,
                      },
                    ]}
                  />
                ) : (
                  <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                    <div>
                      <label className="mb-1.5 block text-label text-muted-foreground">Blood Group</label>
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
                      <label className="mb-1.5 block text-label text-muted-foreground">Primary Doctor</label>
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
                              {d.name} — {d.specialization}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-label text-muted-foreground">Conditions</label>
                      <TagInput
                        tags={formData.medical_conditions}
                        onChange={tags => setFormData({ ...formData, medical_conditions: tags })}
                        placeholder="e.g. Diabetes, Hypertension"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-label text-muted-foreground">Allergies</label>
                      <TagInput
                        tags={formData.allergies}
                        onChange={tags => setFormData({ ...formData, allergies: tags })}
                        placeholder="e.g. Penicillin, Peanuts"
                        variant="danger"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Emergency Contact Section - Hidden for guests */}
            {!member.is_guest && (
              <div id="emergency" className="scroll-mt-6">
                {!isEditing ? (
                  <DetailSection id="emergency-contact" title="Emergency Contact" icon={Phone} noPadding>
                    {member.emergency_contact_name ? (
                      <div className="divide-y">
                        <DetailRow label="Name">{member.emergency_contact_name}</DetailRow>
                        {member.emergency_contact_relation && (
                          <DetailRow label="Relationship">{member.emergency_contact_relation}</DetailRow>
                        )}
                        {member.emergency_contact_phone && (
                          <DetailRow label="Phone">{member.emergency_contact_phone}</DetailRow>
                        )}
                      </div>
                    ) : (
                      <div className="px-6 py-12">
                        <EmptyState
                          icon={Phone}
                          message="No emergency contact added"
                          description="Add someone to contact in case of emergencies"
                          action={
                            <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
                              Add contact
                            </Button>
                          }
                        />
                      </div>
                    )}
                  </DetailSection>
                ) : (
                  <div>
                    <div className="flex items-center gap-2.5 mb-4">
                      <Icon icon={Phone} className="h-5 w-5 text-foreground" />
                      <h2 className="text-section-title text-foreground">
                        Emergency Contact
                      </h2>
                    </div>
                    <Card className="p-6 space-y-4">
                      <div>
                        <label className="mb-1.5 block text-label text-muted-foreground">Name</label>
                        <Input
                          value={formData.emergency_contact_name}
                          onChange={e => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                          placeholder="Emergency contact name"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-label text-muted-foreground">Relationship</label>
                        <Input
                          value={formData.emergency_contact_relation}
                          onChange={e => setFormData({ ...formData, emergency_contact_relation: e.target.value })}
                          placeholder="e.g., Spouse, Parent"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-label text-muted-foreground">Phone</label>
                        <PhoneInput
                          value={formData.emergency_contact_phone || ''}
                          onChange={value => setFormData({ ...formData, emergency_contact_phone: value })}
                        />
                      </div>
                    </Card>
                  </div>
                )}
              </div>
            )}

            {/* Health Data Links Section - Hidden for guests */}
            {!member.is_guest && (
              <DetailSection id="health" title="Health Data" icon={Activity} noPadding>
                <div className="divide-y">
                  {healthDataLinks.map((link, i) => (
                    <Button
                      key={i}
                      variant="ghost"
                      onClick={() => router.visit(link.href)}
                      className="w-full flex items-center gap-4 px-6 py-4 h-auto rounded-none text-left hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-icon-bg">
                        <link.icon className="h-5 w-5 text-icon" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-card-title text-foreground">{link.title}</p>
                        <p className="text-body text-muted-foreground">{link.subtitle}</p>
                      </div>
                      <Button variant="secondary" iconOnly size="md">
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </Button>
                  ))}
                </div>
              </DetailSection>
            )}
          </div>
        </div>
      </div>

      {/* Upgrade Confirmation Dialog */}
      <Dialog
        open={showUpgradeConfirm}
        onOpenChange={(open) => { if (!upgrading) setShowUpgradeConfirm(open); }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Upgrade {member.name}?</DialogTitle>
            <DialogDescription>
              This will convert this guest to a full family member with access to health records, billing, and all other features.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setShowUpgradeConfirm(false)}
              disabled={upgrading}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleUpgrade}
              disabled={upgrading}
            >
              {upgrading ? 'Upgrading...' : 'Upgrade'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteConfirm}
        onOpenChange={(open) => {
          if (!open) { setShowDeleteConfirm(false); setDeleteConfirmName(''); }
          else setShowDeleteConfirm(true);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle style={{ color: 'hsl(var(--destructive))' }}>Remove {member.name}?</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-4">
              <AlertComponent variant="error" title="This action cannot be undone">
                <p>This will permanently delete:</p>
                <ul className="mt-2 space-y-1 ml-4 list-disc">
                  <li>All health records and medical history</li>
                  <li>Past appointments and consultation notes</li>
                  <li>Billing and insurance claim records</li>
                  <li>Prescriptions and lab reports</li>
                </ul>
              </AlertComponent>
              <div>
                <label className="block text-label text-foreground mb-2">
                  Type <span className="font-semibold">{member.name}</span> to confirm
                </label>
                <Input
                  type="text"
                  value={deleteConfirmName}
                  onChange={(e) => setDeleteConfirmName(e.target.value)}
                  placeholder={`Type "${member.name}" to confirm`}
                  className="w-full"
                />
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setShowDeleteConfirm(false);
                setDeleteConfirmName('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleDelete}
              disabled={deleteConfirmName !== member.name}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </AppLayout>
  );
}
