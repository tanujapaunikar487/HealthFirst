import * as React from 'react';
import { cn } from '@/Lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
import { Button } from '@/Components/ui/button';
import { Check, Star, Video, User, Search, ChevronDown } from 'lucide-react';
import { EmbeddedDoctorList } from './embedded/EmbeddedDoctorList';
import { EmbeddedLocationSelector } from './embedded/EmbeddedLocationSelector';
import { EmbeddedPackageList } from './embedded/EmbeddedPackageList';
import { EmbeddedConsultationType } from './embedded/EmbeddedConsultationType';
import { EmbeddedUrgencySelector } from './embedded/EmbeddedUrgencySelector';
import { EmbeddedConsultationMode } from './embedded/EmbeddedConsultationMode';
import { EmbeddedBookingSummary } from './embedded/EmbeddedBookingSummary';

/**
 * EmbeddedComponent
 *
 * Renders interactive components embedded in assistant messages.
 * Handles patient selection, consultation type, urgency levels, doctor cards, etc.
 */

interface EmbeddedComponentProps {
  type: string;
  data: any;
  selection: any;
  familyMembers?: any[];
  conversationId?: string;
  onSelect: (value: any) => void;
  disabled?: boolean;
}

// Dummy data - avatars will show initials by default, can be updated with profile images later
const DUMMY_FAMILY_MEMBERS = [
  { id: 1, name: 'Sanjana Jaisinghani', relation: 'Self', avatar: '' },
  { id: 2, name: 'Richa Jaisinghani', relation: 'Mother', avatar: '' },
  { id: 3, name: 'Prateek Jaisinghani', relation: 'Father', avatar: '' },
  { id: 4, name: 'Manav Jaisinghani', relation: 'Brother', avatar: '' },
  { id: 5, name: 'Kriti Jaisinghani', relation: 'Sister', avatar: '' },
  { id: 6, name: 'Prateek Jaisinghani', relation: 'Grandfather', avatar: '' },
];

const DUMMY_DOCTORS = [
  {
    id: '1',
    name: 'Dr. Sarah Johnson',
    specialization: 'General Physician',
    experience_years: 15,
    avatar: null,
    consultation_modes: ['video', 'in_person'],
    video_fee: 800,
    in_person_fee: 1200,
    slots: [
      { time: '09:00', preferred: true, available: true },
      { time: '10:00', preferred: true, available: true },
      { time: '11:00', preferred: false, available: true },
      { time: '14:00', preferred: false, available: true },
      { time: '15:00', preferred: false, available: true },
      { time: '17:00', preferred: false, available: true },
    ],
  },
  {
    id: '2',
    name: 'Dr. Michael Chen',
    specialization: 'Cardiologist',
    experience_years: 12,
    avatar: null,
    consultation_modes: ['video', 'in_person'],
    video_fee: 800,
    in_person_fee: 1200,
    slots: [
      { time: '09:00', preferred: true, available: true },
      { time: '10:00', preferred: true, available: true },
      { time: '11:00', preferred: false, available: true },
      { time: '14:00', preferred: false, available: true },
      { time: '15:00', preferred: false, available: true },
      { time: '17:00', preferred: false, available: true },
    ],
  },
  {
    id: '3',
    name: 'Dr. Priya Sharma',
    specialization: 'Dermatologist',
    experience_years: 10,
    avatar: null,
    consultation_modes: ['video', 'in_person'],
    video_fee: 800,
    in_person_fee: 1200,
    slots: [
      { time: '09:00', preferred: true, available: true },
      { time: '10:00', preferred: true, available: true },
      { time: '11:00', preferred: false, available: true },
      { time: '14:00', preferred: false, available: true },
      { time: '15:00', preferred: false, available: true },
      { time: '17:00', preferred: false, available: true },
    ],
  },
];

const DUMMY_PACKAGES = [
  {
    id: '1',
    name: 'Basic Health Checkup',
    description: 'Essential tests for general wellness monitoring',
    duration_hours: '2-3',
    tests_count: 35,
    age_range: '18-60',
    price: 1999,
    original_price: 2999,
    is_recommended: true,
  },
  {
    id: '2',
    name: 'Comprehensive Health Package',
    description: 'Complete health assessment with advanced screenings',
    duration_hours: '3-4',
    tests_count: 68,
    age_range: '18-60',
    price: 4999,
    original_price: 7999,
    is_recommended: false,
  },
];

