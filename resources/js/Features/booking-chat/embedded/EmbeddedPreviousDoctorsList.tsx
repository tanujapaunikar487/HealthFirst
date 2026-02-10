import { DoctorCard } from '@/Components/Booking/DoctorCard';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Plus } from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';

interface TimeSlot {
  time: string;
  available: boolean;
}

interface PreviousDoctor {
  id: string;
  name: string;
  avatar: string | null;
  specialization: string;
  experience_years?: number;
  education?: string[];
  languages?: string[];
  rating?: number;
  reviewCount?: number;
  price?: number;
  last_visit?: string; // Backend sends this
  lastVisitDate?: string; // Legacy field
  previousSymptoms?: string[];
  slots?: TimeSlot[];
  // New fields from backend enhancement
  available_on_date?: boolean;
  availability_message?: string;
  quick_times?: string[];
  consultation_modes?: string[];
  video_fee?: number;
  in_person_fee?: number;
}

interface Props {
  primaryDoctor: PreviousDoctor;
  otherDoctors: PreviousDoctor[];
  selectedDoctorId: string | null;
  selectedTime: string | null;
  onSelect: (doctorId: string, time: string) => void;
  onSeeOtherDoctors: () => void;
  disabled: boolean;
}

export function EmbeddedPreviousDoctorsList({
  primaryDoctor,
  otherDoctors,
  selectedDoctorId,
  selectedTime,
  onSelect,
  onSeeOtherDoctors,
  disabled,
}: Props) {
  const allDoctors = [primaryDoctor, ...otherDoctors];

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0 divide-y">
        {allDoctors.map((doctor) => (
          <DoctorCard
            key={doctor.id}
            id={doctor.id}
            name={doctor.name}
            avatar={doctor.avatar}
            specialization={doctor.specialization}
            experienceYears={doctor.experience_years}
            education={doctor.education}
            languages={doctor.languages}
            rating={doctor.rating}
            reviewCount={doctor.reviewCount}
            consultationModes={doctor.consultation_modes}
            videoFee={doctor.video_fee}
            inPersonFee={doctor.in_person_fee}
            price={doctor.price}
            slots={doctor.slots}
            quickTimes={doctor.quick_times}
            availableOnDate={doctor.available_on_date}
            availabilityMessage={doctor.availability_message}
            selectedTime={selectedDoctorId === doctor.id ? selectedTime : null}
            onSelectTime={(time) => onSelect(doctor.id, time)}
            disabled={disabled}
          />
        ))}

        {/* See other doctors button */}
        <Button
          variant="link"
          className="w-full h-auto px-6 py-4 rounded-none justify-center text-body text-primary hover:bg-muted/50"
          onClick={onSeeOtherDoctors}
          disabled={disabled}
        >
          <Icon icon={Plus} size={16} />
          See other doctors instead
        </Button>
      </CardContent>
    </Card>
  );
}
