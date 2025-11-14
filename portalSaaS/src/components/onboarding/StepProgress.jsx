import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

const StepProgress = ({ steps, currentStep, onStepClick }) => {
  return (
    <div className="flex items-center justify-between max-w-3xl mx-auto">
      {steps.slice(0, -1).map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isClickable = index <= currentStep;

        return (
          <div key={step.id} className="flex items-center">
            {/* Step Circle */}
            <motion.button
              onClick={() => isClickable && onStepClick(index)}
              disabled={!isClickable}
              className={`relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-200 ${
                isCompleted
                  ? 'bg-gradient-to-br from-green-500 to-green-600 border-green-500 text-white shadow-lg'
                  : isCurrent
                  ? 'bg-gradient-to-br from-blue-500 to-indigo-600 border-blue-500 text-white shadow-lg'
                  : 'bg-white border-gray-300 text-gray-400'
              } ${isClickable ? 'cursor-pointer hover:shadow-lg' : 'cursor-not-allowed'}`}
              whileHover={isClickable ? { scale: 1.05 } : {}}
              whileTap={isClickable ? { scale: 0.95 } : {}}
            >
              {isCompleted ? (
                <Check className="h-6 w-6" />
              ) : (
                <step.icon className="h-6 w-6" />
              )}
              
              {/* Pulse animation for current step */}
              {isCurrent && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-blue-400"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </motion.button>

            {/* Step Label */}
            <div className="ml-3 min-w-0 flex-1">
              <p className={`text-sm font-medium ${
                isCurrent ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
              }`}>
                {step.title}
              </p>
              <p className="text-xs text-gray-500 mt-1 hidden sm:block">
                {step.description}
              </p>
            </div>

            {/* Connector Line */}
            {index < steps.length - 2 && (
              <div className={`flex-1 h-0.5 mx-6 ${
                index < currentStep ? 'bg-green-500' : 'bg-gray-300'
              }`}>
                {index < currentStep && (
                  <motion.div
                    className="h-full bg-gradient-to-r from-green-500 to-green-600"
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StepProgress;
