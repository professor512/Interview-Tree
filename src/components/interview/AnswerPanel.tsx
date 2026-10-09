import { useState } from "react";

interface AnswerPanelProps {
    question: string;
    onClose: () => void;
    onSubmit: (answer: string) => Promise<void>;
    submitting: boolean;
}

function AnswerPanel({
    question,
    onClose,
    onSubmit,
    submitting,
}: AnswerPanelProps) {
    const [answer, setAnswer] = useState("");

    async function handleSubmit() {
        if (!answer.trim() || submitting) {
            return;
        }

        await onSubmit(answer.trim());
    }

    return (
        <div className="answer-panel">
            <div className="answer-panel-header">
                <div>
                    <span className="answer-panel-label">
                        Interview Question
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
                <label htmlFor="candidate-answer">
                    Your Answer
                </label>

                <textarea
                    id="candidate-answer"
                    value={answer}
                    onChange={(event) =>
                        setAnswer(event.target.value)
                    }
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
                        disabled={
                            submitting || !answer.trim()
                        }
                    >
                        {submitting
                            ? "Evaluating..."
                            : "Submit Answer"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AnswerPanel;