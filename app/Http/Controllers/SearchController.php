<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\DoctorAlias;
use App\Models\HealthRecord;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SearchController extends Controller
{
    public function search(Request $request): JsonResponse
    {
        $user = $request->user() ?? \App\User::first();

        $validated = $request->validate([
            'q' => 'required|string|min:2|max:100',
            'category' => 'nullable|string|in:doctors,appointments,health_records,bills',
        ]);

        $q = strtolower(trim($validated['q']));
        $category = $validated['category'] ?? null;
        $limit = 5;

        $results = [];

        if (!$category || $category === 'doctors') {
            $data = $this->searchDoctors($q, $limit);
            $results['doctors'] = $data['items'];
            $results['doctors_total'] = $data['total'];
        }
        if (!$category || $category === 'appointments') {
            $data = $this->searchAppointments($q, $user, $limit);
            $results['appointments'] = $data['items'];
            $results['appointments_total'] = $data['total'];
        }
        if (!$category || $category === 'health_records') {
            $data = $this->searchHealthRecords($q, $user, $limit);
            $results['health_records'] = $data['items'];
            $results['health_records_total'] = $data['total'];
        }
        if (!$category || $category === 'bills') {
            $data = $this->searchBills($q, $user, $limit);
            $results['bills'] = $data['items'];
            $results['bills_total'] = $data['total'];
        }

        return response()->json($results);
    }

    private function searchDoctors(string $q, int $limit): array
    {
        $baseQuery = Doctor::with('department')
            ->where(function ($query) use ($q) {
                $query->whereRaw('LOWER(name) LIKE ?', ["%{$q}%"])
                      ->orWhereRaw('LOWER(specialization) LIKE ?', ["%{$q}%"]);
            })
            ->where('is_active', true);

        $total = (clone $baseQuery)->count();
        $doctors = (clone $baseQuery)->limit($limit)->get();

        // Check aliases for additional matches
        $aliasDocIds = DoctorAlias::whereRaw('LOWER(alias) LIKE ?', ["%{$q}%"])
            ->pluck('doctor_id')
            ->toArray();

        if (!empty($aliasDocIds)) {
            $aliasOnlyQuery = Doctor::where('is_active', true)
                ->whereIn('id', $aliasDocIds)
                ->whereNotIn('id', (clone $baseQuery)->pluck('id'));

            $aliasOnlyCount = (clone $aliasOnlyQuery)->count();
            $total += $aliasOnlyCount;

            if ($doctors->count() < $limit) {
                $remaining = $limit - $doctors->count();
                $aliasDoctors = $aliasOnlyQuery->limit($remaining)->get();
                $doctors = $doctors->merge($aliasDoctors);
            }
        }

        return [
            'items' => $doctors->map(fn ($d) => [
                'id' => $d->id,
                'name' => $d->name,
                'specialization' => $d->specialization,
                'department' => $d->department?->name,
                'experience_years' => $d->experience_years,
                'avatar_url' => $d->avatar_url,
            ])->values()->toArray(),
            'total' => $total,
        ];
    }

    private function searchAppointments(string $q, $user, int $limit): array
    {
        $baseQuery = Appointment::where('user_id', $user->id)
            ->with(['doctor', 'familyMember', 'labPackage'])
            ->where(function ($query) use ($q) {
                $query->whereHas('doctor', fn ($dq) => $dq->whereRaw('LOWER(name) LIKE ?', ["%{$q}%"]))
                      ->orWhereHas('familyMember', fn ($fq) => $fq->whereRaw('LOWER(name) LIKE ?', ["%{$q}%"]))
                      ->orWhereHas('labPackage', fn ($lq) => $lq->whereRaw('LOWER(name) LIKE ?', ["%{$q}%"]))
                      ->orWhereRaw('LOWER(appointment_type) LIKE ?', ["%{$q}%"]);
            })
            ->orderByDesc('appointment_date');

        $total = (clone $baseQuery)->count();

        return [
            'items' => (clone $baseQuery)->limit($limit)->get()
                ->map(fn ($a) => [
                    'id' => $a->id,
                    'type' => $a->appointment_type,
                    'title' => $a->appointment_type === 'doctor'
                        ? ($a->doctor?->name ?? 'Doctor Appointment')
                        : ($a->labPackage?->name ?? 'Lab Test'),
                    'subtitle' => $a->appointment_type === 'doctor'
                        ? ($a->doctor?->specialization ?? '')
                        : ($a->collection_type === 'home' ? 'Home Collection' : 'Lab Visit'),
                    'patient_name' => $a->familyMember?->name ?? 'You',
                    'date_formatted' => $a->appointment_date->format('D, d M Y'),
                    'time' => $a->appointment_time,
                    'status' => $a->status,
                    'consultation_mode' => $a->consultation_mode,
                ])->values()->toArray(),
            'total' => $total,
        ];
    }

    private function searchHealthRecords(string $q, $user, int $limit): array
    {
        $baseQuery = HealthRecord::where('user_id', $user->id)
            ->with('familyMember')
            ->where(function ($query) use ($q) {
                $query->whereRaw('LOWER(title) LIKE ?', ["%{$q}%"])
                      ->orWhereRaw('LOWER(COALESCE(description, \'\')) LIKE ?', ["%{$q}%"])
                      ->orWhereRaw('LOWER(COALESCE(doctor_name, \'\')) LIKE ?', ["%{$q}%"])
                      ->orWhereRaw('LOWER(COALESCE(department_name, \'\')) LIKE ?', ["%{$q}%"])
                      ->orWhereHas('familyMember', fn ($fq) => $fq->whereRaw('LOWER(name) LIKE ?', ["%{$q}%"]));
            })
            ->orderByDesc('record_date');

        $total = (clone $baseQuery)->count();

        return [
            'items' => (clone $baseQuery)->limit($limit)->get()
                ->map(fn ($r) => [
                    'id' => $r->id,
                    'category' => $r->category,
                    'title' => $r->title,
                    'doctor_name' => $r->doctor_name,
                    'department_name' => $r->department_name,
                    'record_date_formatted' => $r->record_date->format('d M Y'),
                    'patient_name' => $r->familyMember?->name ?? 'You',
                ])->values()->toArray(),
            'total' => $total,
        ];
    }

    private function searchBills(string $q, $user, int $limit): array
    {
        $query = Appointment::where('user_id', $user->id)
            ->with(['doctor', 'familyMember', 'labPackage']);

        if (preg_match('/^inv[- ]?0*(\d+)$/i', $q, $matches)) {
            $numericId = (int) $matches[1];
            $query->where('id', $numericId);
        } else {
            $query->where(function ($qb) use ($q) {
                $qb->whereHas('doctor', fn ($dq) => $dq->whereRaw('LOWER(name) LIKE ?', ["%{$q}%"]))
                    ->orWhereHas('familyMember', fn ($fq) => $fq->whereRaw('LOWER(name) LIKE ?', ["%{$q}%"]))
                    ->orWhereHas('labPackage', fn ($lq) => $lq->whereRaw('LOWER(name) LIKE ?', ["%{$q}%"]));
            });
        }

        $query->orderByDesc('appointment_date');
        $total = (clone $query)->count();

        return [
            'items' => (clone $query)->limit($limit)->get()
                ->map(fn ($a) => [
                    'id' => $a->id,
                    'invoice_number' => 'INV-' . str_pad($a->id, 6, '0', STR_PAD_LEFT),
                    'title' => $a->appointment_type === 'doctor'
                        ? ($a->doctor?->name ?? 'Doctor Appointment')
                        : ($a->labPackage?->name ?? 'Lab Test'),
                    'patient_name' => $a->familyMember?->name ?? 'You',
                    'date_formatted' => $a->appointment_date->format('D, d M Y'),
                    'amount' => $a->fee ?? 0,
                    'payment_status' => $a->payment_status ?? 'paid',
                ])->values()->toArray(),
            'total' => $total,
        ];
    }
}
