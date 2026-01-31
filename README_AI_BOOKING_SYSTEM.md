# AI Booking System - Complete Documentation Package

> **Healthcare Appointment Booking with Conversational AI**
> **Version:** 1.0 | **Status:** Production Ready ✅
> **Last Updated:** January 30, 2026

---

## 📚 What's Included

This documentation package provides everything needed to implement and maintain an AI-powered healthcare booking system with natural language understanding.

### Core Documentation (7 Files)

1. **MAIN_SYSTEM_PROMPT_FINAL.txt** - Primary AI behavior (5,500 words)
2. **INTENT_CLASSIFICATION_PROMPT_FINAL.txt** - Intent detection (4,200 words)
3. **RESPONSE_GENERATION_PROMPT_FINAL.txt** - Response creation (6,800 words)
4. **FOLLOWUP_REASON_RESPONSES_FINAL.txt** - Follow-up messaging (3,400 words)
5. **MULTI_INTENT_HANDLING_GUIDE.md** - Multi-entity processing
6. **AI_PROMPTS_SUMMARY.md** - Quick reference guide
7. **AI_BOOKING_FLOW_COMPLETE_DOCUMENTATION.md** - System architecture (2,178 lines)

**Total:** ~20,000 words of production-ready documentation

---

## 🚀 Quick Start

### 1. Implementation (5 minutes)

Copy the 4 prompt files to your Laravel project:

```bash
mkdir -p storage/prompts
cp MAIN_SYSTEM_PROMPT_FINAL.txt storage/prompts/
cp INTENT_CLASSIFICATION_PROMPT_FINAL.txt storage/prompts/
cp RESPONSE_GENERATION_PROMPT_FINAL.txt storage/prompts/
cp FOLLOWUP_REASON_RESPONSES_FINAL.txt storage/prompts/
```

### 2. Configure Laravel

Update `config/ai.php`:

```php
return [
    'prompts' => [
        'booking_assistant' => file_get_contents(
            storage_path('prompts/MAIN_SYSTEM_PROMPT_FINAL.txt')
        ),
        'intent_classifier' => file_get_contents(
            storage_path('prompts/INTENT_CLASSIFICATION_PROMPT_FINAL.txt')
        ),
        'response_generator' => file_get_contents(
            storage_path('prompts/RESPONSE_GENERATION_PROMPT_FINAL.txt')
        ),
    ],
];
```

### 3. Test

Test with these sample inputs:

```
✅ "I have a headache and fever"
✅ "Book follow-up for my mother with Dr. Sharma tomorrow at 3pm"
✅ "Do you have cardiologists? My father has chest pain"
✅ "Actually, can we do video instead?"
```

---

## 📖 Documentation Guide

### For Developers

**Start here:**
1. [AI_PROMPTS_SUMMARY.md](AI_PROMPTS_SUMMARY.md) - Overview and quick reference
2. [AI_BOOKING_FLOW_COMPLETE_DOCUMENTATION.md](AI_BOOKING_FLOW_COMPLETE_DOCUMENTATION.md) - Full system architecture
3. [MULTI_INTENT_HANDLING_GUIDE.md](MULTI_INTENT_HANDLING_GUIDE.md) - Multi-entity processing

**Implementation:**
- Backend: See Section 12 in AI_BOOKING_FLOW_COMPLETE_DOCUMENTATION.md
- Frontend: See Section 8 (Components)
- Database: See Section 7 (Schema)

### For AI/Prompt Engineers

**Start here:**
1. [MAIN_SYSTEM_PROMPT_FINAL.txt](MAIN_SYSTEM_PROMPT_FINAL.txt) - Core behavior
2. [INTENT_CLASSIFICATION_PROMPT_FINAL.txt](INTENT_CLASSIFICATION_PROMPT_FINAL.txt) - Entity extraction
3. [RESPONSE_GENERATION_PROMPT_FINAL.txt](RESPONSE_GENERATION_PROMPT_FINAL.txt) - Response creation

**Fine-tuning:**
- Adjust tone in MAIN_SYSTEM_PROMPT (Section: Tone Guidelines)
- Modify entity extraction rules in INTENT_CLASSIFICATION (Section: Entity Extraction Rules)
- Update response templates in RESPONSE_GENERATION (Section: Common Scenarios)

