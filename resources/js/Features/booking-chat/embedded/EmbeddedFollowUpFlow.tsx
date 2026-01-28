import { EmbeddedPreviousVisit } from './EmbeddedPreviousVisit';
import { EmbeddedFollowUpReason } from './EmbeddedFollowUpReason';

interface PreviousVisitData {
  doctor: {
    id: string;
    name: string;
    avatar: string | null;
    specialization: string;
  };
  date: string;
  reason: string;
  doctorNotes: string;
}

interface Props {
  previousVisit: PreviousVisitData;
  selectedReason: string | null;
  onSelect: (reason: string) => void;
  disabled: boolean;
}

export function EmbeddedFollowUpFlow({
  previousVisit,
  selectedReason,
  onSelect,
  disabled
}: Props) {
  return (
    <div className="space-y-6">
      {/* Previous visit card */}
      <EmbeddedPreviousVisit visit={previousVisit} />

      {/* Reason selector section */}
      <div className="space-y-3">
        <p className="text-base font-normal text-foreground">
          What's the reason for this follow-up?
        </p>
        <EmbeddedFollowUpReason
          selectedReason={selectedReason}
          onSelect={onSelect}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
