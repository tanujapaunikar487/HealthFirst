import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputActions,
  PromptInputAction,
} from '@/Components/ui/prompt-input';
import { PromptInputContainer } from '@/Components/ui/prompt-input-container';
import { Button } from '@/Components/ui/button';
import { PromptSuggestion } from '@/Components/ui/prompt-suggestion';
import { ArrowUp, Plus, Mic, X, Check } from 'lucide-react';
import { AudioWaveform } from '@/Components/ui/AudioWaveform';
import { useAudioRecorder } from '@/Hooks/useAudioRecorder';
import { cn } from '@/Lib/utils';

type BookingMode = 'ai' | 'guided';
type BookingType = 'doctor' | 'lab_test' | null;

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
      router.get('/booking/lab/patient-test');
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

  const handleBookingAction = (type: 'doctor' | 'lab_test') => {
    if (mode === 'ai') {
      startConversation(type);
    } else {
      startGuidedBooking(type);
    }
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

      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
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
            <div className="h-full w-[16%] bg-blue-600 transition-all duration-300" />
          </div>
        </header>

        {/* Main content */}
        <main className="flex flex-col items-center justify-center px-6 py-20">
          {/* AI Blob */}
          <div className="relative w-28 h-28 mb-10">
            <img src="/assets/images/ai-blob.png" alt="" className="w-full h-full object-contain" />
          </div>

          {/* Mode toggle */}
          <div className="flex items-center gap-1 border border-gray-300 rounded-full p-1 mb-10 bg-gray-50">
            <button
              onClick={() => setMode('ai')}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-full text-sm transition-all',
                mode === 'ai'
                  ? 'bg-white shadow-md text-gray-900 font-semibold'
                  : 'text-gray-400 hover:text-gray-600 bg-transparent font-normal'
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
            </button>
            <button
              onClick={() => setMode('guided')}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-full text-sm transition-all',
                mode === 'guided'
                  ? 'bg-white shadow-md text-gray-900 font-semibold'
                  : 'text-gray-400 hover:text-gray-600 bg-transparent font-normal'
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
            </button>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-center mb-10 text-gray-900">
            What would you like to book today?
          </h1>

          {/* AI Input - only show in AI mode */}
          {mode === 'ai' && (
            <PromptInputContainer
              style={{ maxWidth: '720px', width: '100%' }}
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
                {isRecording ? (
                  // Recording mode - show waveform
                  <div className="px-4 py-4 min-h-[140px] flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-gray-700">
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
                    className="text-base text-[#0A0B0D] placeholder:text-[#9CA3AF] min-h-[140px]"
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                  />
                )}
                <PromptInputActions className="absolute bottom-4 left-4 right-4 flex justify-between">
                  <div className="flex items-center gap-1">
                    {/* Add Button - hide when recording */}
                    {!isRecording && (
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
                    )}
                  </div>

                  {/* Right side buttons */}
                  <div className="flex items-center gap-1">
                    {isRecording ? (
                      // Recording mode - show Cancel (X) and Submit (Check) icons
                      <>
                        <PromptInputAction tooltip="Cancel recording">
                          <button
                            onClick={() => {
                              cancelRecording();
                            }}
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
                              e.currentTarget.style.backgroundColor = '#FEE2E2';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#FFFFFF';
                            }}
                          >
                            <X className="w-[18px] h-[18px] text-red-600" />
                          </button>
                        </PromptInputAction>

                        <PromptInputAction tooltip="Submit recording">
                          <button
                            onClick={handleMicClick}
                            style={{
                              width: '40px',
                              height: '40px',
                              backgroundColor: '#0052FF',
                              border: 'none',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#0041CC';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#0052FF';
                            }}
                          >
                            <Check className="w-5 h-5 text-white" />
                          </button>
                        </PromptInputAction>
                      </>
                    ) : (
                      // Normal mode - show Mic and Submit buttons
                      <>
                        <PromptInputAction tooltip={isTranscribing ? "Transcribing..." : "Voice input"}>
                          <button
                            onClick={handleMicClick}
                            disabled={isLoading}
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
                            <Mic className={cn(
                              "w-[18px] h-[18px]",
                              isTranscribing && "animate-pulse text-blue-600"
                            )} />
                          </button>
                        </PromptInputAction>

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
                      </>
                    )}
                  </div>
                </PromptInputActions>
              </PromptInput>
            </PromptInputContainer>
          )}

          {/* Action buttons */}
          <div className="flex gap-4 mt-6">
            <PromptSuggestion
              onClick={() => handleBookingAction('doctor')}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <img
                src="/assets/icons/hugeicons/doctor-01-1.svg"
                alt=""
                className="w-4 h-4"
              />
              Book a doctor
            </PromptSuggestion>
            <PromptSuggestion
              onClick={() => handleBookingAction('lab_test')}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <img
                src="/assets/icons/hugeicons/test-tube-01.svg"
                alt=""
                className="w-4 h-4"
              />
              Book a test
            </PromptSuggestion>
          </div>
        </main>
      </div>
    </>
  );
}
