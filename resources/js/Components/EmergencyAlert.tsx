import React from 'react';
import { AlertTriangle, Phone, Ambulance, Shield, Flame } from 'lucide-react';

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
        <div className="bg-red-50 border-2 border-red-500 rounded-xl p-6 my-4 shadow-lg">
            {/* Header */}
            <div className="flex items-center gap-3 text-red-700 font-bold text-xl mb-4">
                <AlertTriangle className="w-8 h-8 animate-pulse" />
                <span>Medical Emergency Detected</span>
            </div>

            {/* Emergency Numbers */}
            <div className="space-y-3 mb-4">
                {/* Primary Emergency */}
                <a
                    href={`tel:${emergencyNumber}`}
                    className="flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700 text-white py-4 px-6 rounded-lg font-bold text-lg shadow-md transition-colors"
                >
                    <Phone className="w-6 h-6" />
                    <span>Call {emergencyNumber} (Emergency Services)</span>
                </a>

                {/* Ambulance */}
                <a
                    href={`tel:${ambulanceNumber}`}
                    className="flex items-center justify-center gap-3 bg-orange-500 hover:bg-orange-600 text-white py-4 px-6 rounded-lg font-bold text-lg shadow-md transition-colors"
                >
                    <Ambulance className="w-6 h-6" />
                    <span>Call {ambulanceNumber} (Ambulance)</span>
                </a>

                {/* Additional Emergency Numbers */}
                <div className="grid grid-cols-2 gap-2">
                    {policeNumber && (
                        <a
                            href={`tel:${policeNumber}`}
                            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold text-sm shadow-sm transition-colors"
                        >
                            <Shield className="w-4 h-4" />
                            <span>Police {policeNumber}</span>
                        </a>
                    )}
                    {fireNumber && (
                        <a
                            href={`tel:${fireNumber}`}
                            className="flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white py-3 px-4 rounded-lg font-semibold text-sm shadow-sm transition-colors"
                        >
                            <Flame className="w-4 h-4" />
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
                        className="w-full flex items-center justify-center gap-2 bg-white border-2 border-red-500 text-red-700 py-3 px-4 rounded-lg font-semibold hover:bg-red-50 transition-colors"
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
            <div className="mt-4 p-4 bg-white rounded-lg border border-red-300">
                <p className="text-sm text-red-800 leading-relaxed">
                    <strong>Important:</strong> This booking system cannot handle
                    medical emergencies. If you're experiencing a life-threatening
                    situation, please call the emergency numbers above or go
                    directly to your nearest hospital emergency room immediately.
                </p>
            </div>

            {/* Disclaimer for Non-Emergency */}
            <div className="mt-3 text-center">
                <p className="text-xs text-gray-600">
                    If this is not an emergency and I misunderstood, please start a
                    new chat and describe your needs differently.
                </p>
            </div>
        </div>
    );
}

export default EmergencyAlert;
