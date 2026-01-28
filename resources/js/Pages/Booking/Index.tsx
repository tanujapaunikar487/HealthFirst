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
import { ArrowUp, Mic, Plus, Globe, MoreVertical } from 'lucide-react';
import { cn } from '@/Lib/utils';

type BookingMode = 'ai' | 'guided';
type BookingType = 'doctor' | 'lab_test' | null;

export default function BookingIndex() {
  const [mode, setMode] = useState<BookingMode>('ai');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<BookingType>(null);
  const [isFocused, setIsFocused] = useState(false);

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

  const handleBookingAction = (type: 'doctor' | 'lab_test') => {
    if (mode === 'ai') {
      startConversation(type);
    } else {
      startGuidedBooking(type);
    }
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
                <PromptInputTextarea
                  placeholder="Type your symptom's"
                  className="text-base text-[#0A0B0D] placeholder:text-[#9CA3AF] min-h-[140px]"
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
                          fontSize: '15px',
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
