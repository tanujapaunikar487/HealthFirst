import * as React from 'react';
import { cn } from '@/Lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';

/**
 * Message Component
 *
 * Displays a single chat message with optional avatar.
 * Supports both user and assistant message styles.
 */

interface MessageProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Message({ className, children, ...props }: MessageProps) {
  return (
    <div className={cn('flex gap-3 items-start', className)} {...props}>
      {children}
    </div>
  );
}

interface MessageAvatarProps {
  src?: string;
  fallback?: string;
  className?: string;
}

export function MessageAvatar({ src, fallback = 'U', className }: MessageAvatarProps) {
  return (
    <Avatar className={cn('w-8 h-8', className)}>
      <AvatarImage src={src} />
      <AvatarFallback>{fallback}</AvatarFallback>
    </Avatar>
  );
}

interface MessageContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function MessageContent({ className, children, ...props }: MessageContentProps) {
  return (
    <div
      className={cn(
        'rounded-2xl px-4 py-2 text-body leading-relaxed',
        'bg-white shadow-sm',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
