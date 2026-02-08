import { Head, router, usePage } from '@inertiajs/react';
import { useState, useRef } from 'react';
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
import { Plus, ArrowUp, Mic, X, Check, FileText } from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';
import { EmbeddedComponent } from '@/Features/booking-chat/EmbeddedComponent';
import { ThinkingIndicator } from '@/Components/Booking/ThinkingIndicator';
import { AudioWaveform } from '@/Components/ui/AudioWaveform';
import { useAudioRecorder } from '@/Hooks/useAudioRecorder';
import { Button } from '@/Components/ui/button';
import { HStack, VStack } from '@/Components/ui/stack';
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
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      console.log('Files selected:', fileArray.length, fileArray.map(f => f.name));
      setSelectedFiles(prev => [...prev, ...fileArray]);
    }
    // Reset input value to allow selecting the same file again
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddFileClick = () => {
    fileInputRef.current?.click();
  };

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

      <div className="h-screen flex flex-col bg-background overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-10 flex-none border-b bg-background">
          <div className="flex items-center justify-between gap-8 px-6 py-4">
            <div className="flex items-center gap-2 flex-shrink-0">
              <img src="/assets/icons/hugeicons/appointment-02.svg" alt="" className="w-5 h-5" />
              <span className="text-label">Booking an appointment</span>
            </div>

            {/* Empty spacer div (no step indicator for AI) */}
            <div className="flex-1 min-w-0"></div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="flex items-center gap-1 border rounded-full p-1 bg-muted">
                <div className="p-1.5 rounded-full bg-background shadow-md">
                  <img src="/assets/icons/hugeicons/ai-magic-1.svg" alt="" className="w-4 h-4" />
                </div>
                <Link
                  href="/booking?mode=guided"
                  className="p-1.5 rounded-full hover:bg-accent transition-all"
                >
                  <img src="/assets/icons/hugeicons/stairs-01.svg" alt="" className="w-4 h-4" />
                </Link>
              </div>

              {/* Cancel button */}
              <Button
                variant="ghost"
                iconOnly
                size="sm"
                className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-accent transition-colors"
                title="Cancel booking"
                onClick={() => router.visit('/')}
              >
                <Icon icon={X} className="w-4 h-4 text-muted-foreground" />
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
        <main className="flex-1 overflow-y-auto">
          <div
            className="min-h-full px-4 py-6"
            style={{
              background: 'linear-gradient(180deg, hsl(var(--primary) / 0.1) 0%, hsl(var(--background) / 0.5) 13.94%, hsl(var(--background)) 30.77%)'
            }}
          >
            <ChatContainerRoot className="h-full">
              <ChatContainerContent>
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
        </main>

        {/* Input area */}
        <div className="flex-none bg-white p-4">
          <div className="mx-auto" style={{ maxWidth: '744px' }}>
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* File preview */}
            {selectedFiles.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-2 bg-muted rounded-xl border border-border"
                  >
                    <Icon icon={FileText} size={16} className="text-muted-foreground" />
                    <span className="text-body text-foreground truncate max-w-xs">
                      {file.name}
                    </span>
                    <Button
                      variant="ghost"
                      iconOnly
                      size="xs"
                      onClick={() => handleRemoveFile(index)}
                      className="h-5 w-5 hover:bg-destructive/10"
                    >
                      <Icon icon={X} size={12} className="text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

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
                  <div className="px-6 py-4 min-h-20 flex items-center justify-between">
                    <HStack gap={3} className="flex-1">
                      <HStack gap={2}>
                        <div className="w-3 h-3 bg-destructive rounded-full animate-pulse"></div>
                        <span className="text-label text-muted-foreground">
                          {formatRecordingTime(recordingTime)}
                        </span>
                      </HStack>
                      <AudioWaveform isRecording={true} className="flex-1 max-w-md" />
                    </HStack>
                  </div>
                ) : (
                  // Normal mode - show textarea
                  <PromptInputTextarea
                    placeholder={isCancelled ? "Booking cancelled" : getPlaceholder(conversation.current_step)}
                    className="text-body text-foreground placeholder:text-muted-foreground min-h-20 px-4 pt-4 pb-16"
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    disabled={isCancelled}
                  />
                )}
                <PromptInputActions className="absolute bottom-4 left-4 right-4 flex justify-between">
                  <HStack gap={1}>
                    {/* Add Button - hide when recording */}
                    {!isRecording && (
                      <PromptInputAction tooltip="Add attachment">
                        <Button
                          variant="outline"
                          iconOnly
                          size="md"
                          onClick={handleAddFileClick}
                          disabled={isLoading || isCancelled}
                          className="rounded-full transition-all duration-200"
                        >
                          <Icon icon={Plus} size={20} />
                        </Button>
                      </PromptInputAction>
                    )}
                  </HStack>

                  {/* Right side buttons */}
                  <HStack gap={1}>
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
                            className="rounded-full transition-all duration-200"
                          >
                            <Icon icon={X} size={20} className="text-destructive" />
                          </Button>
                        </PromptInputAction>

                        <PromptInputAction tooltip="Submit recording">
                          <Button
                            variant="primary"
                            iconOnly
                            size="md"
                            onClick={handleMicClick}
                            className="rounded-full transition-all duration-200"
                          >
                            <Icon icon={Check} size={20} className="text-inverse" />
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
                            className="rounded-full transition-all duration-200"
                          >
                            <Icon icon={Mic} size={20} className={cn(
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
                            className={cn(
                              "rounded-full transition-all duration-200",
                              (isLoading || !input.trim() || isCancelled) && "bg-muted"
                            )}
                          >
                            <Icon icon={ArrowUp} size={20} className="text-inverse" />
                          </Button>
                        </PromptInputAction>
                      </>
                    )}
                  </HStack>
                </PromptInputActions>
              </PromptInput>
            </PromptInputContainer>

            {/* Disclaimer */}
            <p className="text-body text-center mt-3 text-muted-foreground">
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
