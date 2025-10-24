import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';

interface SymptomSelectionProps {
  domain: string;
  onSymptomSelect: (symptom: string) => void;
  onBack: () => void;
  selectedSymptoms: string[];
  onAnalyzeSymptoms: () => void;
}

const DOMAIN_SYMPTOMS: Record<string, { name: string; emoji: string; symptoms: string[] }> = {
  neurological: {
    name: 'Neurological / Mental Symptoms',
    emoji: '🧠',
    symptoms: [
      'Headaches / Migraines',
      'Memory problems',
      'Confusion / Disorientation',
      'Mood changes',
      'Anxiety / Panic attacks',
      'Depression',
      'Sleep disturbances',
      'Seizures',
      'Numbness / Tingling',
      'Balance problems',
      'Speech difficulties',
      'Vision changes'
    ]
  },
  cardiovascular: {
    name: 'Cardiovascular / Respiratory',
    emoji: '💓',
    symptoms: [
      'Chest pain',
      'Shortness of breath',
      'Heart palpitations',
      'High blood pressure',
      'Coughing',
      'Wheezing',
      'Dizziness',
      'Fainting',
      'Swelling in legs',
      'Irregular heartbeat',
      'Fatigue during activity',
      'Cold hands/feet'
    ]
  },
  systemic: {
    name: 'Systemic (Whole Body)',
    emoji: '🤒',
    symptoms: [
      'Fever',
      'Fatigue / Weakness',
      'Weight loss / gain',
      'Night sweats',
      'Chills',
      'Body aches',
      'Swollen lymph nodes',
      'Skin changes',
      'Hair loss',
      'Nail changes',
      'General malaise',
      'Loss of appetite'
    ]
  },
  digestive: {
    name: 'Digestive System',
    emoji: '💩',
    symptoms: [
      'Abdominal pain',
      'Nausea / Vomiting',
      'Diarrhea',
      'Constipation',
      'Bloating',
      'Heartburn / Acid reflux',
      'Loss of appetite',
      'Weight changes',
      'Blood in stool',
      'Difficulty swallowing',
      'Food intolerances',
      'Indigestion'
    ]
  },
  musculoskeletal: {
    name: 'Musculoskeletal',
    emoji: '💀',
    symptoms: [
      'Joint pain',
      'Muscle pain',
      'Back pain',
      'Neck pain',
      'Stiffness',
      'Swelling in joints',
      'Limited range of motion',
      'Muscle weakness',
      'Cramps',
      'Bone pain',
      'Tenderness',
      'Redness / warmth'
    ]
  },
  hormonal: {
    name: 'Hormonal / Endocrine',
    emoji: '🧍‍♀️',
    symptoms: [
      'Weight changes',
      'Mood swings',
      'Irregular periods',
      'Hot flashes',
      'Cold intolerance',
      'Excessive thirst',
      'Frequent urination',
      'Hair changes',
      'Skin changes',
      'Energy level changes',
      'Sleep problems',
      'Appetite changes'
    ]
  },
  immune: {
    name: 'Immune / Infection Related',
    emoji: '🩸',
    symptoms: [
      'Frequent infections',
      'Slow healing',
      'Allergic reactions',
      'Rashes',
      'Swollen glands',
      'Fever',
      'Chills',
      'Sore throat',
      'Runny nose',
      'Cough',
      'Body aches',
      'Fatigue'
    ]
  },
  emotional: {
    name: 'Emotional / Psychological',
    emoji: '😔',
    symptoms: [
      'Anxiety',
      'Depression',
      'Mood swings',
      'Irritability',
      'Panic attacks',
      'Social withdrawal',
      'Concentration problems',
      'Sleep disturbances',
      'Appetite changes',
      'Loss of interest',
      'Feelings of hopelessness',
      'Stress'
    ]
  },
  other: {
    name: 'Other',
    emoji: '❓',
    symptoms: [
      'Symptoms not listed above',
      'Multiple different symptoms',
      'Unclear symptoms',
      'Need general consultation'
    ]
  }
};

export function SymptomSelection({ domain, onSymptomSelect, onBack, selectedSymptoms, onAnalyzeSymptoms }: SymptomSelectionProps) {
  const domainInfo = DOMAIN_SYMPTOMS[domain];
  
  if (!domainInfo) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center space-y-8"
        >
          {/* Back Button */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            onClick={onBack}
            className="self-start flex items-center gap-2 text-teal-700 hover:text-teal-900 transition-colors body-regular"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Categories
          </motion.button>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-center"
          >
            <div className="text-center mb-4">
              <h1 className="text-teal-900 text-3xl title-primary">
                {domainInfo.name}
              </h1>
            </div>
            <p className="text-teal-700/70 text-lg body-regular">
              Select the symptoms you're experiencing
            </p>
          </motion.div>

          {/* Symptoms Grid */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 w-full max-w-5xl"
          >
            {domainInfo.symptoms.map((symptom, index) => (
              <motion.div
                key={symptom}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.05, duration: 0.4 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={() => onSymptomSelect(symptom)}
                  className={`w-full h-16 rounded-xl transition-all duration-300 flex items-center justify-center p-4 ${
                    selectedSymptoms.includes(symptom)
                      ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white border border-teal-500'
                      : 'bg-teal-50/60 border border-teal-200 text-black hover:bg-teal-100/80'
                  }`}
                >
                  <span className="text-sm font-medium text-center leading-tight">
                    {symptom}
                  </span>
                </Button>
              </motion.div>
            ))}
          </motion.div>

          {/* Selected Symptoms Display */}
          {selectedSymptoms.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="bg-white/80 backdrop-blur-sm rounded-xl border border-teal-200 p-6 max-w-2xl"
            >
              <h3 className="text-teal-900 font-medium mb-3">Selected Symptoms:</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedSymptoms.map((symptom, index) => (
                  <span
                    key={index}
                    className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-3 py-1 rounded-full text-sm"
                  >
                    {symptom}
                  </span>
                ))}
              </div>
              <Button
                onClick={onAnalyzeSymptoms}
                className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white rounded-xl h-12 shadow-lg shadow-teal-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/40"
              >
                Analyze My Symptoms
              </Button>
            </motion.div>
          )}

          {/* Disclaimer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0, duration: 0.6 }}
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
