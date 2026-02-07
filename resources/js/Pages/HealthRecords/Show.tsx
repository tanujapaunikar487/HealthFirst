import { Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { DetailSection } from '@/Components/ui/detail-section';
import { DetailRow } from '@/Components/ui/detail-row';
import { Toast } from '@/Components/ui/toast';
import { SideNav } from '@/Components/SideNav';
import { MetaCard } from '@/Components/ui/meta-card';
import { LinkedAppointment } from '@/Components/ui/linked-appointment';
import { SourceSection } from '@/Components/ui/source-section';
import { ActionFooter } from '@/Components/ui/action-footer';
import { useFormatPreferences } from '@/Hooks/useFormatPreferences';
import { cn } from '@/Lib/utils';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import {
  ChevronLeft,
  Download,
  Share2,
  MoreHorizontal,
  FileText,
  ExternalLink,
  HeartPulse,
  User,
  Pencil,
  ShieldCheck,
} from '@/Lib/icons';
import { downloadAsHtml } from '@/Lib/download';
import { generateHealthRecordPdfContent, escapeHtml } from '@/Lib/pdf-content';
import { ShareDialog } from '@/Components/ui/share-dialog';

import type { Props, CategorySection, RecordMetadata } from './types';
import { categoryConfig } from './constants';

// Category section imports
import { getLabReportSections } from './sections/lab-report';
import { getImagingSections } from './sections/imaging-report';
import { getCardiacSections } from './sections/cardiac-report';
import { getPathologySections } from './sections/pathology-report';
import { getPftSections } from './sections/pft-report';
import { getPrescriptionSections } from './sections/prescription';
import { getConsultationSections } from './sections/consultation';
import { getProcedureSections } from './sections/procedure';
import { getDischargeSections } from './sections/discharge';
import { getErVisitSections } from './sections/er-visit';
import { getVaccinationSections } from './sections/vaccination';
import { getMedicalCertificateSections } from './sections/medical-certificate';
import { getDocumentSections } from './sections/document';
import { getReferralSections } from './sections/referral';
import { getOtherVisitSections } from './sections/other-visit';

/* ─── Helpers ─── */

function CategoryIcon({ category, size = 'md' }: { category: string; size?: 'sm' | 'md' | 'lg' }) {
  const config = categoryConfig[category] || { icon: FileText, color: 'hsl(var(--muted-foreground))', bg: 'hsl(var(--secondary))' };
  const Icon = config.icon;
  const dims = { sm: 'h-10 w-10', md: 'h-12 w-12', lg: 'h-14 w-14' };
  const iconDims = { sm: 'h-5 w-5', md: 'h-6 w-6', lg: 'h-7 w-7' };
  return (
    <div
      className={cn(dims[size], 'rounded-full flex items-center justify-center flex-shrink-0')}
      style={{ backgroundColor: config.bg }}
    >
      <Icon className={iconDims[size]} style={{ color: config.color }} />
    </div>
  );
}

function StatusBadge({ status }: { status: { label: string; variant: string } }) {
  const variantMap: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'neutral'> = {
    success: 'success',
    info: 'info',
    warning: 'warning',
    destructive: 'danger',
    secondary: 'neutral',
  };
  return <Badge variant={variantMap[status.variant] || 'neutral'}>{status.label}</Badge>;
}

/* ─── Side Navigation ─── */

function RecordSideNav({ items }: { items: { id: string; label: string; icon: React.ElementType }[] }) {
  const [activeSection, setActiveSection] = useState(items[0]?.id || 'meta');
  const isScrollingRef = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
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

    items.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  const scrollTo = (id: string) => {
    isScrollingRef.current = true;
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => {
      isScrollingRef.current = false;
    }, 1000);
  };

  return (
    <SideNav
      items={items.map(s => ({ id: s.id, label: s.label, icon: s.icon }))}
      activeId={activeSection}
      onSelect={scrollTo}
      hiddenOnMobile
    />
  );
}

/* ─── Section alias (noPadding by default — rows handle own px-6 py-4) ─── */

function Section({
  id,
  title,
  icon,
  children,
  action,
  noPadding = true,
}: {
  id: string;
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  action?: React.ReactNode;
  noPadding?: boolean;
}) {
  return (
    <DetailSection id={id} title={title} icon={icon} action={action} noPadding={noPadding}>
      {children}
    </DetailSection>
  );
}

/* ─── Category Section Router ─── */

