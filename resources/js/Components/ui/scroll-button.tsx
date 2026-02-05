import * as React from 'react';
import { cn } from '@/Lib/utils';
import { useChatContainer } from '@/Components/ui/chat-container';
import { ArrowDown } from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';

/**
 * ScrollButton Component
 *
 * A button that appears when user scrolls up and allows jumping back to bottom.
 */

interface ScrollButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export function ScrollButton({ className, ...props }: ScrollButtonProps) {
  const { scrollRef } = useChatContainer();
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = element;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShow(!isNearBottom);
    };

    element.addEventListener('scroll', handleScroll);
    return () => element.removeEventListener('scroll', handleScroll);
  }, [scrollRef]);

  const scrollToBottom = () => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  };

  if (!show) return null;

  return (
    <button
      onClick={scrollToBottom}
      className={cn(
        'flex items-center justify-center',
        'w-10 h-10 rounded-full',
        'bg-background border border-border shadow-lg',
        'hover:bg-muted transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-primary',
        className
      )}
      {...props}
    >
      <ArrowDown className="w-5 h-5 text-foreground" />
    </button>
  );
}
