import { useState } from 'react';
import { router } from '@inertiajs/react';
import { GuidedBookingLayout } from '@/Layouts/GuidedBookingLayout';
import { Avatar, AvatarImage, AvatarFallback } from '@/Components/ui/avatar';
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

  const getInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

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
        <h2 className="text-xl font-semibold">Booking Summary</h2>

        {/* Summary Table */}
        <Card className="overflow-hidden divide-y bg-white">
          <SummaryRow
            label={summary.package.isTests ? 'Tests' : 'Package'}
            value={<span className="font-medium">{summary.package.name}</span>}
            onChangeClick={() => handleChange('test-search')}
          />

          <SummaryRow
            label="Patient"
            value={
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={summary.patient.avatar || undefined} />
                  <AvatarFallback className="bg-orange-400 text-white text-[14px] font-medium">
                    {getInitial(summary.patient.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{summary.patient.name}</span>
              </div>
            }
            onChangeClick={() => handleChange('patient')}
          />

          <SummaryRow
            label="Date & Time"
            value={<span className="font-medium">{formatDateTime(summary.datetime)}</span>}
            onChangeClick={() => handleChange('schedule')}
          />

          <SummaryRow
            label="Collection"
            value={<span className="font-medium">{summary.collection}</span>}
            onChangeClick={() => handleChange('schedule')}
          />

          <SummaryRow
            label="Address"
            value={<span className="font-medium">{summary.address}</span>}
            onChangeClick={() => handleChange('schedule')}
          />

          {/* Fee - no Change button */}
          <div className="flex items-center justify-between px-6 py-4">
            <span className="text-muted-foreground">Consultation Fee</span>
            <span className="font-semibold">₹{summary.fee.toLocaleString()}</span>
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

// SummaryRow component
interface SummaryRowProps {
  label: string;
  value: React.ReactNode;
  onChangeClick: () => void;
}

function SummaryRow({ label, value, onChangeClick }: SummaryRowProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-3">
        <div>{value}</div>
        <button onClick={onChangeClick} className="text-primary text-[14px] hover:underline">
          Change
        </button>
      </div>
    </div>
  );
}
