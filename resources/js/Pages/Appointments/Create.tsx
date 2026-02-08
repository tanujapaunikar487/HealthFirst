import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { AIPromptInput } from '@/Components/ui/ai-prompt-input';
import { AIBookingHeader } from '@/Components/Booking/AIBookingHeader';
import { PromptSuggestion } from '@/Components/ui/prompt-suggestion';
import { Button } from '@/Components/ui/button';

interface User {
  id: number;
  name: string;
  email: string;
  avatar_url?: string;
}

interface Patient {
  id: number;
  first_name: string;
  last_name: string;
}

interface CreateAppointmentProps {
  user: User & { patient?: Patient };
}

export default function CreateAppointment({ user }: CreateAppointmentProps) {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const startConversation = (type: 'doctor' | 'lab_test', initialMessage?: string) => {
    setIsLoading(true);
    router.post('/booking/start', {
      type,
      initial_message: initialMessage,
    });
  };

  const handleSubmit = () => {
    if (!query.trim()) return;
    startConversation('doctor', query.trim());
  };

  return (
    <>
      <Head title="Booking an appointment" />

      <AIBookingHeader progress={16} />

      {/* Main Content */}
      <div
        style={{
          width: '100%',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'hsl(var(--muted))',
          padding: '48px 20px',
          marginTop: '72px',
        }}
      >
        {/* Center Content Container */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '32px',
            maxWidth: '720px',
            width: '100%',
          }}
        >
          {/* AI Blob Image */}
          <img
            src="/assets/images/ai-blob.png"
            alt="AI Assistant"
            style={{
              width: '120px',
              height: '120px',
              objectFit: 'contain',
            }}
          />

          {/* Heading */}
          <h1
            className="font-bold"
            style={{
              fontSize: '32px',
              fontWeight: 700,
              lineHeight: '40px',
              letterSpacing: '-0.64px',
              color: 'hsl(var(--foreground))',
              textAlign: 'center',
              margin: 0,
            }}
          >
            What would you like to book today?
          </h1>

          {/* Prompt Input with AI Chat */}
          <AIPromptInput
            value={query}
            onValueChange={setQuery}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            placeholder="Type doctor's name"
            minHeight="[140px]"
            isFocused={isFocused}
            onFocusChange={setIsFocused}
            gradient="linear-gradient(265deg, #BFDBFE 24.67%, #FFF 144.07%)"
            gradientFocused="linear-gradient(265deg, #93C5FD 24.67%, #BFDBFE 144.07%)"
            style={{ maxWidth: '720px', width: '100%' }}
          />

          {/* Option Buttons Below Input */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: '12px',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <PromptSuggestion
              onClick={() => startConversation('doctor')}
              disabled={isLoading}
            >
              Book a doctor
            </PromptSuggestion>

            <PromptSuggestion
              onClick={() => startConversation('lab_test')}
              disabled={isLoading}
            >
              Book a test
            </PromptSuggestion>
          </div>

          {/* Disclaimer */}
          <p className="text-caption text-center text-muted-foreground">
            AI may make mistakes. Verify important health information.
          </p>
        </div>
      </div>
    </>
  );
}
