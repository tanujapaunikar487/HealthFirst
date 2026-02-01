import { useState } from 'react';
import { router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Card } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Toast } from '@/Components/ui/toast';
import {
  ArrowLeft,
  AlertTriangle,
  ChevronRight,
  Trash2,
} from 'lucide-react';

interface PolicyDetail {
  id: number;
  provider_name: string;
  provider_logo: string | null;
  plan_name: string;
  policy_number: string;
  plan_type: string;
  sum_insured: number;
  premium_amount: number | null;
  start_date_formatted: string;
  end_date_formatted: string;
  is_expiring_soon: boolean;
  days_until_expiry: number;
  metadata: {
    icu_limit?: string;
    copay?: string;
    tpa?: string;
    tpa_contact?: string;
  };
}

interface CoveredMember {
  id: number;
  name: string;
  relation: string;
}

interface PolicyClaim {
  id: number;
  claim_date_formatted: string | null;
  treatment_name: string;
  patient_name: string;
  claim_amount: number;
  status: string;
}

interface Props {
  policy: PolicyDetail;
  coveredMembers: CoveredMember[];
  claims: PolicyClaim[];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function getProviderInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function getMemberInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

const avatarColors = [
  { bg: '#DBEAFE', text: '#1E40AF' },
  { bg: '#FCE7F3', text: '#9D174D' },
  { bg: '#D1FAE5', text: '#065F46' },
  { bg: '#FEF3C7', text: '#92400E' },
  { bg: '#EDE9FE', text: '#5B21B6' },
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

function getStatusBadge(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    current: {
      label: 'In Treatment',
      className: 'bg-orange-100 text-orange-700 border-orange-200',
    },
    processing: {
      label: 'In Treatment',
      className: 'bg-orange-100 text-orange-700 border-orange-200',
    },
    settled: {
      label: 'Settled',
      className: 'bg-green-100 text-green-700 border-green-200',
    },
    approved: {
      label: 'Settled',
      className: 'bg-green-100 text-green-700 border-green-200',
    },
    rejected: {
      label: 'Rejected',
      className: 'bg-red-100 text-red-700 border-red-200',
    },
    pending: {
      label: 'Pending',
      className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    },
  };
  const entry = map[status] ?? map.pending;
  return (
    <Badge variant="outline" className={entry.className}>
      {entry.label}
    </Badge>
  );
}

export default function InsuranceShow({ policy, coveredMembers, claims }: Props) {
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const toast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
  };

  function handleDelete() {
    if (!window.confirm('Remove this policy? It can be re-added later.')) return;
    router.delete(`/insurance/${policy.id}`, {
      preserveScroll: true,
    });
  }

  const meta = policy.metadata;

  return (
    <AppLayout pageTitle="Insurance" pageIcon="insurance">
      <div className="mx-auto max-w-[960px] px-6 py-8">
        {/* Back link */}
        <button
          onClick={() => router.visit('/insurance')}
          className="mb-6 flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Insurance
        </button>

        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold"
              style={{ backgroundColor: '#BFDBFE', color: '#1E40AF' }}
            >
              {getProviderInitials(policy.provider_name)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{policy.plan_name}</h1>
              <p className="text-sm text-gray-500">{policy.provider_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button onClick={() => toast('Use for Admission coming soon')}>
              Use for Admission
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="text-gray-400 hover:text-red-500"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Expiry warning */}
        {policy.is_expiring_soon && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-semibold text-amber-800">
                Policy expires in {policy.days_until_expiry} days
              </p>
              <p className="text-xs text-amber-600">
                Valid until {policy.end_date_formatted}. Consider renewing soon.
              </p>
            </div>
          </div>
        )}

        {/* Policy Details */}
        <Card className="mb-6 p-0">
          <div className="border-b px-5 py-3.5" style={{ backgroundColor: '#FAFAFA' }}>
            <h2 className="text-sm font-semibold text-gray-900">Policy Details</h2>
          </div>
          <div className="px-5 py-4">
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500">Policy Number</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{policy.policy_number}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Valid</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {policy.start_date_formatted} &rarr; {policy.end_date_formatted}
                </p>
              </div>
              {meta.icu_limit && (
                <div>
                  <p className="text-xs font-medium text-gray-500">ICU Limit</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{meta.icu_limit}</p>
                </div>
              )}
              {meta.copay && (
                <div>
                  <p className="text-xs font-medium text-gray-500">Co-pay</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{meta.copay}</p>
                </div>
              )}
              {meta.tpa && (
                <div>
                  <p className="text-xs font-medium text-gray-500">TPA</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{meta.tpa}</p>
                </div>
              )}
              {meta.tpa_contact && (
                <div>
                  <p className="text-xs font-medium text-gray-500">TPA Contact</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{meta.tpa_contact}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-gray-500">Sum Insured</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {formatCurrency(policy.sum_insured)}
                </p>
              </div>
              {policy.premium_amount && (
                <div>
                  <p className="text-xs font-medium text-gray-500">Annual Premium</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {formatCurrency(policy.premium_amount)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Covered Members */}
        {coveredMembers.length > 0 && (
          <Card className="mb-6 p-0">
            <div className="border-b px-5 py-3.5" style={{ backgroundColor: '#FAFAFA' }}>
              <h2 className="text-sm font-semibold text-gray-900">Covered Members</h2>
            </div>
            <div className="px-5 py-4">
              <div className="flex flex-wrap gap-3">
                {coveredMembers.map((member) => {
                  const color = getAvatarColor(member.name);
                  return (
                    <div
                      key={member.id}
                      className="flex items-center gap-2.5 rounded-full border px-3 py-1.5"
                    >
                      <div
                        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
                        style={{ backgroundColor: color.bg, color: color.text }}
                      >
                        {getMemberInitials(member.name)}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{member.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        )}

        {/* Claims at This Hospital */}
        <div>
          <h2 className="mb-4 text-sm font-semibold text-gray-500">Claims at This Hospital</h2>
          {claims.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-12">
              <p className="mb-1 text-sm font-medium text-gray-600">No claims yet</p>
              <p className="max-w-xs text-center text-xs text-gray-400">
                Claims appear here when you use this policy for hospital admissions.
              </p>
            </div>
          ) : (
            <Card className="divide-y p-0">
              {claims.map((claim) => (
                <button
                  key={claim.id}
                  className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-gray-50"
                  onClick={() => toast('Claim detail coming soon')}
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">
                        Claim #{claim.id}
                      </span>
                      {getStatusBadge(claim.status)}
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{claim.treatment_name}</p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {claim.patient_name}
                      {claim.claim_date_formatted && ` \u00B7 ${claim.claim_date_formatted}`}
                    </p>
                  </div>
                  <ChevronRight className="ml-3 h-4 w-4 flex-shrink-0 text-gray-400" />
                </button>
              ))}
            </Card>
          )}
        </div>
      </div>

      <Toast message={toastMessage} show={showToast} onHide={() => setShowToast(false)} />
    </AppLayout>
  );
}
