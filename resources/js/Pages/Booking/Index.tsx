import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputActions,
  PromptInputAction,
} from '@/Components/ui/prompt-input';
import { PromptInputContainer } from '@/Components/ui/prompt-input-container';
import { PromptSuggestion } from '@/Components/ui/prompt-suggestion';
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

  const handleSubmit = () => {
    if (!input.trim()) return;
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
        <header className="bg-white border-b border-border">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-2">
              <img src="/assets/icons/hugeicons/appointment-02.svg" alt="" className="w-5 h-5" />
              <span className="font-medium text-[14px]">Booking an appointment</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 border border-border rounded-full p-1 bg-muted">
              <Button
                variant="ghost"
                className={cn(
                  'h-auto p-1.5 rounded-full transition-all',
                  mode === 'ai' ? 'shadow-md' : ''
                )}
                onClick={() => setMode('ai')}
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
                  'h-auto p-1.5 rounded-full transition-all',
                  mode === 'guided' ? 'shadow-md' : ''
                )}
                onClick={() => setMode('guided')}
              >
                <img
                  src={mode === 'guided' ? '/assets/icons/hugeicons/stairs-01-1.svg' : '/assets/icons/hugeicons/stairs-01.svg'}
                  alt=""
                  className="w-4 h-4"
                />
              </Button>
            </div>

              {/* Cancel button */}
              <Button
                variant="ghost"
                onClick={() => router.visit('/')}
                className="w-8 h-8 rounded-full hover:bg-accent transition-colors"
                iconOnly
                title="Cancel booking"
              >
                <Icon icon={X} className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
          {/* Progress bar */}
          <div className="h-1 bg-muted">
            <div className="h-full w-[16%] bg-primary transition-all duration-300" />
          </div>
        </header>

        {/* Main content */}
        <main className="flex flex-col items-center justify-center px-6 py-20">
          {/* AI Blob */}
          <div className="relative w-28 h-28 mb-10">
            <img src="/assets/images/ai-blob.png" alt="" className="w-full h-full object-contain" />
          </div>

          {/* Mode toggle */}
          <div className="flex items-center gap-1 border border-border rounded-full p-1 mb-10 bg-muted">
            <Button
              variant="ghost"
              onClick={() => setMode('ai')}
              className={cn(
                'h-auto flex items-center gap-2 px-5 py-2.5 rounded-full text-[14px] transition-all',
                mode === 'ai'
                  ? 'bg-white shadow-md text-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground bg-transparent font-normal'
              )}
            >
              <img
                src={
                  mode === 'ai'
                    ? '/assets/icons/hugeicons/ai-magic.svg'
                    : '/assets/icons/hugeicons/ai-magic-1.svg'
                }
                alt=""
                className="w-5 h-5"
              />
              AI assistant
            </Button>
            <Button
              variant="ghost"
              onClick={() => setMode('guided')}
              className={cn(
                'h-auto flex items-center gap-2 px-5 py-2.5 rounded-full text-[14px] transition-all',
                mode === 'guided'
                  ? 'bg-white shadow-md text-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground bg-transparent font-normal'
              )}
            >
              <img
                src={
                  mode === 'guided'
                    ? '/assets/icons/hugeicons/stairs-01-1.svg'
                    : '/assets/icons/hugeicons/stairs-01.svg'
                }
                alt=""
                className="w-5 h-5"
              />
              Guided Booking
            </Button>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-center mb-10 text-foreground">
            What would you like to book today?
          </h1>

          {/* AI Input - only show in AI mode */}
          {mode === 'ai' && (
            <PromptInputContainer
              style={{ maxWidth: '720px', width: '100%' }}
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
                  <div className="px-6 py-4 min-h-[140px] flex items-center justify-between">
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
                    placeholder="Type your symptom's"
                    className="text-base text-foreground placeholder:text-muted-foreground min-h-[140px]"
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
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
                            disabled={isLoading || !input.trim()}
                            style={{
                              borderRadius: '50%',
                              backgroundColor: isLoading || !input.trim() ? 'hsl(var(--muted))' : undefined,
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
          )}

          {/* AI mode — prompt suggestions */}
          {mode === 'ai' && (
            <div className="flex flex-col items-start gap-3 mt-6" style={{ maxWidth: '720px', width: '100%' }}>
              {PROMPT_SUGGESTIONS.map((suggestion, i) => (
                <PromptSuggestion
                  key={i}
                  onClick={() => handlePromptClick(suggestion)}
                  disabled={isLoading}
                >
                  {suggestion.text}
                </PromptSuggestion>
              ))}
            </div>
          )}

          {/* Guided mode — booking type cards */}
          {mode === 'guided' && (
            <div className="flex gap-4">
              <Button
                variant="ghost"
                onClick={() => startGuidedBooking('doctor')}
                className="h-auto p-0 rounded-3xl border border-border bg-card text-left transition-all hover:border-primary hover:shadow-sm overflow-hidden font-normal"
                style={{ width: '300px', flexShrink: 0 }}
              >
                <div className="w-full">
                  <div
                    className="relative overflow-hidden"
                    style={{ backgroundColor: 'hsl(var(--primary) / 0.15)', height: '200px' }}
                  >
                    <img
                      src="/assets/images/doctor.png"
                      alt="Book a doctor"
                      className="absolute"
                      style={{ width: '260px', top: '0', left: '50%', transform: 'translateX(-50%)' }}
                    />
                  </div>
                  <div className="px-5 py-4">
                    <p className="text-[16px] font-semibold text-foreground">Book a doctor</p>
                    <p className="text-[14px] text-muted-foreground mt-1">
                      Schedule a consultation with a specialist or general physician
                    </p>
                  </div>
                </div>
              </Button>

              <Button
                variant="ghost"
                onClick={() => startGuidedBooking('lab_test')}
                className="h-auto p-0 rounded-3xl border border-border bg-card text-left transition-all hover:border-primary hover:shadow-sm overflow-hidden font-normal"
                style={{ width: '300px', flexShrink: 0 }}
              >
                <div className="w-full">
                  <div
                    className="relative overflow-hidden"
                    style={{ backgroundColor: 'hsl(var(--primary) / 0.15)', height: '200px' }}
                  >
                    <img
                      src="/assets/images/test.png"
                      alt="Book a test"
                      className="absolute"
                      style={{ width: '260px', top: '0', left: '50%', transform: 'translateX(-50%)' }}
                    />
                  </div>
                  <div className="px-5 py-4">
                    <p className="text-[16px] font-semibold text-foreground">Book a test</p>
                    <p className="text-[14px] text-muted-foreground mt-1">
                      Lab tests, health packages, and home sample collection
                    </p>
                  </div>
                </div>
              </Button>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
