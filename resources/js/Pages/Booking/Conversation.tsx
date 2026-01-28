import { Head, router } from '@inertiajs/react';
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
import { Plus, Globe, MoreVertical, ArrowUp, Mic } from 'lucide-react';
import { EmbeddedComponent } from '@/Features/booking-chat/EmbeddedComponent';
import { cn } from '@/Lib/utils';

interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  component_type: string | null;
  component_data: any;
  user_selection: any;
}

interface ConversationData {
  id: string;
  type: 'doctor' | 'lab_test';
  status: string;
  current_step: string;
  collected_data: Record<string, any>;
  messages: ConversationMessage[];
}

interface Props {
  conversation: ConversationData;
}

export default function Conversation({ conversation }: Props) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [mode, setMode] = useState<'ai' | 'guided'>('ai');

  // Mock user and family data (will be replaced with real data later)
  const user = { id: '1', name: 'Sanjana Jaisinghani', avatar: '' };
  const familyMembers = [
    { id: 1, name: 'Yourself', relation: 'self', avatar: '' },
    { id: 2, name: 'John Doe', relation: 'Father', avatar: '' },
    { id: 3, name: 'Jane Doe', relation: 'Mother', avatar: '' },
  ];

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

  const formatSelectionText = (componentType: string, value: any) => {
    // Convert selection data into human-readable text
    switch (componentType) {
      case 'patient_selector':
        const patient = familyMembers.find(p => p.id === value.patient_id);
        return patient ? patient.name : 'Unknown patient';

      case 'consultation_type_selector':
        return value.consultation_type === 'new' ? 'New Consultation' : 'Follow-up';

      case 'followup_flow':
        const reasonMap: Record<string, string> = {
          'scheduled': 'Scheduled follow-up',
          'new_concern': 'New concern',
          'ongoing_issue': 'Ongoing issue'
        };
        return reasonMap[value.reason] || value.reason;

      case 'previous_doctors':
        if (value.action === 'see_other_doctors') {
          return 'See other doctors instead';
        }
        return `Dr. ${value.doctorId} at ${value.time}`;

      case 'urgency_selector':
        const urgencyMap: Record<string, string> = {
          'urgent': 'Urgent (Today/ASAP)',
          'this_week': 'This Week',
          'specific_date': "I've a specific date"
        };
        return urgencyMap[value.urgency] || value.urgency;

      case 'mode_selector':
        return value.mode === 'video' ? 'Video Consultation' : 'In-Person Visit';

      case 'doctor_list':
        return `Dr. ${value.doctor_id} at ${value.time}`;

      case 'package_list':
        return `Package: ${value.package_id}`;

      case 'location_selector':
        return `Location: ${value.location_id}`;

      case 'date_picker':
      case 'time_slot_picker':
        if (value.date && value.time) {
          return `${value.date} at ${value.time}`;
        }
        return value.date || value.time || JSON.stringify(value);

      default:
        return JSON.stringify(value);
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

  // Calculate progress based on step
  const getProgress = () => {
    const steps =
      conversation.type === 'doctor'
        ? [
            'init',
            'patient_selection',
            'consultation_type',
            'symptoms',
            'urgency',
            'date_input',
            'doctor_selection',
            'mode_selection',
            'summary',
          ]
        : [
            'init',
            'patient_selection',
            'test_type',
            'package_selection',
            'location_selection',
            'time_selection',
            'summary',
          ];

    const currentIndex = steps.indexOf(conversation.current_step);
    return ((currentIndex + 1) / steps.length) * 100;
  };

  return (
    <>
      <Head title="Booking Appointment" />

      <div className="flex flex-col h-screen bg-white">
        {/* Header */}
        <header className="bg-white border-b">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-2">
              <img src="/assets/icons/hugeicons/appointment-02.svg" alt="" className="w-5 h-5" />
              <span className="font-medium text-sm">Booking an appointment</span>
            </div>
            <div className="flex items-center gap-1 border rounded-full p-1 bg-gray-50">
              <button
                className={cn(
                  'p-1.5 rounded-full transition-all',
                  mode === 'ai' ? 'shadow-md' : ''
                )}
                onClick={() => setMode('ai')}
              >
                <img
                  src={mode === 'ai' ? '/assets/icons/hugeicons/ai-magic.svg' : '/assets/icons/hugeicons/ai-magic-1.svg'}
                  alt=""
                  className="w-4 h-4"
                />
              </button>
              <button
                className={cn(
                  'p-1.5 rounded-full transition-all',
                  mode === 'guided' ? 'shadow-md' : ''
                )}
                onClick={() => setMode('guided')}
              >
                <img
                  src={mode === 'guided' ? '/assets/icons/hugeicons/stairs-01-1.svg' : '/assets/icons/hugeicons/stairs-01.svg'}
                  alt=""
                  className="w-4 h-4"
                />
              </button>
            </div>
          </div>
          {/* Progress bar */}
          <div className="h-1 bg-gray-100">
            <div
              className="h-full w-[16%] bg-blue-600 transition-all duration-300"
              style={{ width: `${getProgress()}%` }}
            />
          </div>
        </header>

        {/* Messages area */}
        <div className="flex-1 relative overflow-hidden">
          <ChatContainerRoot className="h-full">
            <ChatContainerContent className="px-4 py-6">
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
                    user={user}
                    familyMembers={familyMembers}
                    conversationId={conversation.id}
                    onSelection={sendSelection}
                    disabled={isLoading}
                    hasNextMessage={index < conversation.messages.length - 1}
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
          <div className="mx-auto" style={{ maxWidth: '800px' }}>
            <PromptInputContainer
              style={{ width: '100%' }}
              gradient={
                isFocused || input.length > 0
                  ? 'linear-gradient(265deg, #93C5FD 24.67%, #BFDBFE 144.07%)'
                  : 'linear-gradient(265deg, #BFDBFE 24.67%, #FFF 144.07%)'
              }
            >
              <PromptInput
                value={input}
                onValueChange={setInput}
                isLoading={isLoading}
                onSubmit={handleSubmit}
                className="w-full border-0 bg-transparent"
              >
                <PromptInputTextarea
                  placeholder={getPlaceholder(conversation.current_step)}
                  className="text-sm text-[#0A0B0D] placeholder:text-[#9CA3AF] min-h-[80px] px-4 pt-4 pb-16 font-normal"
                  style={{ fontSize: '14px', lineHeight: '20px' }}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                />
                <PromptInputActions className="absolute bottom-4 left-4 right-4 flex justify-between">
                  <div className="flex items-center gap-1">
                    {/* Add Button */}
                    <PromptInputAction tooltip="Add attachment">
                      <button
                        style={{
                          width: '40px',
                          height: '40px',
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #E5E7EB',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#F9FAFB';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#FFFFFF';
                        }}
                      >
                        <Plus className="w-[18px] h-[18px]" />
                      </button>
                    </PromptInputAction>

                    {/* Search Button */}
                    <PromptInputAction tooltip="Search">
                      <button
                        style={{
                          height: '40px',
                          padding: '0 16px',
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #E5E7EB',
                          borderRadius: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          fontSize: '14px',
                          fontWeight: 400,
                          color: '#0A0B0D',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#F9FAFB';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#FFFFFF';
                        }}
                      >
                        <Globe className="w-[18px] h-[18px]" />
                        Search
                      </button>
                    </PromptInputAction>

                    {/* More Options Button */}
                    <PromptInputAction tooltip="More options">
                      <button
                        style={{
                          width: '40px',
                          height: '40px',
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #E5E7EB',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#F9FAFB';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#FFFFFF';
                        }}
                      >
                        <MoreVertical className="w-[18px] h-[18px]" />
                      </button>
                    </PromptInputAction>
                  </div>

                  {/* Right side buttons */}
                  <div className="flex items-center gap-1">
                    <PromptInputAction tooltip="Voice">
                      <button
                        style={{
                          width: '40px',
                          height: '40px',
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #E5E7EB',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#F9FAFB';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#FFFFFF';
                        }}
                      >
                        <Mic className="w-[18px] h-[18px]" />
                      </button>
                    </PromptInputAction>

                    {/* Submit Button */}
                    <PromptInputAction tooltip="Submit">
                      <button
                        onClick={handleSubmit}
                        disabled={isLoading || !input.trim()}
                        style={{
                          width: '40px',
                          height: '40px',
                          backgroundColor: isLoading || !input.trim() ? '#E5E7EB' : '#0052FF',
                          border: 'none',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (!isLoading && input.trim()) {
                            e.currentTarget.style.backgroundColor = '#0041CC';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isLoading && input.trim()) {
                            e.currentTarget.style.backgroundColor = '#0052FF';
                          }
                        }}
                      >
                        <ArrowUp className="w-5 h-5 text-white" />
                      </button>
                    </PromptInputAction>
                  </div>
                </PromptInputActions>
              </PromptInput>
            </PromptInputContainer>

            {/* Disclaimer */}
            <p className="text-xs text-center mt-3" style={{ color: '#737373' }}>
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
  user,
  familyMembers,
  conversationId,
  onSelection,
  disabled,
  hasNextMessage,
}: {
  message: ConversationMessage;
  user: any;
  familyMembers: any[];
  conversationId: string;
  onSelection: (type: string, value: any) => void;
  disabled: boolean;
  hasNextMessage: boolean;
}) {
  if (message.role === 'user') {
    return (
      <div className="flex gap-3 justify-end">
        <div className="rounded-2xl px-4 py-2.5 bg-[#F3F4F6] text-[#0A0B0D] max-w-2xl">
          <p className="text-sm leading-relaxed">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <AIAvatar />
      <div className="flex-1 max-w-3xl">
        {/* Text content */}
        {message.content && (
          <div className="rounded-2xl px-4 py-2.5 bg-[#F3F4F6] text-[#0A0B0D] mb-2.5">
            <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>
          </div>
        )}

        {/* Embedded component */}
        {message.component_type && (
          <div className={message.content ? "mt-2.5" : ""}>
            <EmbeddedComponent
              type={message.component_type}
              data={message.component_data}
              selection={message.user_selection}
              familyMembers={familyMembers}
              conversationId={conversationId}
              onSelect={(value) => onSelection(message.component_type!, value)}
              disabled={disabled || message.user_selection !== null || hasNextMessage}
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
