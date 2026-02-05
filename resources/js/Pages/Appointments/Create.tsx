import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputActions,
  PromptInputAction,
} from '@/Components/ui/prompt-input';
import { PromptInputContainer } from '@/Components/ui/prompt-input-container';
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
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
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

      {/* Top Navigation Bar */}
      <div
        style={{
          width: '100%',
          height: '72px',
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid hsl(var(--border))',
          display: 'flex',
          alignItems: 'center',
          padding: '0 32px',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: 'hsl(var(--foreground))',
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8 2V5M16 2V5M3.5 9.09H20.5M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeMiterlimit="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M15.6947 13.7H15.7037M15.6947 16.7H15.7037M11.9955 13.7H12.0045M11.9955 16.7H12.0045M8.29431 13.7H8.30329M8.29431 16.7H8.30329"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span
            className="font-semibold"
            style={{
              fontSize: '16px',
              fontWeight: 600,
              lineHeight: '24px',
              color: 'hsl(var(--foreground))',
            }}
          >
            Booking an appointment
          </span>
        </div>

        {/* Right side - Search and Notifications */}
        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            color: 'hsl(var(--foreground))',
          }}
        >
          <button
            style={{
              width: '40px',
              height: '40px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F5F8FF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M11.5 21C16.7467 21 21 16.7467 21 11.5C21 6.25329 16.7467 2 11.5 2C6.25329 2 2 6.25329 2 11.5C2 16.7467 6.25329 21 11.5 21Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M22 22L20 20"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            style={{
              width: '40px',
              height: '40px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F5F8FF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12.02 2.91C8.71 2.91 6.02 5.6 6.02 8.91V11.8C6.02 12.41 5.76 13.34 5.45 13.86L4.3 15.77C3.59 16.95 4.08 18.26 5.38 18.7C9.69 20.14 14.34 20.14 18.65 18.7C19.86 18.3 20.39 16.87 19.73 15.77L18.58 13.86C18.28 13.34 18.02 12.41 18.02 11.8V8.91C18.02 5.61 15.32 2.91 12.02 2.91Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeMiterlimit="10"
                strokeLinecap="round"
              />
              <path
                d="M13.87 3.2C13.56 3.11 13.24 3.04 12.91 3C11.95 2.88 11.03 2.95 10.17 3.2C10.46 2.46 11.18 1.94 12.02 1.94C12.86 1.94 13.58 2.46 13.87 3.2Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeMiterlimit="10"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M15.02 19.06C15.02 20.71 13.67 22.06 12.02 22.06C11.2 22.06 10.44 21.72 9.90002 21.18C9.36002 20.64 9.02002 19.88 9.02002 19.06"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeMiterlimit="10"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{
          width: '100%',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F5F8FF',
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
          <PromptInputContainer
            style={{ maxWidth: '720px', width: '100%' }}
            gradient={
              isFocused || query.length > 0
                ? 'linear-gradient(265deg, #93C5FD 24.67%, #BFDBFE 144.07%)'
                : 'linear-gradient(265deg, #BFDBFE 24.67%, #FFF 144.07%)'
            }
          >
            <PromptInput
              value={query}
              onValueChange={setQuery}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              className="w-full border-0 bg-transparent"
            >
              <PromptInputTextarea
                placeholder="Type doctor's name"
                className="text-base text-foreground placeholder:text-muted-foreground min-h-[140px]"
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
                      border: '1px solid hsl(var(--border))',
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
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 5V19M5 12H19"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </PromptInputAction>

                {/* Search Button */}
                <PromptInputAction tooltip="Search">
                  <button
                    style={{
                      height: '40px',
                      padding: '0 16px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      fontSize: '15px',
                      fontWeight: 400,
                      color: 'hsl(var(--foreground))',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#F9FAFB';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#FFFFFF';
                    }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M2 12H22M12 2C14.5013 4.73835 15.9228 8.29203 16 12C15.9228 15.708 14.5013 19.2616 12 22C9.49872 19.2616 8.07725 15.708 8 12C8.07725 8.29203 9.49872 4.73835 12 2Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
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
                      border: '1px solid hsl(var(--border))',
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
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle cx="12" cy="6" r="1.5" fill="currentColor" />
                      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                      <circle cx="12" cy="18" r="1.5" fill="currentColor" />
                    </svg>
                  </button>
                </PromptInputAction>
              </div>

              {/* Submit Button */}
              <PromptInputAction tooltip="Submit">
                <button
                  onClick={handleSubmit}
                  disabled={isLoading || !query.trim()}
                  style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: isLoading || !query.trim() ? '#E5E7EB' : '#0052FF',
                    border: 'none',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: isLoading || !query.trim() ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading && query.trim()) {
                      e.currentTarget.style.backgroundColor = '#0041CC';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading && query.trim()) {
                      e.currentTarget.style.backgroundColor = '#0052FF';
                    }
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M7 12L12 7L17 12M12 17V7"
                      stroke="#FFFFFF"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </PromptInputAction>
            </PromptInputActions>
            </PromptInput>
          </PromptInputContainer>

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
          <p
            className="font-normal"
            style={{
              fontSize: '14px',
              fontWeight: 400,
              lineHeight: '20px',
              color: 'hsl(var(--muted-foreground))',
              textAlign: 'center',
              margin: 0,
            }}
          >
            AI may make mistakes. Verify important health information.
          </p>
        </div>
      </div>
    </>
  );
}
