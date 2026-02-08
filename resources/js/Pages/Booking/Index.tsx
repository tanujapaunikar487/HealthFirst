import { Head, router, Link } from '@inertiajs/react';
import { useState, useRef } from 'react';
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputActions,
  PromptInputAction,
} from '@/Components/ui/prompt-input';
import { PromptInputContainer } from '@/Components/ui/prompt-input-container';
import { PromptSuggestion } from '@/Components/ui/prompt-suggestion';
import { HStack, VStack } from '@/Components/ui/stack';
import { ArrowUp, Plus, Mic, X, Check, ChevronRight, Stethoscope, TestTube2 } from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';
import { AudioWaveform } from '@/Components/ui/AudioWaveform';
import { useAudioRecorder } from '@/Hooks/useAudioRecorder';
import { Button } from '@/Components/ui/button';
import { cn } from '@/Lib/utils';

type BookingMode = 'ai' | 'guided';
type BookingType = 'doctor' | 'lab_test' | null;

const PROMPT_SUGGESTIONS: { text: string; type: 'doctor' | 'lab_test' }[] = [
  { text: 'Book a follow-up with my previous doctor', type: 'doctor' },
  { text: 'I need a blood test done at home this weekend', type: 'lab_test' },
  { text: 'Schedule a video consultation for my mother', type: 'doctor' },
  { text: 'Book an urgent appointment — I\u2019ve been having headaches', type: 'doctor' },
];

