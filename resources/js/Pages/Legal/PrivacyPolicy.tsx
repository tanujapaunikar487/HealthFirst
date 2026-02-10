import AppLayout from '@/Layouts/AppLayout';
import { ChevronLeft } from '@/Lib/icons';
import { Button } from '@/Components/ui/button';
import { router } from '@inertiajs/react';

interface Props {
  user?: any;
}

export default function PrivacyPolicy({ user }: Props) {
  return (
    <AppLayout user={user} pageTitle="Privacy Policy" pageIcon="/assets/icons/settings.svg">
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
          <h1 className="text-detail-title text-foreground">Privacy Policy</h1>
          <p className="text-body text-muted-foreground mt-2">Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        {/* Content */}
        <div className="space-y-8 text-body">
          <section>
            <h2 className="text-section-title text-foreground mb-3">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              HealthFirst ("we", "our", or "us") is committed to protecting your privacy and ensuring the security of your personal health information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our healthcare platform.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              By using HealthFirst, you agree to the collection and use of information in accordance with this policy. We comply with the Information Technology Act, 2000, the Digital Personal Data Protection Act, 2023, and applicable healthcare regulations in India.
            </p>
          </section>

          <section>
            <h2 className="text-section-title text-foreground mb-3">2. Information We Collect</h2>

            <h3 className="text-label text-foreground mb-2 mt-4">2.1 Personal Information</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Name, email address, phone number, and date of birth</li>
              <li>Government ID details (for verification purposes)</li>
              <li>Address and location data</li>
              <li>Payment and billing information</li>
            </ul>

            <h3 className="text-label text-foreground mb-2 mt-4">2.2 Health Information</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Medical history and current health conditions</li>
              <li>Lab test results and diagnostic reports</li>
              <li>Prescriptions and medication records</li>
              <li>Doctor consultation notes and visit summaries</li>
              <li>Vital signs and health metrics</li>
              <li>Insurance policy and claim information</li>
            </ul>

            <h3 className="text-label text-foreground mb-2 mt-4">2.3 Technical Information</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Device information (IP address, browser type, operating system)</li>
              <li>Usage data (pages visited, features used, time spent)</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-section-title text-foreground mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Healthcare Services:</strong> To facilitate appointments, consultations, lab tests, and prescriptions</li>
              <li><strong>Medical Records:</strong> To maintain and provide access to your health records</li>
              <li><strong>Insurance Processing:</strong> To process insurance claims and pre-authorizations</li>
              <li><strong>Payment Processing:</strong> To process payments through secure payment gateways (Razorpay)</li>
              <li><strong>Communication:</strong> To send appointment reminders, test results, and important notifications</li>
              <li><strong>Service Improvement:</strong> To analyze usage patterns and improve our platform</li>
              <li><strong>AI Features:</strong> To generate health summaries and insights (with your consent)</li>
              <li><strong>Legal Compliance:</strong> To comply with legal obligations and healthcare regulations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-section-title text-foreground mb-3">4. Information Sharing and Disclosure</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We do not sell your personal or health information. We may share your information only in the following circumstances:
            </p>

            <h3 className="text-label text-foreground mb-2 mt-4">4.1 Healthcare Providers</h3>
            <p className="text-muted-foreground leading-relaxed">
              With doctors, hospitals, labs, and pharmacies involved in your care (with your explicit consent).
            </p>

            <h3 className="text-label text-foreground mb-2 mt-4">4.2 Insurance Companies</h3>
            <p className="text-muted-foreground leading-relaxed">
              For processing insurance claims and pre-authorizations (with your consent).
            </p>

            <h3 className="text-label text-foreground mb-2 mt-4">4.3 Service Providers</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Payment processors (Razorpay) - PCI-DSS compliant</li>
              <li>SMS/notification services (Twilio) - GDPR compliant</li>
              <li>Cloud hosting providers - ISO 27001 certified</li>
              <li>AI service providers (for health summaries) - with data processing agreements</li>
            </ul>

            <h3 className="text-label text-foreground mb-2 mt-4">4.4 Legal Requirements</h3>
            <p className="text-muted-foreground leading-relaxed">
              When required by law, court order, or government authority.
            </p>

            <h3 className="text-label text-foreground mb-2 mt-4">4.5 Family Members</h3>
            <p className="text-muted-foreground leading-relaxed">
              With linked family members for managing their health records (with appropriate consent and verification).
            </p>
          </section>

          <section>
            <h2 className="text-section-title text-foreground mb-3">5. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We implement industry-standard security measures to protect your information:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Encryption:</strong> All data is encrypted in transit (TLS/SSL) and at rest (AES-256)</li>
              <li><strong>Access Controls:</strong> Role-based access with multi-factor authentication</li>
              <li><strong>Audit Logs:</strong> Comprehensive logging of all data access and modifications</li>
              <li><strong>Data Localization:</strong> All health data is stored on servers located in India</li>
              <li><strong>Regular Security Audits:</strong> Periodic security assessments and penetration testing</li>
              <li><strong>Secure Backups:</strong> Regular encrypted backups with disaster recovery procedures</li>
            </ul>
          </section>

          <section>
            <h2 className="text-section-title text-foreground mb-3">6. Your Rights and Choices</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              You have the following rights regarding your personal and health information:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Access:</strong> View and access your health records and personal information at any time</li>
              <li><strong>Correction:</strong> Request corrections to inaccurate or incomplete information</li>
              <li><strong>Download:</strong> Export your data in a portable format (available in Settings → Preferences)</li>
              <li><strong>Deletion:</strong> Request deletion of your account and data (available in Settings → Preferences)</li>
              <li><strong>Consent Withdrawal:</strong> Withdraw consent for specific data processing activities</li>
              <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
              <li><strong>Data Portability:</strong> Transfer your data to another service provider</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              To exercise these rights, visit Settings → Preferences or contact our Data Protection Officer at privacy@healthfirst.in
            </p>
          </section>

          <section>
            <h2 className="text-section-title text-foreground mb-3">7. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your information for as long as necessary to provide services and comply with legal obligations:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-3">
              <li><strong>Health Records:</strong> Retained for 7 years as per Indian medical record retention guidelines</li>
              <li><strong>Billing Records:</strong> Retained for 7 years for tax and audit purposes</li>
              <li><strong>Insurance Claims:</strong> Retained as per IRDAI guidelines and policy terms</li>
              <li><strong>Account Data:</strong> Retained until you request deletion (subject to legal retention requirements)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-section-title text-foreground mb-3">8. Cookies and Tracking</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use cookies and similar technologies to improve your experience, analyze usage, and remember your preferences. You can control cookie settings through your browser, but disabling cookies may limit certain features of our platform.
            </p>
          </section>

          <section>
            <h2 className="text-section-title text-foreground mb-3">9. Children's Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our services are intended for users 18 years and older. For minors, we require parental or guardian consent. Family members under 18 can be added to an adult's account with appropriate consent.
            </p>
          </section>

          <section>
            <h2 className="text-section-title text-foreground mb-3">10. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy periodically. We will notify you of significant changes via email or platform notification. Continued use of our services after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-section-title text-foreground mb-3">11. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              If you have questions, concerns, or requests regarding this Privacy Policy or your personal information:
            </p>
            <div className="bg-muted rounded-xl p-6 space-y-2">
              <p className="text-label text-foreground"><strong>Data Protection Officer</strong></p>
              <p className="text-body text-muted-foreground">Email: privacy@healthfirst.in</p>
              <p className="text-body text-muted-foreground">Phone: +91-XXX-XXX-XXXX</p>
              <p className="text-body text-muted-foreground">Address: 123 Hospital Road, Pune 411001, India</p>
            </div>
          </section>

          <section>
            <h2 className="text-section-title text-foreground mb-3">12. Grievance Redressal</h2>
            <p className="text-muted-foreground leading-relaxed">
              In accordance with the Information Technology Act, 2000, and the Digital Personal Data Protection Act, 2023, we have appointed a Grievance Officer to address your concerns regarding data privacy and security.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Grievances will be acknowledged within 24 hours and resolved within 30 days.
            </p>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
