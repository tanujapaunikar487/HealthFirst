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
                <Link href="/" className="flex items-center gap-3">
                    <img
                        src="/assets/logos/logo.svg"
                        alt="HealthFirst Logo"
                        className="h-10.5 w-auto"
                    />
                    <span className="text-detail-title">HealthFirst</span>
                </Link>
            </div>

            <Card className="mt-6 w-full sm:max-w-md" style={{ borderRadius: '24px' }}>
                <CardContent className="p-6">
                    {children}
                </CardContent>
            </Card>
        </div>
    );
}