export function EmbeddedComponent({
  type,
  data,
  selection,
  familyMembers = [],
  conversationId,
  onSelect,
  disabled = false,
}: EmbeddedComponentProps) {
  const isSelected = selection !== null;

  // Use dummy data if not provided
  const patients = data?.patients || familyMembers.length > 0 ? familyMembers : DUMMY_FAMILY_MEMBERS;
  const doctors = data?.doctors || DUMMY_DOCTORS;
  const packages = data?.packages || DUMMY_PACKAGES;

  switch (type) {
    case 'patient_selector':
      return (
        <PatientSelector
          patients={patients}
          selected={selection?.patient_id}
          onSelect={(id) => onSelect({ patient_id: id })}
          disabled={disabled || isSelected}
        />
      );

    case 'consultation_type_selector':
      return (
        <EmbeddedConsultationType
          selectedType={selection?.consultation_type}
          onSelect={(type) => onSelect({ consultation_type: type })}
          disabled={disabled || isSelected}
        />
      );

    case 'urgency_selector':
      return (
        <EmbeddedUrgencySelector
          selectedUrgency={selection?.urgency}
          onSelect={(urgency) => onSelect({ urgency })}
          disabled={disabled || isSelected}
        />
      );

    case 'doctor_list':
      return (
        <EmbeddedDoctorList
          doctors={doctors}
          selectedDoctorId={selection?.doctor_id}
          selectedTime={selection?.time}
          onSelect={(doctorId, time) => onSelect({ doctor_id: doctorId, time })}
          disabled={disabled || isSelected}
        />
      );

    case 'mode_selector':
      return (
        <EmbeddedConsultationMode
          modes={data?.modes || [
            { type: 'video', price: 800 },
            { type: 'in_person', price: 1200 },
          ]}
          selectedMode={selection?.mode}
          onSelect={(mode) => onSelect({ mode })}
          disabled={disabled || isSelected}
        />
      );

    case 'booking_summary':
      return (
        <EmbeddedBookingSummary
          summary={data?.summary || {
            doctor: { name: 'Dr. Meera Iyer', avatar: null },
            patient: { name: 'Kriti Jaisinghani', avatar: null },
            datetime: '2026-01-25T08:00:00',
            type: 'Video Consultation',
            fee: 800,
          }}
          onPay={() => onSelect({ action: 'pay' })}
          conversationId={conversationId || ''}
          disabled={disabled}
        />
      );

    case 'test_type_selector':
      return (
        <OptionSelector
          options={data?.types || []}
          selected={selection?.test_type}
          onSelect={(id) => onSelect({ test_type: id })}
          disabled={disabled || isSelected}
        />
      );

    case 'package_list':
      return (
        <EmbeddedPackageList
          packages={packages}
          selectedPackageId={selection?.package_id}
          onSelect={(id) => onSelect({ package_id: id })}
          disabled={disabled || isSelected}
        />
      );

    case 'location_selector':
      return (
        <EmbeddedLocationSelector
          locations={data?.locations || []}
          selectedLocationId={selection?.location_id}
          onSelect={(id) => onSelect({ location_id: id })}
          disabled={disabled || isSelected}
        />
      );

    case 'date_picker':
    case 'time_slot_picker':
      return (
        <DateTimePicker
          selectedDate={selection?.date}
          selectedTime={selection?.time}
          onSelect={(date, time) => onSelect({ date, time })}
          disabled={disabled || isSelected}
          warning={data?.warning}
        />
      );

    default:
      console.warn(`Unknown embedded component type: ${type}`);
      return null;
  }
}