function getCategorySections(
  category: string,
  meta: RecordMetadata,
  record: { file_url?: string | null; file_type?: string | null; doctor_name?: string | null },
): CategorySection[] {
  switch (category) {
    case 'lab_report': return getLabReportSections(meta);
    case 'xray_report':
    case 'mri_report':
    case 'ultrasound_report': return getImagingSections(meta, category);
    case 'ecg_report': return getCardiacSections(meta);
    case 'pathology_report': return getPathologySections(meta);
    case 'pft_report': return getPftSections(meta);
    case 'prescription':
    case 'medication_active':
    case 'medication_past': return getPrescriptionSections(meta, category);
    case 'consultation_notes': return getConsultationSections(meta);
    case 'procedure_notes': return getProcedureSections(meta);
    case 'discharge_summary': return getDischargeSections(meta);
    case 'er_visit': return getErVisitSections(meta);
    case 'vaccination': return getVaccinationSections(meta);
    case 'medical_certificate': return getMedicalCertificateSections(meta);
    case 'document':
    case 'other_report': return getDocumentSections(meta, record.file_url, record.file_type);
    case 'referral': return getReferralSections(meta, record.doctor_name);
    case 'other_visit': return getOtherVisitSections(meta);
    default: return [];
  }
}

/* ─── Main Page Component ─── */

