import { useState } from 'react';
import { router } from '@inertiajs/react';
import { GuidedBookingLayout } from '@/Layouts/GuidedBookingLayout';
import { Button } from '@/Components/ui/button';
import { Card } from '@/Components/ui/card';
import { Alert } from '@/Components/ui/alert';
import { format, parseISO } from 'date-fns';

const labSteps = [
  { id: 'patient', label: 'Patient' },
  { id: 'test_search', label: 'Find Tests' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'confirm', label: 'Confirm' },
];

interface Props {
  summary: {
    package: { id: string | null; name: string; isTests?: boolean };
    patient: { id: string; name: string; avatar: string | null };
    datetime: string;
    collection: string;
    address: string;
    fee: number;
    prepInstructions: string[];
  };
}

export default function ConfirmStep({ summary }: Props) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBack = () => {
    router.get('/booking/lab/schedule');
  };

  const handlePay = () => {
    setIsProcessing(true);
    // Trigger payment flow
    router.post('/booking/lab/confirm');
  };

  const handleChange = (step: string) => {
    router.get(`/booking/lab/${step}`);
  };

  const formatDateTime = (datetime: string) => {
    try {
      const date = parseISO(datetime);
      return format(date, 'EEE, d MMM • h:mm a');
    } catch {
      return datetime;
    }
  };

  // Build rows array for proper divider handling
  const rows = [
    { label: summary.package.isTests ? 'Tests' : 'Package', value: summary.package.name, showChange: true, step: 'test-search' },
    { label: 'Patient', value: summary.patient.name, showChange: true, step: 'patient' },
    { label: 'Date & Time', value: formatDateTime(summary.datetime), showChange: true, step: 'schedule' },
    { label: 'Collection', value: summary.collection, showChange: true, step: 'schedule' },
    { label: 'Address', value: summary.address, showChange: true, step: 'schedule' },
    { label: 'Consultation Fee', value: `₹${summary.fee.toLocaleString()}`, showChange: false, step: '' },
  ];

  return (
    <GuidedBookingLayout
      steps={labSteps}
      currentStepId="confirm"
      onBack={handleBack}
      onContinue={handlePay}
      continueLabel={`Pay ₹${summary.fee.toLocaleString()}`}
      isProcessing={isProcessing}
    >
      <div className="space-y-6">
        <h2 className="text-step-title">Booking Summary</h2>

        {/* Summary Table */}
        <Card className="overflow-hidden">
          <div className="divide-y">
            {rows.map((row) => (
              <div key={row.label} className="flex items-center justify-between px-6 py-4">
                <span className="text-body text-muted-foreground">{row.label}</span>
                <div className="flex items-center gap-3">
                  <span className="text-label text-right">{row.value}</span>
                  {row.showChange && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => handleChange(row.step)}
                      className="h-auto p-0 text-primary text-body hover:underline"
                    >
                      change
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Preparation Instructions */}
        {summary.prepInstructions.length > 0 && (
          <Alert variant="warning" title="Preparation instructions">
            <ul className="space-y-1 mt-1">
              {summary.prepInstructions.map((instruction, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span>•</span>
                  <span>{instruction}</span>
                </li>
              ))}
            </ul>
          </Alert>
        )}
      </div>
    </GuidedBookingLayout>
  );
}

