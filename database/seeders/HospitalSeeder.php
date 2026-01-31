<?php

namespace Database\Seeders;

use App\Models\Appointment;
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
            $this->seedAppointments($user);
            $this->seedInsuranceClaims($user);
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
                'symptoms' => null,
                'notes' => 'Annual health checkup. All reports normal.',
                'fee' => 4999,
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
}
