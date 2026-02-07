import { DetailRow } from '@/Components/ui/detail-row';
import { Card } from '@/Components/ui/card';
import { ParameterCard } from '@/Components/ui/parameter-card';
import { SpecialistCard } from '@/Components/ui/specialist-card';
import { HeartPulse, ClipboardList, FileText, Stethoscope, User, Check } from '@/Lib/icons';
import type { CategorySection, RecordMetadata } from '../types';

export function getCardiacSections(meta: RecordMetadata): CategorySection[] {
  const sections: CategorySection[] = [];

  // Patient Status
  if (meta.patient_status) {
    const ps = meta.patient_status;
    sections.push({
      id: 'patient-status',
      title: 'Patient Status',
      icon: User,
      content: (
        <div className="divide-y">
          {ps.age && <DetailRow label="Age">{ps.age} years</DetailRow>}
          {ps.gender && <DetailRow label="Gender">{ps.gender}</DetailRow>}
          {ps.bp_at_test && <DetailRow label="BP at test">{ps.bp_at_test}</DetailRow>}
          {ps.known_case && <DetailRow label="Known case">{ps.known_case}</DetailRow>}
        </div>
      ),
    });
  }

  // Clinical Indication
  if (meta.indication) {
    sections.push({
      id: 'indication',
      title: 'Clinical Indication',
      icon: ClipboardList,
      content: (
        <div className="p-6">
          <p className="text-body leading-relaxed text-foreground">{meta.indication}</p>
        </div>
      ),
    });
  }

  // ECG Parameters (parameter cards)
  const ecgParams: { parameter: string; value: string; unit: string; referenceRange: string; status: string }[] = [];
  if (meta.heart_rate) {
    const hr = meta.heart_rate;
    ecgParams.push({
      parameter: 'Heart Rate',
      value: String(hr),
      unit: 'bpm',
      referenceRange: '60-100',
      status: hr >= 60 && hr <= 100 ? 'normal' : hr > 100 ? 'high' : 'low',
    });
  }
  if (meta.rhythm) {
    ecgParams.push({
      parameter: 'Rhythm',
      value: meta.rhythm,
      unit: '',
      referenceRange: 'Regular',
      status: meta.rhythm.toLowerCase().includes('normal') ? 'normal' : 'abnormal',
    });
  }
  if (meta.intervals) {
    if (meta.intervals.pr) {
      const prVal = parseInt(meta.intervals.pr);
      ecgParams.push({
        parameter: 'PR Interval',
        value: meta.intervals.pr,
        unit: 'ms',
        referenceRange: '120-200 ms',
        status: !isNaN(prVal) && prVal >= 120 && prVal <= 200 ? 'normal' : 'abnormal',
      });
    }
    if (meta.intervals.qrs) {
      const qrsVal = parseInt(meta.intervals.qrs);
      ecgParams.push({
        parameter: 'QRS Duration',
        value: meta.intervals.qrs,
        unit: 'ms',
        referenceRange: '< 120 ms',
        status: !isNaN(qrsVal) && qrsVal < 120 ? 'normal' : 'abnormal',
      });
    }
    if (meta.intervals.qt) {
      ecgParams.push({
        parameter: 'QT/QTc',
        value: meta.intervals.qt,
        unit: 'ms',
        referenceRange: '< 440 ms',
        status: 'normal', // simplified
      });
    }
  }
  if (meta.axis) {
    ecgParams.push({
      parameter: 'Axis',
      value: meta.axis,
      unit: '',
      referenceRange: '-30 to +90°',
      status: 'normal', // simplified
    });
  }

  if (ecgParams.length > 0) {
    sections.push({
      id: 'ecg-parameters',
      title: 'ECG Parameters',
      icon: HeartPulse,
      content: (
        <div className="divide-y">
          {ecgParams.map((param, i) => (
            <ParameterCard
              key={i}
              parameter={param.parameter}
              value={param.value}
              unit={param.unit}
              referenceRange={param.referenceRange}
              status={param.status}
              showRangeBar={false}
            />
          ))}
        </div>
      ),
    });
  }

  // Detailed Findings
  if (meta.structured_findings && meta.structured_findings.length > 0) {
    sections.push({
      id: 'findings',
      title: 'Detailed Findings',
      icon: FileText,
      content: (
        <div className="p-6 space-y-3">
          {meta.structured_findings.map((finding, i) => (
            <div key={i}>
              <span className="text-label text-foreground">{finding.region}:</span>{' '}
              <span className="text-body text-foreground">{finding.description}</span>
            </div>
          ))}
        </div>
      ),
    });
  } else if (meta.findings) {
    sections.push({
      id: 'findings',
      title: 'Detailed Findings',
      icon: FileText,
      content: (
        <div className="p-6">
          <p className="text-body leading-relaxed text-foreground">{meta.findings}</p>
        </div>
      ),
    });
  }

  // Interpretation
  if (meta.impression) {
    sections.push({
      id: 'interpretation',
      title: 'Interpretation',
      icon: FileText,
      content: (
        <div className="p-6">
          <Card className="p-4 bg-muted/30">
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center h-5 w-5 rounded-full bg-success/10 flex-shrink-0 mt-0.5">
                <Check className="h-3 w-3" style={{ color: 'hsl(var(--success))' }} />
              </span>
              <p className="text-body leading-relaxed text-foreground">{meta.impression}</p>
            </div>
          </Card>
        </div>
      ),
    });
  }

  // ECG Strip placeholder
  sections.push({
    id: 'ecg-strip',
    title: 'ECG Strip',
    icon: HeartPulse,
    content: (
      <div className="p-6">
        <Card className="p-6 bg-muted/30">
          <div className="flex flex-col items-center justify-center text-center py-4">
            <HeartPulse className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-label text-foreground mb-1">ECG waveform available in PDF</p>
            <p className="text-body text-muted-foreground">Download the report to view the full ECG strip</p>
          </div>
        </Card>
      </div>
    ),
  });

  // Cardiologist
  if (meta.cardiologist) {
    sections.push({
      id: 'cardiologist',
      title: 'Cardiologist',
      icon: Stethoscope,
      content: (
        <div className="p-6">
          <SpecialistCard
            name={meta.cardiologist}
            credentials={meta.cardiologist_credentials}
          />
        </div>
      ),
    });
  }

  return sections;
}
