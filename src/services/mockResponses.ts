// Mock responses for development without API access
const mockResponses = {
  symptomAnalysis: {
    fever: {
      assessment: "Your symptoms suggest a possible fever. This could be due to various causes including viral or bacterial infections.",
      confidence: 75,
      urgencyLevel: "medium" as const,
      recommendations: [
        "Monitor your temperature regularly",
        "Stay hydrated by drinking plenty of fluids",
        "Rest and avoid strenuous activity",
        "Take over-the-counter fever reducers if needed",
        "Seek medical attention if temperature exceeds 103°F (39.4°C) or persists for more than 3 days"
      ]
    },
    headache: {
      assessment: "You appear to be experiencing a headache. This could range from a tension headache to a migraine.",
      confidence: 70,
      urgencyLevel: "low" as const,
      recommendations: [
        "Rest in a quiet, dark room",
        "Stay hydrated",
        "Try over-the-counter pain relievers",
        "Apply a cold or warm compress",
        "If severe or persistent, consult a healthcare provider"
      ]
    },
    default: {
      assessment: "Based on the symptoms described, a medical evaluation may be needed for proper diagnosis.",
      confidence: 60,
      urgencyLevel: "medium" as const,
      recommendations: [
        "Monitor your symptoms",
        "Keep track of any changes",
        "Consider consulting with a healthcare provider",
        "Watch for worsening symptoms"
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