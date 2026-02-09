import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
import { Button } from '@/Components/ui/button';
import { HStack, VStack } from '@/Components/ui/stack';
import { Icon } from '@/Components/ui/icon';
import { Star } from '@/Lib/icons';
import { cn } from '@/Lib/utils';
import { getAvatarColorByName } from '@/Lib/avatar-colors';

export interface TimeSlot {
  time: string;
  available: boolean;
  preferred: boolean;
}

export interface Doctor {
  id: string;
  name: string;
  avatar: string | null;
  specialization: string;
  experience_years: number;
  appointment_modes: string[];
  video_fee: number;
  in_person_fee: number;
  education?: string[];
  languages?: string[];
  rating?: number;
  total_reviews?: number;
}

interface DoctorCardProps {
  doctor: Doctor;
  slots: TimeSlot[];
  selectedTime: string | null;
  isSelected: boolean;
  onSelectTime: (time: string) => void;
}

export function DoctorCard({ doctor, slots, selectedTime, isSelected, onSelectTime }: DoctorCardProps) {
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    return parts.length > 1
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  const formatConsultationModes = (modes: string[]) => {
    if (modes.includes('video') && modes.includes('in_person')) {
      return 'Video and In-hospital';
    }
    if (modes.includes('video')) {
      return 'Video';
    }
    if (modes.includes('in_person')) {
      return 'In-hospital';
    }
    return '';
  };

  const getFeeRange = () => {
    const fees = [];
    if (doctor.appointment_modes.includes('video')) {
      fees.push(doctor.video_fee);
    }
    if (doctor.appointment_modes.includes('in_person')) {
      fees.push(doctor.in_person_fee);
    }

    const uniqueFees = [...new Set(fees)];
    if (uniqueFees.length === 1) {
      return `₹${uniqueFees[0].toLocaleString()}`;
    }
    return `₹${Math.min(...uniqueFees).toLocaleString()} / ${Math.max(...uniqueFees).toLocaleString()}`;
  };

  const avatarColor = getAvatarColorByName(doctor.name);

  return (
    <div
      className={cn(
        'px-6 py-4 transition-all hover:bg-muted/50',
        isSelected && 'bg-primary/5'
      )}
    >
      <VStack gap={4}>
        {/* Doctor Info */}
        <HStack gap={3} className="items-start">
          <Avatar className="h-12 w-12">
            <AvatarImage src={doctor.avatar || undefined} />
            <AvatarFallback
              className="text-label"
              style={{
                backgroundColor: `hsl(${avatarColor.bg})`,
                color: `hsl(${avatarColor.text})`,
              }}
            >
              {getInitials(doctor.name)}
            </AvatarFallback>
          </Avatar>
          <VStack gap={0} className="flex-1 min-w-0">
            <h3 className="text-label text-foreground">{doctor.name}</h3>
            <p className="text-body text-muted-foreground">
              {doctor.specialization} • {doctor.experience_years} years
            </p>
            {doctor.education && doctor.education.length > 0 && (
              <p className="text-body text-muted-foreground">
                {doctor.education.join(', ')}
              </p>
            )}
            {doctor.languages && doctor.languages.length > 0 && (
              <p className="text-body text-muted-foreground">
                {doctor.languages.join(', ')}
              </p>
            )}
            {doctor.rating && (
              <div className="flex items-center gap-1">
                <Icon icon={Star} size={14} className="fill-warning text-warning" />
                <span className="text-label">{doctor.rating}</span>
                {doctor.total_reviews && (
                  <span className="text-body text-muted-foreground">
                    ({doctor.total_reviews})
                  </span>
                )}
              </div>
            )}
          </VStack>
          <VStack gap={1} className="items-end">
            <span className="px-2 py-1 text-label text-primary bg-primary/10 rounded whitespace-nowrap">
              {formatConsultationModes(doctor.appointment_modes)}
            </span>
            <span className="text-card-title">{getFeeRange()}</span>
          </VStack>
        </HStack>

        {/* Time Slots */}
        <HStack gap={2} className="flex-wrap">
          {slots.map((slot) => (
            <Button
              key={slot.time}
              variant={selectedTime === slot.time ? 'accent' : 'outline'}
              onClick={() => slot.available && onSelectTime(slot.time)}
              disabled={!slot.available}
              className={cn(
                'h-auto px-4 py-2 rounded-full transition-all relative',
                selectedTime !== slot.time && 'hover:border-primary/50 hover:bg-primary/5',
                selectedTime === slot.time && 'border-foreground',
                !slot.available && 'opacity-40 cursor-not-allowed'
              )}
            >
              {slot.time}
              {slot.preferred && selectedTime !== slot.time && (
                <Icon icon={Star} size={12} className="absolute -top-1 -right-1 fill-black text-black" />
              )}
            </Button>
          ))}
        </HStack>
      </VStack>
    </div>
  );
}
