<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Healthcare Data Export</title>
    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 12px;
            color: #171717;
            line-height: 1.5;
            margin: 0;
            padding: 20px;
        }
        h1 {
            font-size: 20px;
            font-weight: 700;
            margin: 0 0 4px 0;
        }
        .subtitle {
            font-size: 12px;
            color: #737373;
        }
        .header {
            border-bottom: 2px solid #171717;
            padding-bottom: 12px;
            margin-bottom: 24px;
        }
        section {
            margin-bottom: 28px;
        }
        h2 {
            font-size: 15px;
            font-weight: 600;
            border-bottom: 1px solid #E5E5E5;
            padding-bottom: 8px;
            margin: 0 0 12px 0;
        }
        .grid {
            width: 100%;
        }
        .grid td {
            width: 50%;
            padding: 2px 0;
            vertical-align: top;
        }
        .label {
            font-weight: 500;
            color: #737373;
        }
        table.data-table {
            width: 100%;
            border-collapse: collapse;
        }
        table.data-table th {
            text-align: left;
            padding: 6px 8px;
            font-weight: 500;
            color: #737373;
            border-bottom: 1px solid #E5E5E5;
        }
        table.data-table td {
            padding: 6px 8px;
            border-bottom: 1px solid #E5E5E5;
        }
        .address, .emergency {
            margin-top: 8px;
        }
        .footer {
            border-top: 1px solid #E5E5E5;
            padding-top: 12px;
            margin-top: 28px;
            font-size: 11px;
            color: #737373;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Healthcare Data Export</h1>
        <p class="subtitle">Generated on {{ $exportDate }}</p>
    </div>

    {{-- Personal Information --}}
    <section>
        <h2>Personal Information</h2>
        <table class="grid">
            <tr>
                <td><span class="label">Name:</span> {{ $profile['name'] ?? '—' }}</td>
                <td><span class="label">Email:</span> {{ $profile['email'] ?? '—' }}</td>
            </tr>
            <tr>
                <td><span class="label">Phone:</span> {{ $profile['phone'] ?? '—' }}</td>
                <td><span class="label">Date of Birth:</span> {{ $profile['date_of_birth'] ?? '—' }}</td>
            </tr>
            <tr>
                <td><span class="label">Gender:</span> {{ $profile['gender'] ? ucfirst($profile['gender']) : '—' }}</td>
                <td></td>
            </tr>
        </table>

        @if(!empty($profile['address_line_1']) || !empty($profile['city']))
            <div class="address">
                <span class="label">Address:</span>
                {{ collect([$profile['address_line_1'], $profile['address_line_2'], $profile['city'], $profile['state'], $profile['pincode']])->filter()->implode(', ') }}
            </div>
        @endif

        @if(!empty($profile['emergency_contact_name']))
            <div class="emergency">
                <span class="label">Emergency Contact:</span>
                {{ $profile['emergency_contact_name'] }}
                @if(!empty($profile['emergency_contact_relation']))
                    ({{ $profile['emergency_contact_relation'] }})
                @endif
                @if(!empty($profile['emergency_contact_phone']))
                    — {{ $profile['emergency_contact_phone'] }}
                @endif
            </div>
        @endif
    </section>

    {{-- Family Members --}}
    @if(count($familyMembers) > 0)
        <section>
            <h2>Family Members ({{ count($familyMembers) }})</h2>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Relation</th>
                        <th>Phone</th>
                        <th>Email</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($familyMembers as $member)
                        <tr>
                            <td>{{ $member['name'] }}</td>
                            <td>{{ $member['relation'] }}</td>
                            <td>{{ $member['phone'] ?? '—' }}</td>
                            <td>{{ $member['email'] ?? '—' }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </section>
    @endif

    {{-- Appointments --}}
    @if(count($appointments) > 0)
        <section>
            <h2>Appointments ({{ count($appointments) }})</h2>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Doctor</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($appointments as $appt)
                        <tr>
                            <td>{{ $appt['date'] }}</td>
                            <td>{{ $appt['time'] }}</td>
                            <td>{{ $appt['doctor'] }}</td>
                            <td>{{ $appt['status'] }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </section>
    @endif

    {{-- Health Records --}}
    @if(count($healthRecords) > 0)
        <section>
            <h2>Health Records ({{ count($healthRecords) }})</h2>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Category</th>
                        <th>Title</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($healthRecords as $record)
                        <tr>
                            <td>{{ $record['category'] }}</td>
                            <td>{{ $record['title'] }}</td>
                            <td>{{ $record['date'] }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </section>
    @endif

    <div class="footer">
        <p>This document contains personal health information exported from your healthcare account.</p>
        <p>Please store this document securely.</p>
    </div>
</body>
</html>
