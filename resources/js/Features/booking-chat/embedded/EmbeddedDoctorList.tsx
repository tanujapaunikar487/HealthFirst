import { useState } from 'react';
import * as React from 'react';
import { DoctorCard } from '@/Components/Booking/DoctorCard';
import { Card, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Components/ui/select';
import { Search } from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';

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
  rating?: number;
  total_reviews?: number;
  education?: string[];
  languages?: string[];
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
  const [expanded, setExpanded] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Scroll to show the AI's entire message (including text before this component) when it mounts
  React.useEffect(() => {
    if (containerRef.current) {
      // Scroll the component itself to top
      containerRef.current.scrollTop = 0;

      // Use requestAnimationFrame to ensure scroll happens after all rendering and layout
      // This runs after the chat's auto-scroll mechanism
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (containerRef.current) {
            // Find the parent message bubble (the AI's complete message with text + embedded component)
            const messageBubble = containerRef.current.closest('.flex.gap-3');
            const scrollContainer = containerRef.current.closest('.overflow-y-auto');

            if (messageBubble && scrollContainer) {
              // Scroll to show the entire AI message from the top (including the text before the embedded component)
              const messageTop = (messageBubble as HTMLElement).offsetTop;
              scrollContainer.scrollTop = messageTop - 24; // 24px offset for breathing room
            }
          }
        });
      });
    }
  }, []);

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
    <div className="space-y-4 scroll-mt-4" ref={containerRef}>
      {/* Filters and search in one row */}
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

        <div className="relative flex-1">
          <Icon icon={Search} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search doctors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            disabled={disabled}
          />
        </div>
      </div>

      {/* Doctor cards */}
      <Card>
        <CardContent className="p-0 divide-y">
          {(expanded ? filteredDoctors : filteredDoctors.slice(0, 2)).map((doctor) => (
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
              reviewCount={doctor.total_reviews}
              consultationModes={doctor.consultation_modes}
              videoFee={doctor.video_fee}
              inPersonFee={doctor.in_person_fee}
              slots={doctor.slots}
              selectedTime={selectedDoctorId === doctor.id ? selectedTime : null}
              onSelectTime={(time) => onSelect(doctor.id, time)}
              disabled={disabled}
            />
          ))}

          {filteredDoctors.length > 2 && (
            <div
              className="px-6 py-4 flex justify-center cursor-pointer hover:bg-accent transition-colors"
              onClick={() => setExpanded(!expanded)}
            >
              <span className="text-label text-primary">
                {expanded ? 'Show less' : `View all ${filteredDoctors.length} doctors`}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
