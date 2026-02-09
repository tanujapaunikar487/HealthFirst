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
    metadata?: Array<{ label: string; value: string }>;
}

export function ShareDialog({ open, onOpenChange, title, description, url, icon, metadata }: ShareDialogProps) {
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
                        {/* Preview Card */}
                        <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
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

                            {/* Metadata */}
                            {metadata && metadata.length > 0 && (
                                <div className="space-y-1 pt-2 border-t">
                                    {metadata.map((item, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <span className="text-body text-muted-foreground">{item.label}</span>
                                            <span className="text-body text-foreground">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Share Options - Horizontal */}
                        <div>
                            <p className="text-body text-muted-foreground mb-3">Share via</p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    onClick={handleCopyLink}
                                    className="flex-1 h-auto py-3"
                                >
                                    <Icon icon={copied ? Check : Copy} className="h-5 w-5 mr-2" />
                                    <span className="text-label">{copied ? 'Copied!' : 'Copy link'}</span>
                                </Button>

                                <a
                                    href={`https://wa.me/?text=${encodedText}%0A${encodedUrl}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1"
                                >
                                    <Button variant="outline" className="w-full h-auto py-3">
                                        <Icon icon={MessageSquare} className="h-5 w-5 mr-2" />
                                        <span className="text-label">WhatsApp</span>
                                    </Button>
                                </a>

                                <a
                                    href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodedText}%0A%0A${encodedUrl}`}
                                    className="flex-1"
                                >
                                    <Button variant="outline" className="w-full h-auto py-3">
                                        <Icon icon={Mail} className="h-5 w-5 mr-2" />
                                        <span className="text-label">Email</span>
                                    </Button>
                                </a>
                            </div>
                        </div>
                    </div>
                </DialogBody>
            </DialogContent>
        </Dialog>
    );
}
