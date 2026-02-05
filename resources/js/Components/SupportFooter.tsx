interface SupportFooterProps {
    pageName: string;
}

export function SupportFooter({ pageName }: SupportFooterProps) {
    const gmailUrl = `https://mail.google.com/mail/?view=cm&to=support@healthfirst.in&su=${encodeURIComponent(pageName + ' Support')}`;

    return (
        <div
            className="fixed text-center"
            style={{
                bottom: '20px',
                left: '320px',
                right: '0',
                zIndex: 10,
            }}
        >
            <p className="text-xs text-neutral-500">
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
