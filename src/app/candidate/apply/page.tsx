"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { CandidateLayout } from "@/components/candidate-dashboard/CandidateLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  submitApplication,
} from "@/lib/candidate-api";
import { getRollNumber } from "@/lib/roll-number";

const DEPARTMENT_OPTIONS = ["BBA", "BCA", "BCOM", "MBA", "MCA"];

/** Official club nomination form — Nomination For Club (required). */
const NOMINATION_CLUBS = [
  "SAHITYASHALA (LITERATURE AND POETRY CLUB) & RACHNAKAR (CREATIVE CLUB)",
  "BOSCO SPARTANS (SPORTS CLUB)",
  "PUBLICATION COMMITTEE",
  "ECO CLUB",
  "TECHNO SPARKS (TECHNO CLUB)",
  "AARAMBH (ENTREPRENEURSHIP CLUB)",
  "SOCIAL SYNERGY (SOCIAL MEDIA CLUB)",
  "SOCIAL OUTREACH (PARIVARTAN CLUB)",
  "CO-CURRICULAR & EXTRA CO-CURRICULAR ACTIVITIES CLUB",
  "JHANKAAR (CULTURAL CLUB)",
];

/** Official club nomination form — Applied for the Position (required). */
const CONTESTING_POSITIONS = [
  "Vice President (Batch 2020)",
  "Secretary (Batch 2021)",
];

const DECLARATION_TEXT =
  "I hereby declare that all the information given above is true and I agree that my candidature will stand disqualified if any of the above information is found to be false or misrepresented. I also agree to abide by the Guidelines of Bosco Technical Training Society Affiliated to Guru Gobind Singh Indraprastha University.";

const YEAR_OPTIONS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

const SECTION_OPTIONS = ["A", "B", "C", "D", "E", "F"];
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
  nominationClub: string;
  contestingPosition: string;
  email: string;
  phone: string;
  photo: string | null;
  bio: string;
  manifesto: string;
  age: string;
  dateOfBirth: string;
  gender: string;
  aadharNumber: string;
  declaration: string;
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
  nominationClub: "",
  contestingPosition: "",
  email: "",
  phone: "",
  photo: null,
  bio: "",
  manifesto: "",
  age: "",
  dateOfBirth: "",
  gender: "",
  aadharNumber: "",
  declaration: "",
};

