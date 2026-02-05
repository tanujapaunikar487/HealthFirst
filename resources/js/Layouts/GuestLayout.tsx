import { Link } from '@inertiajs/react';
import { Card, CardContent } from '@/Components/ui/card';

interface GuestLayoutProps {
    children: React.ReactNode;
}

export default function GuestLayout({ children }: GuestLayoutProps) {
    return (
        <div
            className="flex min-h-screen flex-col items-center pt-6 sm:justify-center sm:pt-0"
            style={{
                background: 'linear-gradient(180deg, hsl(var(--primary) / 0.1) 0%, hsl(var(--background) / 0.5) 13.94%, hsl(var(--background)) 30.77%)'
            }}
        >
            <div>
                <Link href="/">
                    <img
                        src="/assets/logos/logo.svg"
                        alt="Hospital Logo"
                        className="h-16 w-16"
                    />
                </Link>
            </div>

            <Card className="mt-6 w-full sm:max-w-md" style={{ borderRadius: '20px' }}>
                <CardContent className="p-6">
                    {children}
                </CardContent>
            </Card>
        </div>
    );
}
