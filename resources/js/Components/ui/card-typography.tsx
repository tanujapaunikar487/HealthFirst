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
                color: '#0A0B0D',
                fontSize: '14px',
                fontWeight: 500,
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
                fontWeight: 500,
                lineHeight: '20px',
                letterSpacing: 0,
                marginTop: '2px',
            }}
        >
            {children}
        </p>
    );
}
