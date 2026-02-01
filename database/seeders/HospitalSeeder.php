<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\BillingNotification;
use App\Models\HealthRecord;
use App\Models\Department;
use App\Models\Doctor;
use App\Models\DoctorAlias;
use App\Models\DoctorAvailability;
use App\Models\DoctorConsultationMode;
use App\Models\EmergencyKeyword;
use App\Models\FamilyMember;
use App\Models\InsuranceClaim;
use App\Models\InsuranceProvider;
use App\Models\LabCenter;
use App\Models\LabPackage;
use App\Models\LabTestType;
use App\Models\UserAddress;
use App\Models\Symptom;
use App\Models\TimeSlot;
use App\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class HospitalSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedDepartments();
        $this->seedDoctors();
        $this->seedSymptoms();
        $this->seedEmergencyKeywords();
        $this->seedLabTestTypes();
        $this->seedLabPackages();
        $this->seedLabCenters();
        $this->seedInsuranceProviders();

        // User-specific data
        $user = User::first();
        if ($user) {
            $this->seedFamilyMembers($user);
            $this->seedUserAddresses($user);
            $this->seedAppointments($user);
            $this->seedInsuranceClaims($user);
            $this->seedBillingNotifications($user);
            $this->seedHealthRecords($user);
        }

        // Generate time slots for next 14 days
        $this->seedTimeSlots();
    }

    private function seedDepartments(): void
    {
        $departments = [
            ['name' => 'General Medicine', 'description' => 'Primary care and general health consultations', 'icon' => 'stethoscope'],
            ['name' => 'Cardiology', 'description' => 'Heart and cardiovascular system specialists', 'icon' => 'heart'],
            ['name' => 'Pediatrics', 'description' => 'Medical care for infants, children, and adolescents', 'icon' => 'baby'],
            ['name' => 'Dermatology', 'description' => 'Skin, hair, and nail conditions', 'icon' => 'shield'],
            ['name' => 'Orthopedics', 'description' => 'Bone, joint, and musculoskeletal disorders', 'icon' => 'bone'],
            ['name' => 'ENT', 'description' => 'Ear, nose, and throat specialists', 'icon' => 'ear'],
            ['name' => 'Gynecology', 'description' => "Women's reproductive health", 'icon' => 'female'],
            ['name' => 'Neurology', 'description' => 'Brain, spinal cord, and nervous system disorders', 'icon' => 'brain'],
            ['name' => 'Ophthalmology', 'description' => 'Eye care and vision specialists', 'icon' => 'eye'],
            ['name' => 'Dental', 'description' => 'Oral health and dental procedures', 'icon' => 'tooth'],
        ];

        foreach ($departments as $dept) {
            Department::create($dept);
        }
    }

    private function seedDoctors(): void
    {
        $doctors = [
            // Existing 5 doctors (preserving IDs for backward compatibility)
            [
                'id' => 1,
                'department' => 'General Medicine',
                'name' => 'Dr. Sarah Johnson',
                'slug' => 'dr-sarah-johnson',
                'specialization' => 'General Physician',
                'qualification' => 'MBBS, MD (General Medicine)',
                'experience_years' => 12,
                'bio' => 'Experienced general physician with expertise in preventive healthcare and chronic disease management.',
                'avatar_url' => '/assets/avatars/doctor1.jpg',
                'rating' => 4.8,
                'reviews_count' => 342,
                'modes' => [
                    ['mode' => 'video', 'fee' => 800, 'is_default' => true],
                    ['mode' => 'in_person', 'fee' => 1200, 'is_default' => false],
                ],
                'days_off' => [0], // Sunday
                'aliases' => ['Sarah', 'Dr Sarah', 'Johnson'],
            ],
            [
                'id' => 2,
                'department' => 'Cardiology',
                'name' => 'Dr. Emily Chen',
                'slug' => 'dr-emily-chen',
                'specialization' => 'Cardiologist',
                'qualification' => 'MBBS, DM (Cardiology)',
                'experience_years' => 18,
                'bio' => 'Senior cardiologist specializing in interventional cardiology and cardiac rehabilitation.',
                'avatar_url' => '/assets/avatars/doctor2.jpg',
                'rating' => 4.9,
                'reviews_count' => 528,
                'modes' => [
                    ['mode' => 'video', 'fee' => 1200, 'is_default' => true],
                    ['mode' => 'in_person', 'fee' => 1500, 'is_default' => false],
                ],
                'days_off' => [0, 6], // Sunday, Saturday
                'aliases' => ['Emily', 'Dr Emily', 'Chen'],
            ],
            [
                'id' => 3,
                'department' => 'Pediatrics',
                'name' => 'Dr. Rajesh Kumar',
                'slug' => 'dr-rajesh-kumar',
                'specialization' => 'Pediatrician',
                'qualification' => 'MBBS, MD (Pediatrics)',
                'experience_years' => 10,
                'bio' => 'Caring pediatrician with special interest in childhood nutrition and developmental milestones.',
                'avatar_url' => '/assets/avatars/doctor3.jpg',
                'rating' => 4.7,
                'reviews_count' => 215,
                'modes' => [
                    ['mode' => 'video', 'fee' => 700, 'is_default' => true],
                    ['mode' => 'in_person', 'fee' => 1000, 'is_default' => false],
                ],
                'days_off' => [0, 3], // Sunday, Wednesday
                'aliases' => ['Rajesh', 'Dr Rajesh', 'Kumar', 'Dr. Meera Iyer'],
            ],
            [
                'id' => 4,
                'department' => 'Dermatology',
                'name' => 'Dr. Anita Deshmukh',
                'slug' => 'dr-anita-deshmukh',
                'specialization' => 'Dermatologist',
                'qualification' => 'MBBS, MD (Dermatology)',
                'experience_years' => 15,
                'bio' => 'Expert dermatologist specializing in cosmetic dermatology and skin allergy management.',
                'avatar_url' => '/assets/avatars/doctor4.jpg',
                'rating' => 4.6,
                'reviews_count' => 189,
                'modes' => [
                    ['mode' => 'video', 'fee' => 1000, 'is_default' => true],
                    ['mode' => 'in_person', 'fee' => 1500, 'is_default' => false],
                ],
                'days_off' => [0, 6], // Sunday, Saturday
                'aliases' => ['Anita', 'Dr Anita', 'Deshmukh'],
            ],
            [
                'id' => 5,
                'department' => 'Orthopedics',
                'name' => 'Dr. Vikram Patel',
                'slug' => 'dr-vikram-patel',
                'specialization' => 'Orthopedist',
                'qualification' => 'MBBS, MS (Orthopedics)',
                'experience_years' => 20,
                'bio' => 'Senior orthopedic surgeon with expertise in joint replacement and sports injuries.',
                'avatar_url' => '/assets/avatars/doctor5.jpg',
                'rating' => 4.9,
                'reviews_count' => 476,
                'modes' => [
                    ['mode' => 'in_person', 'fee' => 1800, 'is_default' => true],
                ],
                'days_off' => [0, 2, 4], // Sunday, Tuesday, Thursday
                'aliases' => ['Vikram', 'Dr Vikram', 'Patel'],
            ],
            // New doctors
            [
                'id' => 6,
                'department' => 'ENT',
                'name' => 'Dr. Priya Sharma',
                'slug' => 'dr-priya-sharma',
                'specialization' => 'ENT Specialist',
                'qualification' => 'MBBS, MS (ENT)',
                'experience_years' => 9,
                'bio' => 'ENT specialist with expertise in sinus surgery and hearing disorders.',
                'avatar_url' => '/assets/avatars/doctor6.jpg',
                'rating' => 4.5,
                'reviews_count' => 156,
                'modes' => [
                    ['mode' => 'video', 'fee' => 800, 'is_default' => true],
                    ['mode' => 'in_person', 'fee' => 1200, 'is_default' => false],
                ],
                'days_off' => [0, 5], // Sunday, Friday
                'aliases' => ['Priya', 'Dr Priya', 'Sharma'],
            ],
            [
                'id' => 7,
                'department' => 'Neurology',
                'name' => 'Dr. Amit Verma',
                'slug' => 'dr-amit-verma',
                'specialization' => 'Neurologist',
                'qualification' => 'MBBS, DM (Neurology)',
                'experience_years' => 14,
                'bio' => 'Neurologist specializing in epilepsy management and stroke rehabilitation.',
                'avatar_url' => '/assets/avatars/doctor7.jpg',
                'rating' => 4.7,
                'reviews_count' => 203,
                'modes' => [
                    ['mode' => 'video', 'fee' => 1000, 'is_default' => true],
                    ['mode' => 'in_person', 'fee' => 1400, 'is_default' => false],
                ],
                'days_off' => [0, 6], // Sunday, Saturday
                'aliases' => ['Amit', 'Dr Amit', 'Verma'],
            ],
            [
                'id' => 8,
                'department' => 'Gynecology',
                'name' => 'Dr. Sunita Reddy',
                'slug' => 'dr-sunita-reddy',
                'specialization' => 'Gynecologist',
                'qualification' => 'MBBS, MS (OB-GYN)',
                'experience_years' => 16,
                'bio' => 'Experienced gynecologist specializing in high-risk pregnancies and laparoscopic surgery.',
                'avatar_url' => '/assets/avatars/doctor8.jpg',
                'rating' => 4.8,
                'reviews_count' => 312,
                'modes' => [
                    ['mode' => 'video', 'fee' => 900, 'is_default' => false],
                    ['mode' => 'in_person', 'fee' => 1500, 'is_default' => true],
                ],
                'days_off' => [0, 3], // Sunday, Wednesday
                'aliases' => ['Sunita', 'Dr Sunita', 'Reddy'],
            ],
            [
                'id' => 9,
                'department' => 'Ophthalmology',
                'name' => 'Dr. Karan Mehta',
                'slug' => 'dr-karan-mehta',
                'specialization' => 'Ophthalmologist',
                'qualification' => 'MBBS, MS (Ophthalmology)',
                'experience_years' => 11,
                'bio' => 'Eye specialist with expertise in LASIK surgery and retinal disorders.',
                'avatar_url' => '/assets/avatars/doctor9.jpg',
                'rating' => 4.6,
                'reviews_count' => 178,
                'modes' => [
                    ['mode' => 'in_person', 'fee' => 1200, 'is_default' => true],
                ],
                'days_off' => [0, 1], // Sunday, Monday
                'aliases' => ['Karan', 'Dr Karan', 'Mehta'],
            ],
            [
                'id' => 10,
                'department' => 'Dental',
                'name' => 'Dr. Neha Gupta',
                'slug' => 'dr-neha-gupta',
                'specialization' => 'Dentist',
                'qualification' => 'BDS, MDS (Orthodontics)',
                'experience_years' => 8,
                'bio' => 'Dentist specializing in orthodontics, cosmetic dentistry, and root canal treatments.',
                'avatar_url' => '/assets/avatars/doctor10.jpg',
                'rating' => 4.5,
                'reviews_count' => 134,
                'modes' => [
                    ['mode' => 'in_person', 'fee' => 800, 'is_default' => true],
                ],
                'days_off' => [0, 4], // Sunday, Thursday
                'aliases' => ['Neha', 'Dr Neha', 'Gupta'],
            ],
        ];

        foreach ($doctors as $doctorData) {
            $department = Department::where('name', $doctorData['department'])->first();

            $doctor = Doctor::create([
                'id' => $doctorData['id'],
                'department_id' => $department->id,
                'name' => $doctorData['name'],
                'slug' => $doctorData['slug'],
                'specialization' => $doctorData['specialization'],
                'qualification' => $doctorData['qualification'],
                'experience_years' => $doctorData['experience_years'],
                'bio' => $doctorData['bio'],
                'avatar_url' => $doctorData['avatar_url'],
                'rating' => $doctorData['rating'],
                'reviews_count' => $doctorData['reviews_count'],
            ]);

            // Consultation modes
            foreach ($doctorData['modes'] as $mode) {
                DoctorConsultationMode::create([
                    'doctor_id' => $doctor->id,
                    'mode' => $mode['mode'],
                    'fee' => $mode['fee'],
                    'is_default' => $mode['is_default'],
                ]);
            }

            // Availability (all days except days off)
            $allDays = [0, 1, 2, 3, 4, 5, 6];
            foreach ($allDays as $day) {
                $isAvailable = !in_array($day, $doctorData['days_off']);
                DoctorAvailability::create([
                    'doctor_id' => $doctor->id,
                    'day_of_week' => $day,
                    'start_time' => '08:00',
                    'end_time' => '17:00',
                    'slot_duration_minutes' => 60,
                    'is_available' => $isAvailable,
                ]);
            }

            // Aliases
            foreach ($doctorData['aliases'] as $alias) {
                DoctorAlias::create([
                    'doctor_id' => $doctor->id,
                    'alias' => $alias,
                ]);
            }
        }
    }

    private function seedTimeSlots(): void
    {
        $doctors = Doctor::all();
        $today = Carbon::today();

        foreach ($doctors as $doctor) {
            $daysOff = $doctor->availabilities()
                ->where('is_available', false)
                ->pluck('day_of_week')
                ->toArray();

            for ($i = 0; $i < 14; $i++) {
                $date = $today->copy()->addDays($i);

                if (in_array($date->dayOfWeek, $daysOff)) {
                    continue;
                }

                $availability = $doctor->availabilities()
                    ->where('day_of_week', $date->dayOfWeek)
                    ->where('is_available', true)
                    ->first();

                if (!$availability) continue;

                $startHour = (int) substr($availability->start_time, 0, 2);
                $endHour = (int) substr($availability->end_time, 0, 2);
                $slotMinutes = $availability->slot_duration_minutes;

                // Skip lunch hour (13:00)
                for ($h = $startHour; $h < $endHour; $h++) {
                    if ($h === 13) continue; // lunch break

                    $isPreferred = $h >= 9 && $h <= 10;
                    $isBooked = false;

                    // Randomly book ~20% of slots for realism
                    if ($i > 0 && rand(1, 100) <= 20) {
                        $isBooked = true;
                    }

                    TimeSlot::create([
                        'doctor_id' => $doctor->id,
                        'date' => $date->format('Y-m-d'),
                        'start_time' => sprintf('%02d:00', $h),
                        'end_time' => sprintf('%02d:00', $h + 1),
                        'is_booked' => $isBooked,
                        'is_preferred' => $isPreferred,
                    ]);
                }
            }
        }
    }

    private function seedSymptoms(): void
    {
        $symptoms = [
            ['name' => 'Fever', 'department' => 'General Medicine', 'severity_level' => 'moderate'],
            ['name' => 'Cough', 'department' => 'General Medicine', 'severity_level' => 'mild'],
            ['name' => 'Headache', 'department' => 'Neurology', 'severity_level' => 'mild'],
            ['name' => 'Body ache', 'department' => 'General Medicine', 'severity_level' => 'mild'],
            ['name' => 'Fatigue', 'department' => 'General Medicine', 'severity_level' => 'mild'],
            ['name' => 'Sore throat', 'department' => 'ENT', 'severity_level' => 'mild'],
            ['name' => 'Nausea', 'department' => 'General Medicine', 'severity_level' => 'moderate'],
            ['name' => 'Dizziness', 'department' => 'Neurology', 'severity_level' => 'moderate'],
            ['name' => 'Chest pain', 'department' => 'Cardiology', 'severity_level' => 'severe'],
            ['name' => 'Shortness of breath', 'department' => 'Cardiology', 'severity_level' => 'severe'],
            ['name' => 'Skin rash', 'department' => 'Dermatology', 'severity_level' => 'mild'],
            ['name' => 'Joint pain', 'department' => 'Orthopedics', 'severity_level' => 'moderate'],
            ['name' => 'Back pain', 'department' => 'Orthopedics', 'severity_level' => 'moderate'],
            ['name' => 'Ear pain', 'department' => 'ENT', 'severity_level' => 'mild'],
            ['name' => 'Eye irritation', 'department' => 'Ophthalmology', 'severity_level' => 'mild'],
            ['name' => 'Toothache', 'department' => 'Dental', 'severity_level' => 'moderate'],
            ['name' => 'Stomach pain', 'department' => 'General Medicine', 'severity_level' => 'moderate'],
            ['name' => 'Cold and flu', 'department' => 'General Medicine', 'severity_level' => 'mild'],
            ['name' => 'Allergies', 'department' => 'General Medicine', 'severity_level' => 'mild'],
            ['name' => 'Insomnia', 'department' => 'Neurology', 'severity_level' => 'mild'],
        ];

        foreach ($symptoms as $symptom) {
            $department = Department::where('name', $symptom['department'])->first();
            Symptom::create([
                'name' => $symptom['name'],
                'department_id' => $department?->id,
                'severity_level' => $symptom['severity_level'],
            ]);
        }
    }

    private function seedEmergencyKeywords(): void
    {
        $keywords = [
            ['keyword' => 'chest pain', 'severity' => 'critical', 'category' => 'cardiac'],
            ['keyword' => 'heart attack', 'severity' => 'critical', 'category' => 'cardiac'],
            ['keyword' => "can't breathe", 'severity' => 'critical', 'category' => 'respiratory'],
            ['keyword' => 'difficulty breathing', 'severity' => 'critical', 'category' => 'respiratory'],
            ['keyword' => 'severe bleeding', 'severity' => 'critical', 'category' => 'trauma'],
            ['keyword' => 'unconscious', 'severity' => 'critical', 'category' => 'neurological'],
            ['keyword' => 'stroke', 'severity' => 'critical', 'category' => 'neurological'],
            ['keyword' => 'seizure', 'severity' => 'critical', 'category' => 'neurological'],
            ['keyword' => 'severe head injury', 'severity' => 'critical', 'category' => 'trauma'],
            ['keyword' => 'suicide', 'severity' => 'critical', 'category' => 'psychiatric'],
            ['keyword' => 'poisoning', 'severity' => 'critical', 'category' => 'toxicology'],
            ['keyword' => 'severe burn', 'severity' => 'high', 'category' => 'trauma'],
            ['keyword' => 'choking', 'severity' => 'critical', 'category' => 'respiratory'],
            ['keyword' => 'anaphylaxis', 'severity' => 'critical', 'category' => 'allergic'],
            ['keyword' => 'severe allergic reaction', 'severity' => 'critical', 'category' => 'allergic'],
        ];

        foreach ($keywords as $keyword) {
            EmergencyKeyword::create($keyword);
        }
    }

    private function seedLabTestTypes(): void
    {
        $tests = [
            ['name' => 'Complete Blood Count (CBC)', 'slug' => 'cbc', 'category' => 'blood', 'price' => 350, 'turnaround_hours' => 6, 'requires_fasting' => false, 'description' => 'Measures red blood cells, white blood cells, hemoglobin, and platelets'],
            ['name' => 'Lipid Profile', 'slug' => 'lipid-profile', 'category' => 'blood', 'price' => 600, 'turnaround_hours' => 12, 'requires_fasting' => true, 'fasting_hours' => 12, 'description' => 'Measures cholesterol, triglycerides, HDL, and LDL levels'],
            ['name' => 'Blood Sugar (Fasting)', 'slug' => 'blood-sugar-fasting', 'category' => 'blood', 'price' => 150, 'turnaround_hours' => 4, 'requires_fasting' => true, 'fasting_hours' => 8, 'description' => 'Measures blood glucose levels after 8-hour fasting'],
            ['name' => 'HbA1c', 'slug' => 'hba1c', 'category' => 'blood', 'price' => 550, 'turnaround_hours' => 12, 'requires_fasting' => false, 'description' => 'Average blood sugar over past 3 months'],
            ['name' => 'Thyroid Profile (T3, T4, TSH)', 'slug' => 'thyroid-profile', 'category' => 'hormonal', 'price' => 800, 'turnaround_hours' => 24, 'requires_fasting' => false, 'description' => 'Measures thyroid hormone levels'],
            ['name' => 'Liver Function Test (LFT)', 'slug' => 'lft', 'category' => 'blood', 'price' => 700, 'turnaround_hours' => 12, 'requires_fasting' => true, 'fasting_hours' => 10, 'description' => 'Measures liver enzymes, bilirubin, and protein levels'],
            ['name' => 'Kidney Function Test (KFT)', 'slug' => 'kft', 'category' => 'blood', 'price' => 650, 'turnaround_hours' => 12, 'requires_fasting' => true, 'fasting_hours' => 8, 'description' => 'Measures creatinine, urea, and uric acid levels'],
            ['name' => 'Urine Routine', 'slug' => 'urine-routine', 'category' => 'urine', 'price' => 200, 'turnaround_hours' => 4, 'requires_fasting' => false, 'description' => 'Physical, chemical, and microscopic examination of urine'],
            ['name' => 'Vitamin D', 'slug' => 'vitamin-d', 'category' => 'blood', 'price' => 900, 'turnaround_hours' => 24, 'requires_fasting' => false, 'description' => 'Measures 25-hydroxyvitamin D levels'],
            ['name' => 'Vitamin B12', 'slug' => 'vitamin-b12', 'category' => 'blood', 'price' => 800, 'turnaround_hours' => 24, 'requires_fasting' => false, 'description' => 'Measures vitamin B12 levels in blood'],
            ['name' => 'Iron Studies', 'slug' => 'iron-studies', 'category' => 'blood', 'price' => 750, 'turnaround_hours' => 12, 'requires_fasting' => true, 'fasting_hours' => 8, 'description' => 'Measures serum iron, TIBC, and ferritin'],
            ['name' => 'ECG', 'slug' => 'ecg', 'category' => 'cardiac', 'price' => 300, 'turnaround_hours' => 1, 'requires_fasting' => false, 'description' => 'Electrocardiogram to measure heart rhythm and electrical activity'],
            ['name' => 'Chest X-Ray', 'slug' => 'chest-xray', 'category' => 'imaging', 'price' => 500, 'turnaround_hours' => 4, 'requires_fasting' => false, 'description' => 'Imaging of chest, lungs, and heart'],
            ['name' => 'Blood Sugar (Post Prandial)', 'slug' => 'blood-sugar-pp', 'category' => 'blood', 'price' => 150, 'turnaround_hours' => 4, 'requires_fasting' => false, 'description' => 'Measures blood glucose 2 hours after eating'],
            ['name' => 'CRP (C-Reactive Protein)', 'slug' => 'crp', 'category' => 'blood', 'price' => 500, 'turnaround_hours' => 12, 'requires_fasting' => false, 'description' => 'Marker for inflammation in the body'],
        ];

        foreach ($tests as $test) {
            LabTestType::create($test);
        }
    }

    private function seedLabPackages(): void
    {
        $packages = [
            [
                'name' => 'Complete Health Checkup',
                'slug' => 'complete-health-checkup',
                'description' => 'Comprehensive tests for overall health assessment including CBC, lipid, thyroid, liver, kidney, and more',
                'price' => 4999,
                'original_price' => 5999,
                'test_ids' => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
                'tests_count' => 72,
                'age_range' => '18-60',
                'duration_hours' => '2-3',
                'preparation_notes' => 'Fasting for 10-12 hours required. Water is allowed. Avoid alcohol 24 hours before.',
                'requires_fasting' => true,
                'fasting_hours' => 10,
                'is_popular' => true,
            ],
            [
                'name' => 'Diabetes Screening Package',
                'slug' => 'diabetes-screening',
                'description' => 'Blood sugar, HbA1c, kidney function, and related tests for diabetes monitoring',
                'price' => 1499,
                'original_price' => 1999,
                'test_ids' => [3, 4, 7, 8, 14],
                'tests_count' => 24,
                'age_range' => '25+',
                'duration_hours' => '1-2',
                'preparation_notes' => 'Fasting for 8 hours required. Water is allowed.',
                'requires_fasting' => true,
                'fasting_hours' => 8,
                'is_popular' => false,
            ],
            [
                'name' => 'Basic Health Panel',
                'slug' => 'basic-health-panel',
                'description' => 'Essential tests for routine health monitoring including CBC, blood sugar, and urine',
                'price' => 2499,
                'original_price' => 2999,
                'test_ids' => [1, 3, 8, 15],
                'tests_count' => 40,
                'age_range' => '18+',
                'duration_hours' => '1',
                'preparation_notes' => 'No special preparation required.',
                'requires_fasting' => false,
                'fasting_hours' => null,
                'is_popular' => false,
            ],
            [
                'name' => 'Heart Health Package',
                'slug' => 'heart-health',
                'description' => 'Comprehensive cardiac screening including lipid profile, ECG, and CRP',
                'price' => 3499,
                'original_price' => 4499,
                'test_ids' => [1, 2, 12, 15],
                'tests_count' => 35,
                'age_range' => '30+',
                'duration_hours' => '2',
                'preparation_notes' => 'Fasting for 12 hours required for lipid profile. Avoid caffeine before ECG.',
                'requires_fasting' => true,
                'fasting_hours' => 12,
                'is_popular' => true,
            ],
            [
                'name' => "Women's Health Package",
                'slug' => 'womens-health',
                'description' => 'Tailored health screening for women including thyroid, iron, vitamin D, and CBC',
                'price' => 3999,
                'original_price' => 4999,
                'test_ids' => [1, 5, 9, 10, 11],
                'tests_count' => 45,
                'age_range' => '18+',
                'duration_hours' => '2',
                'preparation_notes' => 'No special preparation required. Best done in the morning.',
                'requires_fasting' => false,
                'fasting_hours' => null,
                'is_popular' => true,
            ],
            [
                'name' => 'Senior Citizen Health Package',
                'slug' => 'senior-citizen-health',
                'description' => 'Complete health assessment for seniors including all major organ function tests',
                'price' => 5999,
                'original_price' => 7999,
                'test_ids' => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15],
                'tests_count' => 85,
                'age_range' => '60+',
                'duration_hours' => '3-4',
                'preparation_notes' => 'Fasting for 10-12 hours required. Water is allowed. Bring all current medications list.',
                'requires_fasting' => true,
                'fasting_hours' => 10,
                'is_popular' => false,
            ],
        ];

        foreach ($packages as $package) {
            LabPackage::create($package);
        }
    }

    private function seedLabCenters(): void
    {
        $centers = [
            [
                'name' => 'HealthCare Diagnostics - Koregaon Park',
                'address' => '123, Palm Grove, Koregaon Park',
                'city' => 'Pune',
                'rating' => 4.7,
                'distance_km' => 2.5,
                'opening_time' => '06:00',
                'closing_time' => '18:00',
                'home_collection_available' => true,
                'home_collection_fee' => 250,
            ],
            [
                'name' => 'HealthCare Diagnostics - Baner',
                'address' => '456, Tech Park Road, Baner',
                'city' => 'Pune',
                'rating' => 4.5,
                'distance_km' => 5.2,
                'opening_time' => '06:00',
                'closing_time' => '20:00',
                'home_collection_available' => true,
                'home_collection_fee' => 300,
            ],
            [
                'name' => 'HealthCare Diagnostics - Viman Nagar',
                'address' => '789, Airport Road, Viman Nagar',
                'city' => 'Pune',
                'rating' => 4.8,
                'distance_km' => 8.1,
                'opening_time' => '06:00',
                'closing_time' => '18:00',
                'home_collection_available' => true,
                'home_collection_fee' => 350,
            ],
            [
                'name' => 'HealthCare Diagnostics - Hinjewadi',
                'address' => '321, Phase 1, Hinjewadi IT Park',
                'city' => 'Pune',
                'rating' => 4.3,
                'distance_km' => 12.0,
                'opening_time' => '07:00',
                'closing_time' => '19:00',
                'home_collection_available' => false,
                'home_collection_fee' => 0,
            ],
        ];

        foreach ($centers as $center) {
            LabCenter::create($center);
        }
    }

    private function seedInsuranceProviders(): void
    {
        $providers = [
            [
                'name' => 'Star Health Insurance',
                'plan_types' => ['individual', 'family', 'senior_citizen'],
            ],
            [
                'name' => 'HDFC ERGO Health',
                'plan_types' => ['individual', 'family', 'corporate'],
            ],
            [
                'name' => 'ICICI Lombard Health',
                'plan_types' => ['individual', 'family'],
            ],
            [
                'name' => 'Max Bupa Health Insurance',
                'plan_types' => ['individual', 'family', 'corporate', 'senior_citizen'],
            ],
            [
                'name' => 'Bajaj Allianz Health',
                'plan_types' => ['individual', 'family'],
            ],
        ];

        foreach ($providers as $provider) {
            InsuranceProvider::create($provider);
        }
    }

    private function seedFamilyMembers(User $user): void
    {
        $members = [
            ['name' => 'Sanjana Jaisinghani', 'relation' => 'self', 'age' => 28, 'gender' => 'female', 'blood_group' => 'B+'],
            ['name' => 'Kriti Jaisinghani', 'relation' => 'mother', 'age' => 54, 'gender' => 'female', 'blood_group' => 'O+'],
            ['name' => 'Raj Jaisinghani', 'relation' => 'father', 'age' => 58, 'gender' => 'male', 'blood_group' => 'B+'],
            ['name' => 'Arjun Jaisinghani', 'relation' => 'brother', 'age' => 24, 'gender' => 'male', 'blood_group' => 'B+'],
            ['name' => 'Dadi Jaisinghani', 'relation' => 'grandmother', 'age' => 78, 'gender' => 'female', 'blood_group' => 'O+'],
            ['name' => 'Rohan Jaisinghani', 'relation' => 'spouse', 'age' => 30, 'gender' => 'male', 'blood_group' => 'A+'],
        ];

        foreach ($members as $member) {
            FamilyMember::create(array_merge($member, ['user_id' => $user->id]));
        }
    }

    private function seedUserAddresses(User $user): void
    {
        $addresses = [
            [
                'label' => 'Home',
                'address_line_1' => 'Flat 302, Sunrise Apartments',
                'address_line_2' => 'Near Phoenix Mall, Viman Nagar',
                'city' => 'Pune',
                'state' => 'Maharashtra',
                'pincode' => '411014',
                'is_default' => true,
            ],
            [
                'label' => 'Office',
                'address_line_1' => '5th Floor, TechPark One',
                'address_line_2' => 'Hinjewadi Phase 1',
                'city' => 'Pune',
                'state' => 'Maharashtra',
                'pincode' => '411057',
                'is_default' => false,
            ],
            [
                'label' => "Parent's House",
                'address_line_1' => '12, Green Valley Society',
                'address_line_2' => 'Koregaon Park',
                'city' => 'Pune',
                'state' => 'Maharashtra',
                'pincode' => '411001',
                'is_default' => false,
            ],
        ];

        foreach ($addresses as $address) {
            UserAddress::create(array_merge($address, ['user_id' => $user->id]));
        }
    }

    private function seedAppointments(User $user): void
    {
        $selfMember = FamilyMember::where('user_id', $user->id)->where('relation', 'self')->first();
        $motherMember = FamilyMember::where('user_id', $user->id)->where('relation', 'mother')->first();

        $appointments = [
            [
                'family_member_id' => $selfMember?->id,
                'doctor_id' => 1,
                'department_id' => 1,
                'appointment_type' => 'doctor',
                'consultation_mode' => 'video',
                'appointment_date' => Carbon::today()->subDays(16)->format('Y-m-d'),
                'appointment_time' => '09:00',
                'status' => 'completed',
                'payment_status' => 'paid',
                'symptoms' => ['Fever', 'Headache'],
                'notes' => 'Prescribed paracetamol and rest. Follow-up in 2 weeks if symptoms persist.',
                'fee' => 800,
            ],
            [
                'family_member_id' => $motherMember?->id,
                'doctor_id' => 2,
                'department_id' => 2,
                'appointment_type' => 'doctor',
                'consultation_mode' => 'in_person',
                'appointment_date' => Carbon::today()->subDays(30)->format('Y-m-d'),
                'appointment_time' => '10:00',
                'status' => 'completed',
                'payment_status' => 'paid',
                'symptoms' => ['Chest pain', 'Shortness of breath'],
                'notes' => 'ECG normal. Prescribed stress management and follow-up in 1 month.',
                'fee' => 1500,
            ],
            [
                'family_member_id' => $selfMember?->id,
                'doctor_id' => 4,
                'department_id' => 4,
                'appointment_type' => 'doctor',
                'consultation_mode' => 'video',
                'appointment_date' => Carbon::today()->subDays(45)->format('Y-m-d'),
                'appointment_time' => '14:00',
                'status' => 'completed',
                'payment_status' => 'paid',
                'symptoms' => ['Skin rash'],
                'notes' => 'Diagnosed mild eczema. Prescribed topical cream.',
                'fee' => 1000,
            ],
            [
                'family_member_id' => $selfMember?->id,
                'doctor_id' => 1,
                'department_id' => 1,
                'appointment_type' => 'lab',
                'consultation_mode' => null,
                'appointment_date' => Carbon::today()->subDays(60)->format('Y-m-d'),
                'appointment_time' => '07:00',
                'status' => 'completed',
                'payment_status' => 'paid',
                'symptoms' => null,
                'notes' => 'Annual health checkup. All reports normal.',
                'fee' => 4999,
            ],
            // Upcoming appointments
            [
                'family_member_id' => $selfMember?->id,
                'doctor_id' => 1,
                'department_id' => 1,
                'appointment_type' => 'doctor',
                'consultation_mode' => 'video',
                'appointment_date' => Carbon::today()->addDays(3)->format('Y-m-d'),
                'appointment_time' => '10:00',
                'status' => 'confirmed',
                'payment_status' => 'paid',
                'symptoms' => ['Follow-up'],
                'notes' => null,
                'fee' => 800,
            ],
            [
                'family_member_id' => $motherMember?->id,
                'doctor_id' => null,
                'department_id' => null,
                'appointment_type' => 'lab',
                'consultation_mode' => null,
                'appointment_date' => Carbon::today()->addDays(5)->format('Y-m-d'),
                'appointment_time' => '08:00',
                'status' => 'confirmed',
                'payment_status' => 'pending',
                'symptoms' => null,
                'notes' => null,
                'fee' => 4999,
                'lab_package_id' => 1,
                'collection_type' => 'home',
            ],
            // Cancelled appointment
            [
                'family_member_id' => $selfMember?->id,
                'doctor_id' => 2,
                'department_id' => 2,
                'appointment_type' => 'doctor',
                'consultation_mode' => 'in_person',
                'appointment_date' => Carbon::today()->addDays(2)->format('Y-m-d'),
                'appointment_time' => '14:00',
                'status' => 'cancelled',
                'payment_status' => 'fully_refunded',
                'symptoms' => ['Chest pain'],
                'notes' => null,
                'fee' => 1500,
            ],
        ];

        foreach ($appointments as $appointment) {
            Appointment::create(array_merge($appointment, ['user_id' => $user->id]));
        }
    }

    private function seedInsuranceClaims(User $user): void
    {
        $starHealth = InsuranceProvider::where('name', 'Star Health Insurance')->first();
        $hdfcErgo = InsuranceProvider::where('name', 'HDFC ERGO Health')->first();

        $claims = [
            [
                'insurance_provider_id' => $starHealth?->id ?? 1,
                'policy_number' => 'SH-2025-789456',
                'claim_amount' => 15000,
                'status' => 'approved',
                'description' => 'Annual health checkup claim',
                'claim_date' => Carbon::today()->subDays(45)->format('Y-m-d'),
            ],
            [
                'insurance_provider_id' => $starHealth?->id ?? 1,
                'policy_number' => 'SH-2025-789456',
                'claim_amount' => 3500,
                'status' => 'approved',
                'description' => 'Consultation and medication for fever',
                'claim_date' => Carbon::today()->subDays(16)->format('Y-m-d'),
            ],
            [
                'insurance_provider_id' => $hdfcErgo?->id ?? 2,
                'policy_number' => 'HE-2026-123456',
                'claim_amount' => 8000,
                'status' => 'processing',
                'description' => 'Cardiology consultation and ECG',
                'claim_date' => Carbon::today()->subDays(5)->format('Y-m-d'),
            ],
            [
                'insurance_provider_id' => $starHealth?->id ?? 1,
                'policy_number' => 'SH-2025-789456',
                'claim_amount' => 5000,
                'status' => 'pending',
                'description' => 'Dermatology consultation claim',
                'claim_date' => Carbon::today()->subDays(2)->format('Y-m-d'),
            ],
        ];

        foreach ($claims as $claim) {
            InsuranceClaim::create(array_merge($claim, ['user_id' => $user->id]));
        }
    }

    private function seedBillingNotifications(User $user): void
    {
        $appointments = Appointment::where('user_id', $user->id)
            ->with('doctor')
            ->orderBy('appointment_date')
            ->get();

        $notifications = [];

        // Appointment 1: doctor, paid, 16 days ago — Dr. Sarah Johnson, ₹800
        if ($appt = $appointments->get(0)) {
            $notifications[] = [
                'appointment_id' => $appt->id,
                'type' => 'bill_generated',
                'title' => 'New Bill Generated',
                'message' => 'Your bill for consultation with Dr. Sarah Johnson has been generated. Amount: ₹800.',
                'channels' => ['push', 'email'],
                'data' => ['amount' => 800, 'invoice_number' => 'INV-000001', 'doctor_name' => 'Dr. Sarah Johnson'],
                'read_at' => now()->subDays(15),
                'created_at' => now()->subDays(16),
            ];
            $notifications[] = [
                'appointment_id' => $appt->id,
                'type' => 'payment_successful',
                'title' => 'Payment Successful',
                'message' => 'Your payment of ₹800 for INV-000001 has been processed successfully.',
                'channels' => ['push', 'email', 'sms'],
                'data' => ['amount' => 800, 'invoice_number' => 'INV-000001', 'payment_method' => 'UPI'],
                'read_at' => now()->subDays(15),
                'created_at' => now()->subDays(16),
            ];
        }

        // Appointment 2: doctor, paid, 30 days ago — Dr. Emily Chen, ₹1,500
        if ($appt = $appointments->get(1)) {
            $notifications[] = [
                'appointment_id' => $appt->id,
                'type' => 'bill_generated',
                'title' => 'New Bill Generated',
                'message' => 'Your bill for consultation with Dr. Emily Chen has been generated. Amount: ₹1,500.',
                'channels' => ['push', 'email'],
                'data' => ['amount' => 1500, 'invoice_number' => 'INV-000002', 'doctor_name' => 'Dr. Emily Chen'],
                'read_at' => now()->subDays(29),
                'created_at' => now()->subDays(30),
            ];
            $notifications[] = [
                'appointment_id' => $appt->id,
                'type' => 'insurance_claim_approved',
                'title' => 'Insurance Claim Approved',
                'message' => 'Your insurance claim for INV-000002 has been approved. Coverage: ₹1,200. Your co-pay: ₹300.',
                'channels' => ['push', 'email'],
                'data' => ['amount' => 1500, 'coverage' => 1200, 'copay' => 300, 'invoice_number' => 'INV-000002'],
                'read_at' => now()->subDays(27),
                'created_at' => now()->subDays(28),
            ];
        }

        // Appointment 3: doctor, paid, 45 days ago — Dr. Anita Deshmukh, ₹1,000
        if ($appt = $appointments->get(2)) {
            $notifications[] = [
                'appointment_id' => $appt->id,
                'type' => 'bill_generated',
                'title' => 'New Bill Generated',
                'message' => 'Your bill for consultation with Dr. Anita Deshmukh has been generated. Amount: ₹1,000.',
                'channels' => ['push', 'email'],
                'data' => ['amount' => 1000, 'invoice_number' => 'INV-000003', 'doctor_name' => 'Dr. Anita Deshmukh'],
                'read_at' => now()->subDays(44),
                'created_at' => now()->subDays(45),
            ];
            $notifications[] = [
                'appointment_id' => $appt->id,
                'type' => 'payment_successful',
                'title' => 'Payment Successful',
                'message' => 'Your payment of ₹1,000 for INV-000003 has been processed successfully.',
                'channels' => ['push', 'email', 'sms'],
                'data' => ['amount' => 1000, 'invoice_number' => 'INV-000003', 'payment_method' => 'Credit Card'],
                'read_at' => now()->subDays(44),
                'created_at' => now()->subDays(45),
            ];
        }

        // Appointment 4: lab, paid, 60 days ago — ₹4,999
        if ($appt = $appointments->get(3)) {
            $notifications[] = [
                'appointment_id' => $appt->id,
                'type' => 'bill_generated',
                'title' => 'New Bill Generated',
                'message' => 'Your bill for Complete Health Checkup has been generated. Amount: ₹4,999.',
                'channels' => ['push', 'email'],
                'data' => ['amount' => 4999, 'invoice_number' => 'INV-000004', 'test_name' => 'Complete Health Checkup'],
                'read_at' => now()->subDays(59),
                'created_at' => now()->subDays(60),
            ];
        }

        // Appointment 5: upcoming doctor, 3 days from now — Dr. Sarah Johnson, ₹800
        if ($appt = $appointments->get(4)) {
            $notifications[] = [
                'appointment_id' => $appt->id,
                'type' => 'bill_generated',
                'title' => 'New Bill Generated',
                'message' => 'Your bill for follow-up consultation with Dr. Sarah Johnson has been generated. Amount: ₹800.',
                'channels' => ['push', 'email'],
                'data' => ['amount' => 800, 'invoice_number' => 'INV-000005', 'doctor_name' => 'Dr. Sarah Johnson'],
                'read_at' => null,
                'created_at' => now()->subHours(6),
            ];
            $notifications[] = [
                'appointment_id' => $appt->id,
                'type' => 'payment_due_reminder',
                'title' => 'Payment Due in 3 Days',
                'message' => 'Your bill INV-000005 of ₹800 is due on ' . now()->addDays(3)->format('M d') . '. Pay now to avoid late fees.',
                'channels' => ['push', 'email'],
                'data' => ['amount' => 800, 'invoice_number' => 'INV-000005', 'due_date' => now()->addDays(3)->format('Y-m-d')],
                'read_at' => null,
                'created_at' => now()->subHours(2),
            ];
        }

        // Appointment 6: upcoming lab, 5 days from now — ₹4,999
        if ($appt = $appointments->get(5)) {
            $notifications[] = [
                'appointment_id' => $appt->id,
                'type' => 'bill_generated',
                'title' => 'New Bill Generated',
                'message' => 'Your bill for Complete Health Checkup (home collection) has been generated. Amount: ₹4,999.',
                'channels' => ['push', 'email'],
                'data' => ['amount' => 4999, 'invoice_number' => 'INV-000006', 'test_name' => 'Complete Health Checkup'],
                'read_at' => null,
                'created_at' => now()->subDays(1),
            ];
            $notifications[] = [
                'appointment_id' => $appt->id,
                'type' => 'emi_due_reminder',
                'title' => 'EMI Payment Due',
                'message' => 'Your EMI installment 2/6 of ₹833 is due on ' . now()->addDays(5)->format('M d') . '. Pay to avoid penalties.',
                'channels' => ['push', 'email'],
                'data' => ['amount' => 833, 'installment' => 2, 'total_installments' => 6, 'invoice_number' => 'INV-000006'],
                'read_at' => null,
                'created_at' => now()->subHours(4),
            ];
        }

        // Appointment 7: cancelled, refunded
        if ($appt = $appointments->get(6)) {
            $notifications[] = [
                'appointment_id' => $appt->id,
                'type' => 'bill_generated',
                'title' => 'New Bill Generated',
                'message' => 'Your bill for consultation with Dr. Emily Chen has been generated. Amount: ₹1,500.',
                'channels' => ['push', 'email'],
                'data' => ['amount' => 1500, 'invoice_number' => 'INV-000007', 'doctor_name' => 'Dr. Emily Chen'],
                'read_at' => now()->subDays(1),
                'created_at' => now()->subDays(2),
            ];
            $notifications[] = [
                'appointment_id' => $appt->id,
                'type' => 'payment_failed',
                'title' => 'Payment Failed',
                'message' => 'Your payment of ₹1,500 for INV-000007 could not be processed. Please try again or use a different payment method.',
                'channels' => ['push', 'email'],
                'data' => ['amount' => 1500, 'invoice_number' => 'INV-000007', 'reason' => 'Insufficient funds'],
                'read_at' => null,
                'created_at' => now()->subDays(2),
            ];
            $notifications[] = [
                'appointment_id' => $appt->id,
                'type' => 'dispute_update',
                'title' => 'Dispute Under Review',
                'message' => 'Your dispute for INV-000007 is under review. Expected resolution: 5-7 business days.',
                'channels' => ['push', 'email'],
                'data' => ['invoice_number' => 'INV-000007', 'dispute_reason' => 'Incorrect charges'],
                'read_at' => null,
                'created_at' => now()->subDays(1),
            ];
        }

        // General: insurance claim rejected (not tied to specific appointment)
        $notifications[] = [
            'appointment_id' => null,
            'type' => 'insurance_claim_rejected',
            'title' => 'Insurance Claim Rejected',
            'message' => 'Your insurance claim of ₹5,000 was rejected. Reason: Pre-existing condition exclusion. Contact your insurer for details.',
            'channels' => ['push', 'email'],
            'data' => ['claim_amount' => 5000, 'reason' => 'Pre-existing condition exclusion', 'provider' => 'Star Health Insurance'],
            'read_at' => null,
            'created_at' => now()->subDays(3),
        ];

        foreach ($notifications as $notification) {
            BillingNotification::create(array_merge($notification, [
                'user_id' => $user->id,
            ]));
        }
    }

    private function seedHealthRecords(User $user): void
    {
        $appointments = Appointment::where('user_id', $user->id)
            ->orderBy('id')
            ->get();

        $selfMember = FamilyMember::where('user_id', $user->id)->where('relation', 'self')->first();
        $motherMember = FamilyMember::where('user_id', $user->id)->where('relation', 'mother')->first();

        $records = [];

        // === Appointment 1: Dr. Sarah Johnson, Fever/Headache, 16 days ago ===
        if ($appt = $appointments->get(0)) {
            $records[] = [
                'appointment_id' => $appt->id,
                'family_member_id' => $selfMember?->id,
                'category' => 'consultation_notes',
                'title' => 'Consultation Notes — Dr. Sarah Johnson',
                'description' => 'Patient presented with fever (101°F) and headache for 3 days. Diagnosed as viral fever. Advised rest and hydration.',
                'doctor_name' => 'Dr. Sarah Johnson',
                'department_name' => 'General Medicine',
                'record_date' => Carbon::today()->subDays(16)->format('Y-m-d'),
                'metadata' => [
                    'diagnosis' => 'Viral Fever',
                    'icd_code' => 'R50.9',
                    'symptoms' => ['Fever', 'Headache'],
                    'examination_findings' => 'Temperature 101°F, throat mildly congested, no rash. Lungs clear.',
                    'treatment_plan' => 'Paracetamol 500mg TDS for 5 days. Cetirizine 10mg OD. Rest and fluids. Follow up in 2 weeks if symptoms persist.',
                ],
            ];
            $records[] = [
                'appointment_id' => $appt->id,
                'family_member_id' => $selfMember?->id,
                'category' => 'prescription',
                'title' => 'Prescription — Viral Fever Treatment',
                'description' => 'Prescribed medications for viral fever management.',
                'doctor_name' => 'Dr. Sarah Johnson',
                'department_name' => 'General Medicine',
                'record_date' => Carbon::today()->subDays(16)->format('Y-m-d'),
                'metadata' => [
                    'drugs' => [
                        ['name' => 'Paracetamol 500mg', 'dosage' => '1 tablet', 'frequency' => 'Three times a day', 'duration' => '5 days', 'instructions' => 'After meals'],
                        ['name' => 'Cetirizine 10mg', 'dosage' => '1 tablet', 'frequency' => 'Once daily', 'duration' => '5 days', 'instructions' => 'At bedtime'],
                    ],
                    'valid_until' => Carbon::today()->subDays(11)->format('Y-m-d'),
                ],
                'file_type' => 'pdf',
            ];
            $records[] = [
                'appointment_id' => $appt->id,
                'family_member_id' => $selfMember?->id,
                'category' => 'lab_report',
                'title' => 'Complete Blood Count (CBC)',
                'description' => 'Routine blood work ordered to rule out bacterial infection. All parameters within normal range.',
                'doctor_name' => 'Dr. Sarah Johnson',
                'department_name' => 'General Medicine',
                'record_date' => Carbon::today()->subDays(16)->format('Y-m-d'),
                'metadata' => [
                    'test_name' => 'Complete Blood Count',
                    'test_category' => 'Hematology',
                    'lab_name' => 'Pune Diagnostics Lab',
                    'results' => [
                        ['parameter' => 'Hemoglobin', 'value' => '14.2', 'unit' => 'g/dL', 'reference_range' => '13.0-17.0', 'status' => 'normal'],
                        ['parameter' => 'WBC Count', 'value' => '7,200', 'unit' => 'cells/mcL', 'reference_range' => '4,500-11,000', 'status' => 'normal'],
                        ['parameter' => 'RBC Count', 'value' => '4.8', 'unit' => 'million/mcL', 'reference_range' => '4.5-5.5', 'status' => 'normal'],
                        ['parameter' => 'Platelet Count', 'value' => '250,000', 'unit' => '/mcL', 'reference_range' => '150,000-400,000', 'status' => 'normal'],
                        ['parameter' => 'ESR', 'value' => '12', 'unit' => 'mm/hr', 'reference_range' => '0-20', 'status' => 'normal'],
                    ],
                ],
                'file_type' => 'pdf',
            ];
            $records[] = [
                'appointment_id' => $appt->id,
                'family_member_id' => $selfMember?->id,
                'category' => 'invoice',
                'title' => 'Invoice INV-000001',
                'description' => 'Consultation with Dr. Sarah Johnson — General Medicine.',
                'record_date' => Carbon::today()->subDays(16)->format('Y-m-d'),
                'metadata' => [
                    'invoice_number' => 'INV-000001',
                    'amount' => 800,
                    'payment_status' => 'paid',
                    'line_items' => [
                        ['label' => 'Video Consultation — Dr. Sarah Johnson', 'amount' => 800],
                    ],
                ],
            ];
        }

        // === Appointment 2: Dr. Emily Chen, Chest Pain, mother, 30 days ago ===
        if ($appt = $appointments->get(1)) {
            $records[] = [
                'appointment_id' => $appt->id,
                'family_member_id' => $motherMember?->id,
                'category' => 'consultation_notes',
                'title' => 'Consultation Notes — Dr. Emily Chen',
                'description' => 'Patient (mother) presented with intermittent chest pain and shortness of breath. ECG normal. Diagnosed as anxiety-related chest pain.',
                'doctor_name' => 'Dr. Emily Chen',
                'department_name' => 'Cardiology',
                'record_date' => Carbon::today()->subDays(30)->format('Y-m-d'),
                'metadata' => [
                    'diagnosis' => 'Anxiety-related Chest Pain (Non-cardiac)',
                    'icd_code' => 'R07.9',
                    'symptoms' => ['Chest pain', 'Shortness of breath'],
                    'examination_findings' => 'BP 130/85 mmHg, HR 82 bpm. ECG: Normal sinus rhythm, no ST changes. Chest auscultation clear.',
                    'treatment_plan' => 'Stress management counseling. Alprazolam 0.25mg SOS. Lifestyle modifications. Referral to psychiatry. Follow-up in 1 month.',
                ],
            ];
            $records[] = [
                'appointment_id' => $appt->id,
                'family_member_id' => $motherMember?->id,
                'category' => 'prescription',
                'title' => 'Prescription — Anxiety Management',
                'description' => 'Prescribed anxiolytic and lifestyle modifications for anxiety-related chest pain.',
                'doctor_name' => 'Dr. Emily Chen',
                'department_name' => 'Cardiology',
                'record_date' => Carbon::today()->subDays(30)->format('Y-m-d'),
                'metadata' => [
                    'drugs' => [
                        ['name' => 'Alprazolam 0.25mg', 'dosage' => '1 tablet', 'frequency' => 'As needed (SOS)', 'duration' => '2 weeks', 'instructions' => 'Only when experiencing acute anxiety. Max 2 per day.'],
                        ['name' => 'Multivitamin', 'dosage' => '1 tablet', 'frequency' => 'Once daily', 'duration' => '30 days', 'instructions' => 'After breakfast'],
                    ],
                    'valid_until' => Carbon::today()->subDays(16)->format('Y-m-d'),
                ],
                'file_type' => 'pdf',
            ];
            $records[] = [
                'appointment_id' => $appt->id,
                'family_member_id' => $motherMember?->id,
                'category' => 'lab_report',
                'title' => 'Lipid Profile',
                'description' => 'Lipid panel to assess cardiovascular risk. Borderline high LDL noted.',
                'doctor_name' => 'Dr. Emily Chen',
                'department_name' => 'Cardiology',
                'record_date' => Carbon::today()->subDays(30)->format('Y-m-d'),
                'metadata' => [
                    'test_name' => 'Lipid Profile',
                    'test_category' => 'Biochemistry',
                    'lab_name' => 'Pune Diagnostics Lab',
                    'results' => [
                        ['parameter' => 'Total Cholesterol', 'value' => '210', 'unit' => 'mg/dL', 'reference_range' => '<200', 'status' => 'borderline'],
                        ['parameter' => 'LDL Cholesterol', 'value' => '138', 'unit' => 'mg/dL', 'reference_range' => '<130', 'status' => 'borderline'],
                        ['parameter' => 'HDL Cholesterol', 'value' => '52', 'unit' => 'mg/dL', 'reference_range' => '>40', 'status' => 'normal'],
                        ['parameter' => 'Triglycerides', 'value' => '145', 'unit' => 'mg/dL', 'reference_range' => '<150', 'status' => 'normal'],
                    ],
                ],
                'file_type' => 'pdf',
            ];
            $records[] = [
                'appointment_id' => $appt->id,
                'family_member_id' => $motherMember?->id,
                'category' => 'xray_report',
                'title' => 'Chest X-ray (PA View)',
                'description' => 'Chest radiograph to rule out cardiac or pulmonary pathology. Normal findings.',
                'doctor_name' => 'Dr. Emily Chen',
                'department_name' => 'Cardiology',
                'record_date' => Carbon::today()->subDays(30)->format('Y-m-d'),
                'metadata' => [
                    'body_part' => 'Chest (PA view)',
                    'indication' => 'Chest pain with shortness of breath — rule out cardiac/pulmonary pathology',
                    'technique' => 'Standard PA erect view',
                    'findings' => 'Heart size normal. Lung fields clear. No pleural effusion. Mediastinum normal. Costophrenic angles clear.',
                    'impression' => 'Normal chest radiograph. No acute cardiopulmonary abnormality.',
                    'radiologist' => 'Dr. Suresh Patil',
                ],
                'file_type' => 'image',
            ];
            $records[] = [
                'appointment_id' => $appt->id,
                'family_member_id' => $motherMember?->id,
                'category' => 'ecg_report',
                'title' => 'ECG — 12 Lead',
                'description' => 'Routine electrocardiogram during cardiology consultation. Normal sinus rhythm.',
                'doctor_name' => 'Dr. Emily Chen',
                'department_name' => 'Cardiology',
                'record_date' => Carbon::today()->subDays(30)->format('Y-m-d'),
                'metadata' => [
                    'indication' => 'Chest pain evaluation',
                    'heart_rate' => 82,
                    'rhythm' => 'Normal Sinus Rhythm',
                    'intervals' => ['pr' => '0.16s', 'qrs' => '0.08s', 'qt' => '0.38s'],
                    'axis' => 'Normal axis',
                    'findings' => 'Normal sinus rhythm at 82 bpm. Normal P waves. Normal PR interval. No ST-T changes. No Q waves.',
                    'impression' => 'Normal ECG. No evidence of ischemia or arrhythmia.',
                ],
                'file_type' => 'pdf',
            ];
            $records[] = [
                'appointment_id' => $appt->id,
                'family_member_id' => $motherMember?->id,
                'category' => 'referral',
                'title' => 'Referral to Psychiatry',
                'description' => 'Referred for stress management and anxiety counseling.',
                'doctor_name' => 'Dr. Emily Chen',
                'department_name' => 'Cardiology',
                'record_date' => Carbon::today()->subDays(30)->format('Y-m-d'),
                'metadata' => [
                    'referred_to_doctor' => 'Dr. Meera Iyer',
                    'referred_to_department' => 'Psychiatry',
                    'reason' => 'Anxiety-related chest pain. Needs stress management counseling and possible long-term anxiolytic management.',
                    'priority' => 'routine',
                ],
            ];
            $records[] = [
                'appointment_id' => $appt->id,
                'family_member_id' => $motherMember?->id,
                'category' => 'invoice',
                'title' => 'Invoice INV-000002',
                'description' => 'Consultation with Dr. Emily Chen — Cardiology.',
                'record_date' => Carbon::today()->subDays(30)->format('Y-m-d'),
                'metadata' => [
                    'invoice_number' => 'INV-000002',
                    'amount' => 1500,
                    'payment_status' => 'paid',
                    'line_items' => [
                        ['label' => 'In-person Consultation — Dr. Emily Chen', 'amount' => 1200],
                        ['label' => 'ECG', 'amount' => 200],
                        ['label' => 'Chest X-ray', 'amount' => 100],
                    ],
                ],
            ];
        }

        // === Appointment 3: Dr. Anita Reddy, Skin Rash, 45 days ago ===
        if ($appt = $appointments->get(2)) {
            $records[] = [
                'appointment_id' => $appt->id,
                'family_member_id' => $selfMember?->id,
                'category' => 'consultation_notes',
                'title' => 'Consultation Notes — Dr. Anita Deshmukh',
                'description' => 'Patient presented with itchy red rash on arms and neck for 1 week. Diagnosed as mild eczema.',
                'doctor_name' => 'Dr. Anita Deshmukh',
                'department_name' => 'Dermatology',
                'record_date' => Carbon::today()->subDays(45)->format('Y-m-d'),
                'metadata' => [
                    'diagnosis' => 'Mild Eczema (Atopic Dermatitis)',
                    'icd_code' => 'L30.9',
                    'symptoms' => ['Skin rash', 'Itching'],
                    'examination_findings' => 'Erythematous papular rash on bilateral forearms and neck. No vesicles. Mild scaling. No secondary infection.',
                    'treatment_plan' => 'Topical hydrocortisone 1% cream BD for 2 weeks. Moisturizer application TDS. Avoid harsh soaps. Follow-up if no improvement in 2 weeks.',
                ],
            ];
            $records[] = [
                'appointment_id' => $appt->id,
                'family_member_id' => $selfMember?->id,
                'category' => 'prescription',
                'title' => 'Prescription — Eczema Treatment',
                'description' => 'Topical treatment for mild eczema.',
                'doctor_name' => 'Dr. Anita Deshmukh',
                'department_name' => 'Dermatology',
                'record_date' => Carbon::today()->subDays(45)->format('Y-m-d'),
                'metadata' => [
                    'drugs' => [
                        ['name' => 'Hydrocortisone Cream 1%', 'dosage' => 'Thin layer', 'frequency' => 'Twice daily', 'duration' => '2 weeks', 'instructions' => 'Apply on affected areas only. Do not use on face.'],
                        ['name' => 'Cetaphil Moisturizing Lotion', 'dosage' => 'Liberal application', 'frequency' => 'Three times daily', 'duration' => '4 weeks', 'instructions' => 'Apply after bathing and throughout the day to prevent dryness.'],
                    ],
                    'valid_until' => Carbon::today()->subDays(31)->format('Y-m-d'),
                ],
                'file_type' => 'pdf',
            ];
            $records[] = [
                'appointment_id' => $appt->id,
                'family_member_id' => $selfMember?->id,
                'category' => 'invoice',
                'title' => 'Invoice INV-000003',
                'description' => 'Consultation with Dr. Anita Deshmukh — Dermatology.',
                'record_date' => Carbon::today()->subDays(45)->format('Y-m-d'),
                'metadata' => [
                    'invoice_number' => 'INV-000003',
                    'amount' => 1000,
                    'payment_status' => 'paid',
                    'line_items' => [
                        ['label' => 'Video Consultation — Dr. Anita Deshmukh', 'amount' => 1000],
                    ],
                ],
            ];
        }

        // === Appointment 4: Lab - Annual Health Checkup, 60 days ago ===
        if ($appt = $appointments->get(3)) {
            $labReports = [
                [
                    'title' => 'Complete Blood Count (CBC)',
                    'description' => 'Annual health checkup — hematology panel. All parameters normal.',
                    'test_name' => 'Complete Blood Count',
                    'test_category' => 'Hematology',
                    'results' => [
                        ['parameter' => 'Hemoglobin', 'value' => '14.5', 'unit' => 'g/dL', 'reference_range' => '13.0-17.0', 'status' => 'normal'],
                        ['parameter' => 'WBC Count', 'value' => '6,800', 'unit' => 'cells/mcL', 'reference_range' => '4,500-11,000', 'status' => 'normal'],
                        ['parameter' => 'Platelet Count', 'value' => '265,000', 'unit' => '/mcL', 'reference_range' => '150,000-400,000', 'status' => 'normal'],
                    ],
                ],
                [
                    'title' => 'Lipid Profile',
                    'description' => 'Annual health checkup — lipid panel. All within normal limits.',
                    'test_name' => 'Lipid Profile',
                    'test_category' => 'Biochemistry',
                    'results' => [
                        ['parameter' => 'Total Cholesterol', 'value' => '185', 'unit' => 'mg/dL', 'reference_range' => '<200', 'status' => 'normal'],
                        ['parameter' => 'LDL Cholesterol', 'value' => '110', 'unit' => 'mg/dL', 'reference_range' => '<130', 'status' => 'normal'],
                        ['parameter' => 'HDL Cholesterol', 'value' => '58', 'unit' => 'mg/dL', 'reference_range' => '>40', 'status' => 'normal'],
                        ['parameter' => 'Triglycerides', 'value' => '120', 'unit' => 'mg/dL', 'reference_range' => '<150', 'status' => 'normal'],
                    ],
                ],
                [
                    'title' => 'Thyroid Panel (TSH, T3, T4)',
                    'description' => 'Annual health checkup — thyroid function. Normal thyroid function.',
                    'test_name' => 'Thyroid Panel',
                    'test_category' => 'Endocrinology',
                    'results' => [
                        ['parameter' => 'TSH', 'value' => '2.8', 'unit' => 'mIU/L', 'reference_range' => '0.4-4.0', 'status' => 'normal'],
                        ['parameter' => 'T3', 'value' => '1.2', 'unit' => 'ng/mL', 'reference_range' => '0.8-2.0', 'status' => 'normal'],
                        ['parameter' => 'T4', 'value' => '7.5', 'unit' => 'µg/dL', 'reference_range' => '5.0-12.0', 'status' => 'normal'],
                    ],
                ],
                [
                    'title' => 'Blood Sugar (Fasting)',
                    'description' => 'Annual health checkup — fasting glucose. Normal blood sugar level.',
                    'test_name' => 'Blood Sugar Fasting',
                    'test_category' => 'Biochemistry',
                    'results' => [
                        ['parameter' => 'Fasting Blood Sugar', 'value' => '92', 'unit' => 'mg/dL', 'reference_range' => '70-100', 'status' => 'normal'],
                        ['parameter' => 'HbA1c', 'value' => '5.4', 'unit' => '%', 'reference_range' => '<5.7', 'status' => 'normal'],
                    ],
                ],
                [
                    'title' => 'Liver Function Test (LFT)',
                    'description' => 'Annual health checkup — liver panel. All enzymes within normal range.',
                    'test_name' => 'Liver Function Test',
                    'test_category' => 'Biochemistry',
                    'results' => [
                        ['parameter' => 'SGPT (ALT)', 'value' => '28', 'unit' => 'U/L', 'reference_range' => '7-56', 'status' => 'normal'],
                        ['parameter' => 'SGOT (AST)', 'value' => '24', 'unit' => 'U/L', 'reference_range' => '10-40', 'status' => 'normal'],
                        ['parameter' => 'Total Bilirubin', 'value' => '0.8', 'unit' => 'mg/dL', 'reference_range' => '0.1-1.2', 'status' => 'normal'],
                        ['parameter' => 'Alkaline Phosphatase', 'value' => '72', 'unit' => 'U/L', 'reference_range' => '44-147', 'status' => 'normal'],
                    ],
                ],
                [
                    'title' => 'Kidney Function Test (KFT)',
                    'description' => 'Annual health checkup — renal panel. Normal kidney function.',
                    'test_name' => 'Kidney Function Test',
                    'test_category' => 'Biochemistry',
                    'results' => [
                        ['parameter' => 'Serum Creatinine', 'value' => '0.9', 'unit' => 'mg/dL', 'reference_range' => '0.7-1.3', 'status' => 'normal'],
                        ['parameter' => 'Blood Urea', 'value' => '28', 'unit' => 'mg/dL', 'reference_range' => '15-40', 'status' => 'normal'],
                        ['parameter' => 'Uric Acid', 'value' => '5.2', 'unit' => 'mg/dL', 'reference_range' => '3.4-7.0', 'status' => 'normal'],
                    ],
                ],
            ];

            foreach ($labReports as $report) {
                $records[] = [
                    'appointment_id' => $appt->id,
                    'family_member_id' => $selfMember?->id,
                    'category' => 'lab_report',
                    'title' => $report['title'],
                    'description' => $report['description'],
                    'doctor_name' => null,
                    'department_name' => 'Pathology',
                    'record_date' => Carbon::today()->subDays(60)->format('Y-m-d'),
                    'metadata' => [
                        'test_name' => $report['test_name'],
                        'test_category' => $report['test_category'],
                        'lab_name' => 'Pune Diagnostics Lab',
                        'results' => $report['results'],
                    ],
                    'file_type' => 'pdf',
                ];
            }

            $records[] = [
                'appointment_id' => $appt->id,
                'family_member_id' => $selfMember?->id,
                'category' => 'invoice',
                'title' => 'Invoice INV-000004',
                'description' => 'Complete Health Checkup — Annual Package.',
                'record_date' => Carbon::today()->subDays(60)->format('Y-m-d'),
                'metadata' => [
                    'invoice_number' => 'INV-000004',
                    'amount' => 4999,
                    'payment_status' => 'paid',
                    'line_items' => [
                        ['label' => 'Complete Health Checkup Package', 'amount' => 4999],
                    ],
                ],
            ];
        }

        // === Standalone Records (no appointment link) ===

        $records[] = [
            'appointment_id' => null,
            'family_member_id' => $selfMember?->id,
            'category' => 'uploaded_document',
            'title' => 'Previous Hospital Discharge Summary',
            'description' => 'Discharge summary from City Hospital for dengue fever treatment (uploaded from external records).',
            'doctor_name' => 'Dr. Rajesh Khanna',
            'department_name' => 'Internal Medicine',
            'record_date' => Carbon::today()->subMonths(6)->format('Y-m-d'),
            'metadata' => [
                'source' => 'City Hospital, Pune',
                'notes' => 'Uploaded by patient. Original document from previous hospitalization.',
            ],
            'file_type' => 'pdf',
        ];

        $records[] = [
            'appointment_id' => null,
            'family_member_id' => $selfMember?->id,
            'category' => 'uploaded_document',
            'title' => 'Old Prescription — Family Doctor',
            'description' => 'Previous prescription from Dr. Sharma (family physician) for seasonal allergies.',
            'doctor_name' => 'Dr. R.K. Sharma',
            'department_name' => null,
            'record_date' => Carbon::today()->subMonths(5)->format('Y-m-d'),
            'metadata' => [
                'source' => 'Dr. Sharma Clinic, Kothrud',
                'notes' => 'Seasonal allergy prescription. Kept for reference.',
            ],
            'file_type' => 'image',
        ];

        $records[] = [
            'appointment_id' => null,
            'family_member_id' => $selfMember?->id,
            'category' => 'prescription',
            'title' => 'Ongoing Medication — Vitamin D3',
            'description' => 'Vitamin D3 supplementation for mild deficiency, prescribed 3 months ago.',
            'doctor_name' => 'Dr. Sarah Johnson',
            'department_name' => 'General Medicine',
            'record_date' => Carbon::today()->subMonths(3)->format('Y-m-d'),
            'metadata' => [
                'drugs' => [
                    ['name' => 'Vitamin D3 60,000 IU', 'dosage' => '1 sachet', 'frequency' => 'Once weekly', 'duration' => '8 weeks', 'instructions' => 'Mix in milk or water. Take after a fatty meal for better absorption.'],
                    ['name' => 'Calcium + Vitamin D3 500mg', 'dosage' => '1 tablet', 'frequency' => 'Once daily', 'duration' => '3 months', 'instructions' => 'After dinner'],
                ],
                'valid_until' => Carbon::today()->format('Y-m-d'),
            ],
            'file_type' => 'pdf',
        ];

        $records[] = [
            'appointment_id' => null,
            'family_member_id' => $selfMember?->id,
            'category' => 'discharge_summary',
            'title' => 'Discharge Summary — Dengue Fever',
            'description' => 'Hospitalized for 5 days due to dengue fever with thrombocytopenia. Recovered fully.',
            'doctor_name' => 'Dr. Rajesh Khanna',
            'department_name' => 'Internal Medicine',
            'record_date' => Carbon::today()->subMonths(6)->format('Y-m-d'),
            'metadata' => [
                'admission_date' => Carbon::today()->subMonths(6)->subDays(5)->format('Y-m-d'),
                'discharge_date' => Carbon::today()->subMonths(6)->format('Y-m-d'),
                'diagnosis' => 'Dengue Fever with Thrombocytopenia',
                'procedures' => ['IV Fluid Therapy', 'Platelet Monitoring', 'Antipyretic Treatment'],
                'discharge_instructions' => 'Rest for 2 weeks. Increase fluid intake. Monitor for any recurrence of fever. Follow-up after 1 week with CBC.',
            ],
            'file_type' => 'pdf',
        ];

        $records[] = [
            'appointment_id' => null,
            'family_member_id' => $motherMember?->id,
            'category' => 'mri_report',
            'title' => 'MRI — Right Knee',
            'description' => 'MRI of right knee from external clinic. Shows mild osteoarthritic changes.',
            'doctor_name' => 'Dr. Pradeep Kulkarni',
            'department_name' => 'Orthopedics',
            'record_date' => Carbon::today()->subMonths(4)->format('Y-m-d'),
            'metadata' => [
                'body_part' => 'Right Knee',
                'indication' => 'Chronic knee pain with stiffness, rule out meniscal/ligament injury',
                'technique' => 'MRI without contrast',
                'contrast' => 'None',
                'sequences' => 'T1, T2, PD Fat-Sat, STIR',
                'findings' => 'Mild narrowing of medial joint space. Small osteophyte formation at tibial plateau. Menisci intact. No ligament tears. Mild joint effusion.',
                'impression' => 'Early osteoarthritic changes in right knee (Grade I-II). No acute pathology. Conservative management recommended.',
                'radiologist' => 'Dr. Pradeep Kulkarni',
            ],
            'file_type' => 'pdf',
        ];

        // === New Report Types ===

        $records[] = [
            'appointment_id' => null,
            'family_member_id' => $selfMember?->id,
            'category' => 'ultrasound_report',
            'title' => 'Abdominal Ultrasound',
            'description' => 'Routine abdominal ultrasound as part of annual checkup. Normal findings.',
            'doctor_name' => 'Dr. Suresh Patil',
            'department_name' => 'Radiology',
            'record_date' => Carbon::today()->subMonths(5)->format('Y-m-d'),
            'metadata' => [
                'body_part' => 'Whole Abdomen',
                'indication' => 'Routine screening, occasional mild abdominal discomfort',
                'findings' => 'Liver: Normal size and echotexture. No focal lesion. Gallbladder: Normal, no calculi. CBD not dilated. Pancreas: Normal. Spleen: Normal. Both kidneys: Normal size, shape, and cortical thickness. No calculi or hydronephrosis. Urinary bladder: Normal wall, no calculi.',
                'impression' => 'Normal abdominal ultrasound. No significant abnormality detected.',
                'sonographer' => 'Dr. Suresh Patil',
            ],
            'file_type' => 'pdf',
        ];

        $records[] = [
            'appointment_id' => null,
            'family_member_id' => $selfMember?->id,
            'category' => 'pathology_report',
            'title' => 'Skin Biopsy — Forearm Lesion',
            'description' => 'Punch biopsy of forearm lesion to confirm eczema diagnosis.',
            'doctor_name' => 'Dr. Anita Deshmukh',
            'department_name' => 'Dermatology',
            'record_date' => Carbon::today()->subDays(42)->format('Y-m-d'),
            'metadata' => [
                'specimen_type' => 'Skin punch biopsy, left forearm',
                'gross_description' => 'Single skin punch biopsy specimen, 4mm diameter, tan-pink, submitted entirely.',
                'microscopic_findings' => 'Epidermis shows spongiosis with mild acanthosis. Superficial perivascular lymphocytic infiltrate in dermis. No granulomas, no atypia. PAS stain negative for fungal elements.',
                'diagnosis' => 'Subacute spongiotic dermatitis, consistent with eczema/atopic dermatitis',
                'grade' => null,
                'pathologist' => 'Dr. Kavita Mane',
            ],
            'file_type' => 'pdf',
        ];

        $records[] = [
            'appointment_id' => null,
            'family_member_id' => $selfMember?->id,
            'category' => 'pft_report',
            'title' => 'Pulmonary Function Test',
            'description' => 'Spirometry performed for pre-employment medical evaluation. Normal lung function.',
            'doctor_name' => 'Dr. Vikram Patel',
            'department_name' => 'Pulmonology',
            'record_date' => Carbon::today()->subMonths(4)->format('Y-m-d'),
            'metadata' => [
                'indication' => 'Pre-employment health screening',
                'results' => [
                    ['parameter' => 'FVC', 'value' => '4.2', 'predicted' => '4.5', 'percent_predicted' => '93', 'status' => 'normal'],
                    ['parameter' => 'FEV1', 'value' => '3.5', 'predicted' => '3.7', 'percent_predicted' => '95', 'status' => 'normal'],
                    ['parameter' => 'FEV1/FVC', 'value' => '83', 'predicted' => '82', 'percent_predicted' => '101', 'status' => 'normal'],
                    ['parameter' => 'PEFR', 'value' => '8.1', 'predicted' => '8.5', 'percent_predicted' => '95', 'status' => 'normal'],
                    ['parameter' => 'FEF 25-75%', 'value' => '3.2', 'predicted' => '3.5', 'percent_predicted' => '91', 'status' => 'normal'],
                ],
                'interpretation' => 'Normal spirometry. FVC, FEV1, and FEV1/FVC ratio are within normal limits. No obstructive or restrictive pattern. Flow-volume loop morphology is normal.',
            ],
            'file_type' => 'pdf',
        ];

        $records[] = [
            'appointment_id' => null,
            'family_member_id' => $selfMember?->id,
            'category' => 'other_report',
            'title' => 'Audiometry Report',
            'description' => 'Pure tone audiometry for routine hearing assessment. Normal hearing bilaterally.',
            'doctor_name' => 'Dr. Neha Joshi',
            'department_name' => 'ENT',
            'record_date' => Carbon::today()->subMonths(3)->format('Y-m-d'),
            'metadata' => [
                'report_type' => 'Pure Tone Audiometry',
                'findings' => 'Right ear: Air conduction thresholds 10-20 dB HL across 250-8000 Hz. Bone conduction normal. Left ear: Air conduction thresholds 10-15 dB HL across 250-8000 Hz. Bone conduction normal. No air-bone gap bilaterally.',
                'impression' => 'Normal hearing sensitivity bilaterally. No conductive or sensorineural hearing loss.',
            ],
            'file_type' => 'pdf',
        ];

        $records[] = [
            'appointment_id' => null,
            'family_member_id' => $selfMember?->id,
            'category' => 'xray_report',
            'title' => 'X-ray — Lumbar Spine (AP/Lateral)',
            'description' => 'Lumbar spine radiograph for evaluation of lower back pain.',
            'doctor_name' => 'Dr. Pradeep Kulkarni',
            'department_name' => 'Orthopedics',
            'record_date' => Carbon::today()->subMonths(3)->format('Y-m-d'),
            'metadata' => [
                'body_part' => 'Lumbar Spine (AP and Lateral)',
                'indication' => 'Lower back pain for 2 weeks',
                'technique' => 'AP and Lateral views',
                'findings' => 'Normal lumbar lordosis maintained. Vertebral body heights preserved. Disc spaces appear normal. No fracture or listhesis. Sacroiliac joints normal. Mild degenerative changes at L4-L5.',
                'impression' => 'Mild degenerative changes at L4-L5. No acute bony abnormality. Correlate clinically.',
                'radiologist' => 'Dr. Suresh Patil',
            ],
            'file_type' => 'image',
        ];

        // === New Visit Types ===

        $records[] = [
            'appointment_id' => null,
            'family_member_id' => $selfMember?->id,
            'category' => 'procedure_notes',
            'title' => 'Minor Wound Suturing — Left Hand',
            'description' => 'Laceration repair of left palm after kitchen accident. 4 sutures placed.',
            'doctor_name' => 'Dr. Amit Kulkarni',
            'department_name' => 'General Surgery',
            'record_date' => Carbon::today()->subMonths(5)->format('Y-m-d'),
            'metadata' => [
                'procedure_name' => 'Wound Suturing (Primary Closure)',
                'indication' => '3cm laceration on left palm from kitchen knife',
                'anesthesia' => 'Local (2% Lignocaine)',
                'technique' => 'Wound irrigated with normal saline. Wound edges debrided. 4 interrupted non-absorbable sutures (3-0 Nylon) placed. Sterile dressing applied.',
                'findings' => 'Clean laceration, 3cm, full thickness skin only. No tendon or nerve involvement. No foreign body.',
                'complications' => 'None',
                'post_op_instructions' => 'Keep wound dry for 48 hours. Change dressing daily. Take prescribed antibiotics. Suture removal after 7-10 days. Report if redness, swelling, or discharge increases.',
            ],
            'file_type' => 'pdf',
        ];

        $records[] = [
            'appointment_id' => null,
            'family_member_id' => $selfMember?->id,
            'category' => 'er_visit',
            'title' => 'ER Visit — Acute Gastroenteritis',
            'description' => 'Emergency department visit for severe vomiting and diarrhea. Treated with IV fluids and discharged.',
            'doctor_name' => 'Dr. Rahul Desai',
            'department_name' => 'Emergency Medicine',
            'record_date' => Carbon::today()->subMonths(7)->format('Y-m-d'),
            'metadata' => [
                'chief_complaint' => 'Severe vomiting (8-10 episodes) and watery diarrhea for 12 hours',
                'triage_level' => 'Level 3 — Urgent',
                'vitals' => [
                    'bp' => '100/60 mmHg',
                    'heart_rate' => '102 bpm',
                    'temperature' => '99.2°F',
                    'spo2' => '98%',
                    'respiratory_rate' => '18/min',
                ],
                'examination' => 'Mild dehydration. Abdomen soft, diffuse tenderness, no guarding. Bowel sounds hyperactive.',
                'diagnosis' => 'Acute Gastroenteritis (likely food poisoning)',
                'treatment_given' => 'IV Normal Saline 1L bolus, then 500ml/hr. Ondansetron 4mg IV. Pantoprazole 40mg IV. Oral rehydration solution started after vomiting controlled.',
                'disposition' => 'Discharged after 6 hours of observation. Tolerating oral fluids.',
                'follow_up' => 'Follow-up with primary care in 2-3 days if symptoms persist.',
            ],
            'file_type' => 'pdf',
        ];

        $records[] = [
            'appointment_id' => null,
            'family_member_id' => $motherMember?->id,
            'category' => 'other_visit',
            'title' => 'Physiotherapy Session — Knee Rehabilitation',
            'description' => 'Physiotherapy session for right knee osteoarthritis management.',
            'doctor_name' => 'Dr. Sneha Rao',
            'department_name' => 'Physiotherapy',
            'record_date' => Carbon::today()->subMonths(3)->format('Y-m-d'),
            'metadata' => [
                'visit_type' => 'Physiotherapy Session',
                'notes' => 'Session 4 of 8. Performed quadriceps strengthening exercises, hamstring stretches, and knee ROM exercises. Ultrasound therapy applied to right knee (10 min). Patient reports 40% improvement in pain since starting therapy. Advised home exercises: straight leg raises 3x15, wall squats 3x10.',
                'follow_up' => 'Next session in 4 days. Continue home exercises daily.',
            ],
        ];

        // === New Medication Types ===

        $records[] = [
            'appointment_id' => null,
            'family_member_id' => $selfMember?->id,
            'category' => 'medication_active',
            'title' => 'Vitamin D3 + Calcium (Active)',
            'description' => 'Ongoing supplementation for mild Vitamin D deficiency.',
            'doctor_name' => 'Dr. Sarah Johnson',
            'department_name' => 'General Medicine',
            'record_date' => Carbon::today()->subMonths(3)->format('Y-m-d'),
            'metadata' => [
                'drug_name' => 'Calcium + Vitamin D3 500mg',
                'dosage' => '1 tablet',
                'frequency' => 'Once daily after dinner',
                'route' => 'Oral',
                'start_date' => Carbon::today()->subMonths(3)->format('Y-m-d'),
                'prescribing_doctor' => 'Dr. Sarah Johnson',
                'condition' => 'Vitamin D Deficiency',
                'refills_remaining' => 2,
            ],
        ];

        $records[] = [
            'appointment_id' => null,
            'family_member_id' => $motherMember?->id,
            'category' => 'medication_active',
            'title' => 'Metformin 500mg (Active)',
            'description' => 'Ongoing medication for Type 2 Diabetes management.',
            'doctor_name' => 'Dr. Sarah Johnson',
            'department_name' => 'General Medicine',
            'record_date' => Carbon::today()->subMonths(8)->format('Y-m-d'),
            'metadata' => [
                'drug_name' => 'Metformin 500mg',
                'dosage' => '1 tablet',
                'frequency' => 'Twice daily (morning and evening)',
                'route' => 'Oral',
                'start_date' => Carbon::today()->subMonths(8)->format('Y-m-d'),
                'prescribing_doctor' => 'Dr. Sarah Johnson',
                'condition' => 'Type 2 Diabetes Mellitus',
                'refills_remaining' => 3,
            ],
        ];

        if ($appt = $appointments->get(0)) {
            $records[] = [
                'appointment_id' => $appt->id,
                'family_member_id' => $selfMember?->id,
                'category' => 'medication_past',
                'title' => 'Paracetamol 500mg (Completed)',
                'description' => 'Course completed for viral fever treatment.',
                'doctor_name' => 'Dr. Sarah Johnson',
                'department_name' => 'General Medicine',
                'record_date' => Carbon::today()->subDays(16)->format('Y-m-d'),
                'metadata' => [
                    'drug_name' => 'Paracetamol 500mg',
                    'dosage' => '1 tablet, three times a day',
                    'frequency' => 'TDS (after meals)',
                    'route' => 'Oral',
                    'start_date' => Carbon::today()->subDays(16)->format('Y-m-d'),
                    'end_date' => Carbon::today()->subDays(11)->format('Y-m-d'),
                    'reason_stopped' => 'Course completed. Symptoms resolved.',
                    'prescribing_doctor' => 'Dr. Sarah Johnson',
                ],
            ];
        }

        if ($appt = $appointments->get(1)) {
            $records[] = [
                'appointment_id' => $appt->id,
                'family_member_id' => $motherMember?->id,
                'category' => 'medication_past',
                'title' => 'Alprazolam 0.25mg (Discontinued)',
                'description' => 'SOS anxiolytic discontinued after stress management counseling helped.',
                'doctor_name' => 'Dr. Emily Chen',
                'department_name' => 'Cardiology',
                'record_date' => Carbon::today()->subDays(30)->format('Y-m-d'),
                'metadata' => [
                    'drug_name' => 'Alprazolam 0.25mg',
                    'dosage' => '1 tablet as needed',
                    'frequency' => 'SOS (max 2 per day)',
                    'route' => 'Oral',
                    'start_date' => Carbon::today()->subDays(30)->format('Y-m-d'),
                    'end_date' => Carbon::today()->subDays(16)->format('Y-m-d'),
                    'reason_stopped' => 'Discontinued by Dr. Meera Iyer. Anxiety managed with counseling and lifestyle changes.',
                    'prescribing_doctor' => 'Dr. Emily Chen',
                ],
            ];
        }

        // === New Document Types ===

        $records[] = [
            'appointment_id' => null,
            'family_member_id' => $selfMember?->id,
            'category' => 'vaccination',
            'title' => 'COVID-19 Booster (Covishield)',
            'description' => 'COVID-19 booster dose administered at vaccination center.',
            'doctor_name' => null,
            'department_name' => 'Vaccination Center',
            'record_date' => Carbon::today()->subMonths(8)->format('Y-m-d'),
            'metadata' => [
                'vaccine_name' => 'Covishield (Oxford-AstraZeneca)',
                'dose_number' => 3,
                'total_doses' => 3,
                'batch_number' => 'COVX-4567-2025',
                'administered_by' => 'Pune Municipal Corporation Vaccination Center',
                'site' => 'Left Deltoid',
                'next_due_date' => null,
            ],
            'file_type' => 'pdf',
        ];

        $records[] = [
            'appointment_id' => null,
            'family_member_id' => $selfMember?->id,
            'category' => 'vaccination',
            'title' => 'Influenza Vaccine 2025-26',
            'description' => 'Annual flu shot for 2025-26 season.',
            'doctor_name' => 'Dr. Sarah Johnson',
            'department_name' => 'General Medicine',
            'record_date' => Carbon::today()->subMonths(4)->format('Y-m-d'),
            'metadata' => [
                'vaccine_name' => 'Quadrivalent Influenza Vaccine (Fluarix)',
                'dose_number' => 1,
                'total_doses' => 1,
                'batch_number' => 'FLU-QIV-8821',
                'administered_by' => 'Dr. Sarah Johnson, General Medicine',
                'site' => 'Right Deltoid',
                'next_due_date' => Carbon::today()->addMonths(8)->format('Y-m-d'),
            ],
            'file_type' => 'pdf',
        ];

        $records[] = [
            'appointment_id' => null,
            'family_member_id' => $selfMember?->id,
            'category' => 'medical_certificate',
            'title' => 'Fitness Certificate — Office Submission',
            'description' => 'Medical fitness certificate issued for annual workplace health compliance.',
            'doctor_name' => 'Dr. Sarah Johnson',
            'department_name' => 'General Medicine',
            'record_date' => Carbon::today()->subMonths(2)->format('Y-m-d'),
            'metadata' => [
                'certificate_type' => 'Fitness Certificate',
                'issued_for' => 'Annual workplace health compliance — employer requirement',
                'valid_from' => Carbon::today()->subMonths(2)->format('Y-m-d'),
                'valid_until' => Carbon::today()->addMonths(10)->format('Y-m-d'),
                'issued_by' => 'Dr. Sarah Johnson, General Medicine',
                'notes' => 'Patient is in good general health. Fit for regular office duties. No medical restrictions.',
            ],
            'file_type' => 'pdf',
        ];

        if ($appt = $appointments->get(0)) {
            $records[] = [
                'appointment_id' => $appt->id,
                'family_member_id' => $selfMember?->id,
                'category' => 'medical_certificate',
                'title' => 'Medical Leave Certificate — Viral Fever',
                'description' => 'Sick leave certificate issued for viral fever episode (5 days).',
                'doctor_name' => 'Dr. Sarah Johnson',
                'department_name' => 'General Medicine',
                'record_date' => Carbon::today()->subDays(16)->format('Y-m-d'),
                'metadata' => [
                    'certificate_type' => 'Sick Leave Certificate',
                    'issued_for' => 'Viral fever with headache — advised rest for 5 days',
                    'valid_from' => Carbon::today()->subDays(16)->format('Y-m-d'),
                    'valid_until' => Carbon::today()->subDays(11)->format('Y-m-d'),
                    'issued_by' => 'Dr. Sarah Johnson, General Medicine',
                    'notes' => 'Patient diagnosed with viral fever. Advised complete rest and medication for 5 days. Fit to resume duties after the rest period.',
                ],
                'file_type' => 'pdf',
            ];
        }

        foreach ($records as $record) {
            HealthRecord::create(array_merge($record, ['user_id' => $user->id]));
        }
    }
}
