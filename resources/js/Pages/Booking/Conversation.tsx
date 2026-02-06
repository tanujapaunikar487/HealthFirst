import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
  ChatContainerRoot,
  ChatContainerContent,
  ChatContainerScrollAnchor,
} from '@/Components/ui/chat-container';
import { ScrollButton } from '@/Components/ui/scroll-button';
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputActions,
  PromptInputAction,
} from '@/Components/ui/prompt-input';
import { PromptInputContainer } from '@/Components/ui/prompt-input-container';
import { Loader } from '@/Components/ui/loader';
import { Plus, ArrowUp, Mic, X, Check } from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';
import { EmbeddedComponent } from '@/Features/booking-chat/EmbeddedComponent';
import { ThinkingIndicator } from '@/Components/Booking/ThinkingIndicator';
import { AudioWaveform } from '@/Components/ui/AudioWaveform';
import { useAudioRecorder } from '@/Hooks/useAudioRecorder';
import { Button } from '@/Components/ui/button';
import { cn } from '@/Lib/utils';

interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  component_type: string | null;
  component_data: any;
  user_selection: any;
  thinking_steps?: string[];
}

interface ConversationData {
  id: string;
  type: 'doctor' | 'lab_test';
  status: string;
  current_step: string;
  collected_data: Record<string, any>;
  messages: ConversationMessage[];
  progress: {
    percentage: number;
    current_state: string;
    missing_fields: string[];
  };
}

interface Props {
  conversation: ConversationData;
  familyMembers?: Array<{ id: number; name: string; relation: string; avatar: string }>;
}

