import * as React from 'react';
import { cn } from '@/Lib/utils';

/**
 * ChatContainer Component
 *
 * A container for chat messages with auto-scroll behavior.
 * Wraps messages in a scrollable area that automatically scrolls to bottom on new messages.
 */

const ChatContainerContext = React.createContext<{
  scrollRef: React.RefObject<HTMLDivElement>;
}>({
  scrollRef: React.createRef(),
});

export function useChatContainer() {
  return React.useContext(ChatContainerContext);
}

interface ChatContainerRootProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function ChatContainerRoot({ className, children, ...props }: ChatContainerRootProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  return (
    <ChatContainerContext.Provider value={{ scrollRef }}>
      <div className={cn('relative h-full', className)} {...props}>
        {children}
      </div>
    </ChatContainerContext.Provider>
  );
}

interface ChatContainerContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function ChatContainerContent({ className, children, ...props }: ChatContainerContentProps) {
  const { scrollRef } = useChatContainer();

  return (
    <div
      ref={scrollRef}
      className={cn('h-full overflow-y-auto', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function ChatContainerScrollAnchor() {
  const { scrollRef } = useChatContainer();
  const anchorRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const scrollElement = scrollRef.current;
    const anchorElement = anchorRef.current;

    if (!scrollElement || !anchorElement) return;

    const observer = new MutationObserver(() => {
      anchorElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });

    observer.observe(scrollElement, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    // Initial scroll
    anchorElement.scrollIntoView({ behavior: 'auto', block: 'end' });

    return () => observer.disconnect();
  }, [scrollRef]);

  return <div ref={anchorRef} className="h-px" />;
}
