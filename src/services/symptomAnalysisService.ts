interface SymptomRecommendation {
  homeRemedies: string[];
  overTheCounterMedicines: string[];
  whenToSeeDoctor: string[];
  generalAdvice: string[];
  severity: 'low' | 'medium' | 'high' | 'emergency';
}

interface SymptomAnalysis {
  possibleConditions: string[];
  recommendations: SymptomRecommendation;
  confidence: number;
  urgency: string;
}

const SYMPTOM_DATABASE: Record<string, Record<string, SymptomAnalysis>> = {
  neurological: {
    'Headaches / Migraines': {
      possibleConditions: ['Tension headache', 'Migraine', 'Sinus headache', 'Cluster headache'],
      recommendations: {
        homeRemedies: [
          'Apply cold or warm compress to head and neck',
          'Rest in a dark, quiet room',
          'Stay hydrated - drink plenty of water',
          'Practice relaxation techniques or meditation',
          'Gentle neck and shoulder stretches'
        ],
        overTheCounterMedicines: [
          'Ibuprofen (Advil, Motrin) - 200-400mg every 4-6 hours',
          'Acetaminophen (Tylenol) - 500-1000mg every 4-6 hours',
          'Aspirin - 325-650mg every 4 hours',
          'Naproxen (Aleve) - 220mg every 8-12 hours'
        ],
        whenToSeeDoctor: [
          'Severe headache with fever, stiff neck, or rash',
          'Sudden, severe headache (thunderclap headache)',
          'Headache after head injury',
          'Headache with vision changes, confusion, or weakness',
          'Headaches that worsen or change pattern'
        ],
        generalAdvice: [
          'Keep a headache diary to identify triggers',
          'Maintain regular sleep schedule',
          'Limit caffeine and alcohol intake',
          'Manage stress through exercise and relaxation'
        ],
        severity: 'medium'
      },
      confidence: 85,
      urgency: 'Monitor symptoms and seek medical attention if severe or persistent'
    },
    'Memory problems': {
      possibleConditions: ['Age-related memory decline', 'Stress-related forgetfulness', 'Sleep deprivation', 'Medication side effects'],
      recommendations: {
        homeRemedies: [
          'Get adequate sleep (7-9 hours per night)',
          'Stay mentally active with puzzles, reading, or learning',
          'Maintain social connections and conversations',
          'Practice mindfulness and meditation',
          'Keep a daily planner or use reminder apps'
        ],
        overTheCounterMedicines: [
          'Ginkgo biloba supplements (120-240mg daily)',
          'Omega-3 fatty acids (1000-2000mg daily)',
          'Vitamin B12 (1000-2000mcg daily) if deficient',
          'Magnesium supplements (200-400mg daily)'
        ],
        whenToSeeDoctor: [
          'Significant memory loss affecting daily activities',
          'Confusion or disorientation',
          'Difficulty with familiar tasks',
          'Personality or mood changes',
          'Memory problems that worsen rapidly'
        ],
        generalAdvice: [
          'Exercise regularly to improve brain function',
          'Eat a brain-healthy diet (Mediterranean diet)',
          'Manage chronic conditions like diabetes and hypertension',
          'Avoid excessive alcohol consumption'
        ],
        severity: 'medium'
      },
      confidence: 80,
      urgency: 'Schedule appointment if symptoms persist or worsen'
    }
  },
  cardiovascular: {
    'Chest pain': {
      possibleConditions: ['Angina', 'Heart attack', 'Costochondritis', 'Anxiety', 'GERD'],
      recommendations: {
        homeRemedies: [
          'Rest and avoid physical exertion',
          'Apply warm compress to chest area',
          'Practice deep breathing exercises',
          'Stay calm and reduce stress',
          'Avoid heavy meals and caffeine'
        ],
        overTheCounterMedicines: [
          'Antacids if GERD-related (Tums, Rolaids)',
          'Aspirin 325mg (only if prescribed by doctor)',
          'Ibuprofen for inflammation (if not heart-related)'
        ],
        whenToSeeDoctor: [
          'Severe chest pain or pressure',
          'Pain radiating to arm, jaw, or back',
          'Shortness of breath or sweating',
          'Nausea or dizziness with chest pain',
          'Chest pain lasting more than 15 minutes'
        ],
        generalAdvice: [
          'Call emergency services (911) for severe chest pain',
          'Avoid smoking and secondhand smoke',
          'Maintain healthy weight and diet',
          'Manage stress and anxiety'
        ],
        severity: 'high'
      },
      confidence: 90,
      urgency: 'Seek immediate medical attention for severe chest pain'
    },
    'Shortness of breath': {
      possibleConditions: ['Asthma', 'Anxiety', 'COPD', 'Heart failure', 'Pneumonia'],
      recommendations: {
        homeRemedies: [
          'Sit upright and lean forward slightly',
          'Practice pursed-lip breathing',
          'Use a fan to circulate air',
          'Stay calm and avoid panic',
          'Remove tight clothing around chest'
        ],
        overTheCounterMedicines: [
          'Antihistamines for allergies (Claritin, Zyrtec)',
          'Decongestants for nasal congestion (Sudafed)',
          'Inhalers (if prescribed by doctor)'
        ],
        whenToSeeDoctor: [
          'Severe shortness of breath at rest',
          'Blue lips or fingernails',
          'Chest pain with breathing difficulty',
          'High fever with breathing problems',
          'Sudden onset of severe breathing difficulty'
        ],
        generalAdvice: [
          'Avoid triggers like smoke, dust, or allergens',
          'Maintain good indoor air quality',
          'Stay hydrated and avoid dehydration',
          'Exercise regularly to improve lung function'
        ],
        severity: 'high'
      },
      confidence: 85,
      urgency: 'Seek immediate medical attention if severe'
    }
  },
  systemic: {
    'Fever': {
      possibleConditions: ['Viral infection', 'Bacterial infection', 'Inflammatory condition', 'Heat exhaustion'],
      recommendations: {
        homeRemedies: [
          'Rest and get plenty of sleep',
          'Stay hydrated with water, herbal teas, or broth',
          'Apply cool, damp cloths to forehead and body',
          'Take lukewarm baths or showers',
          'Wear lightweight, breathable clothing'
        ],
        overTheCounterMedicines: [
          'Acetaminophen (Tylenol) - 500-1000mg every 4-6 hours',
          'Ibuprofen (Advil) - 200-400mg every 4-6 hours',
          'Aspirin - 325-650mg every 4 hours (adults only)'
        ],
        whenToSeeDoctor: [
          'Fever above 103°F (39.4°C) in adults',
          'Fever lasting more than 3 days',
          'Fever with severe headache or stiff neck',
          'Fever with rash or difficulty breathing',
          'Fever in infants under 3 months'
        ],
        generalAdvice: [
          'Monitor temperature regularly',
          'Avoid alcohol and caffeine',
          'Eat light, easily digestible foods',
          'Get adequate rest and avoid overexertion'
        ],
        severity: 'medium'
      },
      confidence: 90,
      urgency: 'Monitor temperature and seek medical attention if high or persistent'
    }
  },
  digestive: {
    'Abdominal pain': {
      possibleConditions: ['Indigestion', 'Gas', 'Constipation', 'Food intolerance', 'Gastritis'],
      recommendations: {
        homeRemedies: [
          'Apply heat pad or warm compress to abdomen',
          'Drink peppermint or ginger tea',
          'Practice gentle abdominal massage',
          'Try the BRAT diet (bananas, rice, applesauce, toast)',
          'Stay hydrated with clear fluids'
        ],
        overTheCounterMedicines: [
          'Antacids (Tums, Rolaids, Maalox)',
          'Simethicone for gas (Gas-X, Mylicon)',
          'Pepto-Bismol for stomach upset',
          'Probiotics for digestive health'
        ],
        whenToSeeDoctor: [
          'Severe or persistent abdominal pain',
          'Pain with fever, vomiting, or diarrhea',
          'Blood in stool or vomit',
          'Pain that worsens with movement',
          'Abdominal pain with chest pain'
        ],
        generalAdvice: [
          'Eat smaller, more frequent meals',
          'Avoid spicy, fatty, or acidic foods',
          'Manage stress and anxiety',
          'Keep a food diary to identify triggers'
        ],
        severity: 'medium'
      },
      confidence: 85,
      urgency: 'Seek medical attention if severe or persistent'
    }
  }
};

