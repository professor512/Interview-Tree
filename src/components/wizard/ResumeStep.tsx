import { useRef, useState } from "react";
import { FileText, Upload, X } from "lucide-react";

interface ResumeStepProps {
    resumeFile: File | null;
    resumeText: string;

    onFileChange: (
        file: File | null
    ) => void;

    onTextChange: (
        text: string
    ) => void;
}

function ResumeStep({
    resumeFile,
    resumeText,
    onFileChange,
    onTextChange,
}: ResumeStepProps) {
    const inputRef =
        useRef<HTMLInputElement>(null);

    const [error, setError] =
        useState("");

    function handleFileSelect(
        event: React.ChangeEvent<HTMLInputElement>
    ) {
        const file =
            event.target.files?.[0];

        if (!file) {
            return;
        }

        setError("");

        if (
            file.type !==
            "application/pdf"
        ) {
            setError(
                "Please upload a PDF file."
            );

            return;
        }

        const maxSize =
            5 * 1024 * 1024;

        if (file.size > maxSize) {
            setError(
                "Resume must be smaller than 5 MB."
            );

            return;
        }

        onFileChange(file);

        // Clear pasted text when uploading
        // a resume file.
        onTextChange("");
    }

    function removeFile() {
        onFileChange(null);

        if (inputRef.current) {
            inputRef.current.value = "";
        }
    }

    function handleTextChange(
        event: React.ChangeEvent<HTMLTextAreaElement>
    ) {
        const value =
            event.target.value;

        onTextChange(value);

        // Clear file when user starts
        // pasting resume text.
        if (value.trim()) {
            onFileChange(null);

            if (inputRef.current) {
                inputRef.current.value = "";
            }
        }
    }

    return (
        <div className="wizard-step">
            <div className="wizard-step-header">
                <h2>Upload your resume</h2>

                <p>
                    Your resume helps InterviewTree create
                    questions specifically around your
                    experience, projects, and skills.
                </p>
            </div>

            {/* PDF UPLOAD */}

            <div className="resume-upload-section">
                <div className="section-label">
                    Upload PDF
                </div>

                {!resumeFile ? (
                    <button
                        type="button"
                        className="resume-dropzone"
                        onClick={() =>
                            inputRef.current?.click()
                        }
                    >
                        <Upload size={28} />

                        <strong>
                            Click to upload your resume
                        </strong>

                        <span>
                            PDF only · Maximum 5 MB
                        </span>
                    </button>
                ) : (
                    <div className="selected-file">
                        <div className="selected-file-info">
                            <FileText size={24} />

                            <div>
                                <strong>
                                    {resumeFile.name}
                                </strong>

                                <span>
                                    {(
                                        resumeFile.size /
                                        1024 /
                                        1024
                                    ).toFixed(2)}{" "}
                                    MB
                                </span>
                            </div>
                        </div>

                        <button
                            type="button"
                            className="remove-file-button"
                            onClick={removeFile}
                            title="Remove file"
                        >
                            <X size={18} />
                        </button>
                    </div>
                )}

                <input
                    ref={inputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileSelect}
                    hidden
                />
            </div>

            <div className="resume-divider">
                <span>OR</span>
            </div>

            {/* TEXT */}

            <div className="form-group">
                <label htmlFor="resumeText">
                    Paste resume text
                </label>

                <textarea
                    id="resumeText"
                    value={resumeText}
                    onChange={handleTextChange}
                    placeholder="Paste the text from your resume here..."
                    rows={12}
                />

                <div className="textarea-footer">
                    <span>
                        {resumeText.trim().length} characters
                    </span>
                </div>
            </div>

            {/* PRIVACY */}

            <div className="privacy-note">
                Your resume will be sent to Google's
                Gemini API for AI analysis. It is used
                to generate your personalised interview
                questions.
            </div>

            {error && (
                <div className="wizard-error">
                    {error}
                </div>
            )}
        </div>
    );
}

export default ResumeStep;