import * as React from 'react';
import { cn } from '@/Lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
import { getAvatarColor } from '@/Lib/avatar-colors';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Card } from '@/Components/ui/card';
import { Check, Star, Video, User, Search, ChevronDown, RefreshCw, AlertCircle, FileText, Pill, CalendarClock, UserPlus, CalendarPlus } from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';
import { EmbeddedDoctorList } from './embedded/EmbeddedDoctorList';
import { EmbeddedLocationSelector } from './embedded/EmbeddedLocationSelector';
import { EmbeddedPackageList } from './embedded/EmbeddedPackageList';
import { EmbeddedAppointmentType } from './embedded/EmbeddedAppointmentType';
import { EmbeddedUrgencySelector } from './embedded/EmbeddedUrgencySelector';
import { EmbeddedAppointmentMode } from './embedded/EmbeddedAppointmentMode';
import { EmbeddedBookingSummary } from './embedded/EmbeddedBookingSummary';
import { EmbeddedFollowUpFlow } from './embedded/EmbeddedFollowUpFlow';
import { EmbeddedPreviousDoctorsList } from './embedded/EmbeddedPreviousDoctorsList';
import { EmbeddedDateTimePicker } from './embedded/EmbeddedDateTimePicker';
import { EmbeddedCollectionMethod } from './embedded/EmbeddedCollectionMethod';
import { EmbeddedCenterList } from './embedded/EmbeddedCenterList';
import { EmbeddedAddressSelector } from './embedded/EmbeddedAddressSelector';
import { EmbeddedFamilyMemberForm } from './embedded/EmbeddedFamilyMemberForm';
import { EmbeddedAddressForm } from './embedded/EmbeddedAddressForm';
import EmbeddedFamilyMemberFlow from './embedded/EmbeddedFamilyMemberFlow';
import InlineMemberTypeSelector from './embedded/InlineMemberTypeSelector';
import { PatientSelector } from '@/Components/Booking/PatientSelector';
import { Alert } from '@/Components/ui/alert';

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
  defaultPatientId?: string | null;
  onSelect: (value: any) => void;
  disabled?: boolean;
}

// Fallback empty arrays — all data should come from the backend via props/data
const DUMMY_FAMILY_MEMBERS: any[] = [];
const DUMMY_DOCTORS: any[] = [];
const DUMMY_PACKAGES: any[] = [];

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

function getAvatarColorByName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return getAvatarColor(Math.abs(hash));
}

