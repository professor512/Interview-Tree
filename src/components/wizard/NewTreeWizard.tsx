import { useState } from "react";
import { useNavigate } from "react-router-dom";

import WizardProgress from "./WizardProgress";
import ResumeStep from "./ResumeStep";
import ContextStep from "./ContextStep";
import ConfirmStep from "./ConfirmStep";

import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

import type {
    ExperienceLevel,
    InterviewType,
} from "../../types/tree";

function NewTreeWizard() {
    const navigate = useNavigate();

    const { user } = useAuth();

    const [step, setStep] = useState(1);

    const [resumeFile, setResumeFile] =
        useState<File | null>(null);

    const [resumeText, setResumeText] =
        useState("");

    const [role, setRole] =
        useState("");

    const [level, setLevel] =
        useState<ExperienceLevel | "">("");

    const [interviewType, setInterviewType] =
        useState<InterviewType | "">("");

    const [company, setCompany] =
        useState("");

    const [jobDescription, setJobDescription] =
        useState("");

    const [error, setError] =
        useState("");

    const [creating, setCreating] =
        useState(false);

    function validateStep() {
        setError("");

        if (step === 1) {
            if (!resumeFile && !resumeText.trim()) {
                setError(
                    "Please upload your resume or paste your resume text."
                );

                return false;
            }

            if (
                resumeText.trim() &&
                resumeText.trim().length < 50
            ) {
                setError(
                    "Your pasted resume text is too short. Please provide more detail."
                );

                return false;
            }
        }

        if (step === 2) {
            if (!role.trim()) {
                setError(
                    "Please enter your target role."
                );

                return false;
            }

            if (!level) {
                setError(
                    "Please select your experience level."
                );

                return false;
            }

            if (!interviewType) {
                setError(
                    "Please select an interview type."
                );

                return false;
            }
        }

        return true;
    }

    function handleNext() {
        if (!validateStep()) {
            return;
        }

        setStep((current) =>
            Math.min(current + 1, 3)
        );
    }

    function handleBack() {
        setError("");

        setStep((current) =>
            Math.max(current - 1, 1)
        );
    }

    async function handleGenerate() {
        if (!validateStep()) {
            return;
        }

        if (!user) {
            setError(
                "You must be logged in to create an interview tree."
            );

            return;
        }

        setCreating(true);
        setError("");

        const title = company
            ? `${role} — ${company}`
            : `${role} Interview`;

        // ============================================
        // 1. CREATE TREE
        // ============================================

        const {
            data: tree,
            error: createError,
        } = await supabase
            .from("trees")
            .insert({
                user_id: user.id,

                title,

                role: role.trim(),

                level,

                interview_type: interviewType,

                company:
                    company.trim() || null,

                job_description:
                    jobDescription.trim() || null,

                resume_profile: null,

                resume_path: null,
            })
            .select()
            .single();

        if (createError || !tree) {
            console.error(createError);

            setError(
                "Unable to create your interview tree. Please try again."
            );

            setCreating(false);

            return;
        }

        // ============================================
        // 2. UPLOAD RESUME PDF
        // ============================================

        if (resumeFile) {
            const fileExtension =
                resumeFile.name
                    .split(".")
                    .pop()
                    ?.toLowerCase() || "pdf";

            const filePath =
                `${user.id}/${tree.id}/resume.${fileExtension}`;

            const {
                error: uploadError,
            } = await supabase.storage
                .from("resumes")
                .upload(
                    filePath,
                    resumeFile,
                    {
                        contentType:
                            resumeFile.type,

                        upsert: false,
                    }
                );

            if (uploadError) {
                console.error(uploadError);

                // Clean up the tree if the resume
                // upload failed.
                await supabase
                    .from("trees")
                    .delete()
                    .eq("id", tree.id);

                setError(
                    "Your interview tree was created, but the resume upload failed. Please try again."
                );

                setCreating(false);

                return;
            }

            // ============================================
            // 3. SAVE RESUME PATH
            // ============================================

            const {
                error: updateError,
            } = await supabase
                .from("trees")
                .update({
                    resume_path: filePath,
                })
                .eq("id", tree.id);

            if (updateError) {
                console.error(updateError);

                // Remove uploaded file.
                await supabase.storage
                    .from("resumes")
                    .remove([filePath]);

                // Remove tree.
                await supabase
                    .from("trees")
                    .delete()
                    .eq("id", tree.id);

                setError(
                    "Unable to save your resume information. Please try again."
                );

                setCreating(false);

                return;
            }
        }

        // ============================================
        // 4. FINISH
        // ============================================

        navigate(`/trees/${tree.id}`);
    }

    return (
        <div className="wizard-page">
            <div className="wizard-container">
                <div className="wizard-header">
                    <button
                        className="wizard-back-link"
                        onClick={() =>
                            navigate("/dashboard")
                        }
                    >
                        ← Back to dashboard
                    </button>

                    <h1>
                        Create Interview Tree
                    </h1>

                    <p>
                        Build a personalised interview
                        experience from your resume.
                    </p>
                </div>

                <WizardProgress
                    currentStep={step}
                />

                <div className="wizard-card">
                    {step === 1 && (
                        <ResumeStep
                            resumeFile={resumeFile}
                            resumeText={resumeText}
                            onFileChange={setResumeFile}
                            onTextChange={setResumeText}
                        />
                    )}

                    {step === 2 && (
                        <ContextStep
                            role={role}
                            level={level}
                            interviewType={interviewType}
                            company={company}
                            jobDescription={jobDescription}
                            onRoleChange={setRole}
                            onLevelChange={setLevel}
                            onInterviewTypeChange={
                                setInterviewType
                            }
                            onCompanyChange={setCompany}
                            onJobDescriptionChange={
                                setJobDescription
                            }
                        />
                    )}

                    {step === 3 && (
                        <ConfirmStep
                            resumeFile={resumeFile}
                            resumeText={resumeText}
                            role={role}
                            level={level}
                            interviewType={interviewType}
                            company={company}
                            jobDescription={jobDescription}
                        />
                    )}

                    {error && (
                        <div className="wizard-error">
                            {error}
                        </div>
                    )}

                    <div className="wizard-actions">
                        {step > 1 ? (
                            <button
                                className="secondary-button"
                                onClick={handleBack}
                                disabled={creating}
                            >
                                Back
                            </button>
                        ) : (
                            <button
                                className="secondary-button"
                                onClick={() =>
                                    navigate("/dashboard")
                                }
                                disabled={creating}
                            >
                                Cancel
                            </button>
                        )}

                        {step < 3 ? (
                            <button
                                className="primary-button wizard-next"
                                onClick={handleNext}
                            >
                                Continue
                            </button>
                        ) : (
                            <button
                                className="primary-button wizard-next"
                                onClick={handleGenerate}
                                disabled={creating}
                            >
                                {creating
                                    ? "Creating..."
                                    : "Generate my interview tree"}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default NewTreeWizard;