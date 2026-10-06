import type {
    ExperienceLevel,
    InterviewType,
} from "../../types/tree";

interface ContextStepProps {
    role: string;
    level: ExperienceLevel | "";
    interviewType: InterviewType | "";
    company: string;
    jobDescription: string;

    onRoleChange: (value: string) => void;
    onLevelChange: (
        value: ExperienceLevel
    ) => void;

    onInterviewTypeChange: (
        value: InterviewType
    ) => void;

    onCompanyChange: (
        value: string
    ) => void;

    onJobDescriptionChange: (
        value: string
    ) => void;
}

function ContextStep({
    role,
    level,
    interviewType,
    company,
    jobDescription,
    onRoleChange,
    onLevelChange,
    onInterviewTypeChange,
    onCompanyChange,
    onJobDescriptionChange,
}: ContextStepProps) {
    return (
        <div className="wizard-step">
            <div className="wizard-step-header">
                <h2>Interview context</h2>

                <p>
                    Tell us what kind of interview you're
                    preparing for.
                </p>
            </div>

            {/* ROLE */}

            <div className="form-group">
                <label htmlFor="role">
                    Target role
                    <span className="required">*</span>
                </label>

                <input
                    id="role"
                    type="text"
                    value={role}
                    onChange={(event) =>
                        onRoleChange(
                            event.target.value
                        )
                    }
                    placeholder="e.g. Software Engineer"
                />
            </div>

            {/* LEVEL */}

            <div className="form-group">
                <label htmlFor="level">
                    Experience level
                    <span className="required">*</span>
                </label>

                <select
                    id="level"
                    value={level}
                    onChange={(event) =>
                        onLevelChange(
                            event.target
                                .value as ExperienceLevel
                        )
                    }
                >
                    <option value="">
                        Select experience level
                    </option>

                    <option value="Intern">
                        Intern
                    </option>

                    <option value="Fresher">
                        Fresher
                    </option>

                    <option value="1-3 yrs">
                        1-3 years
                    </option>

                    <option value="3+ yrs">
                        3+ years
                    </option>
                </select>
            </div>

            {/* INTERVIEW TYPE */}

            <div className="form-group">
                <label htmlFor="interviewType">
                    Interview type
                    <span className="required">*</span>
                </label>

                <select
                    id="interviewType"
                    value={interviewType}
                    onChange={(event) =>
                        onInterviewTypeChange(
                            event.target
                                .value as InterviewType
                        )
                    }
                >
                    <option value="">
                        Select interview type
                    </option>

                    <option value="Technical">
                        Technical
                    </option>

                    <option value="HR">
                        HR
                    </option>

                    <option value="Mixed">
                        Mixed
                    </option>
                </select>
            </div>

            {/* COMPANY */}

            <div className="form-group">
                <label htmlFor="company">
                    Company name
                    <span className="optional">
                        Optional
                    </span>
                </label>

                <input
                    id="company"
                    type="text"
                    value={company}
                    onChange={(event) =>
                        onCompanyChange(
                            event.target.value
                        )
                    }
                    placeholder="e.g. Google"
                />
            </div>

            {/* JOB DESCRIPTION */}

            <div className="form-group">
                <label htmlFor="jobDescription">
                    Job description
                    <span className="optional">
                        Optional
                    </span>
                </label>

                <textarea
                    id="jobDescription"
                    value={jobDescription}
                    onChange={(event) =>
                        onJobDescriptionChange(
                            event.target.value
                        )
                    }
                    placeholder="Paste the job description here. InterviewTree will use it to tailor questions to the role."
                    rows={8}
                />
            </div>
        </div>
    );
}

export default ContextStep;