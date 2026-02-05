import React from 'react';
import { AlertTriangle, Phone, Ambulance, Shield, Flame } from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';

interface EmergencyAlertProps {
    emergencyNumber: string;
    ambulanceNumber: string;
    policeNumber?: string;
    fireNumber?: string;
    showNearbyHospitals?: boolean;
}

export function EmergencyAlert({
    emergencyNumber,
    ambulanceNumber,
    policeNumber,
    fireNumber,
    showNearbyHospitals = true,
}: EmergencyAlertProps) {
    return (
        <div className="bg-destructive/10 border border-destructive rounded-xl p-6 my-4 shadow-lg">
            {/* Header */}
            <div className="flex items-center gap-3 text-destructive font-bold text-xl mb-4">
                <Icon icon={AlertTriangle} className="w-8 h-8 animate-pulse" />
                <span>Medical Emergency Detected</span>
            </div>

            {/* Emergency Numbers */}
            <div className="space-y-3 mb-4">
                {/* Primary Emergency */}
                <a
                    href={`tel:${emergencyNumber}`}
                    className="flex items-center justify-center gap-3 bg-destructive hover:bg-destructive/90 text-destructive-foreground py-4 px-6 rounded-lg font-bold text-lg shadow-md transition-colors"
                >
                    <Icon icon={Phone} className="w-6 h-6" />
                    <span>Call {emergencyNumber} (Emergency Services)</span>
                </a>

                {/* Ambulance */}
                <a
                    href={`tel:${ambulanceNumber}`}
                    className="flex items-center justify-center gap-3 bg-warning hover:bg-warning/90 text-warning-foreground py-4 px-6 rounded-lg font-bold text-lg shadow-md transition-colors"
                >
                    <Icon icon={Ambulance} className="w-6 h-6" />
                    <span>Call {ambulanceNumber} (Ambulance)</span>
                </a>

                {/* Additional Emergency Numbers */}
                <div className="grid grid-cols-2 gap-2">
                    {policeNumber && (
                        <a
                            href={`tel:${policeNumber}`}
                            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground py-3 px-4 rounded-lg font-semibold text-[14px] shadow-sm transition-colors"
                        >
                            <Icon icon={Shield} className="w-4 h-4" />
                            <span>Police {policeNumber}</span>
                        </a>
                    )}
                    {fireNumber && (
                        <a
                            href={`tel:${fireNumber}`}
                            className="flex items-center justify-center gap-2 bg-warning hover:bg-warning/90 text-warning-foreground py-3 px-4 rounded-lg font-semibold text-[14px] shadow-sm transition-colors"
                        >
                            <Icon icon={Flame} className="w-4 h-4" />
                            <span>Fire {fireNumber}</span>
                        </a>
                    )}
                </div>
            </div>

            {/* Nearby Hospitals */}
            {showNearbyHospitals && (
                <div className="mt-4">
                    <button
                        onClick={() => {
                            // Open Google Maps with "emergency room near me"
                            window.open(
                                'https://www.google.com/maps/search/emergency+room+near+me',
                                '_blank'
                            );
                        }}
                        className="w-full flex items-center justify-center gap-2 bg-background border border-destructive text-destructive py-3 px-4 rounded-lg font-semibold hover:bg-destructive/10 transition-colors"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                        </svg>
                        <span>Find Nearest Emergency Room</span>
                    </button>
                </div>
            )}

            {/* Warning Text */}
            <div className="mt-4 p-4 bg-background rounded-lg border border-destructive/30">
                <p className="text-[14px] text-destructive leading-relaxed">
                    <strong>Important:</strong> This booking system cannot handle
                    medical emergencies. If you're experiencing a life-threatening
                    situation, please call the emergency numbers above or go
                    directly to your nearest hospital emergency room immediately.
                </p>
            </div>

            {/* Disclaimer for Non-Emergency */}
            <div className="mt-3 text-center">
                <p className="text-[14px] text-muted-foreground">
                    If this is not an emergency and I misunderstood, please start a
                    new chat and describe your needs differently.
                </p>
            </div>
        </div>
    );
}

export default EmergencyAlert;
