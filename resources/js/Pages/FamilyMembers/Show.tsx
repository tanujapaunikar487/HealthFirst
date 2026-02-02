import { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Pulse, ErrorState, useSkeletonLoading } from '@/Components/ui/skeleton';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { PhoneInput } from '@/Components/ui/phone-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/Components/ui/sheet';
import { Toast } from '@/Components/ui/toast';
import { cn } from '@/Lib/utils';
import {
  ArrowLeft,
  Pencil,
  AlertTriangle,
  Stethoscope,
  FileText,
  Pill,
  ChevronRight,
  Trash2,
  X,
  UserPlus,
} from '@/Lib/icons';

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

interface Props {
  member: Member;
  doctors: DoctorOption[];
  hasAlerts: boolean;
  alertType: string;
}

/* ─── Constants ─── */

const relationOptions = [
  'self', 'mother', 'father', 'brother', 'sister',
  'spouse', 'son', 'daughter', 'grandmother', 'grandfather', 'other',
] as const;

const genderOptions = ['male', 'female', 'other'] as const;

const bloodGroupOptions = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

const relationColors: Record<string, { bg: string; text: string }> = {
  self:        { bg: '#DBEAFE', text: '#1E40AF' },
  mother:      { bg: '#FCE7F3', text: '#9D174D' },
  father:      { bg: '#E0E7FF', text: '#3730A3' },
  brother:     { bg: '#DCFCE7', text: '#166534' },
  sister:      { bg: '#F3E8FF', text: '#6B21A8' },
  spouse:      { bg: '#FFE4E6', text: '#9F1239' },
  son:         { bg: '#CCFBF1', text: '#115E59' },
  daughter:    { bg: '#FEF3C7', text: '#92400E' },
  grandmother: { bg: '#FFEDD5', text: '#9A3412' },
  grandfather: { bg: '#E2E8F0', text: '#334155' },
  other:       { bg: '#F3F4F6', text: '#374151' },
};

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

  return (
    <div>
      {tags.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
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
          variant="outline"
          size="sm"
          onClick={addTag}
          disabled={!inputValue.trim()}
        >
          Add
        </Button>
      </div>
    </div>
  );
}

/* ─── Skeleton ─── */