export default function CandidateApplyPage() {
  const router = useRouter();
  const { user } = useUser();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Pre-fill from Clerk user (Google OAuth profile) and stored roll number
  useEffect(() => {
    if (!user) return;
    const clerkName = [user.firstName, user.lastName].filter(Boolean).join(" ") || "";
    const clerkEmail = user.primaryEmailAddress?.emailAddress || "";
    const storedRoll =
      getRollNumber("candidate", clerkEmail) || getRollNumber("student", clerkEmail);

    setFormData((prev) => ({
      ...prev,
      name: prev.name || clerkName,
      email: prev.email || clerkEmail,
      enrollmentNumber: prev.enrollmentNumber || storedRoll || "",
    }));
  }, [user]);

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
    // Downscale via canvas (max 512px, JPEG ~85%) before storing. The photo
    // is saved as a base64 data URL in the database — a raw phone photo is
    // megabytes of base64, which blows row/payload limits and slows every
    // load. A 512px JPEG stays in the ~30-80KB range and looks fine at
    // avatar sizes.
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new window.Image();
      img.onload = () => {
        const MAX = 512;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          // Canvas unavailable — fall back to the original data URL.
          setFormData((prev) => ({ ...prev, photo: ev.target?.result as string }));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        setFormData((prev) => ({
          ...prev,
          photo: canvas.toDataURL("image/jpeg", 0.85),
        }));
        setErrors((prev) => {
          const next = { ...prev };
          delete next.photo;
          return next;
        });
      };
      img.onerror = () => {
        setErrors((prev) => ({ ...prev, photo: "Could not read that image. Try a different photo." }));
      };
      img.src = ev.target?.result as string;
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
    if (!formData.nominationClub) newErrors.nominationClub = "Please select the club you are nominating for";
    if (!formData.contestingPosition) newErrors.contestingPosition = "Please select the position you are applying for";
    if (!formData.age.trim()) newErrors.age = "Age is required";
    if (!formData.dateOfBirth.trim()) newErrors.dateOfBirth = "Date of birth is required";
    if (!formData.gender) newErrors.gender = "Gender is required";
    if (!formData.aadharNumber.trim()) newErrors.aadharNumber = "Aadhar number is required";
    else if (!/^\d{12}$/.test(formData.aadharNumber.replace(/\s/g, ""))) newErrors.aadharNumber = "Aadhar must be 12 digits";
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
    if (formData.declaration.trim().toUpperCase() !== "CONFIRM") {
      newErrors.declaration = 'Please type “CONFIRM” exactly to submit your application';
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
    if (!formData.nominationClub || !formData.contestingPosition) {
      setErrors({
        nominationClub: !formData.nominationClub ? "Please select the club you are nominating for" : "",
        contestingPosition: !formData.contestingPosition ? "Please select the position you are applying for" : "",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await submitApplication({
        fullName: formData.name.trim(),
        enrollmentNumber: formData.enrollmentNumber.trim(),
        department: formData.department,
        year: formData.year,
        section: formData.section,
        nominationClub: formData.nominationClub,
        contestingPosition: formData.contestingPosition,
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        profilePhotoUrl: formData.photo,
        bio: formData.bio.trim(),
        manifesto: formData.manifesto.trim(),
        age: Number(formData.age),
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        aadharNumber: formData.aadharNumber.trim(),
      });
      setShowSuccess(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to submit application.";
      setErrors({ general: message });
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
                  <span className="text-text-secondary">Club</span>
                  <span className="font-medium text-text-primary text-right max-w-[220px]">{formData.nominationClub || "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Position</span>
                  <span className="font-medium text-text-primary">{formData.contestingPosition || "—"}</span>
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
                Verified information (name, enrollment number, age, DOB, gender, Aadhar, department, year, section, club and position) will be
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
              </div>

              {/* Club & Society Details — official nomination form fields */}
              <div className="bg-bg-tertiary rounded-xl p-4 space-y-4">
                <p className="text-sm font-semibold text-text-primary">Club & Society Details</p>

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    Nomination For Club <span className="text-error-500">*</span>
                  </label>
                  <select
                    value={formData.nominationClub}
                    onChange={(e) => handleChange("nominationClub", e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.nominationClub ? "border-error-500" : "border-border"
                    }`}
                  >
                    <option value="">Select club</option>
                    {NOMINATION_CLUBS.map((club) => (
                      <option key={club} value={club}>{club}</option>
                    ))}
                  </select>
                  {errors.nominationClub && (
                    <p className="text-xs text-error-600 mt-1">{errors.nominationClub}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    Applied for the Position <span className="text-error-500">*</span>
                  </label>
                  <select
                    value={formData.contestingPosition}
                    onChange={(e) => handleChange("contestingPosition", e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.contestingPosition ? "border-error-500" : "border-border"
                    }`}
                  >
                    <option value="">Select position</option>
                    {CONTESTING_POSITIONS.map((pos) => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                  </select>
                  {errors.contestingPosition && (
                    <p className="text-xs text-error-600 mt-1">{errors.contestingPosition}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    Age <span className="text-error-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={16}
                    max={30}
                    value={formData.age}
                    onChange={(e) => handleChange("age", e.target.value)}
                    placeholder="As per 10th Certificate"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.age ? "border-error-500" : "border-border"
                    }`}
                  />
                  {errors.age && (
                    <p className="text-xs text-error-600 mt-1">{errors.age}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    Date of Birth <span className="text-error-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.dateOfBirth ? "border-error-500" : "border-border"
                    }`}
                  />
                  {errors.dateOfBirth && (
                    <p className="text-xs text-error-600 mt-1">{errors.dateOfBirth}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    Gender <span className="text-error-500">*</span>
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleChange("gender", e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.gender ? "border-error-500" : "border-border"
                    }`}
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.gender && (
                    <p className="text-xs text-error-600 mt-1">{errors.gender}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    Aadhar Card Number <span className="text-error-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.aadharNumber}
                    onChange={(e) => handleChange("aadharNumber", e.target.value)}
                    placeholder="12-digit Aadhar number"
                    maxLength={14}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.aadharNumber ? "border-error-500" : "border-border"
                    }`}
                  />
                  {errors.aadharNumber && (
                    <p className="text-xs text-error-600 mt-1">{errors.aadharNumber}</p>
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
                  errors.manifesto ? "border-error-500" : "border-border"
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

            {/* Declaration + CONFIRM gate — matches official nomination form */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-800">
                Declaration
              </p>
              <p className="text-xs text-amber-800 leading-relaxed">
                {DECLARATION_TEXT} Please write <span className="font-bold">“CONFIRM”</span> to send
                the application for review. <span className="text-error-500">*</span>
              </p>
              <input
                type="text"
                value={formData.declaration}
                onChange={(e) => handleChange("declaration", e.target.value)}
                placeholder="Type CONFIRM to proceed"
                className={`w-full px-4 py-2.5 rounded-xl border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.declaration ? "border-error-500" : "border-border"
                }`}
              />
              {errors.declaration && (
                <p className="text-xs text-error-600">{errors.declaration}</p>
              )}
            </div>

            {errors.general && (
              <div className="p-3 rounded-xl bg-error-50 border border-error/20 text-sm text-error-600 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errors.general}</span>
              </div>
            )}

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
