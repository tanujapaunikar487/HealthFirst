import * as React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/Components/ui/avatar';
import { getAvatarColorByName } from '@/Lib/avatar-colors';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Star } from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';
import { cn } from '@/Lib/utils';

export interface TimeSlot {
  time: string;
  available: boolean;
  preferred?: boolean;
}

export interface DoctorCardProps {
  id: string;
  name: string;
  avatar: string | null;
  specialization: string;
  experienceYears?: number;
  education?: string[];
  languages?: string[];
  rating?: number;
  reviewCount?: number;
  consultationModes?: string[];
  videoFee?: number;
  inPersonFee?: number;
  price?: number; // Legacy fallback
  slots?: TimeSlot[];
  quickTimes?: string[]; // For previous doctors
  availableOnDate?: boolean; // For previous doctors
  availabilityMessage?: string;
  selectedTime: string | null;
  onSelectTime: (time: string) => void;
  disabled?: boolean;
}

/**
 * DoctorCard Component
 *
 * Global component for displaying doctor information in booking flows.
 * Supports both full doctor lists and previous doctors lists.
 *
 * @example
 * // Basic usage
 * <DoctorCard
 *   id={doctor.id}
 *   name={doctor.name}
 *   avatar={doctor.avatar}
 *   specialization={doctor.specialization}
 *   experienceYears={doctor.experience_years}
 *   selectedTime={selectedTime}
 *   onSelectTime={handleSelectTime}
 * />
 *
 * @example
 * // With time slots and consultation modes
 * <DoctorCard
 *   {...doctor}
 *   consultationModes={['video', 'in_person']}
 *   videoFee={800}
 *   inPersonFee={1000}
 *   slots={doctor.slots}
 *   selectedTime={selectedTime}
 *   onSelectTime={handleSelectTime}
 * />
 */
export function DoctorCard({
  id,
  name,
  avatar,
  specialization,
  experienceYears,
  education,
  languages,
  rating,
  reviewCount,
  consultationModes,
  videoFee,
  inPersonFee,
  price,
  slots,
  quickTimes,
  availableOnDate,
  availabilityMessage,
  selectedTime,
  onSelectTime,
  disabled = false,
}: DoctorCardProps) {
  const getPrice = () => {
    const vFee = videoFee ?? 0;
    const iPFee = inPersonFee ?? 0;

    if (consultationModes?.length === 2 && vFee && iPFee) {
      return `₹${vFee.toLocaleString()} / ${iPFee.toLocaleString()}`;
    }

    if (vFee && iPFee) {
      return `₹${vFee.toLocaleString()} / ${iPFee.toLocaleString()}`;
    }

    const fee = vFee || iPFee || price;
    return fee ? `₹${fee.toLocaleString()}` : 'Price not available';
  };

  const getInitial = (doctorName: string) => doctorName.charAt(0).toUpperCase();

  return (
    <div className="px-6 py-4 transition-colors hover:bg-muted/50">
      {/* Doctor info */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-start gap-3 flex-1">
          <Avatar className="h-10 w-10">
            <AvatarImage src={avatar || undefined} />
            <AvatarFallback
              style={(() => {
                const color = getAvatarColorByName(name || 'Doctor');
                return { backgroundColor: color.bg, color: color.text };
              })()}
            >
              {getInitial(name || 'D')}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <p className="text-label leading-none">{name || 'Unknown Doctor'}</p>
            <p className="text-body text-muted-foreground">
              {specialization || 'General'}{experienceYears ? ` • ${experienceYears} years` : ''}
            </p>
            {education && education.length > 0 && (
              <p className="text-body text-muted-foreground">
                {education.join(', ')}
              </p>
            )}
            {languages && languages.length > 0 && (
              <p className="text-body text-muted-foreground">
                {languages.join(', ')}
              </p>
            )}
            {rating && (
              <div className="flex items-center gap-1">
                <Icon icon={Star} size={14} className="fill-warning text-warning" />
                <span className="text-label">{rating}</span>
                {reviewCount && (
                  <span className="text-body text-muted-foreground">
                    ({reviewCount})
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {consultationModes && consultationModes.length > 0 && (
            <div className="flex gap-2">
              {consultationModes.includes('video') && (
                <Badge variant="neutral">Video</Badge>
              )}
              {consultationModes.includes('in_person') && (
                <Badge variant="neutral">In-person</Badge>
              )}
            </div>
          )}
          <p className="text-label">{getPrice()}</p>
        </div>
      </div>

      {/* Time slots */}
      {availableOnDate === false ? (
        <div className="ml-13 text-body text-muted-foreground italic">
          {availabilityMessage || 'No available slots on the selected date'}
        </div>
      ) : (
        <div className="ml-13 flex flex-wrap gap-2">
          {/* Show quick times if available */}
          {quickTimes && quickTimes.length > 0 ? (
            quickTimes.map((time) => (
              <Button
                key={time}
                variant="outline"
                onClick={() => !disabled && onSelectTime(time)}
                disabled={disabled}
                className={cn(
                  "h-auto px-3 py-1.5 rounded-full text-label",
                  "disabled:opacity-60",
                  selectedTime === time && "border-2 border-primary bg-primary/10 text-primary"
                )}
              >
                {formatTime(time)}
              </Button>
            ))
          ) : slots && slots.length > 0 ? (
            /* Show full slots with availability */
            slots.map((slot) => (
              <Button
                key={slot.time}
                variant="outline"
                onClick={() => !disabled && slot.available && onSelectTime(slot.time)}
                disabled={disabled || !slot.available}
                className={cn(
                  "h-auto px-3 py-1.5 rounded-full text-label",
                  "disabled:opacity-60",
                  selectedTime === slot.time && "border-2 border-primary bg-primary/10 text-primary"
                )}
              >
                {formatTime(slot.time)}
                {slot.preferred && <Icon icon={Star} size={12} className="fill-current text-muted-foreground" />}
              </Button>
            ))
          ) : null}
        </div>
      )}
    </div>
  );
}

/**
 * Format time from 24-hour to 12-hour with AM/PM
 * If time already has AM/PM, return as-is
 */
function formatTime(time: string): string {
  // If time already has AM/PM, return as-is
  if (time.includes('AM') || time.includes('PM') || time.includes('am') || time.includes('pm')) {
    return time;
  }

  // Otherwise, format from 24-hour to 12-hour with AM/PM
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}
