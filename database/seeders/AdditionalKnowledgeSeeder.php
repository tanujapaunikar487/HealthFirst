<?php

namespace Database\Seeders;

use App\Models\KnowledgeBaseResource;
use Illuminate\Database\Seeder;

class AdditionalKnowledgeSeeder extends Seeder
{
    /**
     * Seed additional knowledge base resources for common questions.
     */
    public function run(): void
    {
        $resources = [
            [
                'title' => 'Choosing the Right Doctor - Specializations and Experience',
                'slug' => 'choosing-right-doctor-specialization',
                'category' => 'doctors',
                'summary' => 'Guide to understanding doctor specializations and experience levels.',
                'content' => 'When choosing a doctor, consider:

**By Specialization:**
- Gynaecology: Women\'s reproductive health, pregnancy, menstrual issues
- Cardiology: Heart and cardiovascular system
- Dermatology: Skin, hair, and nail conditions
- Neurology: Brain and nervous system
- Pediatrics: Children\'s health and development
- General Physician: Common illnesses and preventive care

**By Experience:**
- Senior doctors (15+ years): Complex cases, specialized procedures
- Mid-level doctors (5-15 years): Good balance of experience and availability
- Junior doctors (0-5 years): Recent training, latest techniques

**How to Choose:**
1. Check specialization matches your concern
2. Review years of experience
3. Read patient reviews and ratings
4. Consider availability and fees
5. Check if they offer your preferred appointment mode (video/in-person)

All our doctors are verified, licensed, and highly qualified.',
                'tags' => ['doctor', 'specialization', 'experience', 'choosing', 'comparison'],
                'priority' => 10,
                'is_active' => true,
                'published_at' => now(),
            ],
            [
                'title' => 'Video vs In-Person Appointments - Complete Comparison',
                'slug' => 'video-vs-inperson-complete-comparison',
                'category' => 'doctors',
                'summary' => 'Detailed comparison of video and in-person appointment options.',
                'content' => 'Understanding the difference between Video and In-Person appointments:

**Video Appointment (₹800):**
✅ Advantages:
- Convenient - consult from anywhere
- No travel time or costs
- Lower appointment fee
- Same-day availability
- Digital prescriptions instantly
- Suitable for follow-ups
- Good for minor health concerns

❌ Limitations:
- No physical examination
- Not suitable for complex diagnoses
- Requires good internet connection

**In-Person Visit (₹1,200):**
✅ Advantages:
- Complete physical examination
- Better for complex conditions
- Access to on-site diagnostic facilities
- Face-to-face interaction
- No technical requirements

❌ Limitations:
- Travel required
- Higher fee
- Fixed clinic hours
- May need to wait

**When to Choose Video:**
- Follow-up appointments
- Prescription renewals
- Minor health concerns
- Second opinions
- Medical advice
- Health checkup reviews

**When to Choose In-Person:**
- First-time appointments
- Physical examination needed
- Complex medical conditions
- Surgical appointments
- Diagnostic procedures required
- Serious health concerns

**Both options provide:**
- Qualified doctors
- Digital prescriptions
- Medical records
- Insurance claims support',
                'tags' => ['video', 'in-person', 'appointment', 'difference', 'comparison', 'mode'],
                'priority' => 10,
                'is_active' => true,
                'published_at' => now(),
            ],
            [
                'title' => 'Doctor Ratings and Patient Reviews',
                'slug' => 'doctor-ratings-reviews',
                'category' => 'doctors',
                'summary' => 'How to use ratings and reviews to choose the best doctor.',
                'content' => 'Understanding Doctor Ratings:

**Rating System:**
- ⭐⭐⭐⭐⭐ (5 stars): Excellent (recommended)
- ⭐⭐⭐⭐ (4 stars): Very Good
- ⭐⭐⭐ (3 stars): Good
- Below 3 stars: Consider other options

**What Ratings Include:**
1. Patient satisfaction
2. Wait time accuracy
3. Communication quality
4. Treatment effectiveness
5. Overall experience

**How to Compare Doctors:**
1. Check overall rating (aim for 4+ stars)
2. Read recent patient reviews
3. Look for reviews matching your concern
4. Check number of appointments completed
5. Verify years of experience
6. Compare specializations

**Red Flags:**
- Very few reviews
- All negative recent reviews
- Inconsistent availability
- No specialization listed

**Green Flags:**
- Consistent high ratings
- Positive reviews in last 3 months
- Many completed appointments
- Clear specialization
- Quick response time

All doctors on our platform are verified and licensed.',
                'tags' => ['doctor', 'ratings', 'reviews', 'comparison', 'choosing', 'quality'],
                'priority' => 8,
                'is_active' => true,
                'published_at' => now(),
            ],
        ];

        foreach ($resources as $resource) {
            KnowledgeBaseResource::updateOrCreate(
                ['slug' => $resource['slug']],
                $resource
            );
        }

        $this->command->info('Additional knowledge base resources seeded: '.count($resources));
    }
}
