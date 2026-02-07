import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogBody, DialogTitle, DialogDescription } from './dialog';
import { Check, Copy, Mail, MessageSquare, Link2 } from '@/Lib/icons';
import { Icon } from './icon';

interface ShareDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    url: string;
}

export function ShareDialog({ open, onOpenChange, title, description, url }: ShareDialogProps) {
    const [copied, setCopied] = React.useState(false);

    const shareText = description ? `${title} — ${description}` : title;
    const encodedUrl = encodeURIComponent(url);
    const encodedText = encodeURIComponent(shareText);

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = url;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const shareOptions = [
        {
            name: 'Copy link',
            icon: copied ? Check : Copy,
            onClick: handleCopyLink,
            className: copied ? 'text-success bg-success/10 border-success/20' : '',
            label: copied ? 'Copied!' : 'Copy link',
        },
        {
            name: 'WhatsApp',
            icon: MessageSquare,
            href: `https://wa.me/?text=${encodedText}%0A${encodedUrl}`,
            color: 'hover:bg-success/10 hover:border-success/20 hover:text-success',
        },
        {
            name: 'Email',
            icon: Mail,
            href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodedText}%0A%0A${encodedUrl}`,
            color: 'hover:bg-primary/10 hover:border-primary/20 hover:text-primary',
        },
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Share</DialogTitle>
                    <DialogDescription className="sr-only">Share this content</DialogDescription>
                </DialogHeader>

                <DialogBody>
                    <div className="space-y-6">
                        {/* Preview Card */}
                        <div className="rounded-xl border bg-muted/30 p-4">
                            <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-icon-bg">
                                    <Icon icon={Link2} className="h-5 w-5 text-icon" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-medium text-foreground truncate">{title}</p>
                                    {description && (
                                        <p className="text-body text-muted-foreground truncate">{description}</p>
                                    )}
                                    <p className="text-body text-muted-foreground/70 mt-1 truncate">{url}</p>
                                </div>
                            </div>
                        </div>

                        {/* Share Options */}
                        <div className="space-y-2">
                            {shareOptions.map((option) => {
                                if (option.href) {
                                    return (
                                        <a
                                            key={option.name}
                                            href={option.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`flex items-center gap-3 w-full rounded-xl border bg-background p-4 transition-colors ${option.color}`}
                                        >
                                            <Icon icon={option.icon} className="h-5 w-5" />
                                            <span className="font-medium">{option.name}</span>
                                        </a>
                                    );
                                }

                                return (
                                    <button
                                        key={option.name}
                                        onClick={option.onClick}
                                        className={`flex items-center gap-3 w-full rounded-xl border bg-background p-4 transition-colors hover:bg-muted/50 ${option.className || ''}`}
                                    >
                                        <Icon icon={option.icon} className="h-5 w-5" />
                                        <span className="font-medium">{option.label || option.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </DialogBody>
            </DialogContent>
        </Dialog>
    );
}
