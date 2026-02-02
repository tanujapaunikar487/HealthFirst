import { Link } from '@inertiajs/react';
import { AlertTriangle, FileQuestion, ShieldX, ServerCrash, ArrowLeft, RefreshCw } from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';
import { Button } from '@/Components/ui/button';

interface Props {
  status: number;
  message?: string;
}

const errors: Record<number, { title: string; description: string; icon: React.ElementType; action: 'back' | 'retry' }> = {
  403: {
    title: 'Access Denied',
    description: 'You don\'t have permission to view this page. If you believe this is a mistake, please contact support.',
    icon: ShieldX,
    action: 'back',
  },
  404: {
    title: 'Page Not Found',
    description: 'The page you\'re looking for doesn\'t exist or may have been moved.',
    icon: FileQuestion,
    action: 'back',
  },
  500: {
    title: 'Something Went Wrong',
    description: 'We encountered an unexpected error. Please try again or contact support if the problem persists.',
    icon: ServerCrash,
    action: 'retry',
  },
};

export default function Error({ status, message }: Props) {
  const error = errors[status] ?? {
    title: 'Error',
    description: message ?? 'An unexpected error occurred.',
    icon: AlertTriangle,
    action: 'back' as const,
  };
  const ErrorIcon = error.icon;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        {/* Status code */}
        <p className="text-7xl font-bold tracking-tighter text-muted-foreground/20 mb-4">
          {status}
        </p>

        {/* Icon */}
        <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-6">
          <Icon icon={ErrorIcon} className="h-8 w-8 text-muted-foreground" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold tracking-tight mb-2" style={{ color: '#00184D' }}>
          {error.title}
        </h1>

        {/* Description */}
        <p className="text-muted-foreground mb-8 leading-relaxed">
          {message ?? error.description}
        </p>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          {error.action === 'retry' ? (
            <>
              <Button
                onClick={() => window.location.reload()}
              >
                <Icon icon={RefreshCw} className="h-4 w-4" />
                Try Again
              </Button>
              <Link href="/dashboard">
                <Button variant="outline">
                  <Icon icon={ArrowLeft} className="h-4 w-4" />
                  Go Home
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Button
                onClick={() => window.history.back()}
              >
                <Icon icon={ArrowLeft} className="h-4 w-4" />
                Go Back
              </Button>
              <Link href="/dashboard">
                <Button variant="outline">
                  Go Home
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
