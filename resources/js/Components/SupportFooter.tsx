import { Link } from '@inertiajs/react';

interface SupportFooterProps {
    pageName: string;
}

export function SupportFooter({ pageName }: SupportFooterProps) {
    const gmailUrl = `https://mail.google.com/mail/?view=cm&to=support@healthfirst.in&su=${encodeURIComponent(pageName + ' Support')}`;

    return (
        <div className="pt-20 text-center">
            <p className="text-caption text-muted-foreground">
                <Link href="/privacy-policy" className="hover:text-foreground transition-colors">
                    Privacy Policy
                </Link>
                <span className="mx-2">•</span>
                <Link href="/terms-of-service" className="hover:text-foreground transition-colors">
                    Terms of Service
                </Link>
                <span className="mx-2">•</span>
                Need help with {pageName}?{' '}
                <a
                    href={gmailUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:text-primary/80 hover:underline"
                >
                    Contact support →
                </a>
            </p>
        </div>
    );
}
