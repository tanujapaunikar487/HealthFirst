import * as React from 'react';
import { cn } from '@/Lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
import { Button } from '@/Components/ui/button';
import { Check, Star, Video, User, Search, ChevronDown } from 'lucide-react';
import { EmbeddedDoctorList } from './embedded/EmbeddedDoctorList';
import { EmbeddedLocationSelector } from './embedded/EmbeddedLocationSelector';
import { EmbeddedPackageList } from './embedded/EmbeddedPackageList';
import { EmbeddedAppointmentType } from './embedded/EmbeddedAppointmentType';
import { EmbeddedUrgencySelector } from './embedded/EmbeddedUrgencySelector';
import { EmbeddedAppointmentMode } from './embedded/EmbeddedAppointmentMode';
import { EmbeddedBookingSummary } from './embedded/EmbeddedBookingSummary';
import { EmbeddedFollowUpFlow } from './embedded/EmbeddedFollowUpFlow';
import { EmbeddedPreviousDoctorsList } from './embedded/EmbeddedPreviousDoctorsList';
import { EmbeddedDateTimeSelector } from './embedded/EmbeddedDateTimeSelector';

/**
 * EmbeddedComponent
 *
 * Renders interactive components embedded in assistant messages.
 * Handles patient selection, appointment type, urgency levels, doctor cards, etc.
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

// Helper function to generate time slots
function generateTimeSlots() {
  const morningSlots = [
    { time: '9:00 AM', available: true, preferred: true },
    { time: '10:00 AM', available: true, preferred: true },
    { time: '11:00 AM', available: true, preferred: false },
  ];
  const afternoonSlots = [
    { time: '2:00 PM', available: true, preferred: false },
    { time: '3:00 PM', available: true, preferred: false },
    { time: '5:00 PM', available: true, preferred: false },
  ];
  return [...morningSlots, ...afternoonSlots];
}

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
          onSelect={(id) => {
            const patient = patients.find((p: any) => p.id === id);
            onSelect({
              patient_id: id,
              patient_name: patient?.name || 'Patient',
              display_message: patient?.name || 'Patient selected'
            });
          }}
          disabled={disabled || isSelected}
        />
      );

    case 'consultation_type_selector':
      return (
        <EmbeddedAppointmentType
          selectedType={selection?.consultation_type}
          onSelect={(type) => onSelect({ consultation_type: type })}
          disabled={disabled || isSelected}
        />
      );

    case 'appointment_type_selector':
      return (
        <div className="flex gap-3 mt-3">
          {data?.options?.map((option: any) => (
            <button
              key={option.id}
              onClick={() => onSelect({
                appointment_type: option.id,
                display_message: option.label
              })}
              disabled={disabled || isSelected}
              className="flex-1 px-6 py-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="font-semibold text-gray-900">{option.label}</div>
              {option.description && (
                <div className="text-sm text-gray-500 mt-1">{option.description}</div>
              )}
            </button>
          ))}
        </div>
      );

    case 'followup_reason':
    case 'followup_reason_selector':
      return (
        <div className="flex flex-col gap-3 mt-3">
          {data?.options?.map((option: any) => (
            <button
              key={option.id || option.value}
              onClick={() =>
                onSelect({
                  followup_reason: option.value || option.id,
                  display_message: option.label, // ✅ Send human-readable label
                })
              }
              disabled={disabled || isSelected}
              className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
            >
              <div className="font-semibold text-gray-900">{option.label}</div>
              {option.description && (
                <div className="text-sm text-gray-500 mt-1">{option.description}</div>
              )}
            </button>
          ))}
        </div>
      );

    case 'urgency_selector':
      const urgencyLabels: Record<string, string> = {
        'urgent': 'Urgent - Today/ASAP',
        'this_week': 'This Week',
        'specific_date': "I have a specific date in mind"
      };
      return (
        <EmbeddedUrgencySelector
          selectedUrgency={selection?.urgency}
          onSelect={(urgency) => onSelect({
            urgency,
            display_message: urgencyLabels[urgency] || urgency
          })}
          disabled={disabled || isSelected}
        />
      );

    case 'doctor_list':
      return (
        <EmbeddedDoctorList
          doctors={doctors}
          selectedDoctorId={selection?.doctor_id}
          selectedTime={selection?.time}
          onSelect={(doctorId, time) => {
            const doctor = doctors.find((d: any) => d.id === doctorId);
            onSelect({
              doctor_id: doctorId,
              doctor_name: doctor?.name || 'Doctor',
              time,
              display_message: `${doctor?.name || 'Doctor'} at ${time}`
            });
          }}
          disabled={disabled || isSelected}
        />
      );

    // Component type aliases - map variations to standard types
    case 'appointment_mode':
    case 'consultation_mode':
    case 'mode_selector':
      return (
        <EmbeddedAppointmentMode
          modes={data?.modes || [
            { type: 'in_person', price: 1200 },
          ]}
          selectedMode={selection?.mode}
          onSelect={(mode) =>
            onSelect({
              mode,
              display_message: mode === 'video' ? 'Video Appointment' : 'In-Person Visit',
            })
          }
          disabled={disabled || isSelected}
        />
      );

    case 'booking_summary':
      return (
        <EmbeddedBookingSummary
          summary={data}
          onPay={() => onSelect({ action: 'pay' })}
          onSelect={onSelect}
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
          onChangeAddress={() => {
            // In real app, send message to AI to change address
            alert('Change address - will allow user to enter new address via AI chat');
          }}
          onChangeBranch={() => {
            // In real app, send message to AI to change branch
            alert('Change branch - will show available branches via AI chat');
          }}
          disabled={disabled || isSelected}
        />
      );

    case 'date_time_selector':
      return (
        <EmbeddedDateTimeSelector
          dates={data?.dates || []}
          slots={data?.slots || generateTimeSlots()}
          fastingRequired={data?.fasting_required}
          fastingHours={data?.fasting_hours}
          selectedDate={selection?.date}
          selectedTime={selection?.time}
          onSelect={(date, time) => onSelect({
            date,
            time,
            display_message: `${date} at ${time}`
          })}
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

    case 'followup_flow':
      return (
        <EmbeddedFollowUpFlow
          previousVisit={data?.previousVisit}
          selectedReason={selection?.reason}
          onSelect={(reason) => onSelect({ reason })}
          disabled={disabled || isSelected}
        />
      );

    case 'previous_doctors':
      const previousDoctors = data?.options || [];
      const showAllDoctorsOption = data?.show_all_doctors_option || false;

      if (previousDoctors.length === 0) {
        // No previous doctors, show all doctors button
        return (
          <div className="mt-3">
            <button
              onClick={() => onSelect({ show_all_doctors: true })}
              disabled={disabled || isSelected}
              className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
            >
              <div className="font-semibold text-gray-900">See all available doctors</div>
              <div className="text-sm text-gray-500 mt-1">Browse our full list of doctors</div>
            </button>
          </div>
        );
      }

      return (
        <div className="space-y-3 mt-3">
          <div className="flex flex-col gap-3">
            {previousDoctors.map((doctor: any) => {
              // Check if name already starts with "Dr."
              const displayName = doctor.name?.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`;

              return (
                <button
                  key={doctor.id}
                  onClick={() =>
                    onSelect({
                      doctor_id: doctor.id,
                      doctor_name: doctor.name,
                      from_previous_doctors: true,
                      display_message: displayName,
                    })
                  }
                  disabled={disabled || isSelected}
                className={cn(
                  'w-full px-6 py-4 border-2 border-gray-200 rounded-xl text-left transition-all',
                  'hover:border-blue-500 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed',
                  selection?.doctor_id === doctor.id && 'border-blue-500 bg-blue-50'
                )}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={doctor.avatar || undefined} />
                    <AvatarFallback className="bg-amber-500 text-white">
                      {doctor.name?.charAt(0) || 'D'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{doctor.name}</div>
                    <div className="text-sm text-gray-500">{doctor.specialization}</div>
                    {doctor.last_visit && (
                      <div className="text-xs text-blue-600 mt-1">Last visit: {doctor.last_visit}</div>
                    )}
                  </div>
                </div>
              </button>
              );
            })}
          </div>
          {showAllDoctorsOption && (
            <button
              onClick={() => onSelect({ show_all_doctors: true })}
              disabled={disabled || isSelected}
              className="w-full px-6 py-3 border-2 border-gray-300 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="text-sm font-semibold text-gray-700">Or see all other doctors</div>
            </button>
          )}
        </div>
      );

    case 'mode_comparison':
      return (
        <ModeComparison
          modes={data?.modes || []}
          recommendation={data?.recommendation}
          onSelect={(mode) => onSelect({ mode })}
          disabled={disabled || isSelected}
        />
      );

    case 'action_list':
      return (
        <ActionList
          actions={data?.actions || []}
          onSelect={(actionId) => onSelect({ action_id: actionId })}
          disabled={disabled || isSelected}
        />
      );

    case 'info_links':
      return (
        <InfoLinks
          links={data?.links || []}
          onSelect={(linkId) => onSelect({ link_id: linkId })}
          disabled={disabled || isSelected}
        />
      );

    case 'confirmation_buttons':
      return (
        <ConfirmationButtons
          options={data?.options || []}
          onSelect={(optionId) => onSelect({ option_id: optionId })}
          disabled={disabled || isSelected}
        />
      );

    case 'emergency_warning':
    case 'emergency_alert':
      return (
        <EmergencyWarning
          emergencyNumbers={data?.emergency_numbers || ['108', '112']}
          category={data?.category}
          disabled={disabled}
        />
      );

    case 'schedule_conflict':
      return (
        <ScheduleConflict
          existing={data?.existing}
          newAppointment={data?.new}
          onSelect={(actionId) => onSelect({ action_id: actionId})}
          disabled={disabled || isSelected}
        />
      );

    // Intelligent Orchestrator component types
    case 'doctor_selector':
      console.log('EmbeddedComponent doctor_selector:', {
        has_data: !!data,
        doctors_from_data: data?.doctors,
        doctors_fallback: doctors,
        doctors_count: data?.doctors?.length || doctors?.length || 0
      });
      return (
        <EmbeddedDoctorList
          doctors={data?.doctors || doctors}
          selectedDoctorId={selection?.doctor_id}
          selectedTime={selection?.time}
          onSelect={(doctorId, time) => {
            const doctor = (data?.doctors || doctors).find((d: any) => d.id === doctorId);
            onSelect({
              doctor_id: doctorId,
              doctor_name: doctor?.name || 'Doctor',
              time,
              display_message: `${doctor?.name || 'Doctor'} at ${time}`
            });
          }}
          disabled={disabled || isSelected}
        />
      );

    case 'date_doctor_selector':
      // Combined component for "This Week" urgency
      // Use selected_date from backend if available, otherwise default to today
      const initialDate = data?.selected_date || selection?.date || new Date().toISOString().split('T')[0];
      const [selectedDate, setSelectedDate] = React.useState(initialDate);

      // Sync with backend-provided selected_date when it changes
      React.useEffect(() => {
        if (data?.selected_date && data.selected_date !== selectedDate) {
          setSelectedDate(data.selected_date);
        }
      }, [data?.selected_date]);

      return (
        <div className="space-y-4">
          {/* Date pills */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {data?.dates?.map((d: any) => {
              const dateValue = d.value || d.date;
              const isSelected = dateValue === selectedDate || dateValue === data?.selected_date;

              return (
                <button
                  key={dateValue}
                  onClick={() => setSelectedDate(dateValue)}
                  disabled={disabled}
                  className={cn(
                    'px-4 py-2 rounded-lg whitespace-nowrap transition-colors',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    isSelected
                      ? 'bg-[#0052FF] text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  )}
                >
                  <div className="font-medium text-sm">{d.label}</div>
                  <div className="text-xs opacity-75">{d.day}</div>
                </button>
              );
            })}
          </div>

          {/* Doctors heading */}
          <div>
            <h3 className="text-lg font-semibold">{data?.doctors_count || 0} doctors available</h3>
            <p className="text-sm text-gray-500">{data?.doctors_subtitle}</p>
          </div>

          {/* Doctor list */}
          <EmbeddedDoctorList
            doctors={data?.doctors || []}
            selectedDoctorId={selection?.doctor_id}
            selectedTime={selection?.time}
            onSelect={(doctorId, time) => {
              const doctor = (data?.doctors || []).find((d: any) => d.id === doctorId);
              onSelect({
                doctor_id: doctorId,
                doctor_name: doctor?.name || 'Doctor',
                time,
                date: selectedDate,
                display_message: `${doctor?.name || 'Doctor'} on ${selectedDate} at ${time}`
              });
            }}
            disabled={disabled || isSelected}
          />
        </div>
      );

    case 'week_date_selector':
      // Simple date pills for "this week" urgency
      const [selectedWeekDate, setSelectedWeekDate] = React.useState(data?.selected_date || new Date().toISOString().split('T')[0]);

      return (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {data?.dates?.map((d: any) => (
            <button
              key={d.date}
              onClick={() => {
                setSelectedWeekDate(d.date);
                onSelect({ date: d.date });
              }}
              disabled={disabled}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                d.date === selectedWeekDate
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <div className="font-medium text-sm">{d.label}</div>
              <div className="text-xs opacity-75">{d.day}</div>
            </button>
          ))}
        </div>
      );

    case 'date_selector':
      return (
        <DateTimePicker
          selectedDate={selection?.date}
          selectedTime={null}
          onSelect={(date, time) => onSelect({ date })}
          disabled={disabled || isSelected}
          warning={data?.fasting_required ? {
            title: 'Fasting Required',
            description: `Please fast for ${data.fasting_hours || 8} hours before your test.`
          } : null}
        />
      );

    case 'time_slot_selector':
      return (
        <DateTimePicker
          selectedDate={data?.date || selection?.date}
          selectedTime={selection?.time}
          onSelect={(date, time) => onSelect({ date, time })}
          disabled={disabled || isSelected}
          warning={data?.warning}
          availableDates={data?.dates}
          availableSlots={data?.slots}
          doctorName={data?.doctor_name}
        />
      );

    case 'test_selector':
      return (
        <EmbeddedPackageList
          packages={data?.tests || packages}
          selectedPackageId={selection?.test_id}
          onSelect={(id) => onSelect({ test_id: id })}
          disabled={disabled || isSelected}
        />
      );

    case 'text_input':
      return <TextInputComponent data={data} onSelect={onSelect} disabled={disabled || isSelected} />;

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
              <div className="font-medium text-sm leading-tight text-foreground truncate">{patient.name}</div>
              {patient.relation && (
                <div className="text-xs leading-tight text-muted-foreground mt-0.5">{patient.relation}</div>
              )}
            </div>
          </button>
        ))}
      </div>

      <button className="text-sm text-foreground hover:text-primary transition-colors flex items-center gap-1 mt-2">
        Add family member or guest →
      </button>
    </div>
  );
}