export function EmbeddedComponent({
  type,
  data,
  selection,
  familyMembers = [],
  conversationId,
  defaultPatientId,
  onSelect,
  disabled = false,
}: EmbeddedComponentProps) {
  const isSelected = selection !== null;

  // Use dummy data if not provided
  const patients = data?.patients || (familyMembers.length > 0 ? familyMembers : DUMMY_FAMILY_MEMBERS);
  const doctors = data?.doctors || DUMMY_DOCTORS;
  const packages = data?.packages || DUMMY_PACKAGES;

  switch (type) {
    case 'patient_selector':
      return (
        <PatientSelector
          patients={patients}
          selected={selection?.patient_id}
          defaultPatientId={defaultPatientId}
          onSelect={(id) => {
            const patient = patients.find((p: any) => p.id === id);
            onSelect({
              patient_id: id,
              patient_name: patient?.name || 'Patient',
              display_message: patient?.name || 'Patient selected'
            });
          }}
          onAddMember={() => {
            onSelect({
              add_family_member: true,
              display_message: 'Add family member or guest',
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
      const typeIconMap: Record<string, any> = {
        'new': UserPlus,
        'followup': RefreshCw,
      };

      return (
        <Card className="overflow-hidden">
          <div className="divide-y">
            {data?.options?.map((option: any) => {
              const optionSelected = isSelected && selection?.appointment_type === option.id;
              const TypeIcon = typeIconMap[option.id] || UserPlus;

              return (
                <Button
                  key={option.id}
                  variant="ghost"
                  onClick={() => onSelect({
                    appointment_type: option.id,
                    display_message: option.label
                  })}
                  disabled={disabled || isSelected}
                  className={cn(
                    "w-full h-auto rounded-none justify-start px-6 py-4 text-body hover:bg-muted/50",
                    "flex items-center gap-4 text-left transition-all",
                    optionSelected
                      ? "bg-primary/10 disabled:opacity-60"
                      : isSelected ? "disabled:opacity-30" : ""
                  )}
                >
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon icon={TypeIcon} size={20} className="text-primary" />
                </div>

                <div className="flex-1 min-w-0 text-left">
                  <p className="text-label text-foreground leading-tight mb-0.5">{option.label}</p>
                  {option.description && (
                    <p className="text-body text-muted-foreground leading-tight">{option.description}</p>
                  )}
                </div>
                </Button>
              );
            })}
          </div>
        </Card>
      );

    case 'followup_reason':
    case 'followup_reason_selector':
      const options = data?.options || [];

      // Icon mapping for followup reasons
      const reasonIconMap: Record<string, any> = {
        'scheduled': CalendarClock,
        'new_concern': AlertCircle,
        'ongoing_issue': RefreshCw,
        'test_results': FileText,
        'medication_review': Pill,
      };

      return (
        <Card className="overflow-hidden">
          <div className="divide-y">
            {options.map((option: any) => {
              const optionSelected = isSelected && data?.selected === (option.value || option.id);
              const OptionIcon = reasonIconMap[option.value || option.id] || RefreshCw;

              return (
                <Button
                  key={option.id || option.value}
                  variant="ghost"
                  onClick={() =>
                    onSelect({
                      followup_reason: option.value || option.id,
                      display_message: option.label,
                    })
                  }
                  disabled={disabled || isSelected}
                  className={cn(
                    "w-full h-auto rounded-none justify-start px-6 py-4 text-body hover:bg-muted/50",
                    "flex items-center gap-4 text-left transition-all",
                    optionSelected
                      ? "bg-primary/10 disabled:opacity-60"
                      : isSelected ? "disabled:opacity-30" : ""
                  )}
                >
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon icon={OptionIcon} size={20} className="text-primary" />
                </div>

                <div className="flex-1 min-w-0 text-left">
                  <p className="text-label text-foreground leading-tight mb-0.5">{option.label}</p>
                  {option.description && (
                    <p className="text-body text-muted-foreground leading-tight">{option.description}</p>
                  )}
                </div>
                </Button>
              );
            })}
          </div>
        </Card>
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
      const pkgList = data?.packages || packages;
      const testList = data?.individual_tests || [];
      return (
        <EmbeddedPackageList
          packages={pkgList}
          individualTests={testList}
          selectedPackageId={selection?.package_id}
          selectedTestIds={
            selection?.test_ids
              ? (Array.isArray(selection.test_ids) ? selection.test_ids.map(String) : [String(selection.test_ids)])
              : []
          }
          onSelect={(id) => {
            const selectedPkg = pkgList.find((p: any) => p.id === id);
            onSelect({
              package_id: id,
              display_message: selectedPkg ? `Selected: ${selectedPkg.name}` : `Selected package ${id}`,
            });
          }}
          onSelectTests={(ids) => {
            const names = ids
              .map((id: string) => testList.find((t: any) => String(t.id) === String(id))?.name)
              .filter(Boolean);
            onSelect({
              test_ids: ids,
              display_message: names.length > 0 ? `Selected: ${names.join(', ')}` : `Selected ${ids.length} test(s)`,
            });
          }}
          disabled={disabled || isSelected}
        />
      );

    case 'collection_type_selector':
      const collMethods = (data?.options || []).map((opt: any) => ({
        type: opt.id as 'home' | 'center',
        label: opt.label,
        address: opt.description,
        price: 'free' as const,
      }));
      return (
        <EmbeddedCollectionMethod
          methods={collMethods}
          selectedMethod={selection?.collection_type}
          onSelect={(type) => onSelect({
            collection_type: type,
            display_message: type === 'home' ? 'Home Collection' : 'Hospital Visit',
          })}
          disabled={disabled || isSelected}
        />
      );

    case 'address_selector':
      return (
        <EmbeddedAddressSelector
          addresses={data?.addresses || []}
          selectedAddressId={selection?.address_id}
          onSelect={(id, label, address) => onSelect({
            address_id: id,
            address_label: label,
            address_text: address,
            display_message: `${label}: ${address}`,
          })}
          onSubmitAddress={(formData) => {
            // Send the complete form data to backend
            onSelect({
              add_address: true,
              address_data: formData,
              display_message: `New address: ${formData.label}`,
            });
          }}
          onAddAddress={() => {
            // Fallback: show standalone form (for backward compatibility)
            onSelect({
              add_address: true,
              display_message: 'Add new address',
            });
          }}
          disabled={disabled || isSelected}
        />
      );

    case 'center_list':
      const centerList = data?.centers || [];
      return (
        <EmbeddedCenterList
          centers={centerList}
          selectedCenterId={selection?.center_id}
          onSelect={(id) => {
            const center = centerList.find((c: any) => c.id === id);
            onSelect({
              center_id: id,
              display_message: center ? `Selected: ${center.name}` : 'Center selected',
            });
          }}
          disabled={disabled || isSelected}
        />
      );

    case 'location_selector':
      const locList = data?.locations || [];
      return (
        <EmbeddedLocationSelector
          locations={locList}
          selectedLocationId={selection?.location_id}
          onSelect={(id) => {
            const selectedLoc = locList.find((l: any) => l.id === id);
            onSelect({
              location_id: id,
              display_message: selectedLoc ? `Selected: ${selectedLoc.label}` : `Selected location`,
            });
          }}
          onChangeAddress={() => {
            alert('Change address - will allow user to enter new address via AI chat');
          }}
          onChangeBranch={() => {
            alert('Change branch - will show available branches via AI chat');
          }}
          disabled={disabled || isSelected}
        />
      );

    case 'date_time_selector':
      const dtDates = data?.dates || [];
      return (
        <EmbeddedDateTimePicker
          dates={dtDates.length > 0 ? dtDates : undefined}
          slots={data?.slots || generateTimeSlots()}
          fastingRequired={data?.fastingRequired || data?.fasting_required}
          fastingHours={data?.fastingHours || data?.fasting_hours}
          selectedDate={selection?.date}
          selectedTime={selection?.time}
          onSelect={(date, time) => {
            const dateLabel = dtDates.find((d: any) => (d.date || d.value) === date)?.label || date;
            onSelect({
              date,
              time,
              display_message: `${dateLabel} at ${time}`,
            });
          }}
          disabled={disabled || isSelected}
        />
      );

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
            <Button
              variant="outline"
              onClick={() => onSelect({ show_all_doctors: true })}
              disabled={disabled || isSelected}
              className="w-full h-auto px-6 py-4 rounded-xl text-left font-normal"
            >
              <div className="w-full">
                <div className="font-semibold text-foreground">See all available doctors</div>
                <div className="text-body text-muted-foreground mt-1">Browse our full list of doctors</div>
              </div>
            </Button>
          </div>
        );
      }

      return (
        <div className="space-y-3 mt-3">
          <Card className="overflow-hidden">
            {previousDoctors.map((doctor: any, index: number) => {
              // Check if name already starts with "Dr."
              const displayName = doctor.name?.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`;
              const doctorSelected = selection?.doctor_id === doctor.id;

              return (
                <Button
                  key={doctor.id}
                  variant="ghost"
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
                    'w-full h-auto rounded-none justify-start px-6 py-4 text-body hover:bg-muted/50',
                    doctorSelected
                      ? isSelected ? 'bg-primary/10 disabled:opacity-60' : 'bg-primary/10'
                      : isSelected ? 'disabled:opacity-30' : ''
                  )}
                  style={{
                    borderBottom: (index < previousDoctors.length - 1 || showAllDoctorsOption)
                      ? '1px solid hsl(var(--border))'
                      : 'none'
                  }}
                >
                  <div className="flex items-start gap-3 w-full text-left">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={doctor.avatar || undefined} />
                      <AvatarFallback
                        style={(() => {
                          const color = getAvatarColorByName(doctor.name || 'Doctor');
                          return { backgroundColor: color.bg, color: color.text };
                        })()}
                      >
                        {doctor.name?.charAt(0) || 'D'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="text-label text-foreground">{doctor.name}</div>
                      <div className="text-body text-muted-foreground">{doctor.specialization}</div>
                      {doctor.last_visit && (
                        <div className="text-body text-primary mt-1">Last visit: {doctor.last_visit}</div>
                      )}
                    </div>
                  </div>
                </Button>
              );
            })}
            {showAllDoctorsOption && (
              <Button
                variant="ghost"
                onClick={() => onSelect({ show_all_doctors: true })}
                disabled={disabled || isSelected}
                className={cn(
                  'w-full h-auto rounded-none justify-center px-6 py-4 text-body hover:bg-muted/50',
                  isSelected ? 'disabled:opacity-30' : ''
                )}
              >
                <div className="text-label text-primary text-center">Or see all other doctors</div>
              </Button>
            )}
          </Card>
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
      const selectorDoctors = data?.doctors || doctors;
      return (
        <div className="space-y-4">
          {data?.doctors_count !== undefined && (
            <div>
              <h3 className="text-lg font-semibold">{data.doctors_count} doctor{data.doctors_count !== 1 ? 's' : ''} available</h3>
            </div>
          )}
          {selectorDoctors.length === 0 ? (
            <div className="p-6 text-center rounded-xl border border-dashed">
              <p className="font-medium text-foreground">No doctors available on this date</p>
              <p className="text-body text-muted-foreground mt-1">Some doctors don't work on certain days. Try a different date.</p>
            </div>
          ) : (
            <EmbeddedDoctorList
              doctors={selectorDoctors}
              selectedDoctorId={selection?.doctor_id}
              selectedTime={selection?.time}
              onSelect={(doctorId, time) => {
                const doctor = selectorDoctors.find((d: any) => d.id === doctorId);
                onSelect({
                  doctor_id: doctorId,
                  doctor_name: doctor?.name || 'Doctor',
                  time,
                  date: data?.selected_date,
                  display_message: `${doctor?.name || 'Doctor'} at ${time}`
                });
              }}
              disabled={disabled || isSelected}
            />
          )}
        </div>
      );

    case 'date_doctor_selector':
      // Combined component for "This Week" urgency
      // Track only user-clicked dates; backend selected_date is always the default
      const [userPickedDate, setUserPickedDate] = React.useState<string | null>(null);
      const activeDate = userPickedDate || data?.selected_date || selection?.date || new Date().toISOString().split('T')[0];

      return (
        <div className="space-y-4">
          {/* Date pills */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {data?.dates?.map((d: any) => {
              const dateValue = d.value || d.date;
              const dateIsActive = dateValue === activeDate;

              return (
                <Button
                  key={dateValue}
                  variant={dateIsActive ? 'primary' : 'secondary'}
                  onClick={() => setUserPickedDate(dateValue)}
                  disabled={disabled}
                  className="h-auto px-4 py-2 rounded-lg font-normal"
                >
                  <div className="text-left">
                    <div className="text-label">{d.label}</div>
                    <div className="text-body opacity-75">{d.day}</div>
                    {d.doctor_count !== undefined && (
                      <div className={cn('text-body mt-0.5', dateIsActive ? 'opacity-75' : 'opacity-50')}>
                        {d.doctor_count} dr{d.doctor_count !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </Button>
              );
            })}
          </div>

          {/* Filter doctors to only those available on the active date */}
          {(() => {
            const allDoctors = data?.doctors || [];
            const filteredDoctors = activeDate
              ? allDoctors.filter((d: any) =>
                  !d.available_dates || d.available_dates.includes(activeDate)
                )
              : allDoctors;

            return (
              <>
                {/* Doctors heading */}
                <div>
                  <h3 className="text-lg font-semibold">{filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? 's' : ''} available</h3>
                  <p className="text-body text-muted-foreground">{data?.doctors_subtitle}</p>
                </div>

                {/* Doctor list */}
                {filteredDoctors.length === 0 ? (
                  <div className="p-6 text-center rounded-xl border border-dashed">
                    <p className="font-medium text-foreground">No doctors available on this date</p>
                    <p className="text-body text-muted-foreground mt-1">Try selecting a different date above</p>
                  </div>
                ) : (
                  <EmbeddedDoctorList
                    doctors={filteredDoctors}
                    selectedDoctorId={selection?.doctor_id}
                    selectedTime={selection?.time}
                    onSelect={(doctorId, time) => {
                      const doctor = allDoctors.find((d: any) => d.id === doctorId);
                      onSelect({
                        doctor_id: doctorId,
                        doctor_name: doctor?.name || 'Doctor',
                        time,
                        date: activeDate,
                        display_message: `${doctor?.name || 'Doctor'} on ${activeDate} at ${time}`
                      });
                    }}
                    disabled={disabled || isSelected}
                  />
                )}
              </>
            );
          })()}
        </div>
      );

    case 'date_picker':
      // Date-only picker (no time slots) — used for date_selection state
      const [pickedDate, setPickedDate] = React.useState<string | null>(data?.selected_date || null);

      return (
        <div className="space-y-4 max-w-3xl">
          {/* Warning message (e.g., past date alert) */}
          {data?.warning && (
            <Alert variant="warning" title={data.warning.title}>
              {data.warning.description}
            </Alert>
          )}

          {/* Date pills */}
          <div>
            <h4 className="text-card-title mb-3 text-foreground">Pick a date</h4>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {data?.dates?.map((d: any) => {
                const dateValue = d.value || d.date;
                const dateIsActive = dateValue === pickedDate;

                return (
                  <Button
                    key={dateValue}
                    variant={dateIsActive ? 'accent' : 'outline'}
                    onClick={() => {
                      if (disabled || isSelected) return;
                      setPickedDate(dateValue);
                      onSelect({ date: dateValue, display_message: `${d.day || d.label}` });
                    }}
                    disabled={disabled || isSelected}
                    className={cn(
                      'h-auto flex-shrink-0 px-6 py-3 rounded-3xl min-w-[120px] font-normal disabled:opacity-60',
                      dateIsActive && 'border-foreground'
                    )}
                  >
                    <div className="text-left">
                      <div className={cn('text-card-title', dateIsActive && 'text-background')}>
                        {d.label}
                      </div>
                      <div className={cn('text-body', dateIsActive ? 'text-background/70' : 'text-muted-foreground')}>
                        {d.day}
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      );

    case 'week_date_selector':
      // Simple date pills for "this week" urgency
      const [selectedWeekDate, setSelectedWeekDate] = React.useState(data?.selected_date || new Date().toISOString().split('T')[0]);

      return (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {data?.dates?.map((d: any) => (
            <Button
              key={d.date}
              variant={d.date === selectedWeekDate ? 'accent' : 'secondary'}
              onClick={() => {
                setSelectedWeekDate(d.date);
                onSelect({ date: d.date });
              }}
              disabled={disabled}
              className="h-auto px-4 py-2 rounded-lg font-normal"
            >
              <div className="text-left">
                <div className="text-label">{d.label}</div>
                <div className="text-body opacity-75">{d.day}</div>
              </div>
            </Button>
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
          warning={data?.warning || (data?.fasting_required ? {
            title: 'Fasting Required',
            description: `Please fast for ${data.fasting_hours || 8} hours before your test.`
          } : null)}
        />
      );

    case 'time_slot_selector':
      return (
        <DateTimePicker
          selectedDate={data?.selected_date || data?.date || selection?.date}
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

    case 'family_member_form':
      return (
        <EmbeddedFamilyMemberForm
          onSelect={(value) => onSelect(value)}
          disabled={disabled || isSelected}
        />
      );

    case 'family_member_flow':
      return (
        <InlineMemberTypeSelector
          onComplete={(value) => onSelect(value)}
          onCancel={() => onSelect({ cancel_add_member: true })}
        />
      );

    case 'address_form':
      return (
        <EmbeddedAddressForm
          onSelect={(value) => onSelect(value)}
          disabled={disabled || isSelected}
        />
      );

    default:
      console.warn(`Unknown embedded component type: ${type}`);
      return null;
  }
}

// Patient Selector Component - 2 column grid

// Generic Option Selector (for appointment type, test type)
function OptionSelector({ options, selected, onSelect, disabled }: any) {
  return (
    <div className="flex flex-wrap gap-2 max-w-xl">
      {options.map((option: any) => (
        <Button
          key={option.id}
          variant="outline"
          onClick={() => !disabled && onSelect(option.id)}
          disabled={disabled}
          className={cn(
            'h-auto px-5 py-2.5 rounded-full text-label',
            'hover:border-primary/50 hover:bg-primary/10',
            selected === option.id
              ? disabled ? 'border-primary bg-primary/10 disabled:opacity-60' : 'border-primary bg-primary/10'
              : disabled ? 'disabled:opacity-30' : ''
          )}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}

// Urgency Selector with colored indicators
function UrgencySelector({ levels, selected, onSelect, disabled }: any) {
  const getIndicatorColor = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case 'urgent':
        return 'bg-destructive';
      case 'this_week':
        return 'bg-warning';
      case 'specific_date':
        return 'bg-info';
      default:
        return 'bg-muted-foreground';
    }
  };

  return (
    <div className="space-y-2 max-w-2xl">
      {levels.map((level: any) => (
        <Button
          key={level.id}
          variant="ghost"
          onClick={() => !disabled && onSelect(level.id)}
          disabled={disabled}
          className={cn(
            'w-full h-auto flex items-start gap-3 p-4 rounded-2xl border text-left text-body hover:bg-primary/10 disabled:opacity-60',
            selected === level.id
              ? 'border-primary bg-primary/10'
              : 'border-border'
          )}
        >
          <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', getIndicatorColor(level.id))} />
          <div className="flex-1">
            <div className="text-card-title text-foreground">{level.label}</div>
            {level.description && (
              <div className="text-body text-muted-foreground mt-0.5">{level.description}</div>
            )}
          </div>
        </Button>
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
        <Button variant="secondary" size="sm" className="rounded-lg gap-2 text-body">
          Recommended <ChevronDown className="w-4 h-4" />
        </Button>
        <div className="flex-1 flex items-center gap-2 px-3 py-2 border border-border rounded-lg">
          <Search className="w-4 h-4 text-foreground" />
          <input
            type="text"
            placeholder="Search patient, doctor, date"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 text-body bg-transparent border-0 outline-none placeholder:text-placeholder"
          />
        </div>
      </div>

      {/* Doctor cards */}
      <div className="space-y-3">
        {doctors.map((doctor: any) => (
          <div
            key={doctor.id}
            className={cn(
              'p-4 rounded-2xl border transition-all',
              selectedDoctorId === doctor.id
                ? 'border-primary bg-primary/10'
                : 'border-border bg-background'
            )}
          >
            {/* Doctor info */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3 flex-1">
                <Avatar className="w-12 h-12 flex-shrink-0">
                  <AvatarImage src={doctor.avatar} />
                  <AvatarFallback className="bg-primary/15 text-primary font-semibold">
                    {doctor.name.split(' ').slice(1).map((n: string) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="text-card-title text-foreground">{doctor.name}</div>
                  <div className="text-body text-muted-foreground">{doctor.specialty} • {doctor.experience}</div>
                </div>
              </div>
              <div className="flex items-start gap-2 flex-shrink-0">
                {doctor.modes?.includes('video') && (
                  <Badge variant="info">Video</Badge>
                )}
                {doctor.modes?.includes('in_person') && (
                  <Badge variant="success">In-hospital</Badge>
                )}
                <div className="text-right">
                  <div className="text-card-title text-foreground">₹{doctor.fees?.video || doctor.fees}</div>
                  {doctor.fees?.in_person && doctor.fees.in_person !== doctor.fees.video && (
                    <div className="text-body text-muted-foreground">/ {doctor.fees.in_person}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Time slots */}
            {doctor.slots && doctor.slots.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {doctor.slots.map((slot: any) => (
                  <Button
                    key={slot.time}
                    variant={selectedDoctorId === doctor.id && selectedTime === slot.time ? 'accent' : 'outline'}
                    onClick={() => !disabled && onSelect(doctor.id, slot.time)}
                    disabled={disabled}
                    className="h-auto px-3 py-1.5 rounded-lg text-label gap-1 disabled:opacity-60"
                  >
                    {slot.time}
                    {slot.priority && <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />}
                  </Button>
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
        <Button
          key={mode.id}
          variant="ghost"
          onClick={() => !disabled && onSelect(mode.id)}
          disabled={disabled}
          className={cn(
            'w-full h-auto flex items-center justify-between p-4 rounded-2xl border text-left text-body hover:bg-primary/10 disabled:opacity-60',
            selected === mode.id
              ? 'border-primary bg-primary/10'
              : 'border-border'
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              {mode.id === 'video' ? (
                <Video className="w-5 h-5 text-primary" />
              ) : (
                <User className="w-5 h-5 text-primary" />
              )}
            </div>
            <div>
              <div className="text-card-title text-foreground">{mode.label}</div>
              <div className="text-body text-muted-foreground">{mode.description}</div>
            </div>
          </div>
          <div className="text-card-title text-foreground">₹{mode.price}</div>
        </Button>
      ))}
    </div>
  );
}

// Booking Summary with payment button
function BookingSummary({ summary, onPay, disabled }: any) {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-background border border-border rounded-2xl p-5">
        <div className="space-y-4">
          {Object.entries(summary || {}).map(([key, value]: [string, any]) => {
            if (key === 'consultation_fee' || key === 'total') return null;

            return (
              <div key={key} className="flex items-center justify-between">
                <span className="text-body text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                <div className="flex items-center gap-2">
                  {value.avatar && (
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={value.avatar} />
                      <AvatarFallback className="text-body">{value.label?.[0]}</AvatarFallback>
                    </Avatar>
                  )}
                  <span className="text-card-title text-foreground">{value.label || String(value)}</span>
                  <Button variant="link" size="sm" className="h-auto p-0 text-body">Change</Button>
                </div>
              </div>
            );
          })}
          {(summary?.consultation_fee || summary?.total) && (
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-label text-muted-foreground">Appointment Fee</span>
              <span className="text-card-title text-foreground">
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
        <Button
          key={pkg.id}
          variant="ghost"
          onClick={() => !disabled && onSelect(pkg.id)}
          disabled={disabled}
          className={cn(
            'w-full h-auto p-4 rounded-2xl border text-left text-body hover:bg-primary/10 disabled:opacity-60',
            selected === pkg.id
              ? 'border-primary bg-primary/10'
              : 'border-border'
          )}
        >
          <div className="flex items-start justify-between w-full">
            <div className="flex-1">
              <div className="text-card-title text-foreground">{pkg.name}</div>
              <div className="text-body text-muted-foreground mt-1">
                {pkg.tests_included?.join(', ')}
              </div>
              <div className="text-micro text-muted-foreground mt-2">Duration: {pkg.duration}</div>
            </div>
            <div className="text-right flex-shrink-0 ml-4">
              <div className="text-card-title text-foreground">₹{pkg.price}</div>
            </div>
          </div>
        </Button>
      ))}
    </div>
  );
}

// Location Selector Component
function LocationSelector({ locations, selected, onSelect, disabled }: any) {
  return (
    <div className="space-y-2 max-w-2xl">
      {locations.map((location: any) => (
        <Button
          key={location.id}
          variant="ghost"
          onClick={() => !disabled && onSelect(location.id)}
          disabled={disabled}
          className={cn(
            'w-full h-auto p-3 rounded-xl border text-left text-body hover:bg-primary/10 disabled:opacity-60',
            selected === location.id
              ? 'border-primary bg-primary/10'
              : 'border-border'
          )}
        >
          <div className="flex items-center justify-between w-full">
            <div>
              <div className="text-card-title text-foreground">{location.name}</div>
              <div className="text-body text-muted-foreground">{location.address}</div>
            </div>
          </div>
        </Button>
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
        <Alert variant="warning" title={warning.title}>
          {warning.description}
        </Alert>
      )}

      <Card className="overflow-hidden">
        {/* Date selection */}
        <div className="p-4 border-b">
          <h4 className="text-card-title mb-3 text-foreground">Date</h4>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {dates.map((dateItem: any) => {
              const isSelected = tempDate === dateItem.value || selectedDate === dateItem.value;

              return (
                <Button
                  key={dateItem.value}
                  variant={isSelected ? 'accent' : 'outline'}
                  onClick={() => handleDateSelect(dateItem.value)}
                  disabled={disabled}
                  className={cn(
                    'h-auto flex-shrink-0 px-6 py-3 rounded-2xl min-w-[120px] font-normal disabled:opacity-60',
                    isSelected && 'border-foreground'
                  )}
                >
                  <div className="text-left">
                    <div className={cn('text-card-title', isSelected && 'text-background')}>
                      {dateItem.label}
                    </div>
                    <div className={cn('text-body', isSelected ? 'text-background/70' : 'text-muted-foreground')}>
                      {dateItem.sublabel}
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Time selection */}
        <div className="p-4">
          <h4 className="text-card-title mb-3 text-foreground">
            Time {warning && <span className="text-body text-muted-foreground">(morning recommended)</span>}
          </h4>
          <div className="flex flex-wrap gap-2">
            {timeSlots.map((slot: any) => {
              const isSelected = tempTime === slot.time || selectedTime === slot.time;

              return (
                <Button
                  key={slot.time}
                  variant={isSelected ? 'accent' : 'outline'}
                  onClick={() => handleTimeSelect(slot.time)}
                  disabled={disabled || !slot.available}
                  className={cn(
                    'h-auto px-3.5 py-1.5 rounded-full text-label gap-1.5 disabled:opacity-60',
                    isSelected && 'border-foreground'
                  )}
                >
                  {formatTimeDisplay(slot.time)}
                  {slot.preferred && !isSelected && <Star className="w-3.5 h-3.5 fill-warning text-warning" />}
                </Button>
              );
            })}
          </div>
        </div>
      </Card>
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
              <li key={i} className="text-body text-muted-foreground flex items-start gap-2">
                <span className="text-foreground">•</span>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {recommendation && (
        <Alert variant="info" hideIcon>
          <span dangerouslySetInnerHTML={{ __html: recommendation }} />
        </Alert>
      )}
    </div>
  );
}

// Action List Component (for multi-step actions)
function ActionList({ actions, onSelect, disabled }: any) {
  return (
    <div className="space-y-3">
      {actions.map((action: any) => (
        <Button
          key={action.id}
          variant="ghost"
          onClick={() => !disabled && onSelect(action.id)}
          disabled={disabled}
          className={cn(
            'w-full h-auto flex items-start gap-4 p-4 rounded-2xl border text-left text-body hover:border-primary hover:bg-primary/10 disabled:opacity-60',
            action.id === 'continue' ? 'bg-primary/10 border-primary' : 'border-border'
          )}
        >
          {action.number && (
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="font-semibold text-primary">{action.number}</span>
            </div>
          )}
          {action.icon && !action.number && (
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <img src={`/assets/icons/hugeicons/${action.icon}.svg`} alt="" className="w-5 h-5" />
            </div>
          )}
          <div className="flex-1">
            <div className="font-semibold text-foreground mb-1">{action.label}</div>
            {action.description && (
              <div className="text-body text-muted-foreground">{action.description}</div>
            )}
          </div>
          <svg className="w-5 h-5 text-foreground flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      ))}
    </div>
  );
}

// Info Links Component (for out-of-scope queries)
function InfoLinks({ links, onSelect, disabled }: any) {
  return (
    <div className="space-y-3">
      {links.map((link: any) => (
        <Button
          key={link.id}
          variant="ghost"
          onClick={() => !disabled && onSelect(link.id)}
          disabled={disabled}
          className="w-full h-auto flex items-start gap-4 p-4 rounded-2xl border border-border text-left text-body hover:border-primary hover:bg-primary/10 disabled:opacity-60"
        >
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            {link.icon === 'clock' && (
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {link.icon === 'phone' && (
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            )}
            {link.icon === 'help-circle' && (
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <div className="flex-1">
            <div className="font-semibold text-foreground mb-1">{link.title}</div>
            <div className="text-body text-muted-foreground">{link.description}</div>
          </div>
          <svg className="w-5 h-5 text-foreground flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      ))}
      <p className="text-body text-muted-foreground text-center mt-4">
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
        <Button
          key={option.id}
          variant={index === 0 ? 'primary' : 'outline'}
          onClick={() => !disabled && onSelect(option.id)}
          disabled={disabled}
          className="disabled:opacity-60"
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
        </Button>
      ))}
    </div>
  );
}

// Schedule Conflict Component
function ScheduleConflict({ existing, newAppointment, onSelect, disabled }: any) {
  return (
    <div className="space-y-4">
      <Alert variant="warning" title="Schedule Conflict">
        You already have an appointment at this time.
      </Alert>

      <div className="bg-muted rounded-2xl p-4 border border-border">
        <p className="text-card-title text-muted-foreground uppercase mb-2">Existing Appointment</p>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-warning/15 flex items-center justify-center">
            <span className="text-warning font-bold text-subheading">D</span>
          </div>
          <div>
            <p className="font-semibold text-foreground">{existing?.doctor}</p>
            <p className="text-body text-muted-foreground">
              {existing?.date && new Date(existing.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} • {existing?.time}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-info-subtle rounded-2xl p-4 border border-info-border">
        <p className="text-card-title text-info-subtle-foreground uppercase mb-2">New Appointment</p>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-bold text-lg">D</span>
          </div>
          <div>
            <p className="font-semibold text-foreground">{newAppointment?.doctor}</p>
            <p className="text-body text-muted-foreground">
              {newAppointment?.date && new Date(newAppointment.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} • {newAppointment?.time}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Button
          onClick={() => !disabled && onSelect('pick_different_time')}
          disabled={disabled}
          className="w-full disabled:opacity-60"
        >
          Pick a different time for new appointment
        </Button>
        <Button
          variant="outline"
          onClick={() => !disabled && onSelect('cancel_and_book')}
          disabled={disabled}
          className="w-full disabled:opacity-60"
        >
          Cancel existing & book new
        </Button>
        <Button
          variant="ghost"
          onClick={() => !disabled && onSelect('keep_existing')}
          disabled={disabled}
          className="w-full text-muted-foreground disabled:opacity-60"
        >
          Keep existing appointment
        </Button>
      </div>
    </div>
  );
}

// Emergency Warning Component (CRITICAL - for medical emergencies)
function EmergencyWarning({ emergencyNumbers, category, disabled }: any) {
  return (
    <div className="bg-destructive-subtle border border-destructive rounded-2xl p-6 space-y-4">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-destructive flex items-center justify-center animate-pulse">
          <svg className="w-6 h-6 text-destructive-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-section-title text-destructive-subtle-foreground mb-2">Medical Emergency Detected</h3>
          <p className="text-destructive-subtle-foreground font-medium mb-4">
            This sounds serious. Please do not wait for an appointment.
          </p>
        </div>
      </div>

      <div className="bg-background rounded-xl p-4 border border-destructive-border">
        <p className="font-semibold text-destructive-subtle-foreground mb-3">Call Emergency Services Immediately:</p>
        <div className="flex gap-3">
          {emergencyNumbers.map((number: string) => (
            <a
              key={number}
              href={`tel:${number}`}
              className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold text-xl py-3 px-6 rounded-full text-center transition-colors"
            >
              {number}
            </a>
          ))}
        </div>
      </div>

      <div className="bg-background rounded-xl p-4 border border-destructive-border">
        <p className="font-semibold text-destructive-subtle-foreground mb-2">Or:</p>
        <ul className="space-y-1.5 text-destructive-subtle-foreground">
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

      <div className="text-center text-body text-muted-foreground pt-2">
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
          className="flex-1 px-4 py-3 border border-border rounded-xl focus:border-primary focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <Button
          variant="primary"
          size="md"
          onClick={handleSubmit}
          disabled={disabled || !text.trim()}
          className="rounded-xl"
        >
          Send
        </Button>
      </div>
      {skippable && (
        <Button
          variant="link"
          size="sm"
          onClick={handleSkip}
          disabled={disabled}
          className="h-auto p-0 text-muted-foreground hover:text-foreground"
        >
          {skipText}
        </Button>
      )}
    </div>
  );
}
