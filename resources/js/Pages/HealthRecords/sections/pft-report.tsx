import { DetailRow } from '@/Components/ui/detail-row';
import { Card } from '@/Components/ui/card';
import { Wind, User, FileText, Check } from '@/Lib/icons';
import type { CategorySection, RecordMetadata, PftResult } from '../types';

export function getPftSections(meta: RecordMetadata): CategorySection[] {
  const sections: CategorySection[] = [];

  // Patient Data
  if (meta.patient_age || meta.patient_height || meta.patient_weight) {
    sections.push({
      id: 'patient-data',
      title: 'Patient Data',
      icon: User,
      content: (
        <div className="divide-y">
          {meta.patient_age && <DetailRow label="Age">{meta.patient_age} years</DetailRow>}
          {meta.patient_height && <DetailRow label="Height">{meta.patient_height} cm</DetailRow>}
          {meta.patient_weight && <DetailRow label="Weight">{meta.patient_weight} kg</DetailRow>}
        </div>
      ),
    });
  }

  // Spirometry Results (table)
  const results = (meta.results || []) as PftResult[];
  if (results.length > 0) {
    sections.push({
      id: 'spirometry',
      title: 'Spirometry Results',
      icon: Wind,
      content: (
        <table className="w-full text-body">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left px-6 py-3 text-label text-muted-foreground font-medium">Parameter</th>
              <th className="text-left px-4 py-3 text-label text-muted-foreground font-medium">Predicted</th>
              <th className="text-left px-4 py-3 text-label text-muted-foreground font-medium">Actual</th>
              <th className="text-left px-4 py-3 text-label text-muted-foreground font-medium">% Predicted</th>
              <th className="text-right px-6 py-3 text-label text-muted-foreground font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => {
              const isNormal = r.status === 'normal';
              return (
                <tr key={i} className={i < results.length - 1 ? 'border-t border-border' : ''}>
                  <td className="px-6 py-3 text-label text-foreground">{r.parameter}</td>
                  <td className="px-4 py-3 text-foreground">{r.predicted}</td>
                  <td className="px-4 py-3 text-foreground">{r.value}</td>
                  <td className="px-4 py-3 text-foreground">{r.percent_predicted}</td>
                  <td className="px-6 py-3 text-right">
                    {isNormal ? (
                      <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-success/10">
                        <Check className="h-3 w-3" style={{ color: 'hsl(var(--success))' }} />
                      </span>
                    ) : (
                      <span className="text-micro px-2 py-0.5 rounded" style={{ backgroundColor: 'hsl(var(--warning) / 0.1)', color: 'hsl(var(--warning))' }}>
                        {r.status === 'low' ? 'Low' : r.status}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ),
    });
  }

  // Interpretation
  if (meta.interpretation) {
    sections.push({
      id: 'interpretation',
      title: 'Interpretation',
      icon: FileText,
      content: (
        <div className="p-6">
          <Card className="p-4 bg-muted/30">
            <p className="text-body leading-relaxed text-foreground">{meta.interpretation}</p>
          </Card>
        </div>
      ),
    });
  }

  return sections;
}