function FamilyMemberShowSkeleton() {
  return (
    <div className="w-full max-w-[800px] px-4 sm:px-6" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
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
  hasAlerts,
  alertType,
}: Props) {
  const { isLoading, hasError, retry } = useSkeletonLoading(member);
  const { props } = usePage<{ toast?: string }>();
  const user = (usePage().props as any).auth?.user;

  const [showEditForm, setShowEditForm] = useState(false);
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
    email: (member as any)?.email ?? '',
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
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (props.toast) {
      setToastMessage(props.toast);
    }
  }, [props.toast]);

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

  function openEditForm() {
    setFormData({
      name: member.name,
      relation: member.relation,
      date_of_birth: member.date_of_birth ?? '',
      gender: member.gender ?? '',
      blood_group: member.blood_group ?? '',
      phone: member.phone ?? '',
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
    setShowEditForm(true);
  }

  function handleSubmit() {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.relation) errors.relation = 'Relation is required';
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);

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
      onSuccess: () => {
        setShowEditForm(false);
        setSubmitting(false);
      },
      onError: (errors) => {
        setFormErrors(errors as Record<string, string>);
        setSubmitting(false);
      },
    });
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
        setToastMessage('Successfully upgraded to family member!');
      },
      onError: () => {
        setUpgrading(false);
        setToastMessage('Failed to upgrade. Please try again.');
      },
    });
  }

  const colors = relationColors[member.relation] || relationColors.other;

  const personalInfoFields = [
    { label: 'Date of Birth', value: member.date_of_birth_formatted },
    { label: 'Blood Group', value: member.blood_group },
    { label: 'Phone', value: member.phone },
    { label: 'Address', value: member.full_address },
    { label: 'Primary Doctor', value: member.primary_doctor_name },
    { label: 'Relationship', value: member.relation ? capitalize(member.relation) : null },
  ];

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
      title: 'Medications',
      subtitle: 'Prescriptions and refills',
      icon: Pill,
      href: `/health-records?member=${member.id}&category=medication_active,medication_past`,
    },
  ];

  return (
    <AppLayout
      user={user}
      pageTitle={member.name}
      pageIcon="/assets/icons/family-selected.svg"
    >
      <div className="w-full max-w-[800px] px-4 sm:px-6" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
        {/* Back Navigation */}
        <button
          onClick={() => router.visit('/family-members')}
          className="mb-6 flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Family Members
        </button>

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
            <h1
              className="font-bold"
              style={{
                fontSize: '28px',
                lineHeight: '36px',
                letterSpacing: '-0.5px',
                color: '#171717',
              }}
            >
              {member.name}
            </h1>
            {member.patient_id && (
              <p className="mt-0.5 text-sm text-gray-500">{member.patient_id}</p>
            )}
          </div>
          <Button
            variant="outline"
            onClick={openEditForm}
            className="flex-shrink-0"
          >
            <Pencil className="h-4 w-4" />
            Edit Profile
          </Button>
        </div>

        {/* Alert Banner */}
        {hasAlerts && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </div>
            <p className="flex-1 text-sm font-medium text-amber-800">
              {alertType} needs attention
            </p>
            <button
              onClick={() => router.visit(`/health-records?member=${member.id}&status=needs_attention`)}
              className="flex items-center gap-1 text-sm font-medium text-amber-700 hover:text-amber-900"
            >
              View records
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Personal Information Card */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              {personalInfoFields.map((field, i) => (
                <div key={i} className={field.label === 'Address' ? 'col-span-2' : ''}>
                  <p className="text-xs font-medium text-gray-500">{field.label}</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {field.value ?? '--'}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Medical Conditions Card - Hidden for guests */}
        {!member.is_guest && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Medical Information</CardTitle>
            </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-xs font-medium text-gray-500">Conditions</p>
                {member.medical_conditions.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {member.medical_conditions.map((c, i) => (
                      <Badge key={i} variant="secondary">{c}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No conditions recorded</p>
                )}
              </div>
              <div>
                <p className="mb-2 text-xs font-medium text-gray-500">Allergies</p>
                {member.allergies.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {member.allergies.map((a, i) => (
                      <Badge key={i} variant="destructive">{a}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No allergies recorded</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        )}

        {/* Emergency Contact Card - Hidden for guests */}
        {!member.is_guest && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Emergency Contact</CardTitle>
          </CardHeader>
          <CardContent>
            {member.emergency_contact_name ? (
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600"
                >
                  {getInitials(member.emergency_contact_name)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{member.emergency_contact_name}</p>
                  <p className="text-xs text-gray-500">
                    {member.emergency_contact_relation}
                    {member.emergency_contact_phone ? ` · ${member.emergency_contact_phone}` : ''}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-200 py-6">
                <p className="text-sm text-gray-400">No emergency contact added</p>
              </div>
            )}
          </CardContent>
        </Card>
        )}

        {/* Health Data Links - Hidden for guests */}
        {!member.is_guest && (
        <div className="mb-8 grid grid-cols-3 gap-4">
          {healthDataLinks.map((link, i) => (
            <div
              key={i}
              onClick={() => router.visit(link.href)}
              className="cursor-pointer rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50"
            >
              <div
                className="mb-3 flex h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: '#BFDBFE' }}
              >
                <link.icon className="h-5 w-5" style={{ color: '#1E40AF' }} />
              </div>
              <p className="text-sm font-semibold text-gray-900">{link.title}</p>
              <p className="mt-0.5 text-xs text-gray-500">{link.subtitle}</p>
            </div>
          ))}
        </div>
        )}

        {/* Guest Information Message */}
        {member.is_guest && (
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                Guest members have limited profile features. Only appointment booking is available.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Sheet */}
      <Sheet open={showEditForm} onOpenChange={setShowEditForm}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Profile</SheetTitle>
            <SheetDescription>
              Update details for {member.name}.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Basic Info</p>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.name}
                    onChange={e => {
                      setFormData({ ...formData, name: e.target.value });
                      if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
                    }}
                    placeholder="Full name"
                    className={cn(formErrors.name && 'border-red-300 focus-visible:ring-red-400')}
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Relation <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={formData.relation}
                    onValueChange={val => {
                      setFormData({ ...formData, relation: val });
                      if (formErrors.relation) setFormErrors({ ...formErrors, relation: '' });
                    }}
                  >
                    <SelectTrigger className={cn(formErrors.relation && 'border-red-300')}>
                      <SelectValue placeholder="Select relation" />
                    </SelectTrigger>
                    <SelectContent>
                      {relationOptions.map(r => (
                        <SelectItem key={r} value={r}>{capitalize(r)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.relation && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.relation}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Date of Birth</label>
                  <Input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={e => setFormData({ ...formData, date_of_birth: e.target.value })}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Gender</label>
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

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Blood Group</label>
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
              </div>
            </div>

            {/* Contact */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Contact</p>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Phone</label>
                  <PhoneInput
                    value={formData.phone || ''}
                    onChange={value => setFormData({ ...formData, phone: value })}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Address</p>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Address Line 1</label>
                  <Input
                    value={formData.address_line_1}
                    onChange={e => setFormData({ ...formData, address_line_1: e.target.value })}
                    placeholder="Street address"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Address Line 2</label>
                  <Input
                    value={formData.address_line_2}
                    onChange={e => setFormData({ ...formData, address_line_2: e.target.value })}
                    placeholder="Landmark, area"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">City</label>
                    <Input
                      value={formData.city}
                      onChange={e => setFormData({ ...formData, city: e.target.value })}
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">State</label>
                    <Input
                      value={formData.state}
                      onChange={e => setFormData({ ...formData, state: e.target.value })}
                      placeholder="State"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Pincode</label>
                    <Input
                      value={formData.pincode}
                      onChange={e => setFormData({ ...formData, pincode: e.target.value })}
                      placeholder="Pincode"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Primary Doctor */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Primary Doctor</p>
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

            {/* Medical */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Medical</p>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Conditions</label>
                  <TagInput
                    tags={formData.medical_conditions}
                    onChange={tags => setFormData({ ...formData, medical_conditions: tags })}
                    placeholder="e.g. Diabetes, Hypertension"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Allergies</label>
                  <TagInput
                    tags={formData.allergies}
                    onChange={tags => setFormData({ ...formData, allergies: tags })}
                    placeholder="e.g. Penicillin, Peanuts"
                    variant="destructive"
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Emergency Contact</p>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Contact Name</label>
                  <Input
                    value={formData.emergency_contact_name}
                    onChange={e => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Contact Relation</label>
                  <Input
                    value={formData.emergency_contact_relation}
                    onChange={e => setFormData({ ...formData, emergency_contact_relation: e.target.value })}
                    placeholder="e.g. Spouse, Parent"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Contact Phone</label>
                  <PhoneInput
                    value={formData.emergency_contact_phone || ''}
                    onChange={value => setFormData({ ...formData, emergency_contact_phone: value })}
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Upgrade Confirmation Overlay */}
      {showUpgradeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !upgrading && setShowUpgradeConfirm(false)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <UserPlus className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="mb-1 text-lg font-semibold text-gray-900">Upgrade {member.name}?</h3>
            <p className="mb-6 text-sm text-gray-500">
              This will convert this guest to a full family member with access to health records, billing, and all other features.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowUpgradeConfirm(false)}
                disabled={upgrading}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                className="flex-1"
                onClick={handleUpgrade}
                disabled={upgrading}
              >
                {upgrading ? 'Upgrading...' : 'Upgrade'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Overlay */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              setShowDeleteConfirm(false);
              setDeleteConfirmName('');
            }}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Remove {member.name}?</h3>
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-800 font-medium mb-2">
                ⚠️ This action cannot be undone
              </p>
              <p className="text-sm text-red-700">
                This will permanently delete:
              </p>
              <ul className="mt-2 text-sm text-red-700 space-y-1 ml-4 list-disc">
                <li>All health records and medical history</li>
                <li>Past appointments and consultation notes</li>
                <li>Billing and insurance claim records</li>
                <li>Prescriptions and lab reports</li>
              </ul>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
            <div className="flex gap-3">
              <Button
                variant="outline"
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
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <Toast
        message={toastMessage}
        show={!!toastMessage}
        onHide={() => setToastMessage('')}
      />
    </AppLayout>
  );
}