### For Product Managers

**Start here:**
1. [AI_PROMPTS_SUMMARY.md](AI_PROMPTS_SUMMARY.md) - System overview
2. [AI_BOOKING_FLOW_COMPLETE_DOCUMENTATION.md](AI_BOOKING_FLOW_COMPLETE_DOCUMENTATION.md) - Sections 3-4 (Flows)

**Key Features:**
- Natural language booking (any order, any phrasing)
- Emergency detection (50+ keywords, 10 categories)
- Follow-up optimization (3 reason types)
- Multi-intent handling (5 entities in one message)
- Change requests anytime (before payment)

---

## 🎯 System Capabilities

### Core Features

✅ **Flexible Information Collection**
- Users provide info in ANY order
- Extract ALL entities from single message
- Changes allowed anytime before payment

✅ **Smart Intent Detection**
- 11 intent types
- Emergency prioritization
- Change/skip/confirm detection

✅ **Natural Responses**
- Context-aware messaging
- Empathetic tone for health concerns
- Reason-specific follow-up responses

✅ **Emergency Handling**
- 50+ emergency keywords
- 10 categories (cardiac, respiratory, etc.)
- Immediate alert with emergency numbers (108, 112)

✅ **Follow-up Optimization**
- 3 tailored responses by reason
- Optional notes with graceful skips
- Previous doctor suggestions

### Booking Flows

**NEW Appointment (7 steps):**
```
patient → symptoms (optional) → urgency → doctor →
date/time → mode → summary → payment
```

**FOLLOW-UP Appointment (9 steps):**
```
patient → reason → notes (optional) → previous_doctors →
date/time → mode → summary → payment
```

---

## 🧠 AI Architecture

### 4-Stage Processing Pipeline

```
User Message
    ↓
[1] Main System Prompt
    - Provides behavior rules and context
    ↓
[2] Intent Classification
    - Extracts intent + 13 entities
    - Detects emergencies, changes, skips
    ↓
[3] Response Generation
    - Creates natural language response
    - Selects appropriate UI component
    ↓
[4] Follow-up Responses (if applicable)
    - Reason-specific messaging
    - Tailored tone and questions
    ↓
Response + Component to Frontend
```

### AI Models Supported

- **Ollama (Local):** llama3.2:3b, deepseek-r1:7b - FREE
- **Groq (Cloud):** llama-3.3-70b-versatile - FREE (with limits)
- **DeepSeek API:** deepseek-chat - PAID

---

## 📋 Key Concepts

### 1. Multi-Intent Handling

**Problem:** Users say "Book urgent appointment for my mother tomorrow"

**Solution:**
- Extract ALL entities: patient=mother, urgency=urgent, date=tomorrow
- Confirm understanding: "Got it, booking an urgent appointment for your mother tomorrow."
- Ask only for missing: "Is this a new consultation or a follow-up?"

**Details:** See [MULTI_INTENT_HANDLING_GUIDE.md](MULTI_INTENT_HANDLING_GUIDE.md)

### 2. Field Dependencies

**When a field changes, clear dependent fields:**

```javascript
{
  'doctor_id': ['appointment_time'],  // Different doctor = different slots
  'appointment_date': ['appointment_time'],  // Different date = different slots
  'urgency': ['doctor_id', 'appointment_date', 'appointment_time']  // Affects availability
}
```

### 3. Follow-up Reason Tailoring

**3 Reason Types, 3 Different Tones:**

- **Scheduled:** Casual, routine - "Got it, scheduled follow-up."
- **New Concern:** Attentive, open - "I see, you have a different concern this time."
- **Ongoing:** Empathetic, supportive - "I understand, the previous issue is still bothering you."

**Details:** See [FOLLOWUP_REASON_RESPONSES_FINAL.txt](FOLLOWUP_REASON_RESPONSES_FINAL.txt)

### 4. Emergency Detection

**10 Categories, 50+ Keywords:**

1. Cardiac: chest pain, heart attack
2. Respiratory: difficulty breathing, choking
3. Bleeding: severe bleeding, hemorrhage
4. Consciousness: unconscious, fainted
5. Stroke: facial drooping, slurred speech
6. Trauma: severe head injury, burns
7. Poisoning: overdose, ingested toxins
8. Allergic: anaphylaxis, throat swelling
9. Seizure: convulsion
10. Mental Health: suicidal thoughts, self-harm

