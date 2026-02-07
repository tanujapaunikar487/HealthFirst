import { Avatar, AvatarFallback } from '@/Components/ui/avatar';
import { Card } from '@/Components/ui/card';

interface SpecialistCardProps {
  name: string;
  specialty?: string;
  credentials?: string;
  registrationNo?: string;
  clinicName?: string;
  className?: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function SpecialistCard({
  name,
  specialty,
  credentials,
  registrationNo,
  clinicName,
}: SpecialistCardProps) {
  return (
    <Card className="px-6 py-4">
      <div className="flex items-center gap-4">
        <Avatar className="h-12 w-12">
          <AvatarFallback className="bg-warning text-warning-foreground text-label">
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-label text-foreground">{name}</p>
          {(specialty || credentials) && (
            <p className="text-body text-muted-foreground">
              {specialty}{specialty && credentials ? ' · ' : ''}{credentials}
            </p>
          )}
          {registrationNo && (
            <p className="text-caption text-muted-foreground">Reg. No: {registrationNo}</p>
          )}
          {clinicName && (
            <p className="text-body text-muted-foreground">{clinicName}</p>
          )}
        </div>
      </div>
    </Card>
  );
}
