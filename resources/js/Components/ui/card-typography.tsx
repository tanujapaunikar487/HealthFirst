import { ReactNode } from 'react';

interface CardTitleProps {
    children: ReactNode;
    className?: string;
}

interface CardSubtextProps {
    children: ReactNode;
    className?: string;
}

export function CardTitle({ children, className = '' }: CardTitleProps) {
    return (
        <p
            className={`truncate ${className}`}
            style={{
                color: '#171717',
                fontSize: '14px',
                fontWeight: 600,
                lineHeight: '20px',
                letterSpacing: 0,
            }}
        >
            {children}
        </p>
    );
}

export function CardSubtext({ children, className = '' }: CardSubtextProps) {
    return (
        <p
            className={className}
            style={{
                color: '#737373',
                fontSize: '14px',
                fontWeight: 400,
                lineHeight: '20px',
                letterSpacing: 0,
                marginTop: '2px',
            }}
        >
            {children}
        </p>
    );
}
