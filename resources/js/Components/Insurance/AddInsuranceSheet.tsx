import { useState, useRef, useEffect, useCallback } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { DatePicker } from '@/Components/ui/date-picker';
import { Checkbox } from '@/Components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetBody,
} from '@/Components/ui/sheet';
import { cn } from '@/Lib/utils';
import { Alert } from '@/Components/ui/alert';
import {
  Upload,
  LoaderCircle,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
} from '@/Lib/icons';

interface InsuranceProvider {
  id: number;
  name: string;
}

interface FamilyMember {
  id: number;
  name: string;
  relation: string;
}

interface PolicyFormData {
  insurance_provider_id: string;
  policy_number: string;
  plan_name: string;
  plan_type: string;
  sum_insured: string;
  premium_amount: string;
  start_date: string;
  end_date: string;
  members: number[];
}

const defaultPolicyForm: PolicyFormData = {
  insurance_provider_id: '',
  policy_number: '',
  plan_name: '',
  plan_type: '',
  sum_insured: '',
  premium_amount: '',
  start_date: '',
  end_date: '',
  members: [],
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

interface AddInsuranceSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  insuranceProviders: InsuranceProvider[];
  familyMembers: FamilyMember[];
  fromDashboard?: boolean;
  onSuccess?: () => void;
}

