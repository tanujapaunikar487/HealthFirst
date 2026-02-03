import { useState, useEffect, useMemo, useRef } from 'react';
import { router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Pulse, ErrorState, useSkeletonLoading } from '@/Components/ui/skeleton';
import { EmptyState } from '@/Components/ui/empty-state';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Card, CardContent } from '@/Components/ui/card';
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
  SheetFooter,
  SheetDivider,
} from '@/Components/ui/sheet';
import { Toast } from '@/Components/ui/toast';
import { cn } from '@/Lib/utils';
import { INDIAN_STATES, getCitiesForState } from '@/Lib/locations';
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
  Receipt,
  ShieldAlert,
  User,
  Heart,
  Phone,
  Activity,
} from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';

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

/* ─── Sections Config ─── */

const SECTIONS = [
  { id: 'personal', label: 'Personal', icon: User },
  { id: 'medical', label: 'Medical', icon: Heart },
  { id: 'emergency', label: 'Emergency', icon: Phone },
  { id: 'health', label: 'Health Data', icon: Activity },
] as const;

/* ─── SideNav Component ─── */

function SideNav({ isGuest }: { isGuest: boolean }) {
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
  const isScrollingRef = useRef(false);

  // Filter sections for guests (only show personal)
  const visibleSections = isGuest
    ? SECTIONS.filter((s) => s.id === 'personal')
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
    <div className="w-48 flex-shrink-0">
      <div className="sticky top-6 space-y-1">
        {visibleSections.map(({ id, label, icon: SectionIcon }) => {
          const isActive = activeSection === id;
          return (
            <button
              type="button"
              key={id}
              onClick={() => scrollTo(id)}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2 text-sm font-semibold transition-all text-left rounded-full cursor-pointer',
                isActive
                  ? 'bg-[#F5F8FF] text-[#0052FF]'
                  : 'text-[#0A0B0D] hover:bg-muted'
              )}
            >
              <Icon icon={SectionIcon} className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Section Component ─── */

function Section({
  id,
  title,
  icon: SectionIcon,
  children,
  noPadding,
}: {
  id: string;
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  noPadding?: boolean;
}) {
  return (
    <div id={id} className="scroll-mt-24">
      <div className="flex items-center gap-2.5 mb-4">
        <Icon icon={SectionIcon} className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold" style={{ color: '#00184D' }}>
          {title}
        </h2>
      </div>
      <Card className={noPadding ? '' : 'p-6'}>{children}</Card>
    </div>
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

// Alert banner icon mapping
function getAlertIcon(type: Alert['type']) {
  switch (type) {
    case 'health_record':
      return <AlertTriangle className="h-4 w-4 text-amber-600" />;
    case 'billing':
      return <Receipt className="h-4 w-4 text-red-600" />;
    case 'insurance':
      return <ShieldAlert className="h-4 w-4 text-orange-600" />;
  }
}

// Alert banner color mapping
function getAlertColors(type: Alert['type']) {
  switch (type) {
    case 'health_record':
      return {
        border: 'border-amber-200',
        bg: 'bg-amber-50',
        iconBg: 'bg-amber-100',
        text: 'text-amber-800',
        button: 'text-amber-700 hover:text-amber-900',
      };
    case 'billing':
      return {
        border: 'border-red-200',
        bg: 'bg-red-50',
        iconBg: 'bg-red-100',
        text: 'text-red-800',
        button: 'text-red-700 hover:text-red-900',
      };
    case 'insurance':
      return {
        border: 'border-orange-200',
        bg: 'bg-orange-50',
        iconBg: 'bg-orange-100',
        text: 'text-orange-800',
        button: 'text-orange-700 hover:text-orange-900',
      };
  }
}

function AlertBanner({ alert }: { alert: Alert }) {
  const colors = getAlertColors(alert.type);

  return (
    <div className={cn(
      'flex items-center gap-3 rounded-xl border px-4 py-3',
      colors.border,
      colors.bg
    )}>
      <div className={cn(
        'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full',
        colors.iconBg
      )}>
        {getAlertIcon(alert.type)}
      </div>
      <div className="flex-1">
        <p className={cn('text-sm font-medium', colors.text)}>
          {alert.message}
        </p>
        {alert.details && (
          <p className={cn('text-xs mt-0.5', colors.text, 'opacity-80')}>
            {alert.details}
          </p>
        )}
      </div>
      <button
        onClick={() => router.visit(alert.url)}
        className={cn(
          'flex items-center gap-1 text-sm font-medium',
          colors.button
        )}
      >
        View details
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
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
    <div className="w-full max-w-[960px]" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
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
      subtitle: 'Active and past medications',
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
      <div className="w-full max-w-[960px]" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
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
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="outline"
              onClick={openEditForm}
            >
              <Pencil className="h-4 w-4" />
              Edit Profile
            </Button>
            {canDelete && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowDeleteConfirm(true)}
                className="h-10 w-10 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Alert Banners */}
        {alerts && alerts.length > 0 && (
          <div className="mb-6 space-y-3">
            {alerts.map((alert) => (
              <AlertBanner key={`${alert.type}-${alert.id}`} alert={alert} />
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

        {/* Main Content with Side Nav */}
        <div className="flex gap-8">
          <SideNav isGuest={!!member.is_guest} />
          <div className="flex-1 min-w-0 space-y-8 pb-12">
            {/* Personal Information Section */}
            <Section id="personal" title="Personal Information" icon={User}>
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
            </Section>

            {/* Medical Information Section - Hidden for guests */}
            {!member.is_guest && (
              <Section id="medical" title="Medical Information" icon={Heart}>
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
                      <EmptyState
                        icon={Stethoscope}
                        message="No conditions recorded"
                        description="Add any medical conditions for better care coordination"
                        action={
                          <Button variant="outline" size="sm" onClick={() => setShowEditSheet(true)}>
                            Add Conditions
                          </Button>
                        }
                      />
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
                      <EmptyState
                        icon={AlertTriangle}
                        message="No known allergies"
                        description="Recording allergies helps prevent adverse reactions"
                        action={
                          <Button variant="outline" size="sm" onClick={() => setShowEditSheet(true)}>
                            Add Allergies
                          </Button>
                        }
                      />
                    )}
                  </div>
                </div>
              </Section>
            )}

            {/* Emergency Contact Section - Hidden for guests */}
            {!member.is_guest && (
              <Section id="emergency" title="Emergency Contact" icon={Phone}>
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
                  <EmptyState
                    icon={Phone}
                    message="No emergency contact added"
                    description="Add someone to contact in case of emergencies"
                    action={
                      <Button variant="outline" size="sm" onClick={() => setShowEditSheet(true)}>
                        Add Contact
                      </Button>
                    }
                  />
                )}
              </Section>
            )}

            {/* Health Data Links Section - Hidden for guests */}
            {!member.is_guest && (
              <Section id="health" title="Health Data" icon={Activity} noPadding>
                <div className="divide-y">
                  {healthDataLinks.map((link, i) => (
                    <button
                      key={i}
                      onClick={() => router.visit(link.href)}
                      className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-muted/30 transition-colors"
                    >
                      <div
                        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
                        style={{ backgroundColor: '#BFDBFE' }}
                      >
                        <link.icon className="h-5 w-5" style={{ color: '#1E40AF' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{link.title}</p>
                        <p className="text-xs text-gray-500">{link.subtitle}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </Section>
            )}
          </div>
        </div>
      </div>

      {/* Edit Sheet */}
      <Sheet open={showEditForm} onOpenChange={setShowEditForm}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit Profile</SheetTitle>
            <SheetDescription>
              Update details for {member.name}.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto -mx-6 px-6">
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

            <SheetDivider className="my-6" />

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

            <SheetDivider className="my-6" />

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
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">State</label>
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
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">City</label>
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

            <SheetDivider className="my-6" />

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

            <SheetDivider className="my-6" />

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

            <SheetDivider className="my-6" />

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

          </div>

          <SheetFooter>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </SheetFooter>
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