export default function Conversation({ conversation, familyMembers: propFamilyMembers }: Props) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [mode, setMode] = useState<'ai' | 'guided'>('ai');
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Audio recording
  const {
    isRecording,
    recordingTime,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useAudioRecorder();

  // Check if conversation is cancelled
  const isCancelled = conversation.status === 'cancelled';

  // Family members from database (passed via props)
  const familyMembers = propFamilyMembers || [];

  // Read default patient preference from shared Inertia props
  const { bookingDefaults } = usePage<{ bookingDefaults?: { default_patient_id: string | null } }>().props;
  const defaultPatientId = bookingDefaults?.default_patient_id || null;

  const sendTextMessage = (content: string) => {
    if (!content.trim() || isLoading) return;

    setIsLoading(true);
    const trimmedContent = content.trim();
    setInput('');

    // If we're on the followup_update step, send as user_selection
    const isFollowupUpdate = conversation.current_step === 'followup_update';

    router.post(
      `/booking/${conversation.id}/message`,
      {
        content: trimmedContent,
        ...(isFollowupUpdate && {
          component_type: 'text_input',
          user_selection: { text: trimmedContent }
        })
      },
      {
        preserveScroll: true,
        onFinish: () => setIsLoading(false),
      }
    );
  };

  const formatSelectionText = (componentType: string, value: any): string => {
    // ALWAYS check for display_message first - backend provides this
    if (value?.display_message) {
      return value.display_message;
    }

    // Convert selection data into human-readable text
    switch (componentType) {
      case 'patient_selector':
        if (value.patient_name) return value.patient_name;
        const patient = familyMembers.find(p => p.id === value.patient_id);
        return patient ? patient.name : 'Patient selected';

      case 'appointment_type_selector':
        if (value.appointment_type === 'followup') return 'Follow-up appointment';
        if (value.appointment_type === 'new') return 'New appointment';
        return 'Appointment type selected';

      case 'urgency_selector':
        const urgencyMap: Record<string, string> = {
          'urgent': 'Urgent - today/ASAP',
          'this_week': 'This week',
          'specific_date': "I have a specific date in mind"
        };
        return urgencyMap[value.urgency] || 'Urgency level selected';

      case 'followup_reason_selector':
      case 'followup_reason':
        const reasonMap: Record<string, string> = {
          'scheduled': 'Scheduled follow-up',
          'new_concern': 'New concern related to previous visit',
          'ongoing_issue': 'Ongoing issue from before',
          'test_results': 'Discuss test results',
          'medication_review': 'Prescription review'
        };
        return reasonMap[value.followup_reason] || value.followup_reason || 'Follow-up reason selected';

      case 'text_input':
        if (value.field === 'followup_notes') {
          return value.text_input ? 'Additional notes provided' : 'Skipped additional notes';
        }
        return value.text_input || 'Text input provided';

      case 'previous_doctors':
        if (value.show_all_doctors) {
          return 'Show all doctors';
        }
        if (value.doctor_name && value.time) {
          return `${value.doctor_name} at ${value.time}`;
        }
        if (value.doctor_name) {
          return value.doctor_name;
        }
        return 'Selected previous doctor';

      case 'doctor_list':
      case 'date_doctor_selector':
      case 'doctor_selector':
        // Comprehensive doctor selection handling
        if (value.doctor_name && value.time && value.date) {
          return `${value.doctor_name} on ${value.date} at ${value.time}`;
        }
        if (value.doctor_name && value.time) {
          return `${value.doctor_name} at ${value.time}`;
        }
        if (value.doctor_name) {
          return value.doctor_name;
        }
        return 'Doctor selected';

      case 'date_selector':
      case 'date_picker':
        if (value.date) return `Date: ${value.date}`;
        return 'Date selected';

      case 'time_slot_picker':
      case 'time_selector':
        if (value.time) return `Time: ${value.time}`;
        return 'Time selected';

      case 'date_time_selector':
        if (value.date && value.time) {
          return `${value.date} at ${value.time}`;
        }
        if (value.date) return `Date: ${value.date}`;
        if (value.time) return `Time: ${value.time}`;
        return 'Date/time selected';

      case 'mode_selector':
      case 'appointment_mode':
      case 'consultation_mode':
        if (value.mode === 'video') return 'Video appointment';
        if (value.mode === 'in_person') return 'In-person visit';
        return 'Appointment mode selected';

      case 'booking_summary':
        // Handle change actions from summary
        if (value.change_doctor) return 'Change doctor';
        if (value.change_patient) return 'Change patient';
        if (value.change_datetime) return 'Change date & time';
        if (value.change_type) return 'Change appointment type';
        if (value.change_mode) return 'Change appointment mode';
        if (value.action === 'pay') return 'Proceed to payment';
        if (value.action === 'confirm') return 'Confirm booking';
        return 'Selection made';

      case 'package_list':
        if (value.package_name) return `Package: ${value.package_name}`;
        return 'Package selected';

      case 'location_selector':
        if (value.location_name) return `Location: ${value.location_name}`;
        return 'Location selected';

      default:
        // NEVER return JSON.stringify - always return something readable
        if (typeof value === 'string') return value;
        if (value?.text) return value.text;
        if (value?.name) return value.name;
        return 'Selection confirmed';
    }
  };

  const sendSelection = (componentType: string, value: any) => {
    setIsLoading(true);

    router.post(
      `/booking/${conversation.id}/message`,
      {
        content: formatSelectionText(componentType, value),
        component_type: componentType,
        user_selection: value,
      },
      {
        preserveScroll: true,
        onFinish: () => setIsLoading(false),
      }
    );
  };

  const handleSubmit = () => {
    sendTextMessage(input);
  };

  const handleMicClick = async () => {
    if (isRecording) {
      // Stop recording and transcribe
      const audioBlob = await stopRecording();
      if (audioBlob) {
        await transcribeAndSend(audioBlob);
      }
    } else {
      // Start recording
      try {
        await startRecording();
      } catch (error) {
        console.error('Failed to start recording:', error);
        alert('Could not access microphone. Please grant permission.');
      }
    }
  };

  const transcribeAndSend = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    setIsLoading(true);

    try {
      // Create form data with audio file
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('language', 'en');

      // Send to transcription endpoint
      const response = await fetch(`/booking/${conversation.id}/transcribe`, {
        method: 'POST',
        body: formData,
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
      });

      const result = await response.json();

      if (result.success && result.text) {
        // Send transcribed text as message
        sendTextMessage(result.text);
      } else {
        throw new Error(result.error || 'Transcription failed');
      }
    } catch (error) {
      console.error('Transcription error:', error);
      alert('Failed to transcribe audio. Please try typing instead.');
      setIsLoading(false);
    } finally {
      setIsTranscribing(false);
    }
  };

  // Calculate progress based on backend state machine
  const getProgress = () => {
    // Use backend-calculated progress if available
    if (conversation.progress?.percentage !== undefined) {
      return conversation.progress.percentage * 100; // Convert 0-1 to 0-100
    }

    // Fallback to 0 if no progress data
    return 0;
  };

  // Format recording time as MM:SS
  const formatRecordingTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <Head title="Booking Appointment" />

      <div
        className="flex flex-col h-screen"
        style={{
          background: 'linear-gradient(180deg, rgba(211, 225, 255, 0.5) 0%, rgba(255, 255, 255, 0.5) 13.94%, rgba(255, 255, 255, 1) 30.77%)'
        }}
      >
        {/* Header */}
        <header className="bg-white border-b border-border">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center gap-2">
              <img src="/assets/icons/hugeicons/appointment-02.svg" alt="" className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-medium text-[14px] sm:text-[14px]">Booking an appointment</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1 border border-border rounded-full p-0.5 sm:p-1 bg-muted">
              <Button
                variant="ghost"
                className={cn(
                  'h-auto p-1 sm:p-1.5 rounded-full transition-all',
                  mode === 'ai' ? 'shadow-md' : ''
                )}
                onClick={() => setMode('ai')}
              >
                <img
                  src={mode === 'ai' ? '/assets/icons/hugeicons/ai-magic.svg' : '/assets/icons/hugeicons/ai-magic-1.svg'}
                  alt=""
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                />
              </Button>
              <Button
                variant="ghost"
                className={cn(
                  'h-auto p-1 sm:p-1.5 rounded-full transition-all',
                  mode === 'guided' ? 'shadow-md' : ''
                )}
                onClick={() => setMode('guided')}
              >
                <img
                  src={mode === 'guided' ? '/assets/icons/hugeicons/stairs-01-1.svg' : '/assets/icons/hugeicons/stairs-01.svg'}
                  alt=""
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                />
              </Button>
            </div>

              {/* Cancel button */}
              <Button
                variant="ghost"
                onClick={() => router.visit('/')}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full hover:bg-accent transition-colors"
                iconOnly
                title="Cancel booking"
              >
                <Icon icon={X} className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
          {/* Progress bar */}
          <div className="h-1 bg-muted">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${Math.max(getProgress(), 2)}%` }}
            />
          </div>
        </header>

        {/* Messages area */}
        <div className="flex-1 relative overflow-hidden">
          <ChatContainerRoot className="h-full">
            <ChatContainerContent className="px-4 py-6">
              <div className="mx-auto space-y-4" style={{ maxWidth: '744px' }}>
                {/* AI Blob - shown when no messages yet */}
                {conversation.messages.length === 0 && !isLoading && (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="relative w-28 h-28 mb-6">
                      <img src="/assets/images/ai-blob.png" alt="" className="w-full h-full object-contain" />
                    </div>
                  </div>
                )}

                {conversation.messages.map((message, index) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    familyMembers={familyMembers}
                    conversationId={conversation.id}
                    defaultPatientId={defaultPatientId}
                    onSelection={sendSelection}
                    disabled={isLoading}
                    hasNextMessage={index < conversation.messages.length - 1}
                    isCancelled={isCancelled}
                  />
                ))}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex items-start gap-3">
                    <AIAvatar />
                    <Loader variant="dots" size="md" />
                  </div>
                )}
              </div>
              <ChatContainerScrollAnchor />
            </ChatContainerContent>

            {/* Scroll button */}
            <div className="absolute right-4 bottom-4">
              <ScrollButton className="shadow-md" />
            </div>
          </ChatContainerRoot>
        </div>

        {/* Input area */}
        <div className="flex-none bg-white p-4">
          <div className="mx-auto" style={{ maxWidth: '744px' }}>
            <PromptInputContainer
              style={{ width: '100%' }}
              gradient={
                isFocused || input.length > 0
                  ? 'linear-gradient(265deg, hsl(var(--primary) / 0.4) 24.67%, hsl(var(--primary) / 0.25) 144.07%)'
                  : 'linear-gradient(265deg, hsl(var(--primary) / 0.25) 24.67%, hsl(var(--background)) 144.07%)'
              }
            >
              <PromptInput
                value={input}
                onValueChange={setInput}
                isLoading={isLoading}
                onSubmit={handleSubmit}
                className="w-full border-0 bg-transparent"
              >
                {isRecording ? (
                  // Recording mode - show waveform
                  <div className="px-6 py-4 min-h-[80px] flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-destructive rounded-full animate-pulse"></div>
                        <span className="text-[14px] font-medium text-muted-foreground">
                          {formatRecordingTime(recordingTime)}
                        </span>
                      </div>
                      <AudioWaveform isRecording={true} className="flex-1 max-w-md" />
                    </div>
                  </div>
                ) : (
                  // Normal mode - show textarea
                  <PromptInputTextarea
                    placeholder={isCancelled ? "Booking cancelled" : getPlaceholder(conversation.current_step)}
                    className="text-[14px] text-foreground placeholder:text-muted-foreground min-h-[80px] px-4 pt-4 pb-16 font-normal"
                    style={{ fontSize: '14px', lineHeight: '20px' }}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    disabled={isCancelled}
                  />
                )}
                <PromptInputActions className="absolute bottom-4 left-4 right-4 flex justify-between">
                  <div className="flex items-center gap-1">
                    {/* Add Button - hide when recording */}
                    {!isRecording && (
                      <PromptInputAction tooltip="Add attachment">
                        <Button
                          variant="outline"
                          iconOnly
                          size="md"
                          style={{
                            borderRadius: '50%',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <Icon icon={Plus} className="w-[18px] h-[18px]" />
                        </Button>
                      </PromptInputAction>
                    )}
                  </div>

                  {/* Right side buttons */}
                  <div className="flex items-center gap-1">
                    {isRecording ? (
                      // Recording mode - show Cancel (X) and Submit (Check) icons
                      <>
                        <PromptInputAction tooltip="Cancel recording">
                          <Button
                            variant="outline"
                            iconOnly
                            size="md"
                            onClick={() => {
                              cancelRecording();
                            }}
                            style={{
                              borderRadius: '50%',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <Icon icon={X} className="w-[18px] h-[18px] text-destructive" />
                          </Button>
                        </PromptInputAction>

                        <PromptInputAction tooltip="Submit recording">
                          <Button
                            variant="primary"
                            iconOnly
                            size="md"
                            onClick={handleMicClick}
                            style={{
                              borderRadius: '50%',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <Icon icon={Check} className="w-5 h-5 text-white" />
                          </Button>
                        </PromptInputAction>
                      </>
                    ) : (
                      // Normal mode - show Mic and Submit buttons
                      <>
                        <PromptInputAction tooltip={isTranscribing ? "Transcribing..." : "Voice input"}>
                          <Button
                            variant="outline"
                            iconOnly
                            size="md"
                            onClick={handleMicClick}
                            disabled={isLoading}
                            style={{
                              borderRadius: '50%',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <Icon icon={Mic} className={cn(
                              "w-[18px] h-[18px]",
                              isTranscribing && "animate-pulse text-primary"
                            )} />
                          </Button>
                        </PromptInputAction>

                        <PromptInputAction tooltip="Submit">
                          <Button
                            variant="primary"
                            iconOnly
                            size="md"
                            onClick={handleSubmit}
                            disabled={isLoading || !input.trim() || isCancelled}
                            style={{
                              borderRadius: '50%',
                              backgroundColor: isLoading || !input.trim() || isCancelled ? 'hsl(var(--muted))' : undefined,
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <Icon icon={ArrowUp} className="w-5 h-5 text-white" />
                          </Button>
                        </PromptInputAction>
                      </>
                    )}
                  </div>
                </PromptInputActions>
              </PromptInput>
            </PromptInputContainer>

            {/* Disclaimer */}
            <p className="text-[14px] text-center mt-3 text-muted-foreground">
              AI may make mistakes. Verify important health information.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

// AI Avatar component (the AI blob)
function AIAvatar() {
  return (
    <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
      <img src="/assets/images/ai-blob.png" alt="" className="w-full h-full object-contain" />
    </div>
  );
}

// Message bubble component
function MessageBubble({
  message,
  familyMembers,
  conversationId,
  defaultPatientId,
  onSelection,
  disabled,
  hasNextMessage,
  isCancelled,
}: {
  message: ConversationMessage;
  familyMembers: any[];
  conversationId: string;
  defaultPatientId: string | null;
  onSelection: (type: string, value: any) => void;
  disabled: boolean;
  hasNextMessage: boolean;
  isCancelled: boolean;
}) {
  if (message.role === 'user') {
    return (
      <div className="flex gap-3 justify-end">
        <div className="rounded-2xl px-4 py-2.5 bg-primary/20 text-foreground max-w-2xl">
          <p className="text-[14px] leading-relaxed">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <AIAvatar />
      <div className="flex-1 max-w-3xl">
        {/* Chain of Thought - Thinking Process */}
        {message.thinking_steps && message.thinking_steps.length > 0 && (
          <div className="rounded-2xl px-4 py-3 bg-muted border border-border mb-2.5">
            <ThinkingIndicator steps={message.thinking_steps} />
          </div>
        )}

        {/* Text content */}
        {message.content && (
          <p className="text-[14px] leading-relaxed whitespace-pre-line text-foreground mb-2.5">{message.content}</p>
        )}

        {/* Embedded component - show if it's the last message OR if a selection was made */}
        {message.component_type && !isCancelled && (
          <div className={message.content ? "mt-2.5" : ""}>
            <EmbeddedComponent
              type={message.component_type}
              data={message.component_data}
              selection={message.user_selection}
              familyMembers={familyMembers}
              conversationId={conversationId}
              defaultPatientId={defaultPatientId}
              onSelect={(value) => onSelection(message.component_type!, value)}
              disabled={disabled || hasNextMessage || message.user_selection !== null}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function getPlaceholder(step: string): string {
  switch (step) {
    case 'symptoms':
      return "Describe your symptoms or concerns...";
    case 'date_input':
      return "Enter a date like '25 Dec evening'...";
    case 'test_type':
      return "Describe what test you need...";
    case 'followup_update':
      return "Share any updates, new symptoms, or concerns...";
    default:
      return "Type your message here...";
  }
}
