import React, { useState } from 'react';
import { Button } from './ui/button';
import { ArrowLeft } from 'lucide-react';

const SYMPTOM_DOMAINS = [
  { 
    id: 'neuro',
    name: 'Sensory',
    symptoms: ['Headache', 'Dizziness', 'Memory Issues', 'Confusion', 'Numbness/Tingling', 'Migraines', 'Balance Problems', 'Tremors', 'Difficulty Concentrating', 'Speech Difficulties', 'Vision Changes', 'Seizures']
  },
  {
    id: 'cardio',
    name: 'Cardiovascular / Respiratory',
    symptoms: ['Chest Pain', 'Shortness of Breath', 'Heart Palpitations', 'Persistent Cough', 'High Blood Pressure', 'Irregular Heartbeat', 'Difficulty Breathing When Lying Down', 'Swelling in Legs/Ankles', 'Wheezing', 'Blue Lips or Fingers']
  },
  {
    id: 'systemic',
    name: 'Systemic (Whole Body)',
    symptoms: ['Fever', 'Fatigue', 'Body Aches', 'Night Sweats', 'Weight Changes', 'Weakness', 'Chills', 'Loss of Energy', 'Unexplained Weight Loss', 'Excessive Thirst', 'Frequent Urination']
  },
  {
    id: 'digestive',
    name: 'Digestive System',
    symptoms: ['Nausea', 'Stomach Pain', 'Diarrhea', 'Constipation', 'Loss of Appetite', 'Bloating', 'Acid Reflux', 'Vomiting', 'Blood in Stool', 'Indigestion', 'Abdominal Cramps', 'Gas']
  },
  {
    id: 'musculo',
    name: 'Skeletal',
    symptoms: ['Joint Pain', 'Muscle Pain', 'Back Pain', 'Stiffness', 'Limited Movement', 'Muscle Weakness', 'Swollen Joints', 'Bone Pain', 'Muscle Cramps', 'Reduced Range of Motion', 'Joint Swelling']
  },
  {
    id: 'hormonal',
    name: 'Hormonal ',
    symptoms: ['Unusual Thirst', 'Temperature Sensitivity', 'Irregular Periods', 'Hair Loss', 'Weight Gain', 'Mood Swings', 'Hot Flashes', 'Excessive Sweating', 'Fatigue', 'Changes in Sex Drive', 'Irregular Heart Rate']
  },
  {
    id: 'immune',
    name: 'Immune System / Infection',
    symptoms: ['Swollen Glands', 'Rash', 'Recurring Infections', 'Allergic Reactions', 'Fever', 'Joint Pain', 'Skin Problems', 'Frequent Colds', 'Slow Wound Healing', 'Autoimmune Issues', 'Inflammation']
  }
];

interface DomainSelectionScreenProps {
  onAnalyze: (symptoms: string[]) => void;
  onBack?: () => void;
}

export function DomainSelectionScreen({ onAnalyze, onBack }: DomainSelectionScreenProps) {
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);

  const handleDomainSelect = (domainId: string) => {
    setSelectedDomain(domainId);
    setSelectedSymptoms([]);
  };

  const handleSymptomToggle = (symptom: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom) 
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handleBack = () => {
    if (selectedDomain) {
      setSelectedDomain(null);
      setSelectedSymptoms([]);
    }
  };

  const selectedDomainData = selectedDomain 
    ? SYMPTOM_DOMAINS.find(d => d.id === selectedDomain)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 px-6 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        {onBack && (
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={onBack}
              className="flex items-center gap-2 text-teal-600 hover:text-teal-700 hover:bg-teal-100 px-4 py-2 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Button>
          </div>
        )}
        {/* Header */}
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-bold text-teal-900 mb-4">
            {selectedDomain ? selectedDomainData?.name : 'Select Symptom Category'}
          </h2>
          <p className="text-lg text-teal-600 font-medium">
            {selectedDomain 
              ? 'Select all symptoms that apply to you'
              : 'Choose the category that best describes your symptoms'}
          </p>
        </div>

        {/* Domain Selection */}
        {!selectedDomain && (
          <div className="flex flex-col items-center space-y-4 w-full">
            {SYMPTOM_DOMAINS.map(domain => (
              <Button
                key={domain.id}
                variant="outline"
                className="w-full max-w-2xl h-auto p-6 flex items-center justify-center text-center transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl border-2 hover:border-teal-500 bg-white rounded-xl"
                onClick={() => handleDomainSelect(domain.id)}
              >
                <span className="text-xl font-semibold text-teal-900 py-2">{domain.name}</span>
              </Button>
            ))}
          </div>
        )}

        {/* Symptom Selection */}
        {selectedDomain && selectedDomainData && (
          <>
            <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
              <div className="mb-6">
                <h3 className="text-2xl font-semibold text-teal-900 mb-3">Common Symptoms</h3>
                <p className="text-teal-600">Select all symptoms that you are experiencing</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                {selectedDomainData.symptoms.map((symptom, index) => (
                  <div key={symptom} className={`${index % 2 === 0 ? 'md:pr-4' : 'md:pl-4'}`}>
                    <Button
                      variant={selectedSymptoms.includes(symptom) ? "default" : "outline"}
                      className={`w-full h-auto p-6 justify-start transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl rounded-xl ${
                        selectedSymptoms.includes(symptom) 
                          ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold hover:from-teal-600 hover:to-cyan-600 border-none' 
                          : 'hover:bg-teal-50 border-2 hover:border-teal-500 bg-white'
                      }`}
                      onClick={() => handleSymptomToggle(symptom)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full ${
                          selectedSymptoms.includes(symptom)
                            ? 'bg-white bg-opacity-20'
                            : 'border-2 border-teal-200'
                        }`}>
                          {selectedSymptoms.includes(symptom) ? (
                            <span className="text-white text-xl">✓</span>
                          ) : (
                            <span className="text-teal-500 text-xl">+</span>
                          )}
                        </div>
                        <span className="text-lg font-medium">{symptom}</span>
                      </div>
                    </Button>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="flex gap-6 justify-between items-center">
                  <Button
                    variant="ghost"
                    onClick={handleBack}
                    className="text-teal-600 hover:text-teal-700 px-6 py-3 text-lg"
                  >
                    ← Back to Categories
                  </Button>

                  <div className="flex items-center gap-3">
                    {selectedSymptoms.length > 0 && (
                      <span className="text-teal-600 font-medium">
                        {selectedSymptoms.length} symptom{selectedSymptoms.length !== 1 ? 's' : ''} selected
                      </span>
                    )}
                    <Button
                      disabled={selectedSymptoms.length === 0}
                      onClick={() => onAnalyze(selectedSymptoms)}
                      className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-10 py-6 text-lg font-semibold rounded-xl hover:shadow-xl transform transition-all duration-300 hover:-translate-y-1 hover:from-teal-600 hover:to-cyan-600 disabled:opacity-50"
                    >
                      Analyze Symptoms →
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}