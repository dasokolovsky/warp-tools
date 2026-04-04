interface WizardStepperProps {
  steps: string[];
  currentStep: number;
}

export function WizardStepper({ steps, currentStep }: WizardStepperProps) {
  return (
    <div className="flex items-center gap-0">
      {steps.map((step, index) => {
        const stepNum = index + 1;
        const isCompleted = stepNum < currentStep;
        const isActive = stepNum === currentStep;

        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                  isCompleted
                    ? 'bg-[#00C650] border-[#00C650] text-black'
                    : isActive
                      ? 'bg-transparent border-[#00C650] text-[#00C650]'
                      : 'bg-transparent border-[#1A2235] text-[#8B95A5]'
                }`}
              >
                {isCompleted ? '✓' : stepNum}
              </div>
              <span
                className={`mt-1 text-xs hidden sm:block ${
                  isActive ? 'text-white font-medium' : isCompleted ? 'text-[#00C650]' : 'text-[#8B95A5]'
                }`}
              >
                {step}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`h-0.5 w-8 sm:w-12 mx-1 mb-4 sm:mb-0 mt-0 sm:mt-0 transition-colors ${
                  stepNum < currentStep ? 'bg-[#00C650]' : 'bg-[#1A2235]'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
