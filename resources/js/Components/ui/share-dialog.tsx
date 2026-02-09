import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogBody, DialogTitle, DialogDescription } from './dialog';
import { Check, Copy, Mail, MessageSquare } from '@/Lib/icons';
import { Icon } from './icon';
import { Button } from './button';

interface ShareDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    url: string;
    icon?: React.ComponentType;
}

export function ShareDialog({ open, onOpenChange, title, description, url, icon }: ShareDialogProps) {
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Share</DialogTitle>
                    <DialogDescription className="sr-only">Share this content</DialogDescription>
                </DialogHeader>

                <DialogBody>
                    <div className="px-5 py-5 space-y-6">
                        {/* Preview */}
                        <div className="flex items-start gap-3">
                            {icon && (
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                                    <Icon icon={icon} className="h-5 w-5 text-primary" />
                                </div>
                            )}
                            <div className="min-w-0 flex-1">
                                <p className="text-label text-foreground">{title}</p>
                                {description && (
                                    <p className="text-body text-muted-foreground mt-0.5">{description}</p>
                                )}
                            </div>
                        </div>

                        {/* Privacy Disclaimer */}
                        <div className="rounded-lg bg-muted/50 px-4 py-3">
                            <p className="text-body text-muted-foreground">
                                This link shares your health information including personal and medical details. The link remains active and accessible to anyone who has it. Be mindful when sharing sensitive information with third parties, as their privacy policies apply.
                            </p>
                        </div>

                        {/* Share Options - Vertical */}
                        <div className="space-y-2">
                            <Button
                                variant="secondary"
                                size="md"
                                onClick={handleCopyLink}
                                className="w-full justify-start"
                            >
                                <Icon icon={copied ? Check : Copy} className="h-4 w-4 mr-3" />
                                {copied ? 'Link copied!' : 'Copy link'}
                            </Button>

                            <a
                                href={`https://wa.me/?text=${encodedText}%0A${encodedUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block"
                            >
                                <Button variant="secondary" size="md" className="w-full justify-start">
                                    <Icon icon={MessageSquare} className="h-4 w-4 mr-3" />
                                    Share via WhatsApp
                                </Button>
                            </a>

                            <a
                                href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodedText}%0A%0A${encodedUrl}`}
                                className="block"
                            >
                                <Button variant="secondary" size="md" className="w-full justify-start">
                                    <Icon icon={Mail} className="h-4 w-4 mr-3" />
                                    Share via Email
                                </Button>
                            </a>
                        </div>
                    </div>
                </DialogBody>
            </DialogContent>
        </Dialog>
    );
}
