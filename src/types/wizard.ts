import type {
    ExperienceLevel,
    InterviewType,
} from "./tree";

export interface ResumeData {
    file: File | null;
    text: string;
}

export interface InterviewContext {
    role: string;
    level: ExperienceLevel | "";
    interviewType: InterviewType | "";
    company: string;
    jobDescription: string;
}

export interface WizardData {
    resume: ResumeData;
    context: InterviewContext;
}