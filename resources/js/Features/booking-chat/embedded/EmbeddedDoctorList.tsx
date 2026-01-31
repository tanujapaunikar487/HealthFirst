import { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/Components/ui/avatar';
import { Badge } from '@/Components/ui/badge';
import { Card, CardContent } from '@/Components/ui/card';
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
  const [filterSpecialty, setFilterSpecialty] = useState<string>('all');
  const [filterMode, setFilterMode] = useState<string>('all');

  // Get unique specialties from doctors
  const specialties = Array.from(new Set(doctors.map(d => d.specialization).filter(Boolean)));

  // Apply filters and sorting
  const filteredDoctors = doctors
    .filter(doctor => {
      // Search filter
      if (searchQuery && !doctor.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Specialty filter
      if (filterSpecialty !== 'all' && doctor.specialization !== filterSpecialty) {
        return false;
      }

      // Appointment mode filter
      if (filterMode !== 'all') {
        if (!doctor.consultation_modes?.includes(filterMode)) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price_low':
          const aPrice = a.video_fee || a.in_person_fee || 0;
          const bPrice = b.video_fee || b.in_person_fee || 0;
          return aPrice - bPrice;
        case 'price_high':
          const aMaxPrice = Math.max(a.video_fee || 0, a.in_person_fee || 0);
          const bMaxPrice = Math.max(b.video_fee || 0, b.in_person_fee || 0);
          return bMaxPrice - aMaxPrice;
        case 'experience':
          return (b.experience_years || 0) - (a.experience_years || 0);
        default:
          return 0; // recommended (keep original order)
      }
    });

  return (
    <div className="space-y-4">
      {/* Filters row 1: Sort and search */}
      <div className="flex items-center gap-3">
        <Select value={sortBy} onValueChange={setSortBy} disabled={disabled}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recommended">Recommended</SelectItem>
            <SelectItem value="price_low">Price: Low to High</SelectItem>
            <SelectItem value="price_high">Price: High to Low</SelectItem>
            <SelectItem value="experience">Experience</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search doctors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            disabled={disabled}
          />
        </div>
      </div>

      {/* Filters row 2: Specialty and Mode */}
      <div className="flex items-center gap-3">
        <Select value={filterSpecialty} onValueChange={setFilterSpecialty} disabled={disabled}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Specialties" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Specialties</SelectItem>
            {specialties.map(spec => (
              <SelectItem key={spec} value={spec}>{spec}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterMode} onValueChange={setFilterMode} disabled={disabled}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Appointment Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="video">Video Only</SelectItem>
            <SelectItem value="in_person">In-Person Only</SelectItem>
          </SelectContent>
        </Select>

        {/* Results count */}
        <div className="ml-auto text-sm text-muted-foreground">
          {filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Doctor cards */}
      <Card>
        <CardContent className="p-0 divide-y">
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
        </CardContent>
      </Card>
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
    const videoFee = doctor.video_fee ?? 0;
    const inPersonFee = doctor.in_person_fee ?? 0;

    if (doctor.consultation_modes?.length === 2 && videoFee && inPersonFee) {
      return `₹${videoFee.toLocaleString()} / ${inPersonFee.toLocaleString()}`;
    }

    const fee = videoFee || inPersonFee;
    return fee ? `₹${fee.toLocaleString()}` : 'Price not available';
  };

  return (
    <div className={cn(
      "p-4 transition-colors hover:bg-accent",
      isSelected && "bg-accent border-l-4 border-l-primary"
    )}>
      {/* Doctor info */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-start gap-3 flex-1">
          <Avatar className="h-10 w-10">
            <AvatarImage src={doctor.avatar || undefined} />
            <AvatarFallback>{doctor.name?.charAt(0) || 'D'}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <p className="text-sm font-medium leading-none">{doctor.name || 'Unknown Doctor'}</p>
            <p className="text-sm text-muted-foreground">
              {doctor.specialization || 'General'} • {doctor.experience_years || 0} years
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2">
            {doctor.consultation_modes?.includes('video') && (
              <Badge variant="outline" className="border-primary text-primary">
                Video
              </Badge>
            )}
            {doctor.consultation_modes?.includes('in_person') && (
              <Badge variant="outline" className="border-primary text-primary">
                In-person
              </Badge>
            )}
          </div>
          <p className="text-sm font-medium">{getPrice()}</p>
        </div>
      </div>

      {/* Time slots */}
      <div className="flex flex-wrap gap-2">
        {doctor.slots?.map((slot) => (
          <button
            key={slot.time}
            onClick={() => !disabled && slot.available && onSelectTime(slot.time)}
            disabled={disabled || !slot.available}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm border transition-colors inline-flex items-center gap-1",
              "hover:bg-accent hover:border-primary",
              selectedTime === slot.time && "bg-primary text-primary-foreground border-primary",
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
