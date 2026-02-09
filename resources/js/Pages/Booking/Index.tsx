import { Head, router, Link } from '@inertiajs/react';
import { useState } from 'react';
import { AIPromptInput } from '@/Components/ui/ai-prompt-input';
import { AIBookingHeader } from '@/Components/Booking/AIBookingHeader';
import { PromptSuggestion } from '@/Components/ui/prompt-suggestion';
import { HStack, VStack } from '@/Components/ui/stack';
import { Button } from '@/Components/ui/button';
import { cn } from '@/Lib/utils';
import { useAccessibilityPreferences } from '@/Hooks/useAccessibilityPreferences';

type BookingMode = 'ai' | 'guided';
type BookingType = 'doctor' | 'lab_test' | null;

const PROMPT_SUGGESTIONS: { text: string; type: 'doctor' | 'lab_test' }[] = [
  { text: 'Book a follow-up with my previous doctor', type: 'doctor' },
  { text: 'I need a blood test done at home this weekend', type: 'lab_test' },
  { text: 'Schedule a video consultation for my mother', type: 'doctor' },
  { text: 'Book an urgent appointment — I\u2019ve been having headaches', type: 'doctor' },
];

export default function BookingIndex() {
  // Apply user accessibility preferences
  useAccessibilityPreferences();

  const [mode, setMode] = useState<BookingMode>('ai');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [selectedType, setSelectedType] = useState<'doctor' | 'lab_test' | null>(null);

  const startConversation = (type: 'doctor' | 'lab_test', initialMessage?: string) => {
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
    if (!input.trim() && attachments.length === 0) return;

    // Determine booking type: use selected type from prompt suggestion,
    // or detect from input keywords, or default to doctor
    let type: 'doctor' | 'lab_test' = selectedType || 'doctor';

    if (!selectedType) {
      // Auto-detect from user input
      const lowerInput = input.toLowerCase();
      const labKeywords = ['test', 'lab', 'blood', 'sample', 'collection', 'package', 'screening', 'x-ray', 'scan', 'mri', 'ct', 'ultrasound'];

      if (labKeywords.some(keyword => lowerInput.includes(keyword))) {
        type = 'lab_test';
      }
    }

    startConversation(type, input.trim());
  };

  const handleRecordingStop = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('language', 'en');

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
      alert('Transcription not available. Please type your message.');
    }
  };

  const handlePromptClick = (suggestion: typeof PROMPT_SUGGESTIONS[number]) => {
    setInput(suggestion.text);
    setSelectedType(suggestion.type);
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
        <AIBookingHeader
          progress={16}
          showModeToggle
          activeMode={mode}
          onModeChange={setMode}
        />

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
          <VStack gap={8} className="items-center w-full mt-15" style={{ maxWidth: '800px' }}>
            <h1 className="text-page-title text-center text-foreground">
              What would you like to book today?
            </h1>

            {/* AI Input - only show in AI mode */}
            {mode === 'ai' && (
              <AIPromptInput
                value={input}
                onValueChange={setInput}
                onSubmit={handleSubmit}
                isLoading={isLoading}
                placeholder="Describe your symptoms or what you'd like to book..."
                minHeight="36"
                enableFileAttachments
                attachments={attachments}
                onFilesChange={setAttachments}
                acceptedFileTypes=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                enableVoiceRecording
                onRecordingStop={handleRecordingStop}
                isFocused={isFocused}
                onFocusChange={setIsFocused}
                className="w-full"
              />
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