export default function Show({ user, record, familyMember }: Props) {
  const { formatDate } = useFormatPreferences();
  const [toastMessage, setToastMessage] = useState('');
  const [showShareDialog, setShowShareDialog] = useState(false);
  const toast = (msg: string) => setToastMessage(msg);

  // AI Summary state
  const [aiSummary, setAiSummary] = useState<string | null>(record.metadata?.ai_summary || null);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiSummaryError, setAiSummaryError] = useState<string | null>(null);
  const [, setSummaryGeneratedAt] = useState<string | null>(
    record.metadata?.ai_summary_generated_at || null
  );

  const generateAiSummary = useCallback(async (regenerate = false) => {
    setAiSummaryLoading(true);
    setAiSummaryError(null);

    try {
      const response = await fetch(`/health-records/${record.id}/summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({ regenerate }),
      });

      const data = await response.json();

      if (data.success) {
        setAiSummary(data.summary);
        setSummaryGeneratedAt(data.generated_at);
        if (!data.cached) {
          toast('AI summary generated');
        }
      } else {
        setAiSummaryError(data.error || 'Failed to generate summary');
      }
    } catch {
      setAiSummaryError('Unable to connect to the AI service. Please try again.');
    } finally {
      setAiSummaryLoading(false);
    }
  }, [record.id]);

  // Auto-generate summary on page load if no cached summary exists
  useEffect(() => {
    if (!aiSummary && !aiSummaryLoading && !aiSummaryError) {
      generateAiSummary();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const config = categoryConfig[record.category] || { label: record.category, icon: FileText, color: 'hsl(var(--muted-foreground))', bg: 'hsl(var(--secondary))' };

  const handleDownload = () => {
    const pdfContent = generateHealthRecordPdfContent(record, aiSummary || undefined);

    downloadAsHtml(
      `${record.category}-${record.id}.pdf`,
      `<h1>${escapeHtml(record.title)}</h1>
       <p class="subtitle">${escapeHtml(record.record_date_formatted)} &middot; ${escapeHtml(config.label)}</p>
       ${record.description ? `<p>${escapeHtml(record.description)}</p>` : ''}
       ${pdfContent}`
    );
    toast('Record downloaded');
  };

  const handleShare = () => {
    setShowShareDialog(true);
  };

  const getHealthSyncLabel = () => {
    const userAgent = navigator.userAgent || '';
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);
    if (isIOS) return 'Add to Apple Health';
    if (isAndroid) return 'Add to Google Fit';
    return 'Add to Health App';
  };

  const handleHealthSync = () => {
    const userAgent = navigator.userAgent || '';
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);

    if (isIOS) {
      toast('Opening Apple Health...');
    } else if (isAndroid) {
      toast('Opening Google Fit...');
    } else {
      toast('Health sync is available on mobile devices');
    }
  };

  const handleRequestAmendment = () => {
    toast('Amendment request submitted. You will be contacted within 48 hours.');
  };

  const meta = record.metadata || {};
  const source = meta.source || meta.facility;

  const categorySections = getCategorySections(record.category, meta, record);

  // Build nav items
  const navItems = [
    ...categorySections.map(s => ({ id: s.id, label: s.title, icon: s.icon })),
    { id: 'patient', label: 'Patient', icon: User },
  ];

  return (
    <AppLayout user={user} pageTitle="Health Records" pageIcon="/assets/icons/records.svg">
      <div className="w-full max-w-page min-h-full flex flex-col pb-10">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/health-records"
            className="inline-flex items-center gap-1 text-body text-muted-foreground hover:text-foreground mb-4"
          >
            <ChevronLeft className="h-4 w-4" />
            Health Records
          </Link>

          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <CategoryIcon category={record.category} size="lg" />
              <div>
                <div className="flex items-center gap-3 mb-1">
                  {record.status && <StatusBadge status={record.status} />}
                  <Badge variant="info">
                    {config.label}
                  </Badge>
                </div>
                <h1 className="text-detail-title text-foreground">
                  {record.title}
                </h1>
                <p className="text-body text-muted-foreground mt-1">
                  {formatDate(record.record_date)}
                  {record.doctor_name && ` · ${record.doctor_name}`}
                  {record.department_name && ` · ${record.department_name}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {record.file_type && (
                <Button onClick={handleDownload}>
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" iconOnly size="md">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {record.appointment_id && (
                    <DropdownMenuItem asChild>
                      <Link href={`/appointments/${record.appointment_id}`} className="flex items-center">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Appointment
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleShare}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                  {!record.file_type && (
                    <DropdownMenuItem onClick={handleDownload}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </DropdownMenuItem>
                  )}
                  {['lab_report', 'vitals', 'immunization'].includes(record.category) && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleHealthSync}>
                        <HeartPulse className="h-4 w-4 mr-2" />
                        {getHealthSyncLabel()}
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleRequestAmendment}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Request Amendment
                  </DropdownMenuItem>
                  {record.insurance_claim_id && (
                    <DropdownMenuItem asChild>
                      <Link href={`/insurance/claims/${record.insurance_claim_id}`} className="flex items-center">
                        <ShieldCheck className="h-4 w-4 mr-2" />
                        View Insurance Claim
                      </Link>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Main Content with Side Nav */}
        <div className="flex gap-24">
          <RecordSideNav items={navItems} />
          <div className="flex-1 min-w-0 space-y-12 pb-12">

            {/* Meta Card */}
            <div id="meta" className="scroll-mt-6">
              <MetaCard
                categoryIcon={<CategoryIcon category={record.category} />}
                categoryLabel={config.label}
                date={formatDate(record.record_date)}
                doctorName={record.doctor_name}
                departmentName={record.department_name}
                status={record.status}
                familyMemberName={familyMember?.name}
              />
            </div>

            {/* Linked Appointment */}
            {record.appointment_id && (
              <LinkedAppointment
                appointmentId={record.appointment_id}
                date={formatDate(record.record_date)}
                doctorName={record.doctor_name || undefined}
              />
            )}

            {/* Source */}
            {source && (
              <SourceSection
                name={source.name}
                location={source.location}
              />
            )}

            {/* Category-specific sections */}
            {categorySections.map(section => (
              <Section key={section.id} id={section.id} title={section.title} icon={section.icon} action={section.action}>
                {section.content}
              </Section>
            ))}

            {/* Patient Section */}
            <Section id="patient" title="Patient" icon={User}>
              <div className="divide-y">
                <DetailRow label="Name">{familyMember ? familyMember.name : user.name}</DetailRow>
                {familyMember && (
                  <>
                    <DetailRow label="Relation">{familyMember.relation}</DetailRow>
                    {familyMember.age && <DetailRow label="Age">{familyMember.age} years</DetailRow>}
                    {familyMember.gender && <DetailRow label="Gender"><span className="capitalize">{familyMember.gender}</span></DetailRow>}
                    {familyMember.blood_group && <DetailRow label="Blood Group">{familyMember.blood_group}</DetailRow>}
                  </>
                )}
              </div>
            </Section>

            {/* Action Footer */}
            <ActionFooter
              onDownload={handleDownload}
              onShare={handleShare}
              showDownload={!!record.file_type}
            />

          </div>
        </div>

      </div>

      <Toast show={!!toastMessage} message={toastMessage} onHide={() => setToastMessage('')} />

      <ShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        title={record.title}
        description={`${config.label} — ${record.record_date_formatted}${record.doctor_name ? ` — ${record.doctor_name}` : ''}`}
        url={window.location.href}
      />
    </AppLayout>
  );
}
