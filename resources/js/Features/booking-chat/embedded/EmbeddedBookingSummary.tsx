import { Button } from '@/Components/ui/button';
import { Alert } from '@/Components/ui/alert';
import { BookingSummary } from '@/Components/BookingSummary';
import { format, parseISO } from 'date-fns';
import { useState } from 'react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface DoctorSummary {
  doctor?: { name: string; avatar: string | null };
  package?: string;
  patient: { name: string; avatar: string | null };
  type: string;
  datetime: string;
  mode?: string;
  collection?: string;
  address?: string;
  fee: number;
  prepInstructions?: string[];
  supported_modes?: string[];
}

interface Props {
  summary: DoctorSummary;
  onPay: () => void;
  onSelect?: (selection: any) => void;
  disabled: boolean;
  conversationId: string;
}

export function EmbeddedBookingSummary({ summary, onPay, onSelect, disabled, conversationId }: Props) {
  const [isProcessing, setIsProcessing] = useState(false);

  // Safety check: if summary is undefined or invalid, show error
  if (!summary || typeof summary !== 'object') {
    console.error('EmbeddedBookingSummary: Invalid summary data', summary);
    return (
      <Alert variant="error" title="Unable to load booking summary">
        Please try again or contact support.
      </Alert>
    );
  }

  const formatDateTime = (datetime: string) => {
    try {
      const date = parseISO(datetime);
      return format(date, "EEE, d MMM • h:mm a");
    } catch {
      return datetime;
    }
  };

  const handlePayment = async () => {
    if (isProcessing) return;

    setIsProcessing(true);

    try {
      // Step 1: Create Razorpay order
      const response = await fetch(`/booking/${conversationId}/payment/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to create payment order');
      }

      const orderData = await response.json();

      // Check if we're in mock mode
      if (orderData.mock_mode) {
        // Mock payment - skip Razorpay modal and verify directly
        const verifyResponse = await fetch(`/booking/${conversationId}/payment/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          },
          body: JSON.stringify({
            razorpay_payment_id: 'pay_mock_' + Math.random().toString(36).substr(2, 9),
            razorpay_order_id: orderData.order_id,
            razorpay_signature: 'mock_signature',
          }),
        });

        const verifyData = await verifyResponse.json();

        if (verifyData.success && verifyData.redirect) {
          window.location.href = verifyData.redirect;
        } else {
          alert('Payment verification failed. Please contact support.');
          setIsProcessing(false);
        }
        return;
      }

      // Real Razorpay payment - Step 2: Open Razorpay checkout
      const options = {
        key: orderData.key,
        amount: orderData.amount * 100,
        currency: orderData.currency,
        name: 'Healthcare Booking',
        description: 'Booking Payment',
        order_id: orderData.order_id,
        handler: async function (response: any) {
          // Step 3: Verify payment on backend
          try {
            const verifyResponse = await fetch(`/booking/${conversationId}/payment/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
              },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success && verifyData.redirect) {
              // Redirect to confirmation page
              window.location.href = verifyData.redirect;
            } else {
              alert('Payment verification failed. Please contact support.');
              setIsProcessing(false);
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            alert('Payment verification failed. Please contact support.');
            setIsProcessing(false);
          }
        },
        prefill: {
          name: summary.patient.name,
        },
        theme: {
          color: '#0052FF',
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Payment initialization error:', error);
      alert('Failed to initialize payment. Please try again.');
      setIsProcessing(false);
    }
  };

  // Build rows array
  const rows: Array<{ label: string; value: React.ReactNode; onChange?: () => void }> = [];

  if (summary.doctor) {
    rows.push({ label: 'Doctor', value: summary.doctor.name, onChange: () => onSelect?.({ change_doctor: true }) });
  }
  if (summary.package) {
    rows.push({ label: 'Package', value: summary.package, onChange: () => onSelect?.({ change_package: true }) });
  }
  rows.push({ label: 'Patient', value: summary.patient.name, onChange: () => onSelect?.({ change_patient: true }) });
  rows.push({ label: 'Date & Time', value: formatDateTime(summary.datetime), onChange: () => onSelect?.({ change_datetime: true }) });
  if (summary.type && !summary.collection) {
    rows.push({ label: 'Type', value: summary.type, onChange: () => onSelect?.({ change_type: true }) });
  }
  if (summary.mode) {
    const showChange = (summary.supported_modes?.length ?? 0) > 1;
    rows.push({
      label: 'Mode',
      value: summary.mode === 'video' ? 'Video Appointment' : 'In-Person Visit',
      onChange: showChange ? () => onSelect?.({ change_mode: true }) : undefined,
    });
  }
  if (summary.collection) {
    rows.push({ label: 'Collection', value: summary.collection, onChange: () => onSelect?.({ change_location: true }) });
  }
  if (summary.address) {
    rows.push({ label: 'Address', value: summary.address, onChange: () => onSelect?.({ change_address: true, display_message: 'Change Address' }) });
  }
  // Fee row - no Change link
  rows.push({ label: 'Appointment Fee', value: `₹${summary.fee.toLocaleString()}` });

  return (
    <div className="space-y-4">
      {/* Summary card */}
      <BookingSummary rows={rows} className="overflow-hidden" />

      {/* Preparation Instructions (for lab) */}
      {summary.prepInstructions && summary.prepInstructions.length > 0 && (
        <Alert variant="warning" title="Preparation Instructions">
          <ul className="space-y-1">
            {summary.prepInstructions.map((instruction, i) => (
              <li key={i} className="flex items-start gap-2">
                <span>•</span>
                <span>{instruction}</span>
              </li>
            ))}
          </ul>
        </Alert>
      )}

      {/* Pay button */}
      <Button
        onClick={handlePayment}
        disabled={disabled || isProcessing}
        size="lg"
      >
        {isProcessing ? 'Processing...' : `Pay ₹${summary.fee.toLocaleString()}`}
      </Button>
    </div>
  );
}

