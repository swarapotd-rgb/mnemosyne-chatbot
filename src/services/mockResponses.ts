// Mock responses for development without API access
const mockResponses = {
  symptomAnalysis: {
    fever: {
      assessment: "Your symptoms suggest a possible fever. This could be due to various causes including viral or bacterial infections.",
      urgencyLevel: "medium" as const,
      possibleConditions: [
        "Viral infection (common cold, flu)",
        "Bacterial infection",
        "Inflammatory condition",
        "Heat exhaustion or dehydration"
      ],
      recommendations: [
        "Monitor your temperature regularly",
        "Stay hydrated by drinking plenty of fluids",
        "Rest and avoid strenuous activity",
        "Take over-the-counter fever reducers if needed",
        "Seek medical attention if temperature exceeds 103°F (39.4°C) or persists for more than 3 days"
      ],
      nextSteps: [
        "Take your temperature every 4 hours",
        "Keep a symptom diary",
        "Contact your doctor if symptoms worsen",
        "Consider scheduling an appointment if fever persists"
      ]
    },
    headache: {
      assessment: "You appear to be experiencing a headache. This could range from a tension headache to a migraine.",
      urgencyLevel: "low" as const,
      possibleConditions: [
        "Tension headache",
        "Migraine",
        "Sinus headache",
        "Cluster headache",
        "Stress-related headache"
      ],
      recommendations: [
        "Rest in a quiet, dark room",
        "Stay hydrated",
        "Try over-the-counter pain relievers",
        "Apply a cold or warm compress",
        "If severe or persistent, consult a healthcare provider"
      ],
      nextSteps: [
        "Identify potential triggers",
        "Practice relaxation techniques",
        "Maintain regular sleep schedule",
        "Consider keeping a headache diary"
      ]
    },
    chestPain: {
      assessment: "Chest pain requires immediate medical attention as it can indicate serious conditions.",
      urgencyLevel: "emergency" as const,
      possibleConditions: [
        "Heart attack",
        "Angina",
        "Pulmonary embolism",
        "Aortic dissection",
        "Pericarditis"
      ],
      recommendations: [
        "Call emergency services immediately",
        "Do not drive yourself to the hospital",
        "Stay calm and rest",
        "Take prescribed medications if available",
        "Avoid any physical exertion"
      ],
      nextSteps: [
        "Seek immediate emergency medical care",
        "Inform emergency responders of all symptoms",
        "Have someone stay with you",
        "Prepare list of current medications"
      ]
    },
    shortnessOfBreath: {
      assessment: "Difficulty breathing can indicate various respiratory or cardiovascular conditions.",
      urgencyLevel: "high" as const,
      possibleConditions: [
        "Asthma attack",
        "Pneumonia",
        "Pulmonary edema",
        "Anxiety attack",
        "COPD exacerbation"
      ],
      recommendations: [
        "Sit upright and try to stay calm",
        "Use prescribed inhalers if available",
        "Seek immediate medical attention",
        "Avoid lying flat",
        "Monitor oxygen levels if possible"
      ],
      nextSteps: [
        "Call emergency services if severe",
        "Visit urgent care or emergency room",
        "Follow up with pulmonologist",
        "Keep emergency medications accessible"
      ]
    },
    abdominalPain: {
      assessment: "Abdominal pain can have many causes, from mild digestive issues to serious conditions.",
      urgencyLevel: "medium" as const,
      possibleConditions: [
        "Gastritis",
        "Appendicitis",
        "Gallstones",
        "Irritable bowel syndrome",
        "Food poisoning"
      ],
      recommendations: [
        "Avoid solid foods initially",
        "Stay hydrated with clear liquids",
        "Apply gentle heat to the area",
        "Monitor for worsening symptoms",
        "Seek medical attention if severe or persistent"
      ],
      nextSteps: [
        "Track pain location and intensity",
        "Note any associated symptoms",
        "Schedule appointment with gastroenterologist",
        "Consider urgent care if symptoms worsen"
      ]
    },
    default: {
      assessment: "Based on the symptoms described, a medical evaluation may be needed for proper diagnosis.",
      urgencyLevel: "medium" as const,
      possibleConditions: [
        "General health concern requiring evaluation",
        "Multiple possible conditions",
        "Need for professional assessment"
      ],
      recommendations: [
        "Monitor your symptoms",
        "Keep track of any changes",
        "Consider consulting with a healthcare provider",
        "Watch for worsening symptoms"
      ],
      nextSteps: [
        "Document all symptoms and their progression",
        "Schedule an appointment with your doctor",
        "Prepare a list of questions for your healthcare provider",
        "Consider urgent care if symptoms worsen"
      ]
    }
  },
  conversations: {
    greeting: "Hello! I'm Mnemosyne, your AI Health Companion. I'm here to help you explore your symptoms and provide guidance. Please note that this is not a replacement for professional medical advice. What type of symptoms are you experiencing?",
    followUp: [
      "Can you describe the severity of your symptoms on a scale of 1-10?",
      "How long have you been experiencing these symptoms?",
      "Have you noticed any patterns or triggers?"
    ],
    emergencyWarning: "⚠️ Based on your symptoms, you should seek immediate medical attention. Please contact emergency services or go to the nearest emergency room."
  }
};

export default mockResponses;