// Patient Selector Component - 2 column grid
function PatientSelector({ patients, selected, onSelect, disabled }: any) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2 max-w-2xl">
        {patients.map((patient: any) => (
          <button
            key={patient.id}
            onClick={() => !disabled && onSelect(patient.id)}
            disabled={disabled}
            className={cn(
              'flex items-center gap-2.5 p-3 rounded-xl border transition-all text-left',
              'hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60',
              selected === patient.id
                ? 'border-primary bg-accent'
                : 'border-border bg-background'
            )}
          >
            <Avatar className="w-9 h-9 flex-shrink-0">
              <AvatarImage src={patient.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 text-xs font-medium">
                {patient.name.split(' ').map((n: string) => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-[13px] leading-tight text-foreground truncate">{patient.name}</div>
              {patient.relation && (
                <div className="text-[11px] leading-tight text-muted-foreground mt-0.5">{patient.relation}</div>
              )}
            </div>
          </button>
        ))}
      </div>

      <button className="text-[13px] text-foreground hover:text-primary transition-colors flex items-center gap-1 mt-2">
        Add family member or guest →
      </button>
    </div>
  );
}

// Generic Option Selector (for consultation type, test type)
function OptionSelector({ options, selected, onSelect, disabled }: any) {
  return (
    <div className="flex flex-wrap gap-2 max-w-xl">
      {options.map((option: any) => (
        <button
          key={option.id}
          onClick={() => !disabled && onSelect(option.id)}
          disabled={disabled}
          className={cn(
            'px-5 py-2.5 rounded-full border-2 text-sm font-medium transition-all',
            'hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60',
            selected === option.id
              ? 'border-[#0052FF] bg-blue-50 text-[#0A0B0D]'
              : 'border-gray-200 bg-white text-[#0A0B0D]'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

// Urgency Selector with colored indicators
function UrgencySelector({ levels, selected, onSelect, disabled }: any) {
  const getIndicatorColor = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case 'urgent':
        return 'bg-red-500';
      case 'this_week':
        return 'bg-orange-500';
      case 'specific_date':
        return 'bg-blue-500';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className="space-y-2 max-w-2xl">
      {levels.map((level: any) => (
        <button
          key={level.id}
          onClick={() => !disabled && onSelect(level.id)}
          disabled={disabled}
          className={cn(
            'w-full flex items-start gap-3 p-4 rounded-2xl border-2 transition-all text-left',
            'hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60',
            selected === level.id
              ? 'border-[#0052FF] bg-blue-50'
              : 'border-gray-200 bg-white'
          )}
        >
          <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', getIndicatorColor(level.id))} />
          <div className="flex-1">
            <div className="font-semibold text-sm text-[#0A0B0D]">{level.label}</div>
            {level.description && (
              <div className="text-xs text-gray-500 mt-0.5">{level.description}</div>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

// Doctor List with time slots and badges
function DoctorList({ doctors, selectedDoctorId, selectedTime, onSelect, disabled }: any) {
  const [searchQuery, setSearchQuery] = React.useState('');

  return (
    <div className="space-y-4 max-w-3xl">
      {/* Search and filter header */}
      <div className="flex items-center gap-3">
        <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-[#0A0B0D] hover:bg-gray-50">
          Recommended <ChevronDown className="w-4 h-4" />
        </button>
        <div className="flex-1 flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search patient, doctor, date"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 text-sm bg-transparent border-0 outline-none placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Doctor cards */}
      <div className="space-y-3">
        {doctors.map((doctor: any) => (
          <div
            key={doctor.id}
            className={cn(
              'p-4 rounded-2xl border-2 transition-all',
              selectedDoctorId === doctor.id
                ? 'border-[#0052FF] bg-blue-50'
                : 'border-gray-200 bg-white'
            )}
          >
            {/* Doctor info */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3 flex-1">
                <Avatar className="w-12 h-12 flex-shrink-0">
                  <AvatarImage src={doctor.avatar} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 font-semibold">
                    {doctor.name.split(' ').slice(1).map((n: string) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-semibold text-sm text-[#0A0B0D]">{doctor.name}</div>
                  <div className="text-xs text-gray-600">{doctor.specialty} • {doctor.experience}</div>
                </div>
              </div>
              <div className="flex items-start gap-2 flex-shrink-0">
                {doctor.modes?.includes('video') && (
                  <span className="px-2 py-1 text-xs font-medium text-[#0052FF] bg-blue-100 rounded">Video</span>
                )}
                {doctor.modes?.includes('in_person') && (
                  <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded">In-hospital</span>
                )}
                <div className="text-right">
                  <div className="font-semibold text-sm text-[#0A0B0D]">₹{doctor.fees?.video || doctor.fees}</div>
                  {doctor.fees?.in_person && doctor.fees.in_person !== doctor.fees.video && (
                    <div className="text-xs text-gray-500">/ {doctor.fees.in_person}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Time slots */}
            {doctor.slots && doctor.slots.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {doctor.slots.map((slot: any) => (
                  <button
                    key={slot.time}
                    onClick={() => !disabled && onSelect(doctor.id, slot.time)}
                    disabled={disabled}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1',
                      'hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60',
                      selectedDoctorId === doctor.id && selectedTime === slot.time
                        ? 'bg-[#0A0B0D] text-white'
                        : 'bg-white border border-gray-200 text-[#0A0B0D]'
                    )}
                  >
                    {slot.time}
                    {slot.priority && <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Consultation Mode Selector (Video vs In-Person)
function ConsultationModeSelector({ modes, selected, onSelect, disabled }: any) {
  return (
    <div className="space-y-3 max-w-2xl">
      {modes.map((mode: any) => (
        <button
          key={mode.id}
          onClick={() => !disabled && onSelect(mode.id)}
          disabled={disabled}
          className={cn(
            'w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left',
            'hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60',
            selected === mode.id
              ? 'border-[#0052FF] bg-blue-50'
              : 'border-gray-200 bg-white'
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              {mode.id === 'video' ? (
                <Video className="w-5 h-5 text-[#0052FF]" />
              ) : (
                <User className="w-5 h-5 text-[#0052FF]" />
              )}
            </div>
            <div>
              <div className="font-semibold text-sm text-[#0A0B0D]">{mode.label}</div>
              <div className="text-xs text-gray-500">{mode.description}</div>
            </div>
          </div>
          <div className="font-semibold text-sm text-[#0A0B0D]">₹{mode.price}</div>
        </button>
      ))}
    </div>
  );
}

// Booking Summary with payment button
function BookingSummary({ summary, onPay, disabled }: any) {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-white border-2 border-gray-200 rounded-2xl p-5">
        <div className="space-y-4">
          {Object.entries(summary || {}).map(([key, value]: [string, any]) => {
            if (key === 'consultation_fee' || key === 'total') return null;

            return (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 capitalize">{key.replace(/_/g, ' ')}</span>
                <div className="flex items-center gap-2">
                  {value.avatar && (
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={value.avatar} />
                      <AvatarFallback className="text-xs">{value.label?.[0]}</AvatarFallback>
                    </Avatar>
                  )}
                  <span className="text-sm font-medium text-[#0A0B0D]">{value.label || String(value)}</span>
                  <button className="text-[#0052FF] text-sm font-medium hover:underline">Change</button>
                </div>
              </div>
            );
          })}
          {(summary?.consultation_fee || summary?.total) && (
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm font-medium text-gray-600">Consultation Fee</span>
              <span className="text-sm font-semibold text-[#0A0B0D]">
                ₹{summary.consultation_fee || summary.total}
              </span>
            </div>
          )}
        </div>
      </div>

      <Button
        onClick={onPay}
        disabled={disabled}
        size="lg"
        rounded="full"
        className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white"
      >
        Pay ₹{summary?.consultation_fee || summary?.total || '800'}
      </Button>
    </div>
  );
}

// Package List Component
function PackageList({ packages, selected, onSelect, disabled }: any) {
  return (
    <div className="space-y-3 max-w-2xl">
      {packages.map((pkg: any) => (
        <button
          key={pkg.id}
          onClick={() => !disabled && onSelect(pkg.id)}
          disabled={disabled}
          className={cn(
            'w-full p-4 rounded-2xl border-2 transition-all text-left',
            'hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60',
            selected === pkg.id
              ? 'border-[#0052FF] bg-blue-50'
              : 'border-gray-200 bg-white'
          )}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="font-semibold text-sm text-[#0A0B0D]">{pkg.name}</div>
              <div className="text-xs text-gray-600 mt-1">
                {pkg.tests_included?.join(', ')}
              </div>
              <div className="text-[10px] text-gray-500 mt-2">Duration: {pkg.duration}</div>
            </div>
            <div className="text-right flex-shrink-0 ml-4">
              <div className="font-semibold text-sm text-[#0A0B0D]">₹{pkg.price}</div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

// Location Selector Component
function LocationSelector({ locations, selected, onSelect, disabled }: any) {
  return (
    <div className="space-y-2 max-w-2xl">
      {locations.map((location: any) => (
        <button
          key={location.id}
          onClick={() => !disabled && onSelect(location.id)}
          disabled={disabled}
          className={cn(
            'w-full p-3 rounded-xl border-2 transition-all text-left',
            'hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60',
            selected === location.id
              ? 'border-[#0052FF] bg-blue-50'
              : 'border-gray-200 bg-white'
          )}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm text-[#0A0B0D]">{location.name}</div>
              <div className="text-xs text-gray-500">{location.address}</div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

// Date Time Picker Component
function DateTimePicker({ selectedDate, selectedTime, onSelect, disabled, warning }: any) {
  const [tempDate, setTempDate] = React.useState(selectedDate);
  const [tempTime, setTempTime] = React.useState(selectedTime);

  // Generate next 5 days
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dates = Array.from({ length: 5 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    return date;
  });

  // Mock time slots
  const timeSlots = [
    { time: '9:00 AM', preferred: true, available: true },
    { time: '10:00 AM', preferred: true, available: true },
    { time: '11:00 AM', preferred: false, available: true },
    { time: '2:00 PM', preferred: false, available: true },
    { time: '3:00 PM', preferred: false, available: true },
    { time: '5:00 PM', preferred: false, available: true },
  ];

  const formatDateLabel = (date: Date, index: number) => {
    if (index === 0) return 'Today';
    if (index === 1) return 'Tomorrow';
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  };

  const formatDateValue = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const formatDateDisplay = (date: Date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  };

  const handleDateSelect = (dateValue: string) => {
    if (disabled) return;
    setTempDate(dateValue);
    // If time is already selected, submit both
    if (tempTime) {
      onSelect(dateValue, tempTime);
    }
  };

  const handleTimeSelect = (time: string) => {
    if (disabled) return;
    setTempTime(time);
    // If date is already selected, submit both
    if (tempDate) {
      onSelect(tempDate, time);
    }
  };

  return (
    <div className="space-y-4 max-w-3xl">
      {/* Warning message (e.g., fasting required) */}
      {warning && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">!</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-amber-900 mb-1">{warning.title}</p>
              <p className="text-sm text-amber-800">{warning.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Date selection */}
      <div>
        <h4 className="font-semibold text-sm mb-3 text-foreground">Date</h4>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {dates.map((date, index) => {
            const dateValue = formatDateValue(date);
            const isSelected = tempDate === dateValue || selectedDate === dateValue;

            return (
              <button
                key={dateValue}
                onClick={() => handleDateSelect(dateValue)}
                disabled={disabled}
                className={cn(
                  'flex-shrink-0 px-6 py-3 rounded-3xl border transition-all min-w-[120px]',
                  'hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60',
                  isSelected
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border bg-background text-foreground'
                )}
              >
                <div className={cn('font-semibold text-sm', isSelected && 'text-background')}>
                  {formatDateLabel(date, index)}
                </div>
                <div className={cn('text-xs', isSelected ? 'text-background/70' : 'text-muted-foreground')}>
                  {formatDateDisplay(date)}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time selection */}
      <div>
        <h4 className="font-semibold text-sm mb-3 text-foreground">
          Time {warning && <span className="text-xs font-normal text-muted-foreground">(morning recommended)</span>}
        </h4>
        <div className="flex flex-wrap gap-2">
          {timeSlots.map((slot) => {
            const isSelected = tempTime === slot.time || selectedTime === slot.time;

            return (
              <button
                key={slot.time}
                onClick={() => handleTimeSelect(slot.time)}
                disabled={disabled || !slot.available}
                className={cn(
                  'px-3.5 py-1.5 rounded-full border text-xs font-medium transition-all inline-flex items-center gap-1.5',
                  'hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60',
                  isSelected
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border bg-background text-foreground'
                )}
              >
                {slot.time}
                {slot.preferred && !isSelected && <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
