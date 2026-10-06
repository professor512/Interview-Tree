import {
    FileText,
    Briefcase,
    Building2,
    ClipboardCheck,
} from "lucide-react";

interface ConfirmStepProps {
    resumeFile: File | null;
    resumeText: string;

    role: string;
    level: string;
    interviewType: string;
    company: string;
    jobDescription: string;
}

function ConfirmStep({
    resumeFile,
    resumeText,
    role,
    level,
    interviewType,
    company,
    jobDescription,
}: ConfirmStepProps) {
    const resumeSource =
        resumeFile
            ? resumeFile.name
            : resumeText
                ? "Pasted resume text"
                : "No resume";

    return (
        <div className="wizard-step">
            <div className="wizard-step-header">
                <h2>Ready to generate</h2>

                <p>
                    Review your interview setup before
                    generating your personalised tree.
                </p>
            </div>

            <div className="confirmation-grid">
                <div className="confirmation-card">
                    <div className="confirmation-icon">
                        <FileText size={20} />
                    </div>

                    <div>
                        <span>Resume</span>

                        <strong>
                            {resumeSource}
                        </strong>
                    </div>
                </div>

                <div className="confirmation-card">
                    <div className="confirmation-icon">
                        <Briefcase size={20} />
                    </div>

                    <div>
                        <span>Target role</span>

                        <strong>{role}</strong>
                    </div>
                </div>

                <div className="confirmation-card">
                    <div className="confirmation-icon">
                        <ClipboardCheck size={20} />
                    </div>

                    <div>
                        <span>Interview</span>

                        <strong>
                            {interviewType} · {level}
                        </strong>
                    </div>
                </div>

                {company && (
                    <div className="confirmation-card">
                        <div className="confirmation-icon">
                            <Building2 size={20} />
                        </div>

                        <div>
                            <span>Company</span>

                            <strong>{company}</strong>
                        </div>
                    </div>
                )}
            </div>

            {jobDescription && (
                <div className="confirmation-description">
                    <span>Job description provided</span>

                    <p>
                        {jobDescription.length > 250
                            ? `${jobDescription.slice(
                                0,
                                250
                            )}...`
                            : jobDescription}
                    </p>
                </div>
            )}

            <div className="generate-info">
                <strong>
                    What happens next?
                </strong>

                <ul>
                    <li>
                        Your resume will be analysed by
                        Gemini.
                    </li>

                    <li>
                        InterviewTree will build your
                        personalised resume profile.
                    </li>

                    <li>
                        AI will generate your first layer
                        of interview questions.
                    </li>

                    <li>
                        Your interview tree will open
                        automatically.
                    </li>
                </ul>
            </div>
        </div>
    );
}

export default ConfirmStep;