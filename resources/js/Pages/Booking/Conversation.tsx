import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
  ChatContainerRoot,
  ChatContainerContent,
  ChatContainerScrollAnchor,
} from '@/Components/ui/chat-container';
import { ScrollButton } from '@/Components/ui/scroll-button';
import { AIPromptInput } from '@/Components/ui/ai-prompt-input';
import { AIBookingHeader } from '@/Components/Booking/AIBookingHeader';
import { Loader } from '@/Components/ui/loader';
import { FileText, X } from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';
import { EmbeddedComponent } from '@/Features/booking-chat/EmbeddedComponent';
import { ThinkingIndicator } from '@/Components/Booking/ThinkingIndicator';
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
  attachments?: Array<{
    name: string;
    path: string;
    url: string;
    mime_type: string;
    size: number;
  }>;
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Check if conversation is cancelled
  const isCancelled = conversation.status === 'cancelled';

  // Family members from database (passed via props)
  const familyMembers = propFamilyMembers || [];

  // Read default patient preference from shared Inertia props
  const { bookingDefaults } = usePage<{ bookingDefaults?: { default_patient_id: string | null } }>().props;
  const defaultPatientId = bookingDefaults?.default_patient_id || null;

  const sendTextMessage = (content: string) => {
    if ((!content.trim() && selectedFiles.length === 0) || isLoading) return;

    setIsLoading(true);
    const trimmedContent = content.trim();
    setInput('');

    // If we're on the followup_update step, send as user_selection
    const isFollowupUpdate = conversation.current_step === 'followup_update';

    // Prepare data - use FormData only if there are files
    const hasFiles = selectedFiles.length > 0;

    if (hasFiles) {
      // Create FormData to handle file uploads
      const formData = new FormData();
      if (trimmedContent) {
        formData.append('content', trimmedContent);
      }

      // Add files - using the correct array format for Laravel
      selectedFiles.forEach((file) => {
        formData.append('attachments[]', file);
      });

      if (isFollowupUpdate) {
        formData.append('component_type', 'text_input');
        formData.append('user_selection[text]', trimmedContent);
      }

      console.log('Sending with files:', selectedFiles.length, 'files');

      router.post(
        `/booking/${conversation.id}/message`,
        formData,
        {
          preserveScroll: true,
          forceFormData: true,
          onSuccess: () => {
            console.log('Files uploaded successfully');
          },
          onError: (errors) => {
            console.error('Upload error:', errors);
          },
          onFinish: () => {
            setIsLoading(false);
            setSelectedFiles([]);
          },
        }
      );
    } else {
      // No files - use regular JSON request
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
    }
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

  const handleRecordingStop = async (audioBlob: Blob) => {
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('language', 'en');

      const response = await fetch(`/booking/${conversation.id}/transcribe`, {
        method: 'POST',
        body: formData,
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
      });

      const result = await response.json();

      if (result.success && result.text) {
        sendTextMessage(result.text);
      } else {
        throw new Error(result.error || 'Transcription failed');
      }
    } catch (error) {
      console.error('Transcription error:', error);
      alert('Failed to transcribe audio. Please try typing instead.');
      setIsLoading(false);
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

  return (
    <>
      <Head title="Booking Appointment" />

      <div className="h-screen flex flex-col bg-background overflow-hidden">
        <AIBookingHeader progress={getProgress()} />

        {/* Messages area */}
        <main className="flex-1 overflow-y-auto">
          <div className="min-h-full px-4 py-6">
            <ChatContainerRoot className="h-full">
              <ChatContainerContent>
                <div className="mx-auto space-y-4" style={{ maxWidth: '800px' }}>
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
        </main>

        {/* Input area */}
        <div className="flex-none bg-white p-4">
          <div className="mx-auto" style={{ maxWidth: '800px' }}>
            <AIPromptInput
              value={input}
              onValueChange={setInput}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              disabled={isCancelled}
              placeholder={isCancelled ? "Booking cancelled" : getPlaceholder(conversation.current_step)}
              minHeight="20"
              enableFileAttachments
              attachments={selectedFiles}
              onFilesChange={setSelectedFiles}
              acceptedFileTypes="image/*,.pdf,.doc,.docx"
              enableVoiceRecording
              onRecordingStop={handleRecordingStop}
              isFocused={isFocused}
              onFocusChange={setIsFocused}
            />

            {/* Disclaimer */}
            <p className="text-caption text-center mt-3 text-muted-foreground">
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
          {message.content && (
            <p className="text-body leading-relaxed">{message.content}</p>
          )}
          {message.attachments && message.attachments.length > 0 && (
            <div className={cn("flex flex-wrap gap-2", message.content && "mt-2")}>
              {message.attachments.map((file, index) => (
                <a
                  key={index}
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-white/50 rounded-xl border border-primary/20 hover:bg-white/70 transition-colors"
                >
                  {file.mime_type.startsWith('image/') ? (
                    <img src={file.url} alt={file.name} className="w-16 h-16 object-cover rounded" />
                  ) : (
                    <Icon icon={FileText} size={16} className="text-foreground" />
                  )}
                  <span className="text-body text-foreground truncate max-w-xs">
                    {file.name}
                  </span>
                </a>
              ))}
            </div>
          )}
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
          <p className="text-body leading-relaxed whitespace-pre-line text-foreground mb-2.5">{message.content}</p>
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