export function AddInsuranceSheet({
  open,
  onOpenChange,
  insuranceProviders,
  familyMembers,
  fromDashboard = false,
  onSuccess,
}: AddInsuranceSheetProps) {
  const [addStep, setAddStep] = useState<'upload' | 'extracting' | 'extract_failed' | 'review'>('upload');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [cameFromUpload, setCameFromUpload] = useState(false);
  const [extractionType, setExtractionType] = useState<'full' | 'partial' | null>(null);
  const [policyForm, setPolicyForm] = useState<PolicyFormData>(defaultPolicyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function resetAddPolicy() {
    setAddStep('upload');
    setUploadedFile(null);
    setUploadError('');
    setIsDragOver(false);
    setCameFromUpload(false);
    setExtractionType(null);
    setPolicyForm(defaultPolicyForm);
    setFormErrors({});
    setSubmitting(false);
  }

  function handleSheetClose(nextOpen: boolean) {
    if (!nextOpen) {
      onOpenChange(false);
      resetAddPolicy();
    }
  }

  function validateFile(file: File): string | null {
    if (file.type !== 'application/pdf') {
      return 'Only PDF files are supported';
    }
    if (file.size > 10 * 1024 * 1024) {
      return 'File size must be less than 10MB';
    }
    return null;
  }

  function handleFileSelect(file: File) {
    const error = validateFile(file);
    if (error) {
      setUploadError(error);
      return;
    }
    setUploadError('');
    setUploadedFile(file);
    setCameFromUpload(true);
    setAddStep('extracting');
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleEnterManually() {
    setCameFromUpload(false);
    setPolicyForm(defaultPolicyForm);
    setAddStep('review');
  }

  // Simulated extraction
  useEffect(() => {
    if (addStep !== 'extracting') return;
    const timer = setTimeout(() => {
      if (Math.random() < 0.2) {
        setAddStep('extract_failed');
        return;
      }

      const today = new Date();
      const oneYearLater = new Date(today);
      oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

      const isPartial = Math.random() < 0.3;

      if (isPartial) {
        setPolicyForm({
          insurance_provider_id: insuranceProviders[0]?.id?.toString() ?? '',
          policy_number: 'POL-2026-' + Math.random().toString().slice(2, 8),
          plan_name: 'Health Protect Plan',
          plan_type: '',
          sum_insured: '',
          premium_amount: '',
          start_date: '',
          end_date: '',
          members: [],
        });
        setExtractionType('partial');
      } else {
        setPolicyForm({
          insurance_provider_id: insuranceProviders[0]?.id?.toString() ?? '',
          policy_number: 'POL-2026-' + Math.random().toString().slice(2, 8),
          plan_name: 'Health Protect Plan',
          plan_type: 'individual',
          sum_insured: '500000',
          premium_amount: '15000',
          start_date: today.toISOString().slice(0, 10),
          end_date: oneYearLater.toISOString().slice(0, 10),
          members: [],
        });
        setExtractionType('full');
      }
      setAddStep('review');
    }, 2000);
    return () => clearTimeout(timer);
  }, [addStep, insuranceProviders]);

  const updateForm = useCallback(
    (field: keyof PolicyFormData, value: string | number[]) => {
      setPolicyForm((prev) => ({ ...prev, [field]: value }));
      if (formErrors[field]) {
        setFormErrors((prev) => ({ ...prev, [field]: '' }));
      }
    },
    [formErrors]
  );

  function toggleMember(memberId: number) {
    setPolicyForm((prev) => ({
      ...prev,
      members: prev.members.includes(memberId)
        ? prev.members.filter((id) => id !== memberId)
        : [...prev.members, memberId],
    }));
  }

  const isPartialEmpty = useCallback(
    (field: keyof PolicyFormData) =>
      extractionType === 'partial' && cameFromUpload && !policyForm[field],
    [extractionType, cameFromUpload, policyForm]
  );

  function handleSubmitPolicy() {
    const errors: Record<string, string> = {};
    if (!policyForm.insurance_provider_id) errors.insurance_provider_id = 'Provider is required';
    if (!policyForm.policy_number.trim()) errors.policy_number = 'Policy number is required';
    if (!policyForm.plan_name.trim()) errors.plan_name = 'Plan name is required';
    if (!policyForm.plan_type) errors.plan_type = 'Plan type is required';
    if (!policyForm.sum_insured || Number(policyForm.sum_insured) <= 0)
      errors.sum_insured = 'Sum insured must be greater than 0';
    if (!policyForm.start_date) errors.start_date = 'Start date is required';
    if (!policyForm.end_date) errors.end_date = 'End date is required';
    if (policyForm.start_date && policyForm.end_date && policyForm.end_date <= policyForm.start_date)
      errors.end_date = 'End date must be after start date';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    router.post(
      '/insurance',
      {
        insurance_provider_id: Number(policyForm.insurance_provider_id),
        policy_number: policyForm.policy_number.trim(),
        plan_name: policyForm.plan_name.trim(),
        plan_type: policyForm.plan_type,
        sum_insured: Number(policyForm.sum_insured),
        premium_amount: policyForm.premium_amount ? Number(policyForm.premium_amount) : null,
        start_date: policyForm.start_date,
        end_date: policyForm.end_date,
        members: policyForm.members.length > 0 ? policyForm.members : null,
        ...(fromDashboard ? { _from_dashboard: true } : {}),
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          resetAddPolicy();
          onSuccess?.();
        },
        onError: (errors) => {
          setFormErrors(errors as Record<string, string>);
          setSubmitting(false);
        },
      }
    );
  }

  return (
    <Sheet open={open} onOpenChange={handleSheetClose}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader onBack={addStep === 'review' ? () => setAddStep('upload') : undefined}>
          <SheetTitle>Add policy</SheetTitle>
        </SheetHeader>

        <SheetBody>
          {/* Step 1: Upload */}
          {addStep === 'upload' && (
            <div className="space-y-6">
              <div
                className={cn(
                  'flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-6 py-12 transition-colors',
                  isDragOver
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-muted hover:border-border hover:bg-accent'
                )}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
              >
                <div
                  className="mb-3 flex h-12 w-12 items-center justify-center rounded-full"
                  style={{ backgroundColor: 'hsl(var(--primary) / 0.2)' }}
                >
                  <Upload className="h-6 w-6" style={{ color: 'hsl(var(--primary))' }} />
                </div>
                <p className="mb-1 text-[14px] font-semibold text-foreground">Upload policy PDF</p>
                <p className="mb-3 text-[14px] text-muted-foreground">
                  We'll extract the details automatically
                </p>
                <p className="text-[14px] text-muted-foreground">Drag & drop or click to browse</p>
                <p className="mt-1 text-[14px] text-muted-foreground">PDF only - Max 10MB</p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={handleFileInputChange}
              />

              {uploadError && (
                <Alert variant="error">{uploadError}</Alert>
              )}

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-[14px] text-muted-foreground">OR</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <Button
                variant="link"
                size="sm"
                className="w-full h-auto p-0 text-[14px] font-medium"
                onClick={handleEnterManually}
              >
                Enter details manually
              </Button>
            </div>
          )}

          {/* Step 2: Extracting */}
          {addStep === 'extracting' && (
            <div className="flex flex-col items-center justify-center py-12">
              <LoaderCircle className="mb-4 h-10 w-10 animate-spin text-primary" />
              <p className="mb-1 text-[14px] font-semibold text-foreground">
                Extracting policy details...
              </p>
              <p className="mb-6 text-[14px] text-muted-foreground">This may take a few moments</p>
              {uploadedFile && (
                <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2">
                  <FileText className="h-4 w-4 text-foreground" />
                  <span className="text-[14px] text-muted-foreground">{uploadedFile.name}</span>
                  <span className="text-[14px] text-muted-foreground">
                    ({formatFileSize(uploadedFile.size)})
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Step 2b: Extraction Failed */}
          {addStep === 'extract_failed' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10"
              >
                <XCircle className="h-6 w-6 text-destructive" />
              </div>
              <p className="mb-1 text-[14px] font-semibold text-foreground">
                Couldn't extract policy details
              </p>
              <p className="mb-6 max-w-xs text-center text-[14px] text-muted-foreground">
                The document may be encrypted or in an unsupported format.
              </p>
              {uploadedFile && (
                <div className="mb-6 flex items-center gap-2 rounded-lg bg-muted px-4 py-2">
                  <FileText className="h-4 w-4 text-foreground" />
                  <span className="text-[14px] text-muted-foreground">{uploadedFile.name}</span>
                  <span className="text-[14px] text-muted-foreground">
                    ({formatFileSize(uploadedFile.size)})
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setAddStep('extracting')}
                >
                  Try again
                </Button>
                <Button onClick={handleEnterManually}>Enter manually</Button>
              </div>
            </div>
          )}

          {/* Step 3: Review & Confirm */}
          {addStep === 'review' && (
            <div className="space-y-6">
              {cameFromUpload && extractionType === 'full' && (
                <Alert variant="success">
                  Details extracted from PDF. Review and confirm below.
                </Alert>
              )}
              {cameFromUpload && extractionType === 'partial' && (
                <Alert variant="warning">
                  Some details couldn't be extracted. Please fill in the highlighted fields.
                </Alert>
              )}
              {formErrors.policy_number?.includes('already') && (
                <Alert variant="warning">
                  A policy with this number already exists. Please check and update if needed.
                </Alert>
              )}

              {/* Provider */}
              <div>
                <p className="mb-3 text-[14px] font-medium text-muted-foreground">
                  Provider
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-[14px] font-medium text-foreground">
                      Insurance Provider *
                    </label>
                    <Select
                      value={policyForm.insurance_provider_id}
                      onValueChange={(v) => updateForm('insurance_provider_id', v)}
                    >
                      <SelectTrigger
                        className={cn(
                          formErrors.insurance_provider_id &&
                            'border-destructive/30 focus-visible:ring-destructive/40',
                          isPartialEmpty('insurance_provider_id') &&
                            'ring-2 ring-warning/30 border-warning/30'
                        )}
                      >
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {insuranceProviders.map((p) => (
                          <SelectItem key={p.id} value={p.id.toString()}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.insurance_provider_id && (
                      <p className="mt-1 text-[14px] text-destructive">
                        {formErrors.insurance_provider_id}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Policy Details */}
              <div>
                <p className="mb-3 text-[14px] font-medium text-muted-foreground">
                  Policy details
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-[14px] font-medium text-foreground">
                      Policy Number *
                    </label>
                    <Input
                      value={policyForm.policy_number}
                      onChange={(e) => updateForm('policy_number', e.target.value)}
                      placeholder="e.g. SH-2026-123456"
                      className={cn(
                        formErrors.policy_number && 'border-destructive/30 focus-visible:ring-destructive/40'
                      )}
                    />
                    {formErrors.policy_number && (
                      <p className="mt-1 text-[14px] text-destructive">{formErrors.policy_number}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-[14px] font-medium text-foreground">
                      Plan Name *
                    </label>
                    <Input
                      value={policyForm.plan_name}
                      onChange={(e) => updateForm('plan_name', e.target.value)}
                      placeholder="e.g. Family Floater Plan"
                      className={cn(
                        formErrors.plan_name && 'border-destructive/30 focus-visible:ring-destructive/40'
                      )}
                    />
                    {formErrors.plan_name && (
                      <p className="mt-1 text-[14px] text-destructive">{formErrors.plan_name}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-[14px] font-medium text-foreground">
                      Plan Type *
                    </label>
                    <Select
                      value={policyForm.plan_type}
                      onValueChange={(v) => updateForm('plan_type', v)}
                    >
                      <SelectTrigger
                        className={cn(
                          formErrors.plan_type && 'border-destructive/30 focus-visible:ring-destructive/40',
                          isPartialEmpty('plan_type') &&
                            'ring-2 ring-warning/30 border-warning/30'
                        )}
                      >
                        <SelectValue placeholder="Select plan type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="family">Family</SelectItem>
                        <SelectItem value="corporate">Corporate</SelectItem>
                        <SelectItem value="senior_citizen">Senior Citizen</SelectItem>
                      </SelectContent>
                    </Select>
                    {formErrors.plan_type && (
                      <p className="mt-1 text-[14px] text-destructive">{formErrors.plan_type}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Coverage */}
              <div>
                <p className="mb-3 text-[14px] font-medium text-muted-foreground">
                  Coverage
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-[14px] font-medium text-foreground">
                      Sum Insured (&#8377;) *
                    </label>
                    <Input
                      type="number"
                      value={policyForm.sum_insured}
                      onChange={(e) => updateForm('sum_insured', e.target.value)}
                      placeholder="500000"
                      className={cn(
                        formErrors.sum_insured && 'border-destructive/30 focus-visible:ring-destructive/40',
                        isPartialEmpty('sum_insured') &&
                          'ring-2 ring-warning/30 border-warning/30'
                      )}
                    />
                    {formErrors.sum_insured && (
                      <p className="mt-1 text-[14px] text-destructive">{formErrors.sum_insured}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-[14px] font-medium text-foreground">
                      Premium (&#8377;)
                    </label>
                    <Input
                      type="number"
                      value={policyForm.premium_amount}
                      onChange={(e) => updateForm('premium_amount', e.target.value)}
                      placeholder="12000"
                    />
                  </div>
                </div>
              </div>

              {/* Validity */}
              <div>
                <p className="mb-3 text-[14px] font-medium text-muted-foreground">
                  Validity
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-[14px] font-medium text-foreground">
                      Start Date *
                    </label>
                    <DatePicker
                      value={policyForm.start_date}
                      onChange={(value) => updateForm('start_date', value)}
                      error={!!formErrors.start_date}
                      className={cn(
                        isPartialEmpty('start_date') &&
                          'ring-2 ring-warning/30 border-warning/30'
                      )}
                      placeholder="Select start date"
                    />
                    {formErrors.start_date && (
                      <p className="mt-1 text-[14px] text-destructive">{formErrors.start_date}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-[14px] font-medium text-foreground">
                      End Date *
                    </label>
                    <DatePicker
                      value={policyForm.end_date}
                      onChange={(value) => updateForm('end_date', value)}
                      error={!!formErrors.end_date}
                      className={cn(
                        isPartialEmpty('end_date') &&
                          'ring-2 ring-warning/30 border-warning/30'
                      )}
                      placeholder="Select end date"
                    />
                    {formErrors.end_date && (
                      <p className="mt-1 text-[14px] text-destructive">{formErrors.end_date}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Covered Members */}
              {familyMembers.length > 0 && (
                <div>
                  <p className="mb-3 text-[14px] font-medium text-muted-foreground">
                    Covered members
                  </p>
                  <div className="space-y-2">
                    {familyMembers.map((m) => (
                      <label
                        key={m.id}
                        className="flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors hover:bg-accent"
                      >
                        <Checkbox
                          checked={policyForm.members.includes(m.id)}
                          onCheckedChange={() => toggleMember(m.id)}
                        />
                        <span className="text-[14px] text-foreground">{m.name}</span>
                        <span className="text-[14px] capitalize text-muted-foreground">({m.relation})</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </SheetBody>

        {addStep === 'review' && (
          <SheetFooter>
            <Button
              className="flex-1"
              size="lg"
              onClick={handleSubmitPolicy}
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Save policy'}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
