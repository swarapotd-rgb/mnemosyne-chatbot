interface ProgressDotsProps {
  currentStep: number;
  totalSteps: number;
}

export function ProgressDots({ currentStep, totalSteps }: ProgressDotsProps) {
  return (
    <div className="flex gap-2 items-center justify-center">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div
          key={index}
          className={`h-2 w-2 rounded-full transition-all duration-300 ${
            index + 1 === currentStep
              ? 'bg-teal-500 w-8'
              : 'bg-gray-300'
          }`}
        />
      ))}
    </div>
  );
}
