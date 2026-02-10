<?php

namespace Database\Seeders;

use App\Models\KnowledgeBaseResource;
use Illuminate\Database\Seeder;

class KnowledgeBaseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $resources = [
            // Booking Information
            [
                'title' => 'How to Book a Doctor Appointment',
                'slug' => 'how-to-book-doctor-appointment',
                'category' => 'booking',
                'summary' => 'Step-by-step guide to booking a doctor appointment through our platform.',
                'content' => 'To book a doctor appointment, you can use our AI-powered chat or guided booking flow. Simply tell us:
1. Who the appointment is for (patient name or relationship)
2. Type of consultation (new or follow-up)
3. Your symptoms or concerns
4. Preferred date and time
5. Consultation mode (video or in-person)

The system will show you available doctors matching your criteria, along with their available time slots. Once you select a doctor and time, you can proceed to payment.',
                'tags' => ['booking', 'doctor', 'appointment', 'how-to'],
                'priority' => 10,
                'is_active' => true,
                'published_at' => now(),
            ],
            [
                'title' => 'How to Schedule Lab Tests',
                'slug' => 'how-to-schedule-lab-tests',
                'category' => 'booking',
                'summary' => 'Guide to scheduling lab tests and sample collection.',
                'content' => 'Scheduling lab tests is easy:
1. Choose the patient for whom the test is needed
2. Specify the test type or symptoms
3. Select a lab package that includes your required tests
4. Choose collection location (home collection or visit center)
5. Pick your preferred date and time
6. Complete payment

For home collection, our phlebotomist will visit your address. For center visits, you can choose the nearest lab location.',
                'tags' => ['booking', 'lab', 'test', 'sample', 'collection'],
                'priority' => 10,
                'is_active' => true,
                'published_at' => now(),
            ],
            [
                'title' => 'Cancellation and Rescheduling Policy',
                'slug' => 'cancellation-rescheduling-policy',
                'category' => 'policies',
                'summary' => 'Information about canceling or rescheduling appointments.',
                'content' => 'You can cancel or reschedule appointments:
- Free cancellation up to 2 hours before appointment time
- Rescheduling available up to 1 hour before appointment
- Cancellations within 2 hours may incur a cancellation fee
- For emergency cancellations, contact our support team
- Lab test cancellations: Free up to 6 hours before sample collection

To cancel or reschedule, visit "My Appointments" section or chat with our assistant.',
                'tags' => ['cancellation', 'rescheduling', 'policy', 'refund'],
                'priority' => 8,
                'is_active' => true,
                'published_at' => now(),
            ],

            // Doctor Information
            [
                'title' => 'Video vs In-Person Appointments',
                'slug' => 'video-vs-inperson-appointments',
                'category' => 'doctors',
                'summary' => 'Comparison of video and in-person appointment options.',
                'content' => 'Video Appointments:
- Convenient from home
- Lower appointment fee
- Available for follow-ups and minor concerns
- Secure video platform
- Digital prescriptions provided

In-Person Appointments:
- Physical examination possible
- Suitable for complex cases
- Access to diagnostic facilities
- Traditional appointment experience
- May require travel to clinic

Choose video for: Follow-ups, prescription renewals, second opinions, minor health concerns
Choose in-person for: First appointments, complex conditions, physical examinations needed',
                'tags' => ['appointment', 'video', 'in-person', 'doctor', 'mode'],
                'priority' => 9,
                'is_active' => true,
                'published_at' => now(),
            ],
            [
                'title' => 'Finding the Right Specialist',
                'slug' => 'finding-right-specialist',
                'category' => 'doctors',
                'summary' => 'Guide to choosing the right medical specialist for your condition.',
                'content' => 'Our platform helps you find the right specialist:

Common Specializations:
- General Physician: Common illnesses, preventive care, health checkups
- Cardiologist: Heart conditions, blood pressure, cholesterol
- Dermatologist: Skin, hair, nail conditions
- Neurologist: Brain, nervous system, headaches, seizures
- Pediatrician: Children\'s health and development

Tell our AI assistant your symptoms, and we\'ll recommend appropriate specialists. You can also browse doctors by specialization and read their profiles, experience, and patient reviews.',
                'tags' => ['specialist', 'doctor', 'selection', 'specialization'],
                'priority' => 7,
                'is_active' => true,
                'published_at' => now(),
            ],

            // Lab Tests Information
            [
                'title' => 'Complete Blood Count (CBC) Test',
                'slug' => 'cbc-test-information',
                'category' => 'lab_tests',
                'summary' => 'Information about CBC test, preparation, and what it measures.',
                'content' => 'Complete Blood Count (CBC) is a common blood test that measures:
- Red blood cell count
- White blood cell count
- Hemoglobin levels
- Platelet count
- Hematocrit

Preparation:
- No fasting required for standard CBC
- Inform lab about any medications you\'re taking
- Sample collection takes 5-10 minutes

Results typically available within 24 hours. CBC helps detect anemia, infections, blood disorders, and overall health status.',
                'tags' => ['cbc', 'blood-test', 'lab', 'health-checkup'],
                'priority' => 6,
                'is_active' => true,
                'published_at' => now(),
            ],
            [
                'title' => 'Fasting Requirements for Lab Tests',
                'slug' => 'fasting-requirements-lab-tests',
                'category' => 'lab_tests',
                'summary' => 'Guide to fasting requirements for different lab tests.',
                'content' => 'Some tests require fasting:

Tests Requiring 8-12 Hour Fasting:
- Fasting Blood Sugar (FBS)
- Lipid Profile
- Liver Function Tests
- Kidney Function Tests

Tests NOT Requiring Fasting:
- Complete Blood Count (CBC)
- Thyroid Function Tests
- HbA1c
- Vitamin levels

Fasting Instructions:
- No food or drinks except water
- Take regular medications unless advised otherwise
- Morning appointments preferred
- Inform lab if you\'re diabetic

Our system will automatically alert you if your selected tests require fasting.',
                'tags' => ['fasting', 'lab-test', 'preparation', 'blood-test'],
                'priority' => 8,
                'is_active' => true,
                'published_at' => now(),
            ],

            // Services Information
            [
                'title' => 'Home Collection Service',
                'slug' => 'home-collection-service',
                'category' => 'services',
                'summary' => 'Details about our home sample collection service.',
                'content' => 'Convenient home sample collection:

Service Details:
- Trained phlebotomists visit your home
- COVID-safe protocols followed
- All necessary equipment provided
- Multiple samples can be collected
- Available 7 days a week

Collection Fee:
- ₹0 for orders above ₹999
- ₹150 standard collection fee

Timing:
- Morning slots: 6 AM - 10 AM (for fasting tests)
- General slots: 10 AM - 8 PM

Service Areas:
- Available in all major metro areas
- Check availability by entering your pincode

Book home collection during checkout by selecting "Home Collection" option.',
                'tags' => ['home-collection', 'service', 'phlebotomist', 'convenience'],
                'priority' => 9,
                'is_active' => true,
                'published_at' => now(),
            ],

            // Emergency Information
            [
                'title' => 'When to Seek Emergency Care',
                'slug' => 'when-to-seek-emergency-care',
                'category' => 'emergency',
                'summary' => 'Guidelines for identifying medical emergencies.',
                'content' => 'Seek immediate emergency care for:

Critical Symptoms:
- Chest pain or pressure
- Difficulty breathing or shortness of breath
- Sudden severe headache
- Severe bleeding that won\'t stop
- Loss of consciousness or confusion
- Severe allergic reaction (swelling, difficulty breathing)
- Signs of stroke (face drooping, arm weakness, speech difficulty)
- Severe abdominal pain
- Poisoning or drug overdose

DO NOT use online booking for emergencies. Call:
- Emergency Services: 108 or 112
- Ambulance: 102
- Hospital Emergency: [Local Emergency Number]

Our booking system is for scheduled appointments only, not emergencies.',
                'tags' => ['emergency', 'urgent-care', 'symptoms', 'safety'],
                'priority' => 10,
                'is_active' => true,
                'published_at' => now(),
            ],

            // Payment Information
            [
                'title' => 'Payment and Refund Policy',
                'slug' => 'payment-refund-policy',
                'category' => 'policies',
                'summary' => 'Information about payment methods and refund process.',
                'content' => 'Payment Information:

Accepted Methods:
- Credit/Debit Cards
- UPI (Google Pay, PhonePe, Paytm)
- Net Banking
- Digital Wallets

Payment Security:
- PCI DSS compliant
- Secure payment gateway
- No card details stored

Refund Policy:
- Cancellations before 2 hours: Full refund
- Cancellations within 2 hours: 50% refund
- No-show: No refund
- Refunds processed within 5-7 business days
- Refund to original payment method

For refund queries, contact support@healthcare.com',
                'tags' => ['payment', 'refund', 'policy', 'billing'],
                'priority' => 7,
                'is_active' => true,
                'published_at' => now(),
            ],
        ];

        foreach ($resources as $resource) {
            KnowledgeBaseResource::create($resource);
        }

        $this->command->info('Knowledge base seeded with '.count($resources).' resources.');
    }
}
