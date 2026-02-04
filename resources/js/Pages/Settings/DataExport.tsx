import { Head } from '@inertiajs/react';
import { useEffect } from 'react';
import { Button } from '@/Components/ui/button';
import { Download } from '@/Lib/icons';

interface Profile {
    name: string;
    email: string;
    phone: string | null;
    date_of_birth: string | null;
    gender: string | null;
    address_line_1: string | null;
    address_line_2: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    emergency_contact_relation: string | null;
}

interface FamilyMember {
    name: string;
    relation: string;
    phone: string | null;
    email: string | null;
    date_of_birth: string | null;
    gender: string | null;
}

interface Appointment {
    date: string;
    time: string;
    doctor: string;
    status: string;
}

interface HealthRecord {
    category: string;
    title: string;
    date: string;
}

interface DataExportProps {
    profile: Profile;
    familyMembers: FamilyMember[];
    appointments: Appointment[];
    healthRecords: HealthRecord[];
    exportDate: string;
}

export default function DataExport({
    profile,
    familyMembers,
    appointments,
    healthRecords,
    exportDate,
}: DataExportProps) {
    const handlePrint = () => {
        window.print();
    };

    // Auto-trigger print dialog on page load
    useEffect(() => {
        const timer = setTimeout(() => {
            window.print();
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <>
            <Head title="Export My Data" />

            {/* Print button - hidden when printing */}
            <div className="print:hidden fixed top-4 right-4 z-50">
                <Button onClick={handlePrint} className="gap-2">
                    <Download className="h-4 w-4" />
                    Save as PDF
                </Button>
            </div>

            {/* Back button - hidden when printing */}
            <div className="print:hidden fixed top-4 left-4 z-50">
                <Button variant="outline" onClick={() => window.history.back()}>
                    Back to Settings
                </Button>
            </div>

            {/* Printable content */}
            <div className="max-w-[800px] mx-auto p-8 bg-white print:p-0">
                {/* Header */}
                <div className="border-b-2 border-gray-800 pb-4 mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Healthcare Data Export</h1>
                    <p className="text-sm text-gray-600 mt-1">Generated on {exportDate}</p>
                </div>

                {/* Profile Section */}
                <section className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-300 pb-2 mb-4">
                        Personal Information
                    </h2>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="font-medium text-gray-700">Name:</span>{' '}
                            <span className="text-gray-900">{profile.name}</span>
                        </div>
                        <div>
                            <span className="font-medium text-gray-700">Email:</span>{' '}
                            <span className="text-gray-900">{profile.email}</span>
                        </div>
                        <div>
                            <span className="font-medium text-gray-700">Phone:</span>{' '}
                            <span className="text-gray-900">{profile.phone || '—'}</span>
                        </div>
                        <div>
                            <span className="font-medium text-gray-700">Date of Birth:</span>{' '}
                            <span className="text-gray-900">{profile.date_of_birth || '—'}</span>
                        </div>
                        <div>
                            <span className="font-medium text-gray-700">Gender:</span>{' '}
                            <span className="text-gray-900">{profile.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : '—'}</span>
                        </div>
                    </div>

                    {/* Address */}
                    {(profile.address_line_1 || profile.city) && (
                        <div className="mt-4 text-sm">
                            <span className="font-medium text-gray-700">Address:</span>{' '}
                            <span className="text-gray-900">
                                {[profile.address_line_1, profile.address_line_2, profile.city, profile.state, profile.pincode]
                                    .filter(Boolean)
                                    .join(', ')}
                            </span>
                        </div>
                    )}

                    {/* Emergency Contact */}
                    {profile.emergency_contact_name && (
                        <div className="mt-4 text-sm">
                            <span className="font-medium text-gray-700">Emergency Contact:</span>{' '}
                            <span className="text-gray-900">
                                {profile.emergency_contact_name}
                                {profile.emergency_contact_relation && ` (${profile.emergency_contact_relation})`}
                                {profile.emergency_contact_phone && ` — ${profile.emergency_contact_phone}`}
                            </span>
                        </div>
                    )}
                </section>

                {/* Family Members Section */}
                {familyMembers.length > 0 && (
                    <section className="mb-8">
                        <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-300 pb-2 mb-4">
                            Family Members ({familyMembers.length})
                        </h2>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-2 font-medium text-gray-700">Name</th>
                                    <th className="text-left py-2 font-medium text-gray-700">Relation</th>
                                    <th className="text-left py-2 font-medium text-gray-700">Phone</th>
                                    <th className="text-left py-2 font-medium text-gray-700">Email</th>
                                </tr>
                            </thead>
                            <tbody>
                                {familyMembers.map((member, index) => (
                                    <tr key={index} className="border-b border-gray-100">
                                        <td className="py-2 text-gray-900">{member.name}</td>
                                        <td className="py-2 text-gray-900">{member.relation}</td>
                                        <td className="py-2 text-gray-900">{member.phone || '—'}</td>
                                        <td className="py-2 text-gray-900">{member.email || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>
                )}

                {/* Appointments Section */}
                {appointments.length > 0 && (
                    <section className="mb-8">
                        <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-300 pb-2 mb-4">
                            Appointments ({appointments.length})
                        </h2>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-2 font-medium text-gray-700">Date</th>
                                    <th className="text-left py-2 font-medium text-gray-700">Time</th>
                                    <th className="text-left py-2 font-medium text-gray-700">Doctor</th>
                                    <th className="text-left py-2 font-medium text-gray-700">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {appointments.map((appt, index) => (
                                    <tr key={index} className="border-b border-gray-100">
                                        <td className="py-2 text-gray-900">{appt.date}</td>
                                        <td className="py-2 text-gray-900">{appt.time}</td>
                                        <td className="py-2 text-gray-900">{appt.doctor}</td>
                                        <td className="py-2 text-gray-900">{appt.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>
                )}

                {/* Health Records Section */}
                {healthRecords.length > 0 && (
                    <section className="mb-8">
                        <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-300 pb-2 mb-4">
                            Health Records ({healthRecords.length})
                        </h2>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-2 font-medium text-gray-700">Category</th>
                                    <th className="text-left py-2 font-medium text-gray-700">Title</th>
                                    <th className="text-left py-2 font-medium text-gray-700">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {healthRecords.map((record, index) => (
                                    <tr key={index} className="border-b border-gray-100">
                                        <td className="py-2 text-gray-900">{record.category}</td>
                                        <td className="py-2 text-gray-900">{record.title}</td>
                                        <td className="py-2 text-gray-900">{record.date}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>
                )}

                {/* Footer */}
                <div className="border-t border-gray-300 pt-4 mt-8 text-xs text-gray-500">
                    <p>This document contains personal health information exported from your healthcare account.</p>
                    <p className="mt-1">Please store this document securely.</p>
                </div>
            </div>

            {/* Print styles */}
            <style>{`
                @media print {
                    @page {
                        margin: 1cm;
                        size: A4;
                    }
                    body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }
            `}</style>
        </>
    );
}