// Generic Option Selector (for appointment type, test type)
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

// Appointment Mode Selector (Video vs In-Person)
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
              <span className="text-sm font-medium text-gray-600">Appointment Fee</span>
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
function DateTimePicker({ selectedDate, selectedTime, onSelect, disabled, warning, availableDates, availableSlots }: any) {
  const [tempDate, setTempDate] = React.useState(selectedDate);
  const [tempTime, setTempTime] = React.useState(selectedTime);

  // Format 24-hour time to 12-hour display (e.g., "09:00" -> "9:00 AM")
  const formatTimeDisplay = (time24: string) => {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
  };

  // Use backend dates if available, otherwise generate next 5 days
  const dates = React.useMemo(() => {
    if (availableDates && availableDates.length > 0) {
      return availableDates.map((d: any) => ({
        value: d.date,
        label: d.label,
        sublabel: d.sublabel,
      }));
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: 5 }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return {
        value: date.toISOString().split('T')[0],
        label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : days[date.getDay()],
        sublabel: `${months[date.getMonth()]} ${date.getDate()}`,
      };
    });
  }, [availableDates]);

  // Use backend slots if available, otherwise use fallback
  const timeSlots = React.useMemo(() => {
    if (availableSlots && availableSlots.length > 0) {
      return availableSlots;
    }
    return [
      { time: '09:00', preferred: true, available: true },
      { time: '10:00', preferred: true, available: true },
      { time: '11:00', preferred: false, available: true },
      { time: '14:00', preferred: false, available: true },
      { time: '15:00', preferred: false, available: true },
      { time: '17:00', preferred: false, available: true },
    ];
  }, [availableSlots]);

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
          {dates.map((dateItem: any) => {
            const isSelected = tempDate === dateItem.value || selectedDate === dateItem.value;

            return (
              <button
                key={dateItem.value}
                onClick={() => handleDateSelect(dateItem.value)}
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
                  {dateItem.label}
                </div>
                <div className={cn('text-xs', isSelected ? 'text-background/70' : 'text-muted-foreground')}>
                  {dateItem.sublabel}
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
          {timeSlots.map((slot: any) => {
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
                {formatTimeDisplay(slot.time)}
                {slot.preferred && !isSelected && <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Mode Comparison Component (for clarification requests like "what's the difference?")
function ModeComparison({ modes, recommendation, onSelect, disabled }: any) {
  return (
    <div className="space-y-4">
      {modes.map((mode: any, index: number) => (
        <div
          key={mode.type}
          className="bg-white border border-border rounded-2xl p-4 hover:shadow-sm transition-shadow"
        >
          <h4 className="font-semibold text-base mb-3">{mode.title}</h4>
          <ul className="space-y-2">
            {mode.benefits.map((benefit: string, i: number) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-foreground">•</span>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {recommendation && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <p className="text-sm text-blue-900" dangerouslySetInnerHTML={{ __html: recommendation }} />
        </div>
      )}
    </div>
  );
}

// Action List Component (for multi-step actions)
function ActionList({ actions, onSelect, disabled }: any) {
  return (
    <div className="space-y-3">
      {actions.map((action: any) => (
        <button
          key={action.id}
          onClick={() => !disabled && onSelect(action.id)}
          disabled={disabled}
          className={cn(
            'w-full flex items-start gap-4 p-4 rounded-2xl border transition-all text-left',
            'hover:border-primary hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60',
            action.id === 'continue' ? 'bg-blue-50 border-primary' : 'bg-white border-border'
          )}
        >
          {action.number && (
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="font-semibold text-blue-900">{action.number}</span>
            </div>
          )}
          {action.icon && !action.number && (
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <img src={`/assets/icons/hugeicons/${action.icon}.svg`} alt="" className="w-4 h-4" />
            </div>
          )}
          <div className="flex-1">
            <div className="font-semibold text-foreground mb-1">{action.label}</div>
            {action.description && (
              <div className="text-sm text-muted-foreground">{action.description}</div>
            )}
          </div>
          <svg className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      ))}
    </div>
  );
}

// Info Links Component (for out-of-scope queries)
function InfoLinks({ links, onSelect, disabled }: any) {
  return (
    <div className="space-y-3">
      {links.map((link: any) => (
        <button
          key={link.id}
          onClick={() => !disabled && onSelect(link.id)}
          disabled={disabled}
          className="w-full flex items-start gap-4 p-4 rounded-2xl border border-border bg-white hover:border-primary hover:bg-blue-50 transition-all text-left disabled:cursor-not-allowed disabled:opacity-60"
        >
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            {link.icon === 'clock' && (
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {link.icon === 'phone' && (
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            )}
            {link.icon === 'help-circle' && (
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <div className="flex-1">
            <div className="font-semibold text-foreground mb-1">{link.title}</div>
            <div className="text-sm text-muted-foreground">{link.description}</div>
          </div>
          <svg className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      ))}
      <p className="text-sm text-muted-foreground text-center mt-4">
        Would you like to continue booking an appointment?
      </p>
    </div>
  );
}

// Confirmation Buttons Component
function ConfirmationButtons({ options, onSelect, disabled }: any) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((option: any, index: number) => (
        <button
          key={option.id}
          onClick={() => !disabled && onSelect(option.id)}
          disabled={disabled}
          className={cn(
            'px-6 py-3 rounded-full font-medium transition-all disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2',
            index === 0
              ? 'bg-primary text-white hover:bg-primary/90'
              : 'bg-white border border-border text-foreground hover:bg-gray-50'
          )}
        >
          {option.icon && option.icon === 'video' && (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
            </svg>
          )}
          {option.icon && option.icon === 'hospital' && (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          )}
          {option.icon && option.icon === 'info' && (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {option.label}
        </button>
      ))}
    </div>
  );
}

// Schedule Conflict Component
function ScheduleConflict({ existing, newAppointment, onSelect, disabled }: any) {
  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-amber-900 mb-1">Schedule Conflict</h3>
            <p className="text-sm text-amber-800">You already have an appointment at this time.</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Existing Appointment</p>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
            <span className="text-orange-600 font-bold text-lg">D</span>
          </div>
          <div>
            <p className="font-semibold text-gray-900">{existing?.doctor}</p>
            <p className="text-sm text-gray-600">
              {existing?.date && new Date(existing.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} • {existing?.time}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 rounded-2xl p-4 border-2 border-blue-400">
        <p className="text-xs font-semibold text-blue-700 uppercase mb-2">New Appointment</p>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-600 font-bold text-lg">D</span>
          </div>
          <div>
            <p className="font-semibold text-gray-900">{newAppointment?.doctor}</p>
            <p className="text-sm text-gray-600">
              {newAppointment?.date && new Date(newAppointment.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} • {newAppointment?.time}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <button
          onClick={() => !disabled && onSelect('pick_different_time')}
          disabled={disabled}
          className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 px-6 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
          Pick a different time for new appointment
        </button>
        <button
          onClick={() => !disabled && onSelect('cancel_and_book')}
          disabled={disabled}
          className="w-full bg-white hover:bg-gray-50 border border-border text-foreground font-medium py-3 px-6 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancel existing & book new
        </button>
        <button
          onClick={() => !disabled && onSelect('keep_existing')}
          disabled={disabled}
          className="w-full bg-white hover:bg-gray-50 text-gray-600 font-medium py-2.5 px-6 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
          Keep existing appointment
        </button>
      </div>
    </div>
  );
}

// Emergency Warning Component (CRITICAL - for medical emergencies)
function EmergencyWarning({ emergencyNumbers, category, disabled }: any) {
  return (
    <div className="bg-red-50 border-2 border-red-500 rounded-2xl p-6 space-y-4">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-500 flex items-center justify-center animate-pulse">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-red-900 mb-2">⚠️ Medical Emergency Detected</h3>
          <p className="text-red-800 font-medium mb-4">
            This sounds serious. Please do not wait for an appointment.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border border-red-200">
        <p className="font-semibold text-red-900 mb-3">Call Emergency Services Immediately:</p>
        <div className="flex gap-3">
          {emergencyNumbers.map((number: string) => (
            <a
              key={number}
              href={`tel:${number}`}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold text-xl py-3 px-6 rounded-full text-center transition-colors"
            >
              📞 {number}
            </a>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border border-red-200">
        <p className="font-semibold text-red-900 mb-2">Or:</p>
        <ul className="space-y-1.5 text-red-800">
          <li className="flex items-start gap-2">
            <span className="font-bold">•</span>
            <span>Go to the nearest emergency room immediately</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">•</span>
            <span>Have someone drive you (do not drive yourself)</span>
          </li>
        </ul>
      </div>

      <div className="text-center text-sm text-red-700 pt-2">
        If this is not an emergency, you can continue booking a routine appointment below.
      </div>
    </div>
  );
}

// Text Input Component (for followup_notes, symptoms, etc.)
function TextInputComponent({
  data,
  onSelect,
  disabled,
}: {
  data: any;
  onSelect: (value: any) => void;
  disabled: boolean;
}) {
  const [text, setText] = React.useState('');
  const field = data?.field || 'text_input';
  const placeholder = data?.placeholder || 'Type your response...';
  const skippable = data?.skippable || false;
  const skipText = data?.skip_text || 'Skip';

  const handleSubmit = () => {
    if (text.trim()) {
      onSelect({ [field]: text.trim(), field });
    }
  };

  const handleSkip = () => {
    onSelect({ skip: field });
  };

  return (
    <div className="mt-3 space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || !text.trim()}
          className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>
      {skippable && (
        <button
          onClick={handleSkip}
          disabled={disabled}
          className="text-sm text-gray-500 hover:text-gray-700 underline disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {skipText}
        </button>
      )}
    </div>
  );
}