**Response:** Immediate emergency alert with 108/112 numbers

---

## 🎨 Tone & Style

### Do:
- ✅ Be warm, friendly, empathetic
- ✅ Use simple, clear language
- ✅ Acknowledge health concerns
- ✅ Keep responses 1-3 sentences
- ✅ Sound like helpful human

### Don't:
- ❌ Use medical jargon
- ❌ Make medical diagnoses
- ❌ Provide medical advice
- ❌ Be overly formal/robotic
- ❌ Give false reassurances

---

## 🧪 Testing Guide

### Test Scenarios

**1. Simple new appointment**
```
Input: "I have a headache"
Expected: Extract symptoms, ask for patient, proceed to urgency
```

**2. Multi-entity message**
```
Input: "Book follow-up for my mother with Dr. Sharma tomorrow at 3pm"
Expected: Extract ALL, ask only for missing followup_reason
```

**3. Emergency detection**
```
Input: "Severe chest pain and difficulty breathing"
Expected: Emergency alert immediately, 108/112 numbers
```

**4. User changes mind**
```
Input: "Actually, can we do video instead?"
Expected: Acknowledge positively, update mode, show summary
```

**5. Follow-up with skip**
```
Input: Select "Scheduled follow-up" → "No updates"
Expected: Accept skip, move to previous doctors
```

### Validation Checklist

- [ ] All 11 intent types work correctly
- [ ] Entity extraction captures all 13 fields
- [ ] Change detection recognizes keywords
- [ ] Skip detection works for optional fields
- [ ] Emergency alert shows for keywords
- [ ] Follow-up responses match reason
- [ ] Previous doctors shown after notes
- [ ] Multi-entity extracts ALL entities

---

## 🔧 Configuration

### Required Environment Variables

```env
# AI Provider
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b

# Alternative: Groq
GROQ_API_KEY=gsk_your_key_here
GROQ_MODEL=llama-3.3-70b-versatile

# Booking Features
BOOKING_AI_ENABLED=true
BOOKING_PARSER_CONFIDENCE_THRESHOLD=0.7
BOOKING_SMART_PARSER_ENABLED=true

# Payment
RAZORPAY_KEY=rzp_test_xxxxxxxxxx
RAZORPAY_SECRET=your_secret_here
```

### Database Schema

**booking_conversations:**
- id, user_id, type, status, current_step
- collected_data (JSON) - stores all booking info

**conversation_messages:**
- id, conversation_id, role, content
- component_type, component_data (JSON)

---

## 📊 File Manifest

### Production Prompts (Ready to use)

| File | Size | Purpose |
|------|------|---------|
| MAIN_SYSTEM_PROMPT_FINAL.txt | 5,500 words | Core AI behavior |
| INTENT_CLASSIFICATION_PROMPT_FINAL.txt | 4,200 words | Intent detection |
| RESPONSE_GENERATION_PROMPT_FINAL.txt | 6,800 words | Response creation |
| FOLLOWUP_REASON_RESPONSES_FINAL.txt | 3,400 words | Follow-up messaging |

### Documentation (Reference)

| File | Purpose |
|------|---------|
| AI_PROMPTS_SUMMARY.md | Quick reference guide |
| AI_BOOKING_FLOW_COMPLETE_DOCUMENTATION.md | Full system architecture |
| MULTI_INTENT_HANDLING_GUIDE.md | Multi-entity processing |
| AI_BOOKING_PROMPTS_AND_CONFIGURATION.md | Detailed prompt docs |
| README_AI_BOOKING_SYSTEM.md | This file |

---

## 🎓 Training Examples

### Example 1: New Appointment Flow

```
User: "I have a headache and fever"
AI: "I'm sorry to hear you're not feeling well. Let me help you book an appointment. Is this for you?"
[Shows patient_selector]

User: "Yes"
AI: "Got it. When do you need to see a doctor?"
[Shows urgency_selector]

User: [Selects "Urgent (Today)"]
AI: "I'll find you an urgent appointment for today. Here are our available doctors:"
[Shows doctor_list with urgent availability]
```

### Example 2: Multi-Entity Input

