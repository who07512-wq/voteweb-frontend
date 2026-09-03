"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CandidateLayout } from "@/components/candidate-dashboard/CandidateLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  submitApplication,
  POSITION_OPTIONS,
  DEPARTMENT_OPTIONS,
  YEAR_OPTIONS,
  SECTION_OPTIONS,
} from "@/lib/candidate-application-store";
import {
  User,
  GraduationCap,
  Mail,
  Phone,
  Camera,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  X,
  Loader2,
} from "lucide-react";

interface FormData {
  name: string;
  enrollmentNumber: string;
  department: string;
  year: string;
  section: string;
  position: string;
  email: string;
  phone: string;
  photo: string | null;
  bio: string;
  manifesto: string;
}

interface FormErrors {
  [key: string]: string;
}

const INITIAL_FORM: FormData = {
  name: "",
  enrollmentNumber: "",
  department: "",
  year: "",
  section: "",
  position: "",
  email: "",
  phone: "",
  photo: null,
  bio: "",
  manifesto: "",
};

export default function CandidateApplyPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, photo: "Photo must be under 5MB" }));
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setFormData((prev) => ({ ...prev, photo: ev.target?.result as string }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next.photo;
        return next;
      });
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setFormData((prev) => ({ ...prev, photo: null }));
  };

  const validateStep1 = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.name.trim()) newErrors.name = "Full name is required";
    if (!formData.enrollmentNumber.trim()) newErrors.enrollmentNumber = "Enrollment number is required";
    if (!formData.department) newErrors.department = "Department is required";
    if (!formData.year) newErrors.year = "Year is required";
    if (!formData.section) newErrors.section = "Section is required";
    if (!formData.position) newErrors.position = "Position is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: FormErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Enter a valid email address";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\+?[\d\s-]{10,15}$/.test(formData.phone)) {
      newErrors.phone = "Enter a valid phone number";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.bio.trim()) {
      newErrors.bio = "Bio is required";
    } else if (formData.bio.length > 500) {
      newErrors.bio = "Bio must be 500 characters or fewer";
    }
    if (!formData.manifesto.trim()) {
      newErrors.manifesto = "Manifesto is required";
    } else if (formData.manifesto.length > 2000) {
      newErrors.manifesto = "Manifesto must be 2000 characters or fewer";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleBack = () => {
    if (step === 3) setStep(2);
    else if (step === 2) setStep(1);
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;
    setIsSubmitting(true);
    try {
      await submitApplication({
        name: formData.name.trim(),
        enrollmentNumber: formData.enrollmentNumber.trim(),
        department: formData.department,
        year: formData.year,
        section: formData.section,
        position: formData.position,
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        photo: formData.photo,
        bio: formData.bio.trim(),
        manifesto: formData.manifesto.trim(),
      });
      setShowSuccess(true);
    } catch (err) {
      setErrors({ general: "Failed to submit application. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <CandidateLayout candidateName="Candidate" candidateId="">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-success-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">
              Application Submitted Successfully
            </h1>
            <Badge variant="warning" size="md" className="mb-4">
              🟡 Under Review
            </Badge>
            <p className="text-sm text-text-secondary mb-6 max-w-md mx-auto">
              Your candidate application has been submitted and is awaiting
              administration review. You will be notified once a decision is made.
            </p>
            <div className="bg-bg-tertiary rounded-xl p-4 mb-6 text-left max-w-sm mx-auto">
              <p className="text-xs text-text-secondary uppercase tracking-wider mb-2">
                Application Summary
              </p>
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Name</span>
                  <span className="font-medium text-text-primary">{formData.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Position</span>
                  <span className="font-medium text-text-primary">{formData.position}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Status</span>
                  <Badge variant="warning" size="sm">Under Review</Badge>
                </div>
              </div>
            </div>
            <Button
              variant="primary"
              onClick={() => router.push("/candidate/status")}
              className="gap-2"
            >
              View Application Status
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Card>
        </div>
      </CandidateLayout>
    );
  }

  return (
    <CandidateLayout candidateName="Candidate" candidateId="">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Candidate Application
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Complete the form below to apply as a candidate for the student council election.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-3">
          {[
            { num: 1, label: "Verified Information" },
            { num: 2, label: "Contact Details" },
            { num: 3, label: "Candidate Content" },
          ].map((s, i) => (
            <div key={s.num} className="flex items-center gap-3 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${
                  step >= s.num
                    ? "bg-primary-600 text-white"
                    : "bg-border text-text-secondary"
                }`}
              >
                {step > s.num ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  s.num
                )}
              </div>
              <span
                className={`text-sm font-medium hidden sm:block ${
                  step >= s.num ? "text-primary-700" : "text-text-muted"
                }`}
              >
                {s.label}
              </span>
              {i < 2 && (
                <div
                  className={`flex-1 h-0.5 ${
                    step > s.num ? "bg-primary-600" : "bg-border"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Verified Information */}
        {step === 1 && (
          <Card className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-text-primary">
                  Verified Information
                </h2>
                <p className="text-xs text-text-secondary">
                  These details will be verified by administration
                </p>
              </div>
            </div>

            <div className="bg-info-50 border border-info-100 rounded-xl p-4 text-sm text-info-700">
              <p className="font-medium">Important</p>
              <p className="mt-1 text-xs text-info-600">
                Verified information (name, enrollment number, department, year, section, position) will be
                frozen after approval and cannot be changed.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  Full Name <span className="text-error-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="Enter your full name"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.name ? "border-error-500" : "border-border"
                    }`}
                  />
                </div>
                {errors.name && (
                  <p className="text-xs text-error-600 mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  Enrollment Number <span className="text-error-500">*</span>
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    value={formData.enrollmentNumber}
                    onChange={(e) => handleChange("enrollmentNumber", e.target.value)}
                    placeholder="e.g. NIT-2024-0847"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.enrollmentNumber ? "border-error-500" : "border-border"
                    }`}
                  />
                </div>
                {errors.enrollmentNumber && (
                  <p className="text-xs text-error-600 mt-1">{errors.enrollmentNumber}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    Course / Department <span className="text-error-500">*</span>
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => handleChange("department", e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.department ? "border-error-500" : "border-border"
                    }`}
                  >
                    <option value="">Select department</option>
                    {DEPARTMENT_OPTIONS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  {errors.department && (
                    <p className="text-xs text-error-600 mt-1">{errors.department}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    Year / Semester <span className="text-error-500">*</span>
                  </label>
                  <select
                    value={formData.year}
                    onChange={(e) => handleChange("year", e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.year ? "border-error-500" : "border-border"
                    }`}
                  >
                    <option value="">Select year</option>
                    {YEAR_OPTIONS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                  {errors.year && (
                    <p className="text-xs text-error-600 mt-1">{errors.year}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    Section <span className="text-error-500">*</span>
                  </label>
                  <select
                    value={formData.section}
                    onChange={(e) => handleChange("section", e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.section ? "border-error-500" : "border-border"
                    }`}
                  >
                    <option value="">Select section</option>
                    {SECTION_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {errors.section && (
                    <p className="text-xs text-error-600 mt-1">{errors.section}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    Position Contesting <span className="text-error-500">*</span>
                  </label>
                  <select
                    value={formData.position}
                    onChange={(e) => handleChange("position", e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.position ? "border-error-500" : "border-border"
                    }`}
                  >
                    <option value="">Select position</option>
                    {POSITION_OPTIONS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  {errors.position && (
                    <p className="text-xs text-error-600 mt-1">{errors.position}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border">
              <Button variant="primary" onClick={handleNext} className="gap-2">
                Next: Contact Details
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* Step 2: Contact Information */}
        {step === 2 && (
          <Card className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-text-primary">
                  Contact Information
                </h2>
                <p className="text-xs text-text-secondary">
                  How the administration can reach you
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  Email Address <span className="text-error-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="your.email@college.edu"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.email ? "border-error-500" : "border-border"
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-error-600 mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  Phone Number <span className="text-error-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="+91 98765 43210"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.phone ? "border-error-500" : "border-border"
                    }`}
                  />
                </div>
                {errors.phone && (
                  <p className="text-xs text-error-600 mt-1">{errors.phone}</p>
                )}
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-border">
              <Button variant="outline" onClick={handleBack} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button variant="primary" onClick={handleNext} className="gap-2">
                Next: Candidate Content
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* Step 3: Candidate Content */}
        {step === 3 && (
          <Card className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-text-primary">
                  Candidate Content
                </h2>
                <p className="text-xs text-text-secondary">
                  Profile photo, bio and manifesto for your public candidate page
                </p>
              </div>
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-2">
                Profile Photo
              </label>
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <div className="w-20 h-20 rounded-2xl bg-bg-tertiary border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
                    {formData.photo ? (
                      <img
                        src={formData.photo}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Camera className="w-6 h-6 text-text-muted" />
                    )}
                  </div>
                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="w-5 h-5 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <div>
                  <p className="text-sm text-text-primary font-medium">
                    Upload a profile photo
                  </p>
                  <p className="text-xs text-text-muted">JPG or PNG, max 5MB</p>
                  {formData.photo && (
                    <button
                      onClick={removePhoto}
                      className="text-xs text-error-600 mt-1 hover:underline"
                    >
                      Remove photo
                    </button>
                  )}
                </div>
              </div>
              {errors.photo && (
                <p className="text-xs text-error-600 mt-1">{errors.photo}</p>
              )}
            </div>

            {/* Bio */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Bio <span className="text-error-500">*</span>
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => handleChange("bio", e.target.value)}
                maxLength={500}
                rows={4}
                placeholder="Write a short bio about yourself (max 500 characters)"
                className={`w-full px-4 py-2.5 rounded-xl border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none ${
                  errors.bio ? "border-error-500" : "border-border"
                }`}
              />
              <div className="flex justify-between items-center mt-1">
                {errors.bio && (
                  <p className="text-xs text-error-600">{errors.bio}</p>
                )}
                <p className="text-xs text-text-muted ml-auto">
                  {formData.bio.length} / 500
                </p>
              </div>
            </div>

            {/* Manifesto */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Manifesto <span className="text-error-500">*</span>
              </label>
              <textarea
                value={formData.manifesto}
                onChange={(e) => handleChange("manifesto", e.target.value)}
                maxLength={2000}
                rows={6}
                placeholder="Describe your vision, goals and what you plan to achieve if elected (max 2000 characters)"
                className={`w-full px-4 py-2.5 rounded-xl border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none ${
                  errors.mANIfesto ? "border-error-500" : "border-border"
                }`}
              />
              <div className="flex justify-between items-center mt-1">
                {errors.manifesto && (
                  <p className="text-xs text-error-600">{errors.manifesto}</p>
                )}
                <p className="text-xs text-text-muted ml-auto">
                  {formData.manifesto.length} / 2000
                </p>
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-between pt-4 border-t border-border">
              <Button variant="outline" onClick={handleBack} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                isLoading={isSubmitting}
                disabled={isSubmitting}
                className="gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Application
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </CandidateLayout>
  );
}
