import { useState, useRef, useEffect } from 'react';
import { router } from '@inertiajs/react';

interface AddToCalendarButtonProps {
  conversationId: string;
  variant?: 'primary' | 'secondary';
  className?: string;
}

type CalendarType = 'google' | 'apple';

export function AddToCalendarButton({
  conversationId,
  variant = 'primary',
  className = ''
}: AddToCalendarButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleCalendarSelect = async (type: CalendarType) => {
    setIsLoading(true);
    setIsOpen(false);

    try {
      if (type === 'google') {
        // Fetch Google Calendar URL
        const response = await fetch(`/booking/${conversationId}/calendar/google`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Open Google Calendar in new tab
        window.open(data.url, '_blank');
      } else {
        // Download ICS file for Apple Calendar
        const link = document.createElement('a');
        link.href = `/booking/${conversationId}/calendar/download`;
        link.download = `appointment-${conversationId}.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      // Mark as added
      setIsAdded(true);
    } catch (error) {
      console.error('Failed to add to calendar:', error);
      alert('Failed to add to calendar. Please try again.');
      setIsLoading(false);
      return;
    } finally {
      setIsLoading(false);
    }
  };

  const buttonClasses = variant === 'primary'
    ? 'bg-primary text-white hover:bg-primary/90'
    : 'bg-white text-primary border border-primary hover:bg-primary/5';

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => !isAdded && setIsOpen(!isOpen)}
        disabled={isLoading || isAdded}
        className={`
          w-full px-6 py-3 rounded-full font-medium text-base
          transition-all duration-200
          flex items-center justify-center gap-2
          ${isAdded ? 'bg-success text-white cursor-default' : buttonClasses}
          ${isLoading ? 'opacity-50 cursor-wait' : ''}
          disabled:opacity-50
        `}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Adding...</span>
          </>
        ) : isAdded ? (
          <>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span>Added to Calendar</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>Add to Calendar</span>
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && !isAdded && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
          <div className="py-1">
            <button
              onClick={() => handleCalendarSelect('google')}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
            >
              <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
              </svg>
              <span className="text-gray-900 font-medium">Google Calendar</span>
            </button>

            <button
              onClick={() => handleCalendarSelect('apple')}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
            >
              <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              <span className="text-gray-900 font-medium">Apple Calendar</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