```
User: "Book video appointment for my mother with Dr. Sharma tomorrow at 3pm for follow-up"
AI: "Perfect! I'll book a video consultation for your mother with Dr. Sharma tomorrow at 3:00 PM. What brings her back for this follow-up?"
[Shows followup_reason]
[Already captured: patient=mother, type=followup, doctor=Dr. Sharma, date=tomorrow, time=15:00, mode=video]
```

### Example 3: Change Request

```
Context: User selected Dr. Kumar, video, 2pm

User: "Actually, I want Dr. Patel in person instead"
AI: "No problem! Switching to an in-person visit with Dr. Patel. Here are available times:"
[Shows date_time_selector for Dr. Patel]
[Cleared appointment_time due to doctor change]
```

---

## 🚨 Important Notes

### Medical Advice
**NEVER provide medical advice, diagnosis, or treatment recommendations.**

The system is ONLY for booking appointments, not medical consultation.

### Emergency Handling
**Emergency keywords ALWAYS take highest priority.**

If detected, show emergency alert immediately, do NOT proceed with normal booking.

### Data Privacy
All patient information is sensitive. Ensure:
- Secure storage (encrypted database)
- HIPAA/data protection compliance
- No logging of patient details in plain text

### Testing
Test with REAL user scenarios:
- Various phrasings and orders
- Multi-entity messages
- Change requests mid-flow
- Emergency keywords
- Edge cases (past dates, invalid doctors, etc.)

---

## 📞 Support & Maintenance

### Updating Prompts

To modify AI behavior:
1. Edit the appropriate .txt file
2. Test with sample inputs
3. Deploy updated file to production
4. Monitor initial responses

### Common Adjustments

**Tone too formal?**
→ Update MAIN_SYSTEM_PROMPT, Section: Response Style

**Missing entity types?**
→ Update INTENT_CLASSIFICATION_PROMPT, Section: Entity Extraction Rules

**Need different follow-up messaging?**
→ Update FOLLOWUP_REASON_RESPONSES_FINAL.txt

**Components not showing correctly?**
→ Check RESPONSE_GENERATION_PROMPT, Section: Component Usage Guidelines

### Monitoring

Track these metrics:
- Intent classification accuracy
- Entity extraction completeness
- Average conversation turns to completion
- Emergency detection precision
- User change request frequency
- Booking completion rate

---

## ✅ Launch Checklist

### Pre-Launch
- [ ] All 4 prompts configured in `config/ai.php`
- [ ] AI service (Ollama/Groq) running and tested
- [ ] Database migrations complete
- [ ] Frontend components built and deployed
- [ ] Payment integration (Razorpay) configured
- [ ] Emergency alert component tested

### Testing
- [ ] Test all 11 intent types
- [ ] Test emergency detection with keywords
- [ ] Test multi-entity extraction (5+ entities)
- [ ] Test change requests (3+ scenarios)
- [ ] Test follow-up flow (all 3 reasons)
- [ ] Test edge cases (past dates, invalid doctors)
- [ ] Test on mobile and desktop
- [ ] Test with real users (5+ sessions)

### Production
- [ ] AI models deployed and accessible
- [ ] Prompt files in production environment
- [ ] Database backups enabled
- [ ] Error logging configured
- [ ] Analytics tracking setup
- [ ] User feedback collection ready

---

## 🎉 You're Ready!

With this documentation package, you have everything needed to:

✅ Implement a production-ready AI booking system
✅ Handle complex conversational flows
✅ Provide natural, empathetic user experience
✅ Detect and respond to emergencies
✅ Process multi-entity user messages
✅ Allow flexible booking changes
✅ Optimize follow-up appointments

**Start with:** [AI_PROMPTS_SUMMARY.md](AI_PROMPTS_SUMMARY.md)

**Questions?** Review the specific documentation file for your area:
- **Architecture:** AI_BOOKING_FLOW_COMPLETE_DOCUMENTATION.md
- **Prompts:** MAIN_SYSTEM_PROMPT_FINAL.txt
- **Multi-Intent:** MULTI_INTENT_HANDLING_GUIDE.md
- **Follow-ups:** FOLLOWUP_REASON_RESPONSES_FINAL.txt

---

**Version:** 1.0
**Status:** Production Ready ✅
**Last Updated:** January 30, 2026
**Total Documentation:** ~20,000 words across 7 files
