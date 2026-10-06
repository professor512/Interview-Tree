interface WizardProgressProps {
    currentStep: number;
}

const steps = [
    "Resume",
    "Interview Context",
    "Confirm",
];

function WizardProgress({
    currentStep,
}: WizardProgressProps) {
    return (
        <div className="wizard-progress">
            {steps.map((step, index) => {
                const stepNumber = index + 1;

                const isActive =
                    stepNumber === currentStep;

                const isCompleted =
                    stepNumber < currentStep;

                return (
                    <div
                        className="wizard-progress-item"
                        key={step}
                    >
                        <div
                            className={`wizard-step-circle ${isActive ? "active" : ""
                                } ${isCompleted ? "completed" : ""
                                }`}
                        >
                            {isCompleted ? "✓" : stepNumber}
                        </div>

                        <span
                            className={
                                isActive
                                    ? "wizard-step-label active"
                                    : "wizard-step-label"
                            }
                        >
                            {step}
                        </span>

                        {index < steps.length - 1 && (
                            <div
                                className={
                                    stepNumber < currentStep
                                        ? "wizard-step-line completed"
                                        : "wizard-step-line"
                                }
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default WizardProgress;