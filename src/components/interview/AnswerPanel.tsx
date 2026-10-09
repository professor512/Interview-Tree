
import { useEffect, useState } from "react";

interface Evaluation {
    score?: number;
    rating?: string;
    summary?: string;
    strengths?: string[];
    weaknesses?: string[];
    missingPoints?: string[];
    feedback?: string;
}

interface AnswerPanelProps {
    question: string;
    status: "Unanswered" | "Answered";
    savedAnswer: string | null;
    evaluation: Evaluation | null;
    onClose: () => void;
    onSubmit: (answer: string) => Promise<void>;
    submitting: boolean;
}

function AnswerPanel({
    question,
    status,
    savedAnswer,
    evaluation,
    onClose,
    onSubmit,
    submitting,
}: AnswerPanelProps) {
    const [answer, setAnswer] = useState("");

    useEffect(() => {
        setAnswer("");
    }, [question, status]);

    async function handleSubmit() {
        if (!answer.trim() || submitting) return;
        await onSubmit(answer.trim());
    }

    const answered = status === "Answered";

    function renderList(title: string, items?: string[]) {
        if (!items?.length) return null;

        return (
            <section className="evaluation-section">
                <h3>{title}</h3>
                <ul>
                    {items.map((item, index) => (
                        <li key={`${title}-${index}`}>{item}</li>
                    ))}
                </ul>
            </section>
        );
    }

    return (
        <div className="answer-panel">
            <div className="answer-panel-header">
                <div>
                    <span className="answer-panel-label">
                        {answered ? "Answered Question" : "Interview Question"}
                    </span>
                    <h2>{question}</h2>
                </div>

                <button
                    className="answer-panel-close"
                    onClick={onClose}
                    disabled={submitting}
                    aria-label="Close"
                >
                    ×
                </button>
            </div>

            <div className="answer-panel-body">
                {answered ? (
                    <div className="evaluation-results">
                        <section className="evaluation-section">
                            <h3>Your Answer</h3>
                            <p className="saved-answer">
                                {savedAnswer || "No saved answer found."}
                            </p>
                        </section>

                        {evaluation ? (
                            <>
                                <div className="evaluation-score">
                                    <div>
                                        <span className="answer-panel-label">
                                            Answer Score
                                        </span>
                                        <strong>
                                            {typeof evaluation.score === "number"
                                                ? `${evaluation.score}/100`
                                                : "Not available"}
                                        </strong>
                                    </div>

                                    {evaluation.rating && (
                                        <span className="evaluation-rating">
                                            {evaluation.rating}
                                        </span>
                                    )}
                                </div>

                                {evaluation.summary && (
                                    <section className="evaluation-section">
                                        <h3>Summary</h3>
                                        <p>{evaluation.summary}</p>
                                    </section>
                                )}

                                {renderList("Strengths", evaluation.strengths)}
                                {renderList("Weaknesses", evaluation.weaknesses)}
                                {renderList("Missing Points", evaluation.missingPoints)}

                                {evaluation.feedback && (
                                    <section className="evaluation-section">
                                        <h3>Improvement Feedback</h3>
                                        <p>{evaluation.feedback}</p>
                                    </section>
                                )}
                            </>
                        ) : (
                            <p>Evaluation details are not available for this answer.</p>
                        )}
                    </div>
                ) : (
                    <>
                        <label htmlFor="candidate-answer">Your Answer</label>

                        <textarea
                            id="candidate-answer"
                            value={answer}
                            onChange={(event) => setAnswer(event.target.value)}
                            placeholder="Explain your answer as you would in a real interview..."
                            rows={8}
                            disabled={submitting}
                        />

                        <div className="answer-panel-footer">
                            <span className="answer-panel-hint">
                                Be specific and explain your reasoning.
                            </span>

                            <button
                                className="primary-button"
                                onClick={handleSubmit}
                                disabled={submitting || !answer.trim()}
                            >
                                {submitting ? "Evaluating..." : "Submit Answer"}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default AnswerPanel;
