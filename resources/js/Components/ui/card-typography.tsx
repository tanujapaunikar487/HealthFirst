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
        <p className={`text-card-title text-foreground truncate ${className}`}>
            {children}
        </p>
    );
}

export function CardSubtext({ children, className = '' }: CardSubtextProps) {
    return (
        <p className={`text-body text-muted-foreground mt-0.5 ${className}`}>
            {children}
        </p>
    );
}