export class SymptomAnalysisService {
  static analyzeSymptoms(domain: string, symptoms: string[]): SymptomAnalysis {
    // Find the most relevant symptom analysis
    const domainData = SYMPTOM_DATABASE[domain];
    if (!domainData) {
      return this.getDefaultAnalysis();
    }

    // For now, analyze the first symptom (can be enhanced to analyze multiple)
    const primarySymptom = symptoms[0];
    const analysis = domainData[primarySymptom];
    
    if (analysis) {
      return analysis;
    }

    return this.getDefaultAnalysis();
  }

  static getDefaultAnalysis(): SymptomAnalysis {
    return {
      possibleConditions: ['General health concern'],
      recommendations: {
        homeRemedies: [
          'Get adequate rest and sleep',
          'Stay hydrated with water',
          'Eat a balanced diet',
          'Practice stress management techniques',
          'Maintain good hygiene'
        ],
        overTheCounterMedicines: [
          'Consult with pharmacist for appropriate OTC medications',
          'Consider multivitamins if diet is inadequate',
          'Pain relievers as needed (acetaminophen or ibuprofen)'
        ],
        whenToSeeDoctor: [
          'Symptoms persist for more than a few days',
          'Symptoms worsen or become severe',
          'New or unusual symptoms develop',
          'Concern about your health condition'
        ],
        generalAdvice: [
          'Monitor your symptoms closely',
          'Maintain a healthy lifestyle',
          'Keep track of symptom patterns',
          'Don\'t hesitate to seek medical advice when needed'
        ],
        severity: 'low'
      },
      confidence: 60,
      urgency: 'Monitor symptoms and consult healthcare provider if needed'
    };
  }

