import { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Badge } from '@/Components/ui/badge';
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
import { Plus, Pencil, Trash2, Users, AlertTriangle } from 'lucide-react';

/* ─── Types ─── */

interface FamilyMember {
  id: number;
  name: string;
  relation: string;
  age: number | null;
  gender: string | null;
  blood_group: string | null;
  avatar_url: string | null;
}

interface Props {
  members: FamilyMember[];
  canCreate: boolean;
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

const emptyForm = {
  name: '',
  relation: '',
  age: '',
  gender: '',
  blood_group: '',
};

/* ─── Component ─── */

export default function FamilyMembersIndex({ members, canCreate }: Props) {
  const { props } = usePage<{ toast?: string }>();

  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FamilyMember | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Auto-open form when ?create=1 is in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('create') === '1') {
      openAddForm();
      // Clean URL
      window.history.replaceState({}, '', '/family-members');
    }
  }, []);

  // Flash toast from server
  useEffect(() => {
    if (props.toast) {
      setToastMessage(props.toast);
    }
  }, [props.toast]);

  function openAddForm() {
    setEditingMember(null);
    setFormData(emptyForm);
    setFormErrors({});
    setShowForm(true);
  }

  function openEditForm(member: FamilyMember) {
    setEditingMember(member);
    setFormData({
      name: member.name,
      relation: member.relation,
      age: member.age?.toString() ?? '',
      gender: member.gender ?? '',
      blood_group: member.blood_group ?? '',
    });
    setFormErrors({});
    setShowForm(true);
  }

  function handleSubmit() {
    // Client-side validation
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.relation) errors.relation = 'Relation is required';
    if (formData.age && (isNaN(Number(formData.age)) || Number(formData.age) < 0 || Number(formData.age) > 150)) {
      errors.age = 'Age must be 0-150';
    }
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);

    const payload = {
      name: formData.name.trim(),
      relation: formData.relation,
      age: formData.age ? Number(formData.age) : null,
      gender: formData.gender || null,
      blood_group: formData.blood_group || null,
    };

    if (editingMember) {
      router.put(`/family-members/${editingMember.id}`, payload, {
        onSuccess: () => {
          setShowForm(false);
          setSubmitting(false);
        },
        onError: (errors) => {
          setFormErrors(errors as Record<string, string>);
          setSubmitting(false);
        },
      });
    } else {
      router.post('/family-members', payload, {
        onSuccess: () => {
          setShowForm(false);
          setSubmitting(false);
        },
        onError: (errors) => {
          setFormErrors(errors as Record<string, string>);
          setSubmitting(false);
        },
      });
    }
  }

  function handleDelete() {
    if (!deleteTarget) return;
    setSubmitting(true);
    router.delete(`/family-members/${deleteTarget.id}`, {
      onSuccess: () => {
        setDeleteTarget(null);
        setSubmitting(false);
      },
      onError: () => {
        setSubmitting(false);
      },
    });
  }

  const user = (usePage().props as any).auth?.user;

  return (
    <AppLayout
      user={user}
      pageTitle="Family Members"
      pageIcon="/assets/icons/family-selected.svg"
    >
      <div style={{ width: '100%', maxWidth: '738px', padding: '40px 0' }}>
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1
              className="font-bold"
              style={{
                fontSize: '36px',
                lineHeight: '44px',
                letterSpacing: '-1px',
                color: '#171717',
              }}
            >
              Family Members
            </h1>
            <p
              className="mt-1"
              style={{ fontSize: '14px', lineHeight: '20px', color: '#737373' }}
            >
              {members.length} {members.length === 1 ? 'member' : 'members'}
            </p>
          </div>
          {canCreate && (
            <Button
              onClick={openAddForm}
              className="gap-2"
              style={{ height: '36px', borderRadius: '10px' }}
            >
              <Plus className="h-4 w-4" />
              Add Member
            </Button>
          )}
        </div>

        {/* Card Grid or Empty State */}
        {members.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 py-16">
            <div
              className="mb-4 flex h-14 w-14 items-center justify-center rounded-full"
              style={{ backgroundColor: '#DBEAFE' }}
            >
              <Users className="h-7 w-7" style={{ color: '#1E40AF' }} />
            </div>
            <p className="mb-1 text-base font-semibold text-gray-900">No family members yet</p>
            <p className="mb-6 text-sm text-gray-500">Add your first family member to manage appointments for everyone.</p>
            <Button onClick={openAddForm} className="gap-2">
              <Plus className="h-4 w-4" />
              Add your first member
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {members.map(member => {
              const colors = relationColors[member.relation] || relationColors.other;
              const details: string[] = [];
              if (member.age != null) details.push(`${member.age} yrs`);
              if (member.gender) details.push(capitalize(member.gender));
              if (member.blood_group) details.push(member.blood_group);

              return (
                <div
                  key={member.id}
                  className="group relative flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-sm"
                >
                  {/* Avatar */}
                  <div
                    className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                    style={{ backgroundColor: colors.bg, color: colors.text }}
                  >
                    {getInitials(member.name)}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-gray-900">
                        {member.name}
                      </span>
                      <Badge
                        variant="secondary"
                        className="text-xs capitalize"
                        style={{
                          backgroundColor: colors.bg,
                          color: colors.text,
                          border: 'none',
                        }}
                      >
                        {member.relation}
                      </Badge>
                    </div>
                    {details.length > 0 && (
                      <p className="mt-1 text-xs text-gray-500">
                        {details.join(' \u00B7 ')}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => openEditForm(member)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    {member.relation !== 'self' && (
                      <button
                        onClick={() => setDeleteTarget(member)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Sheet */}
      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editingMember ? 'Edit Member' : 'Add Family Member'}</SheetTitle>
            <SheetDescription>
              {editingMember
                ? 'Update the details for this family member.'
                : 'Add a new family member to manage their appointments and health records.'}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-5">
            {/* Name */}
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

            {/* Relation */}
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

            {/* Age */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Age</label>
              <Input
                type="number"
                value={formData.age}
                onChange={e => setFormData({ ...formData, age: e.target.value })}
                placeholder="Age"
                min={0}
                max={150}
              />
              {formErrors.age && (
                <p className="mt-1 text-xs text-red-500">{formErrors.age}</p>
              )}
            </div>

            {/* Gender */}
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

            {/* Blood Group */}
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

            {/* Submit */}
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full"
              style={{ height: '40px', borderRadius: '10px' }}
            >
              {submitting
                ? 'Saving...'
                : editingMember
                  ? 'Update Member'
                  : 'Add Member'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Overlay */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">Remove family member?</h3>
            <p className="mt-1 text-sm text-gray-500">
              Are you sure you want to remove <strong>{deleteTarget.name}</strong>? This action cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setDeleteTarget(null)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleDelete}
                disabled={submitting}
              >
                {submitting ? 'Removing...' : 'Remove'}
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