export default function BookingIndex() {
  const [mode, setMode] = useState<BookingMode>('ai');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<BookingType>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Audio recording
  const {
    isRecording,
    recordingTime,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useAudioRecorder();

  const startConversation = (type: 'doctor' | 'lab_test', initialMessage?: string) => {
    setSelectedType(type);
    setIsLoading(true);
    router.post('/booking/start', {
      type,
      initial_message: initialMessage,
    });
  };

  const startGuidedBooking = (type: 'doctor' | 'lab_test') => {
    if (type === 'doctor') {
      router.get('/booking/doctor/patient');
    } else {
      router.get('/booking/lab/patient');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles = Array.from(files).filter(file => {
      // Max 10MB per file
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} is too large. Maximum file size is 10MB.`);
        return false;
      }
      // Allowed types
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        alert(`${file.name} is not a supported file type.`);
        return false;
      }
      return true;
    });

    setAttachments(prev => [...prev, ...newFiles]);
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!input.trim() && attachments.length === 0) return;
    startConversation('doctor', input.trim());
  };

  const handleMicClick = async () => {
    if (isRecording) {
      // Stop recording and transcribe
      const audioBlob = await stopRecording();
      if (audioBlob) {
        await transcribeAudio(audioBlob);
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

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);

    try {
      // For the entry page, we'll create a temporary conversation first
      // or we can transcribe and then set the input
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('language', 'en');

      // Since we don't have a conversation ID yet, we'll use Groq's API directly
      // For now, let's just set a placeholder - you'd need to add a dedicated endpoint
      // or start the conversation first

      // Simpler approach: transcribe to text and set input
      // This requires a dedicated transcription endpoint without conversation
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
      });

      const result = await response.json();

      if (result.success && result.text) {
        setInput(result.text);
      } else {
        throw new Error(result.error || 'Transcription failed');
      }
    } catch (error) {
      console.error('Transcription error:', error);
      // Fallback: just start conversation without transcription
      alert('Transcription not available. Please type your message.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handlePromptClick = (suggestion: typeof PROMPT_SUGGESTIONS[number]) => {
    setInput(suggestion.text);
    setSelectedType(suggestion.type);
  };

  // Format recording time as MM:SS
  const formatRecordingTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <Head title="Booking an appointment" />

      <div
        className="min-h-screen"
        style={{
          background: 'linear-gradient(180deg, rgba(211, 225, 255, 0.5) 0%, rgba(255, 255, 255, 0.5) 13.94%, rgba(255, 255, 255, 1) 30.77%)'
        }}
      >
        {/* Header */}
        <header className="bg-card border-b border-border">
          <HStack className="justify-between items-center px-6 py-4">
            <HStack gap={2}>
              <img src="/assets/icons/hugeicons/appointment-02.svg" alt="" className="w-5 h-5" />
              <span className="text-label">Booking an appointment</span>
            </HStack>
            <HStack gap={4} className="items-center">
              <HStack gap={1} className="border border-border rounded-full p-1 bg-muted">
                <Button
                  variant="ghost"
                  className={cn(
                    'h-auto p-2 rounded-full transition-all',
                    mode === 'ai' ? 'bg-background shadow-md hover:bg-background' : 'hover:bg-transparent'
                  )}
                  onClick={() => setMode('ai')}
                  iconOnly
                >
                  <img
                    src={mode === 'ai' ? '/assets/icons/hugeicons/ai-magic.svg' : '/assets/icons/hugeicons/ai-magic-1.svg'}
                    alt=""
                    className="w-4 h-4"
                  />
                </Button>
                <Button
                  variant="ghost"
                  className={cn(
                    'h-auto p-2 rounded-full transition-all',
                    mode === 'guided' ? 'bg-background shadow-md hover:bg-background' : 'hover:bg-transparent'
                  )}
                  onClick={() => setMode('guided')}
                  iconOnly
                >
                  <img
                    src={mode === 'guided' ? '/assets/icons/hugeicons/stairs-01-1.svg' : '/assets/icons/hugeicons/stairs-01.svg'}
                    alt=""
                    className="w-4 h-4"
                  />
                </Button>
              </HStack>

              {/* Cancel link */}
              <Link href="/" className="text-label text-muted-foreground hover:text-foreground transition-colors">
                Cancel
              </Link>
            </HStack>
          </HStack>
          {/* Progress bar */}
          <div className="h-1 bg-muted">
            <div className="h-full w-[16%] bg-primary transition-all duration-300 rounded-r-full" />
          </div>
        </header>

        {/* Main content */}
        <main className="flex flex-col items-center justify-center px-6 py-20">
          <VStack gap={10} className="items-center">
            {/* AI Blob */}
            <div className="relative w-28 h-28">
              <img src="/assets/images/ai-blob.png" alt="" className="w-full h-full object-contain" />
            </div>

            {/* Mode toggle */}
            <HStack gap={1} className="border border-border rounded-full p-1 bg-muted">
              <Button
                variant="ghost"
                onClick={() => setMode('ai')}
                className={cn(
                  'h-auto rounded-full px-4 py-2 text-label transition-all',
                  mode === 'ai' ? 'bg-background shadow-md hover:bg-background' : 'text-muted-foreground hover:bg-transparent'
                )}
              >
                <HStack gap={2}>
                  <img
                    src={mode === 'ai' ? '/assets/icons/hugeicons/ai-magic.svg' : '/assets/icons/hugeicons/ai-magic-1.svg'}
                    alt=""
                    className="w-5 h-5"
                  />
                  AI assistant
                </HStack>
              </Button>
              <Button
                variant="ghost"
                onClick={() => setMode('guided')}
                className={cn(
                  'h-auto rounded-full px-4 py-2 text-label transition-all',
                  mode === 'guided' ? 'bg-background shadow-md hover:bg-background' : 'text-muted-foreground hover:bg-transparent'
                )}
              >
                <HStack gap={2}>
                  <img
                    src={mode === 'guided' ? '/assets/icons/hugeicons/stairs-01-1.svg' : '/assets/icons/hugeicons/stairs-01.svg'}
                    alt=""
                    className="w-5 h-5"
                  />
                  Guided Booking
                </HStack>
              </Button>
            </HStack>
          </VStack>

          {/* Title and input section */}
          <VStack gap={8} className="items-center w-full max-w-3xl mt-15">
            <h1 className="text-page-title text-center text-foreground">
              What would you like to book today?
            </h1>

            {/* AI Input - only show in AI mode */}
            {mode === 'ai' && (
            <PromptInputContainer
              className="w-full"
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
                  <div className="px-6 py-4 min-h-36 flex items-start">
                    <HStack gap={3} className="items-center">
                      <div className="w-3 h-3 bg-destructive rounded-full animate-pulse"></div>
                      <span className="text-label text-muted-foreground">
                        {formatRecordingTime(recordingTime)}
                      </span>
                      <AudioWaveform isRecording={true} className="flex-1" />
                    </HStack>
                  </div>
                ) : (
                  // Normal mode - show textarea
                  <div className="relative w-full">
                    {/* File attachments chips */}
                    {attachments.length > 0 && (
                      <div className="px-6 pt-4 pb-2">
                        <HStack gap={2} className="flex-wrap">
                          {attachments.map((file, index) => (
                            <div
                              key={index}
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-body border border-border"
                            >
                              <span className="text-foreground truncate max-w-32">{file.name}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveAttachment(index)}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <Icon icon={X} size={12} />
                              </button>
                            </div>
                          ))}
                        </HStack>
                      </div>
                    )}
                    <PromptInputTextarea
                      placeholder="Describe your symptoms or what you'd like to book..."
                      className="text-base text-foreground placeholder:text-muted-foreground min-h-36"
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                    />
                  </div>
                )}
                <PromptInputActions className="absolute bottom-4 left-4 right-4 flex justify-between">
                  <HStack gap={1}>
                    {/* Add Button - hide when recording */}
                    {!isRecording && (
                      <>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                          multiple
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        <PromptInputAction tooltip="Add attachment">
                          <Button
                            variant="outline"
                            iconOnly
                            size="md"
                            onClick={() => fileInputRef.current?.click()}
                            className="rounded-full transition-all duration-200"
                          >
                            <Icon icon={Plus} />
                          </Button>
                        </PromptInputAction>
                      </>
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
                            <Icon icon={X} className="text-destructive" />
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
                            <Icon icon={Check} className="text-inverse" />
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
                            <Icon icon={Mic} className={cn(
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
                            disabled={isLoading || !input.trim()}
                            className="rounded-full transition-all duration-200"
                          >
                            <Icon icon={ArrowUp} className="text-inverse" />
                          </Button>
                        </PromptInputAction>
                      </>
                    )}
                  </HStack>
                </PromptInputActions>
              </PromptInput>
            </PromptInputContainer>
          )}

          {/* AI mode — prompt suggestions */}
          {mode === 'ai' && (
            <VStack gap={3} className="items-start w-full">
              {PROMPT_SUGGESTIONS.map((suggestion, i) => (
                <PromptSuggestion
                  key={i}
                  onClick={() => handlePromptClick(suggestion)}
                  disabled={isLoading}
                >
                  {suggestion.text}
                </PromptSuggestion>
              ))}
            </VStack>
          )}

          {/* Guided mode — booking type cards */}
          {mode === 'guided' && (
            <HStack gap={8}>
              <Button
                variant="ghost"
                onClick={() => startGuidedBooking('doctor')}
                className="h-auto p-0 rounded-3xl border border-border bg-card text-left transition-all hover:border-primary hover:shadow-sm overflow-hidden font-normal w-72 shrink-0"
              >
                <div className="w-full">
                  <div
                    className="relative overflow-hidden h-48"
                    style={{ backgroundColor: 'hsl(var(--primary) / 0.15)' }}
                  >
                    <img
                      src="/assets/images/doctor.png"
                      alt="Book a doctor"
                      className="absolute w-64 top-0 left-1/2 -translate-x-1/2"
                    />
                  </div>
                  <VStack gap={1} className="px-6 py-4 w-full min-w-0">
                    <h3 className="text-base font-semibold text-foreground">Book a doctor</h3>
                    <p className="text-body text-muted-foreground whitespace-normal">
                      Schedule a consultation with a specialist or general physician
                    </p>
                  </VStack>
                </div>
              </Button>

              <Button
                variant="ghost"
                onClick={() => startGuidedBooking('lab_test')}
                className="h-auto p-0 rounded-3xl border border-border bg-card text-left transition-all hover:border-primary hover:shadow-sm overflow-hidden font-normal w-72 shrink-0"
              >
                <div className="w-full">
                  <div
                    className="relative overflow-hidden h-48"
                    style={{ backgroundColor: 'hsl(var(--primary) / 0.15)' }}
                  >
                    <img
                      src="/assets/images/test.png"
                      alt="Book a test"
                      className="absolute w-64 top-0 left-1/2 -translate-x-1/2"
                    />
                  </div>
                  <VStack gap={1} className="px-6 py-4 w-full min-w-0">
                    <h3 className="text-base font-semibold text-foreground">Book a test</h3>
                    <p className="text-body text-muted-foreground whitespace-normal">
                      Lab tests, health packages, and home sample collection
                    </p>
                  </VStack>
                </div>
              </Button>
            </HStack>
          )}
          </VStack>
        </main>
      </div>
    </>
  );
}
