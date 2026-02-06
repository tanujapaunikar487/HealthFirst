import React from 'react';
import { User, ShieldCheck } from '@/Lib/icons';
import { cn } from '@/Lib/utils';
import { Badge } from '@/Components/ui/badge';

interface MemberData {
    id: number;
    name: string;
    age?: number;
    gender?: string;
    patient_id?: string;
    phone?: string;
    verified_phone?: string;
}

interface MemberSearchCardProps {
    member: MemberData;
    alreadyLinked?: boolean;
}

export function MemberSearchCard({ member, alreadyLinked }: MemberSearchCardProps) {
    return (
        <div className="border border-primary rounded-xl p-4 bg-primary/5">
            <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-primary" />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{member.name}</h3>
                        {member.verified_phone && (
                            <ShieldCheck className="h-4 w-4 text-success" title="Verified" />
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2 mb-2">
                        {member.age && (
                            <span className="text-[14px] text-muted-foreground">{member.age} years</span>
                        )}
                        {member.gender && (
                            <span className="text-[14px] text-muted-foreground capitalize">
                                • {member.gender}
                            </span>
                        )}
                    </div>

                    {member.patient_id && (
                        <p className="text-[14px] text-muted-foreground mb-2">
                            Patient ID: <span className="font-mono">{member.patient_id}</span>
                        </p>
                    )}

                    {member.phone && (
                        <p className="text-[14px] text-muted-foreground">
                            Phone: {member.phone}
                        </p>
                    )}

                    {alreadyLinked && (
                        <Badge variant="secondary" className="mt-2">
                            Already linked to your account
                        </Badge>
                    )}
                </div>
            </div>
        </div>
    );
}
