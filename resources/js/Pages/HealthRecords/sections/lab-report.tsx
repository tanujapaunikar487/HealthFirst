import { Alert } from '@/Components/ui/alert';
import { DetailRow } from '@/Components/ui/detail-row';
import { ParameterCard } from '@/Components/ui/parameter-card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/Components/ui/collapsible';
import { Button } from '@/Components/ui/button';
import { TestTube2, FileText, Sparkles, ChevronDown } from '@/Lib/icons';
import { useState } from 'react';
import type { CategorySection, RecordMetadata, LabResult } from '../types';

export function getLabReportSections(meta: RecordMetadata): CategorySection[] {
  const sections: CategorySection[] = [];
  const results = (meta.results || []) as LabResult[];

  // AI Summary (only if abnormal values exist)
  const hasAbnormal = results.some(r => r.status !== 'normal');

  if (hasAbnormal && meta.ai_summary) {
    sections.push({
      id: 'ai-summary',
      title: 'AI Summary',
      icon: Sparkles,
      content: (
        <div className="p-6">
          <Alert variant="info" hideIcon>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-overline text-muted-foreground">AI-generated summary</span>
              </div>
              <p className="text-body leading-relaxed" style={{ color: 'hsl(var(--foreground))' }}>
                {meta.ai_summary}
              </p>
              <p className="text-caption text-muted-foreground">
                AI-generated interpretation. Always consult your doctor for medical advice.
              </p>
            </div>
          </Alert>
        </div>
      ),
    });
  }

  // Status Banner
  const allNormal = results.length > 0 && results.every(r => r.status === 'normal');
  sections.push({
    id: 'status-banner',
    title: 'Status',
    icon: TestTube2,
    content: (
      <div className="p-6">
        {allNormal ? (
          <Alert variant="success">
            All values within normal range. No action needed.
          </Alert>
        ) : hasAbnormal ? (
          <Alert variant="warning">
            Some values are outside the normal range. Please consult your doctor.
          </Alert>
        ) : (
          <Alert variant="info">
            Test results are available below.
          </Alert>
        )}
      </div>
    ),
  });

  // Test Results
  if (results.length > 0) {
    sections.push({
      id: 'test-results',
      title: 'Test Results',
      icon: TestTube2,
      content: (
        <div className="divide-y">
          {results.map((result, i) => (
            <ParameterCard
              key={i}
              parameter={result.parameter}
              value={result.value}
              unit={result.unit}
              referenceRange={result.reference_range}
              status={result.status}
            />
          ))}
        </div>
      ),
    });
  }

  // Report Details (Collapsible)
  if (meta.sample_type || meta.collected_date || meta.reported_date || meta.verified_by || meta.fasting !== undefined) {
    sections.push({
      id: 'report-details',
      title: 'Report Details',
      icon: FileText,
      content: <ReportDetails meta={meta} />,
    });
  }

  return sections;
}

function ReportDetails({ meta }: { meta: RecordMetadata }) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="flex items-center justify-between w-full px-6 py-4 h-auto rounded-none">
          <span className="text-label text-foreground">View report details</span>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="divide-y border-t border-border">
          {meta.sample_type && <DetailRow label="Sample type">{meta.sample_type}</DetailRow>}
          {meta.collected_date && <DetailRow label="Collected">{meta.collected_date}</DetailRow>}
          {meta.reported_date && <DetailRow label="Reported">{meta.reported_date}</DetailRow>}
          {meta.verified_by && <DetailRow label="Verified by">{meta.verified_by}</DetailRow>}
          {meta.fasting !== undefined && <DetailRow label="Fasting">{meta.fasting ? 'Yes' : 'No'}</DetailRow>}
          {meta.test_category && <DetailRow label="Test category">{meta.test_category}</DetailRow>}
          {meta.lab_name && <DetailRow label="Lab">{meta.lab_name}</DetailRow>}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
