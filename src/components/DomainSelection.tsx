import { motion } from 'motion/react';
import { Button } from './ui/button';

interface DomainSelectionProps {
  onDomainSelect: (domain: string) => void;
}

const MEDICAL_DOMAINS = [
  { 
    id: 'neurological', 
    name: 'Neurological / Mental Symptoms', 
    emoji: '🧠', 
    color: 'from-purple-500 to-indigo-500',
    description: 'Brain, nerves, mental health issues'
  },
  { 
    id: 'cardiovascular', 
    name: 'Cardiovascular / Respiratory', 
    emoji: '💓', 
    color: 'from-red-500 to-pink-500',
    description: 'Heart, lungs, blood circulation'
  },
  { 
    id: 'systemic', 
    name: 'Systemic (Whole Body)', 
    emoji: '🤒', 
    color: 'from-orange-500 to-red-500',
    description: 'Fever, fatigue, general illness'
  },
  { 
    id: 'digestive', 
    name: 'Digestive System', 
    emoji: '💩', 
    color: 'from-yellow-500 to-orange-500',
    description: 'Stomach, intestines, digestion'
  },
  { 
    id: 'musculoskeletal', 
    name: 'Musculoskeletal', 
    emoji: '💀', 
    color: 'from-gray-500 to-slate-500',
    description: 'Bones, muscles, joints, back'
  },
  { 
    id: 'hormonal', 
    name: 'Hormonal / Endocrine', 
    emoji: '🧍‍♀️', 
    color: 'from-green-500 to-emerald-500',
    description: 'Thyroid, diabetes, hormones'
  },
  { 
    id: 'immune', 
    name: 'Immune / Infection Related', 
    emoji: '🩸', 
    color: 'from-rose-500 to-red-500',
    description: 'Infections, allergies, immunity'
  },
  { 
    id: 'emotional', 
    name: 'Emotional / Psychological', 
    emoji: '😔', 
    color: 'from-blue-500 to-cyan-500',
    description: 'Mood, anxiety, depression'
  },
  { 
    id: 'other', 
    name: 'Other / General Consultation', 
    emoji: '❓', 
    color: 'from-gray-400 to-gray-600',
    description: 'Symptoms not listed above'
  },
];

export function DomainSelection({ onDomainSelect }: DomainSelectionProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center space-y-8"
        >
          {/* Header */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-teal-900 text-4xl title-primary mb-4">
              What are you experiencing?
            </h1>
            <p className="text-teal-700/70 text-xl body-regular">
              Please select the category that best describes your symptoms
            </p>
          </motion.div>

          {/* Domain Grid */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full"
          >
            {MEDICAL_DOMAINS.map((domain, index) => (
              <motion.div
                key={domain.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1, duration: 0.4 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={() => onDomainSelect(domain.id)}
                  className={`w-full h-32 bg-gradient-to-r ${domain.color} hover:shadow-lg text-white rounded-xl transition-all duration-300 hover:shadow-xl flex flex-col items-center justify-center gap-3 p-6`}
                >
                  <div className="text-center">
                    <div className="text-lg font-semibold leading-tight mb-2">
                      {domain.name}
                    </div>
                    <div className="text-sm opacity-90 leading-tight">
                      {domain.description}
                    </div>
                  </div>
                </Button>
              </motion.div>
            ))}
          </motion.div>

          {/* Disclaimer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="bg-white/60 backdrop-blur-sm px-6 py-4 rounded-xl border border-teal-200/30 shadow-sm max-w-2xl text-center"
          >
            <p className="text-teal-700/80 text-sm body-regular">
              ⚠️ This is for informational purposes only. Always consult with a healthcare professional for proper diagnosis and treatment.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
