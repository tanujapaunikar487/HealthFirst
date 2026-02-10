import AppLayout from '@/Layouts/AppLayout';
import { ChevronLeft } from '@/Lib/icons';
import { Button } from '@/Components/ui/button';
import { router } from '@inertiajs/react';

interface Props {
  user?: any;
}

export default function TermsOfService({ user }: Props) {
  return (
    <AppLayout user={user} pageTitle="Terms of Service" pageIcon="/assets/icons/settings.svg">
      <div className="w-full max-w-[960px] min-h-full flex flex-col pb-10">
        {/* Back Button */}
        <Button
          variant="link"
          size="sm"
          className="h-auto p-0 mb-6 flex items-center gap-1.5 text-body text-muted-foreground hover:text-foreground transition-colors self-start"
          onClick={() => router.visit('/')}
        >
          <ChevronLeft className="h-4 w-4" />
          Home
        </Button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-detail-title text-foreground">Terms of Service</h1>
          <p className="text-body text-muted-foreground mt-2">Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        {/* Content */}
        <div className="space-y-8 text-body">
          <section>
            <h2 className="text-section-title text-foreground mb-3">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using HealthFirst's services, you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our services.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              These Terms constitute a legal agreement between you and HealthFirst and govern your access to and use of our healthcare platform, including all features, content, and services offered.
            </p>
          </section>

          <section>
            <h2 className="text-section-title text-foreground mb-3">2. Service Description</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              HealthFirst provides a digital healthcare platform that facilitates:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Doctor consultations (in-person, video, and voice)</li>
              <li>Lab test bookings and result management</li>
              <li>Prescription management and medication tracking</li>
              <li>Health records storage and management</li>
              <li>Insurance claim processing and tracking</li>
              <li>Appointment scheduling and reminders</li>
              <li>Family member health management</li>
              <li>AI-powered health summaries and insights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-section-title text-foreground mb-3">3. Eligibility</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>You must be at least 18 years old to create an account</li>
              <li>For users under 18, a parent or legal guardian must create and manage the account</li>
              <li>You must provide accurate and complete registration information</li>
              <li>You must be a resident of India to use our services</li>
              <li>You must have the legal capacity to enter into this agreement</li>
            </ul>
          </section>

          <section>
            <h2 className="text-section-title text-foreground mb-3">4. Account Responsibilities</h2>

            <h3 className="text-label text-foreground mb-2 mt-4">4.1 Account Security</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>You are responsible for maintaining the confidentiality of your account credentials</li>
              <li>You must notify us immediately of any unauthorized access to your account</li>
              <li>You are liable for all activities conducted through your account</li>
              <li>Do not share your account credentials with anyone</li>
            </ul>

            <h3 className="text-label text-foreground mb-2 mt-4">4.2 Accurate Information</h3>
            <p className="text-muted-foreground leading-relaxed">
              You agree to provide accurate, current, and complete health and personal information. Inaccurate information may affect the quality of healthcare services and insurance claims.
            </p>

            <h3 className="text-label text-foreground mb-2 mt-4">4.3 Prohibited Activities</h3>
            <p className="text-muted-foreground leading-relaxed mb-2">You may not:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Use the platform for any illegal or unauthorized purpose</li>
              <li>Impersonate another person or provide false information</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Upload malicious code, viruses, or harmful content</li>
              <li>Scrape, harvest, or collect user data without permission</li>
              <li>Interfere with or disrupt the platform's functionality</li>
              <li>Share prescription medications or controlled substances</li>
              <li>Submit fraudulent insurance claims</li>
            </ul>
          </section>

          <section>
            <h2 className="text-section-title text-foreground mb-3">5. Medical Disclaimers</h2>

            <h3 className="text-label text-foreground mb-2 mt-4">5.1 Not Medical Advice</h3>
            <p className="text-muted-foreground leading-relaxed">
              HealthFirst is a platform that facilitates access to healthcare services but does not provide medical advice, diagnosis, or treatment. All medical decisions should be made in consultation with qualified healthcare professionals.
            </p>

            <h3 className="text-label text-foreground mb-2 mt-4">5.2 AI Features</h3>
            <p className="text-muted-foreground leading-relaxed">
              AI-generated health summaries and insights are for informational purposes only and should not be used as a substitute for professional medical advice. Always consult your doctor before making healthcare decisions.
            </p>

            <h3 className="text-label text-foreground mb-2 mt-4">5.3 Emergency Situations</h3>
            <p className="text-muted-foreground leading-relaxed">
              In case of a medical emergency, immediately call emergency services (112 in India) or visit the nearest hospital. Do not rely on our platform for emergency medical assistance.
            </p>

            <h3 className="text-label text-foreground mb-2 mt-4">5.4 Doctor-Patient Relationship</h3>
            <p className="text-muted-foreground leading-relaxed">
              Consultations conducted through our platform establish a doctor-patient relationship between you and the healthcare provider, not between you and HealthFirst. We are not responsible for the quality of care provided by healthcare professionals on our platform.
            </p>
          </section>

          <section>
            <h2 className="text-section-title text-foreground mb-3">6. Payments and Billing</h2>

            <h3 className="text-label text-foreground mb-2 mt-4">6.1 Payment Processing</h3>
            <p className="text-muted-foreground leading-relaxed">
              All payments are processed through secure third-party payment processors (Razorpay). We do not store your complete credit card or debit card information.
            </p>

            <h3 className="text-label text-foreground mb-2 mt-4">6.2 Pricing</h3>
            <p className="text-muted-foreground leading-relaxed">
              Service prices are determined by healthcare providers and may vary. Prices displayed at the time of booking are final, subject to applicable taxes and insurance coverage.
            </p>

            <h3 className="text-label text-foreground mb-2 mt-4">6.3 Refunds and Cancellations</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Appointment cancellations must be made at least 2 hours before the scheduled time for a full refund</li>
              <li>Lab test cancellations: Full refund if cancelled before sample collection</li>
              <li>Refunds will be processed within 7-10 business days</li>
              <li>Insurance reimbursements are subject to policy terms and IRDAI guidelines</li>
            </ul>

            <h3 className="text-label text-foreground mb-2 mt-4">6.4 Disputed Charges</h3>
            <p className="text-muted-foreground leading-relaxed">
              You may raise a dispute within 30 days of a charge. We will investigate and respond within 3-5 business days.
            </p>
          </section>

          <section>
            <h2 className="text-section-title text-foreground mb-3">7. Insurance Services</h2>
            <p className="text-muted-foreground leading-relaxed">
              We facilitate insurance claim processing but are not an insurance provider. All insurance coverage is subject to your policy terms and conditions. We do not guarantee claim approval or reimbursement amounts.
            </p>
          </section>

          <section>
            <h2 className="text-section-title text-foreground mb-3">8. Intellectual Property</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>All content, features, and functionality on HealthFirst are owned by us or our licensors</li>
              <li>You may not copy, modify, distribute, or reverse-engineer any part of our platform</li>
              <li>You retain ownership of your health data and content you submit</li>
              <li>By submitting content, you grant us a limited license to use it for providing services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-section-title text-foreground mb-3">9. Privacy and Data Protection</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your use of our services is also governed by our Privacy Policy, which explains how we collect, use, and protect your personal and health information. Please review our Privacy Policy to understand our practices.
            </p>
          </section>

          <section>
            <h2 className="text-section-title text-foreground mb-3">10. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              To the fullest extent permitted by law:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>HealthFirst is provided on an "as is" and "as available" basis</li>
              <li>We do not guarantee uninterrupted, error-free, or secure service</li>
              <li>We are not liable for medical malpractice or negligence by healthcare providers</li>
              <li>We are not responsible for insurance claim denials or delays</li>
              <li>Our total liability for any claim shall not exceed the amount you paid us in the last 12 months</li>
              <li>We are not liable for indirect, incidental, or consequential damages</li>
            </ul>
          </section>

          <section>
            <h2 className="text-section-title text-foreground mb-3">11. Indemnification</h2>
            <p className="text-muted-foreground leading-relaxed">
              You agree to indemnify and hold harmless HealthFirst, its affiliates, and service providers from any claims, damages, losses, or expenses arising from your use of our services, violation of these Terms, or infringement of any rights of another party.
            </p>
          </section>

          <section>
            <h2 className="text-section-title text-foreground mb-3">12. Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to suspend or terminate your account at any time for violation of these Terms or for any other reason at our discretion. You may terminate your account at any time through Settings → Preferences → Delete Account.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Upon termination, your right to use our services will cease, but certain provisions (liability limitations, indemnification) will survive termination.
            </p>
          </section>

          <section>
            <h2 className="text-section-title text-foreground mb-3">13. Governing Law and Dispute Resolution</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms are governed by the laws of India. Any disputes arising from these Terms or your use of our services shall be subject to the exclusive jurisdiction of courts in Pune, Maharashtra, India.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Before initiating legal proceedings, you agree to attempt to resolve disputes through good-faith negotiation or mediation.
            </p>
          </section>

          <section>
            <h2 className="text-section-title text-foreground mb-3">14. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update these Terms periodically. Significant changes will be communicated via email or platform notification at least 30 days before they take effect. Continued use of our services after changes constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-section-title text-foreground mb-3">15. Severability</h2>
            <p className="text-muted-foreground leading-relaxed">
              If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in full force and effect.
            </p>
          </section>

          <section>
            <h2 className="text-section-title text-foreground mb-3">16. Contact Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              For questions or concerns regarding these Terms of Service:
            </p>
            <div className="bg-muted rounded-xl p-6 space-y-2">
              <p className="text-label text-foreground"><strong>HealthFirst Support</strong></p>
              <p className="text-body text-muted-foreground">Email: support@healthfirst.in</p>
              <p className="text-body text-muted-foreground">Phone: +91-XXX-XXX-XXXX</p>
              <p className="text-body text-muted-foreground">Address: 123 Hospital Road, Pune 411001, India</p>
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
