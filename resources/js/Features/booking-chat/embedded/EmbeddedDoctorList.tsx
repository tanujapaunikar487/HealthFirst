import { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/Components/ui/avatar';
import { Badge } from '@/Components/ui/badge';
import { Input } from '@/Components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Components/ui/select';
import { cn } from '@/Lib/utils';
import { Search, Star } from 'lucide-react';

interface TimeSlot {
  time: string;
  available: boolean;
  preferred: boolean;
}

interface Doctor {
  id: string;
  name: string;
  avatar: string | null;
  specialization: string;
  experience_years: number;
  consultation_modes: string[];
  video_fee: number;
  in_person_fee: number;
  slots: TimeSlot[];
}

interface Props {
  doctors: Doctor[];
  selectedDoctorId: string | null;
  selectedTime: string | null;
  onSelect: (doctorId: string, time: string) => void;
  disabled: boolean;
}

export function EmbeddedDoctorList({ doctors, selectedDoctorId, selectedTime, onSelect, disabled }: Props) {
  const [sortBy, setSortBy] = useState('recommended');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDoctors = doctors.filter(doctor => {
    if (!searchQuery) return true;
    return doctor.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-4">
      {/* Sort and search */}
      <div className="flex items-center gap-3">
        <Select value={sortBy} onValueChange={setSortBy} disabled={disabled}>
          <SelectTrigger className="w-[180px] h-11 text-sm border-border rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="z-[9999]">
            <SelectItem value="recommended" className="text-sm">Recommended</SelectItem>
            <SelectItem value="price_low" className="text-sm">Price: Low to High</SelectItem>
            <SelectItem value="price_high" className="text-sm">Price: High to Low</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search patient, doctor, date"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-11 text-sm rounded-lg border-border"
            disabled={disabled}
          />
        </div>
      </div>

      {/* Doctor cards */}
      <div className="border rounded-xl overflow-hidden divide-y bg-background">
        {filteredDoctors.map((doctor) => (
          <DoctorCard
            key={doctor.id}
            doctor={doctor}
            isSelected={selectedDoctorId === doctor.id}
            selectedTime={selectedDoctorId === doctor.id ? selectedTime : null}
            onSelectTime={(time) => onSelect(doctor.id, time)}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}

function DoctorCard({
  doctor,
  isSelected,
  selectedTime,
  onSelectTime,
  disabled,
}: {
  doctor: Doctor;
  isSelected: boolean;
  selectedTime: string | null;
  onSelectTime: (time: string) => void;
  disabled: boolean;
}) {
  const getPrice = () => {
    if (doctor.consultation_modes.length === 2) {
      return `₹${doctor.video_fee.toLocaleString()} / ${doctor.in_person_fee.toLocaleString()}`;
    }
    return `₹${(doctor.video_fee || doctor.in_person_fee).toLocaleString()}`;
  };

  return (
    <div className={cn(
      "p-5 transition-all",
      isSelected && "bg-primary/5 border-l-2 border-l-primary"
    )}>
      {/* Doctor info */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={doctor.avatar || undefined} />
            <AvatarFallback className="bg-gray-200 text-gray-700 text-sm font-medium">{doctor.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm mb-0.5">{doctor.name}</p>
            <p className="text-xs text-muted-foreground">
              {doctor.specialization} • {doctor.experience_years} years of experience
            </p>
          </div>
        </div>

        <div className="text-right flex flex-col items-end">
          <div className="flex gap-2 mb-1.5">
            {doctor.consultation_modes.includes('video') && (
              <Badge variant="outline" className="text-[10px] font-normal text-primary border-primary px-2 py-0.5 h-5">
                Video
              </Badge>
            )}
            {doctor.consultation_modes.includes('in_person') && (
              <Badge variant="outline" className="text-[10px] font-normal text-primary border-primary px-2 py-0.5 h-5">
                In-hospital
              </Badge>
            )}
          </div>
          <p className="text-sm font-semibold">{getPrice()}</p>
        </div>
      </div>

      {/* Time slots */}
      <div className="flex flex-wrap gap-2">
        {doctor.slots.map((slot) => (
          <button
            key={slot.time}
            onClick={() => !disabled && slot.available && onSelectTime(slot.time)}
            disabled={disabled || !slot.available}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-normal border transition-all inline-flex items-center gap-1",
              "hover:border-primary hover:bg-primary/5",
              selectedTime === slot.time && "bg-foreground text-background border-foreground font-medium",
              !slot.available && "opacity-50 cursor-not-allowed",
              slot.preferred && selectedTime !== slot.time && "border-amber-400 bg-amber-50"
            )}
          >
            {formatTime(slot.time)}
            {slot.preferred && <Star className="h-3 w-3 fill-amber-500 text-amber-500" />}
          </button>
        ))}
      </div>
    </div>
  );
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}
