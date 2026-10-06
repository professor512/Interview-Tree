export type ExperienceLevel =
    | "Intern"
    | "Fresher"
    | "1-3 yrs"
    | "3+ yrs";

export type InterviewType =
    | "Technical"
    | "HR"
    | "Mixed";

export interface InterviewTree {
    id: string;

    user_id: string;

    title: string;

    role: string;

    level: ExperienceLevel;

    interview_type: InterviewType;

    job_description: string | null;

    company: string | null;

    resume_profile: Record<string, unknown> | null;

    resume_path: string | null;

    created_at: string;

    updated_at: string;
}