  static getDoctorRecommendations(location: { latitude: number; longitude: number }, symptoms: string[]): any[] {
    // Mock doctor data - in a real app, this would call a healthcare provider API
    const mockDoctors = [
      {
        id: '1',
        name: 'Dr. Sarah Johnson',
        specialty: 'General Practice',
        photo: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face',
        qualifications: ['MD', 'Family Medicine'],
        address: '123 Medical Center Dr, Suite 100',
        location: {
          latitude: location.latitude + 0.01,
          longitude: location.longitude + 0.01
        },
        phone: '(555) 123-4567',
        email: 'dr.johnson@example.com',
        rating: 4.8,
        reviews: 156,
        availability: {
          nextAvailable: new Date(Date.now() + 86400000),
          slots: ['9:00 AM', '2:30 PM', '4:00 PM']
        },
        distance: 1.2
      },
      {
        id: '2',
        name: 'Dr. Michael Chen',
        specialty: 'Internal Medicine',
        photo: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&crop=face',
        qualifications: ['MD', 'Internal Medicine'],
        address: '456 Health Plaza, Floor 2',
        location: {
          latitude: location.latitude - 0.015,
          longitude: location.longitude + 0.02
        },
        phone: '(555) 234-5678',
        email: 'dr.chen@example.com',
        rating: 4.6,
        reviews: 89,
        availability: {
          nextAvailable: new Date(Date.now() + 172800000),
          slots: ['10:30 AM', '3:00 PM']
        },
        distance: 2.1
      },
      {
        id: '3',
        name: 'Dr. Lisa Park',
        specialty: 'Emergency Medicine',
        photo: 'https://images.unsplash.com/photo-1594824388852-8a0a4b0b0b0b?w=150&h=150&fit=crop&crop=face',
        qualifications: ['MD', 'Emergency Medicine'],
        address: '789 Emergency Center',
        location: {
          latitude: location.latitude + 0.02,
          longitude: location.longitude - 0.01
        },
        phone: '(555) 345-6789',
        email: 'dr.park@example.com',
        rating: 4.9,
        reviews: 203,
        availability: {
          nextAvailable: new Date(Date.now() + 3600000),
          slots: ['Immediate', '24/7 Emergency']
        },
        distance: 3.5
      }
    ];

    return mockDoctors;
  }
}

