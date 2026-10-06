import { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as pdfjsLib from "pdfjs-dist";

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

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
).toString();

interface GeneratedQuestion {
    question: string;
    hook?: string;
    category?: string;
    branchType?: string;
    difficulty?: string;
    idealAnswerOutline?: string[];
}

interface AnalyzeResumeResult {
    resumeProfile: Record<string, unknown>;
    questions: GeneratedQuestion[];
}

function NewTreeWizard() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [step, setStep] = useState(1);

    const [resumeFile, setResumeFile] =
        useState<File | null>(null);

    const [resumeText, setResumeText] = useState("");

    const [role, setRole] = useState("");

    const [level, setLevel] =
        useState<ExperienceLevel | "">("");

    const [interviewType, setInterviewType] =
        useState<InterviewType | "">("");

    const [company, setCompany] = useState("");

    const [jobDescription, setJobDescription] =
        useState("");

    const [error, setError] = useState("");

    const [creating, setCreating] = useState(false);

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
                setError("Please enter your target role.");
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

    async function extractPdfText(file: File) {
        const arrayBuffer = await file.arrayBuffer();

        const pdf = await pdfjsLib.getDocument({
            data: arrayBuffer,
        }).promise;

        let extractedText = "";

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
            const page = await pdf.getPage(pageNumber);

            const content = await page.getTextContent();

            const pageText = content.items
                .map((item) =>
                    "str" in item ? item.str : ""
                )
                .join(" ");

            extractedText += `${pageText}\n`;
        }

        return extractedText.trim();
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

        let treeId: string | null = null;
        let uploadedFilePath: string | null = null;

        try {
            const title = company
                ? `${role} — ${company}`
                : `${role} Interview`;

            // ============================================
            // 1. GET RESUME TEXT
            // ============================================

            let finalResumeText = resumeText.trim();

            if (resumeFile) {
                finalResumeText =
                    await extractPdfText(resumeFile);
            }

            if (!finalResumeText) {
                throw new Error(
                    "Unable to extract text from your resume."
                );
            }

            if (finalResumeText.length < 50) {
                throw new Error(
                    "The resume does not contain enough readable text."
                );
            }

            // ============================================
            // 2. CREATE TREE
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
                    company: company.trim() || null,
                    job_description:
                        jobDescription.trim() || null,
                    resume_profile: null,
                    resume_path: null,
                })
                .select()
                .single();

            if (createError || !tree) {
                console.error(createError);

                throw new Error(
                    "Unable to create your interview tree."
                );
            }

            treeId = tree.id;

            // ============================================
            // 3. UPLOAD RESUME PDF
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
                            contentType: resumeFile.type,
                            upsert: false,
                        }
                    );

                if (uploadError) {
                    console.error(uploadError);

                    throw new Error(
                        "Your resume upload failed. Please try again."
                    );
                }

                uploadedFilePath = filePath;

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

                    throw new Error(
                        "Unable to save your resume information."
                    );
                }
            }

            // ============================================
            // 4. CALL ANALYZE-RESUME EDGE FUNCTION
            // ============================================

            const {
                data: functionData,
                error: functionError,
            } = await supabase.functions.invoke(
                "analyze-resume",
                {
                    body: {
                        resumeText: finalResumeText,
                        role: role.trim(),
                        level,
                        interviewType,
                        company: company.trim(),
                        jobDescription:
                            jobDescription.trim(),
                    },
                }
            );

            if (functionError) {
                console.error(
                    "analyze-resume error:",
                    functionError
                );

                throw new Error(
                    "AI analysis failed. Please try again."
                );
            }

            if (
                !functionData ||
                !functionData.success ||
                !functionData.data
            ) {
                console.error(
                    "Invalid analyze-resume response:",
                    functionData
                );

                throw new Error(
                    "AI returned an invalid response."
                );
            }

            const analysis =
                functionData.data as AnalyzeResumeResult;

            if (
                !analysis.resumeProfile ||
                !Array.isArray(analysis.questions)
            ) {
                throw new Error(
                    "AI response is missing resume analysis or questions."
                );
            }

            // ============================================
            // 5. SAVE RESUME PROFILE
            // ============================================

            const {
                error: profileError,
            } = await supabase
                .from("trees")
                .update({
                    resume_profile:
                        analysis.resumeProfile,
                })
                .eq("id", tree.id);

            if (profileError) {
                console.error(profileError);

                throw new Error(
                    "Unable to save the AI resume analysis."
                );
            }

            // ============================================
            // 6. CREATE LAYER 1 NODES
            // ============================================

            const nodes = analysis.questions
                .filter(
                    (item) =>
                        item &&
                        typeof item.question === "string" &&
                        item.question.trim()
                )
                .map((item, index) => ({
                    tree_id: tree.id,
                    parent_id: null,
                    layer: 1,
                    question: item.question.trim(),
                    hook: item.hook || null,
                    category: item.category || null,
                    branch_type: item.branchType || null,
                    difficulty: item.difficulty || null,
                    ideal_answer_outline:
                        item.idealAnswerOutline || [],
                    user_answer: null,
                    evaluation: null,
                    status: "Unanswered",
                    position_x: index * 320,
                    position_y: 100,
                    collapsed: false,
                }));

            if (nodes.length === 0) {
                throw new Error(
                    "AI did not generate any interview questions."
                );
            }

            const {
                error: nodesError,
            } = await supabase
                .from("nodes")
                .insert(nodes);

            if (nodesError) {
                console.error(nodesError);

                throw new Error(
                    "Unable to save the generated interview questions."
                );
            }

            // ============================================
            // 7. FINISH
            // ============================================

            navigate(`/trees/${tree.id}`);
        } catch (error) {
            console.error(
                "Interview tree generation failed:",
                error
            );

            // ============================================
            // CLEANUP
            // ============================================

            if (uploadedFilePath) {
                await supabase.storage
                    .from("resumes")
                    .remove([uploadedFilePath]);
            }

            if (treeId) {
                await supabase
                    .from("trees")
                    .delete()
                    .eq("id", treeId);
            }

            setError(
                error instanceof Error
                    ? error.message
                    : "Something went wrong while creating your interview tree."
            );
        } finally {
            setCreating(false);
        }
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
                        disabled={creating}
                    >
                        ← Back to dashboard
                    </button>

                    <h1>Create Interview Tree</h1>

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
                                disabled={creating}
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
                                    ? "Analyzing resume..."
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