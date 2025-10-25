import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  ArrowLeft, 
  Bot, 
  User as UserIcon,
  Phone, 
  Mail, 
  X,
  Star,
  Map as MapPin,
  Calendar,
  Thermometer,
  Clock,
  AlertTriangle,
  CheckCircle,
  Heart,
  Brain,
  Settings
} from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { MnemosyneLogo } from './MnemosyneLogo';
import { LogoutButton } from './LogoutButton';
import { SettingsModal } from './SettingsModal';
import { LanguageTranslator } from './LanguageTranslator';
import { aiService } from '../services/aiService';

interface ChatInterfaceProps {
  mode: 'pre-diagnosis' | 'post-diagnosis';
  initialSymptoms?: string[];
  onBack?: () => void;
  username?: string | null;
  onLogout?: () => void;
}

interface ConversationStep {
  id: number;
  botMessage: string;
  userResponse?: string;
  options?: string[];
  inputType: 'text' | 'options' | 'location' | 'confirmation';
  data?: any;
}

interface PatientContext {
  chronicConditions: string[];
  medications: string[];
  medicalHistory: string[];
  age?: number;
  gender?: string;
}

interface SymptomAnalysis {
  primarySymptom: string;
  severity: number;
  duration: string;
  associatedSymptoms: string[];
  triggers: string[];
  confidence: number;
  urgencyLevel: 'low' | 'medium' | 'high' | 'emergency';
  preliminaryDiagnosis?: string;
}

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  photo?: string;
  qualifications: string[];
  address: string;
  location: {
    latitude: number;
    longitude: number;
  };
  phone: string;
  email: string;
  rating: number;
  reviews: number;
  availability?: {
    nextAvailable: Date;
    slots: string[];
  };
  distance?: number;
}

const SYMPTOM_DOMAINS = [
  { id: 'neuro', emoji: '🧠', name: 'Neurological / Mental Symptoms', 
    commonSymptoms: ['Headache', 'Dizziness', 'Memory Issues', 'Confusion', 'Numbness/Tingling'] },
  { id: 'cardio', emoji: '💓', name: 'Cardiovascular / Respiratory',
    commonSymptoms: ['Chest Pain', 'Shortness of Breath', 'Heart Palpitations', 'Persistent Cough'] },
  { id: 'systemic', emoji: '🤒', name: 'Systemic (Whole Body)',
    commonSymptoms: ['Fever', 'Fatigue', 'Body Aches', 'Night Sweats', 'Weight Changes'] },
  { id: 'digestive', emoji: '💩', name: 'Digestive System',
    commonSymptoms: ['Nausea', 'Stomach Pain', 'Diarrhea', 'Constipation', 'Loss of Appetite'] },
  { id: 'musculo', emoji: '💀', name: 'Musculoskeletal',
    commonSymptoms: ['Joint Pain', 'Muscle Pain', 'Back Pain', 'Stiffness', 'Limited Movement'] },
  { id: 'hormonal', emoji: '🧍‍♀️', name: 'Hormonal / Endocrine',
    commonSymptoms: ['Unusual Thirst', 'Temperature Sensitivity', 'Irregular Periods', 'Hair Loss'] },
  { id: 'immune', emoji: '🩸', name: 'Immune / Infection Related',
    commonSymptoms: ['Swollen Glands', 'Rash', 'Recurring Infections', 'Allergic Reactions'] },
  { id: 'emotional', emoji: '😔', name: 'Emotional / Psychological',
    commonSymptoms: ['Anxiety', 'Depression', 'Mood Changes', 'Sleep Issues', 'Stress'] },
  { id: 'other', emoji: '❓', name: 'Other Symptoms',
    commonSymptoms: [] }
];

const CONVERSATION_FLOW: ConversationStep[] = [
  {
    id: 1,
    botMessage: "Hello! I'm Mnemosyne, your AI Health Companion. I'm here to help you explore your symptoms and provide guidance. Please note that this is not a replacement for professional medical advice.\n\nWhat type of symptoms are you experiencing?",
    inputType: 'options',
    options: SYMPTOM_DOMAINS.map(domain => `${domain.emoji} ${domain.name}`)
  },
  {
    id: 2,
    botMessage: "Please select your primary symptom:",
    inputType: 'options',
    options: [] // Will be filled dynamically based on selected domain
  },
  {
    id: 3,
    botMessage: "How long have you been experiencing this symptom?",
    inputType: 'options',
    options: ['Less than 24 hours', '1-3 days', '4-7 days', 'More than a week', 'More than a month']
  },
  {
    id: 4,
    botMessage: "Thank you. A fever is a temperature of 100.4°F (38°C) or higher. Is your temperature greater than 100.4°F (38°C)?",
    inputType: 'options',
    options: ['Yes', 'No', 'I don\'t know']
  },
  {
    id: 5,
    botMessage: "Alright. Since when have you had this elevated temperature? (e.g., 1 day, 3 hours)",
    inputType: 'text'
  },
  {
    id: 6,
    botMessage: "I understand. Do you have any of the following additional symptoms?\n\n1. Sore Throat / Difficulty Swallowing\n2. Severe Pain (Headache, Abdominal Pain, Chest Pain)\n3. Significant Weakness or Dizziness",
    inputType: 'options',
    options: ['Sore Throat / Difficulty Swallowing', 'Severe Pain', 'Significant Weakness or Dizziness', 'None of these']
  },
  {
    id: 7,
    botMessage: "I see. Is the sore throat making it difficult to eat or drink fluids?",
    inputType: 'options',
    options: ['Yes', 'No']
  },
  {
    id: 8,
    botMessage: "Does the soreness seem to be caused by pain specifically in your throat/tonsils (pharyngitis/tonsillitis) or by small painful patches (ulcers) inside your mouth?\n\n1. Throat/Tonsil Pain\n2. Mouth Ulcers/Sores",
    inputType: 'options',
    options: ['Throat/Tonsil Pain', 'Mouth Ulcers/Sores']
  },
  {
    id: 9,
    botMessage: "Based on your symptoms, this strongly suggests an acute condition, such as Tonsillitis or Pharyngitis.\n\nI am 78% confident in this preliminary assessment.\n\nWould you like to explore next steps for managing this, including medication and local doctor recommendations?",
    inputType: 'options',
    options: ['Yes', 'No']
  },
  {
    id: 10,
    botMessage: "For pain and fever relief, over-the-counter analgesics are recommended: Acetaminophen (Tylenol) or Ibuprofen (Advil or Motrin). These reduce fever and can relieve sore throat pain.\n\nTo confirm the cause and get a prescription if needed, you should see a doctor.\n\nWould you like to use our GPS-based feature to find nearby clinics or GPs who can see you?",
    inputType: 'options',
    options: ['Yes', 'No']
  },
  {
    id: 11,
    botMessage: "I need your permission to access your device's location to find the closest doctors. Your location data will only be used to provide doctor recommendations and will not be stored permanently. Do you consent to share your real-time location?",
    inputType: 'location'
  },
  {
    id: 12,
    botMessage: "Here are the top 3 doctors/clinics within a 10 km radius, filtered for General Practice/ENT:\n\n1. Dr. Anya Sharma (Rating: 4.8⭐, 2.5 km away) [Book Appointment]\n2. City Urgent Care (Rating: 4.5⭐, 4.1 km away) [Call]\n3. Dr. Ben Carter (Rating: 4.6⭐, 8.9 km away) [Details]\n\nRemember to call ahead.",
    inputType: 'confirmation'
  }
];

export function MnemosyneChatbot({ mode, initialSymptoms = [], onBack, username, onLogout }: ChatInterfaceProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [patientContext, setPatientContext] = useState<PatientContext>({
    chronicConditions: [],
    medications: [],
    medicalHistory: []
  });
  const [symptomAnalysis, setSymptomAnalysis] = useState<SymptomAnalysis | null>(null);
  const [nearbyDoctors, setNearbyDoctors] = useState<Doctor[]>([]);
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [conversationHistory, setConversationHistory] = useState<ConversationStep[]>([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [showDoctorsList, setShowDoctorsList] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isGPT4Enabled, setIsGPT4Enabled] = useState(false);
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize conversation and check GPT-4 availability
  useEffect(() => {
    const initConversation = async () => {
      if (mode === 'pre-diagnosis') {
        setCurrentStep(0);
        const initialMessage = CONVERSATION_FLOW[0];
        setConversationHistory([initialMessage]);
        
        // If there are initial symptoms, analyze them right away
        if (initialSymptoms.length > 0) {
          try {
            setIsGeneratingResponse(true);
            
            // Get detailed analysis from GPT-4
            const symptomAnalysis = await aiService.analyzeSymptoms(
              initialSymptoms.join(", "),
              patientContext
            );

            // Check if there was an error during analysis
            if (symptomAnalysis.error) {
              setConversationHistory(prev => [
                ...prev,
                {
                  id: Date.now(),
                  botMessage: symptomAnalysis.error,
                  inputType: 'text'
                }
              ]);
              return;
            }
            
            const botResponse = `Based on the symptoms you've described (${initialSymptoms.join(", ")}), here's my analysis:

Assessment: ${symptomAnalysis.assessment}

Urgency Level: ${symptomAnalysis.urgencyLevel.toUpperCase()}

Recommendations:
${symptomAnalysis.recommendations.map(rec => `• ${rec}`).join("\n")}

Confidence Level: ${symptomAnalysis.confidence}%

Would you like me to:
1. Explain any of these recommendations in more detail
2. Find healthcare providers in your area
3. Provide self-care tips
4. Ask me additional questions about your symptoms

Please let me know how I can help further.`;

            setConversationHistory(prev => [
              ...prev,
              {
                id: Date.now(),
                botMessage: botResponse,
                inputType: 'text'
              }
            ]);
            
            setSymptomAnalysis({
              primarySymptom: initialSymptoms[0],
              severity: 5, // Default to medium severity
              duration: "unspecified",
              associatedSymptoms: initialSymptoms.slice(1),
              triggers: [],
              confidence: symptomAnalysis.confidence,
              urgencyLevel: symptomAnalysis.urgencyLevel
            });
          } catch (error) {
            console.error('Error analyzing symptoms:', error);
            setConversationHistory(prev => [
              ...prev,
              {
                id: Date.now(),
                botMessage: error instanceof Error 
                  ? error.message 
                  : "I apologize, but I encountered an error while analyzing your symptoms. Please ensure you have set up your API key correctly in the settings.",
                inputType: 'text'
              }
            ]);
          } finally {
            setIsGeneratingResponse(false);
          }
        }
      }
      
      // Check if API key is available and valid
      const apiKey = localStorage.getItem('openai_api_key');
      if (apiKey) {
        aiService.setApiKey(apiKey);
        // Test the API key with a simple request
        try {
          await aiService.generateResponse(
            "test",
            [],
            { chronicConditions: [], medications: [], medicalHistory: [] },
            null
          );
          setIsGPT4Enabled(true);
        } catch (error) {
          console.error('API key validation error:', error);
          setIsGPT4Enabled(false);
          localStorage.removeItem('openai_api_key'); // Clear invalid API key
        }
      } else {
        setIsGPT4Enabled(false);
      }
    };

    initConversation();
  }, [mode, initialSymptoms, patientContext]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationHistory]);

  // Get user's location
  const getUserLocation = useCallback(async (): Promise<{latitude: number, longitude: number}> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      // Check if we're on HTTPS or localhost
      const isSecureContext = window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (!isSecureContext) {
        reject(new Error('Location access requires HTTPS or localhost. Please use HTTPS or run locally.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setUserLocation(location);
          resolve(location);
        },
        (error) => {
          console.error('Geolocation error:', error);
          let errorMessage = 'Unable to access your location. ';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += 'Location access was denied. Please allow location access in your browser settings.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += 'Location information is unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage += 'Location request timed out.';
              break;
            default:
              errorMessage += 'An unknown error occurred.';
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }, []);

  // Find nearby doctors
  const findNearbyDoctors = useCallback(async (location: {latitude: number, longitude: number}) => {
    setIsLoadingDoctors(true);
    try {
      // Mock doctor data - in production, this would integrate with a real API
      const mockDoctors: Doctor[] = [
        {
          id: '1',
          name: 'Dr. Anya Sharma',
          specialty: 'General Practice',
          qualifications: ['MD', 'MBBS'],
          address: '123 Medical Center Dr, City',
          location: {
            latitude: location.latitude + 0.01,
            longitude: location.longitude + 0.01
          },
          phone: '(555) 123-4567',
          email: 'dr.sharma@example.com',
          rating: 4.8,
          reviews: 156,
          availability: {
            nextAvailable: new Date(Date.now() + 86400000),
            slots: ['9:00 AM', '2:30 PM']
          }
        },
        {
          id: '2',
          name: 'City Urgent Care',
          specialty: 'Urgent Care',
          qualifications: ['Emergency Medicine'],
          address: '456 Emergency St, City',
          location: {
            latitude: location.latitude + 0.02,
            longitude: location.longitude - 0.01
          },
          phone: '(555) 987-6543',
          email: 'urgent@citycare.com',
          rating: 4.5,
          reviews: 89,
          availability: {
            nextAvailable: new Date(),
            slots: ['24/7 Available']
          }
        },
        {
          id: '3',
          name: 'Dr. Ben Carter',
          specialty: 'ENT Specialist',
          qualifications: ['MD', 'ENT'],
          address: '789 Specialist Ave, City',
          location: {
            latitude: location.latitude - 0.02,
            longitude: location.longitude + 0.02
          },
          phone: '(555) 456-7890',
          email: 'dr.carter@example.com',
          rating: 4.6,
          reviews: 203,
          availability: {
            nextAvailable: new Date(Date.now() + 172800000),
            slots: ['10:00 AM', '3:00 PM']
          }
        }
      ];

      // Calculate distances
      const doctorsWithDistance = mockDoctors.map(doctor => ({
        ...doctor,
        distance: calculateDistance(
          location.latitude,
          location.longitude,
          doctor.location.latitude,
          doctor.location.longitude
        )
      }));

      setNearbyDoctors(doctorsWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0)));
      setShowDoctorsList(true);
    } catch (error) {
      console.error('Error finding doctors:', error);
    } finally {
      setIsLoadingDoctors(false);
    }
  }, []);

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  };

  // Parse chronic conditions and medications from user input
  const parseChronicConditions = (input: string): Partial<PatientContext> => {
    const conditions: string[] = [];
    const medications: string[] = [];
    
    // Common chronic conditions
    const conditionKeywords = [
      'diabetes', 'asthma', 'heart disease', 'hypertension', 'high blood pressure',
      'copd', 'arthritis', 'depression', 'anxiety', 'thyroid', 'kidney disease',
      'liver disease', 'cancer', 'stroke', 'epilepsy', 'migraine', 'fibromyalgia',
      'crohn', 'colitis', 'lupus', 'multiple sclerosis', 'parkinson'
    ];
    
    // Common medications
    const medicationKeywords = [
      'metformin', 'insulin', 'lisinopril', 'amlodipine', 'atorvastatin',
      'metoprolol', 'omeprazole', 'levothyroxine', 'sertraline', 'bupropion',
      'prednisone', 'warfarin', 'aspirin', 'ibuprofen', 'acetaminophen'
    ];
    
    const lowerInput = input.toLowerCase();
    
    // Extract conditions
    conditionKeywords.forEach(keyword => {
      if (lowerInput.includes(keyword)) {
        conditions.push(keyword);
      }
    });
    
    // Extract medications
    medicationKeywords.forEach(keyword => {
      if (lowerInput.includes(keyword)) {
        medications.push(keyword);
      }
    });
    
    return {
      chronicConditions: conditions,
      medications: medications
    };
  };

  // Adjust symptom analysis based on chronic conditions
  const adjustAnalysisForChronicConditions = (
    analysis: SymptomAnalysis,
    context: PatientContext
  ): SymptomAnalysis => {
    let adjustedAnalysis = { ...analysis };
    
    // Adjust urgency and confidence based on chronic conditions
    if (context.chronicConditions.length > 0) {
      // Increase confidence when we have medical context
      adjustedAnalysis.confidence = Math.min(analysis.confidence + 15, 95);
      
      // Check for condition-specific concerns
      const conditions = context.chronicConditions.map(c => c.toLowerCase());
      
      if (conditions.some(c => c.includes('diabetes'))) {
        // Diabetes increases risk for infections
        if (analysis.primarySymptom.includes('fever') || analysis.primarySymptom.includes('infection')) {
          adjustedAnalysis.urgencyLevel = 'high';
          adjustedAnalysis.confidence = Math.min(analysis.confidence + 25, 95);
        }
      }
      
      if (conditions.some(c => c.includes('asthma'))) {
        // Asthma increases risk for respiratory complications
        if (analysis.primarySymptom.includes('cough') || analysis.primarySymptom.includes('breathing')) {
          adjustedAnalysis.urgencyLevel = 'high';
          adjustedAnalysis.confidence = Math.min(analysis.confidence + 20, 95);
        }
      }
      
      if (conditions.some(c => c.includes('heart'))) {
        // Heart conditions increase risk for cardiac events
        if (analysis.primarySymptom.includes('chest') || analysis.primarySymptom.includes('pain')) {
          adjustedAnalysis.urgencyLevel = 'emergency';
          adjustedAnalysis.confidence = Math.min(analysis.confidence + 30, 95);
        }
      }
      
      // Adjust for medication interactions
      if (context.medications.length > 0) {
        adjustedAnalysis.confidence = Math.min(analysis.confidence + 10, 95);
      }
    }
    
    return adjustedAnalysis;
  };

  // Generate GPT-4 enhanced response
  const generateGPT4Response = async (userInput: string): Promise<string> => {
    if (!isGPT4Enabled) {
      return "GPT-4 integration is not enabled. Please add your OpenAI API key in settings for more intelligent responses.";
    }

    try {
      setIsGeneratingResponse(true);
      const gptResponse = await aiService.generateResponse(
        userInput,
        conversationHistory.map(step => ({
          botMessage: step.botMessage,
          userResponse: step.userResponse
        })),
        patientContext,
        symptomAnalysis
      );
      return gptResponse;
    } catch (error) {
      console.error('GPT-4 Error:', error);
      return `I apologize, but I encountered an error with the AI service: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again or check your API key settings.`;
    } finally {
      setIsGeneratingResponse(false);
    }
  };

  // Handle user response
  const handleUserResponse = async (response: string) => {
    const currentStepData = CONVERSATION_FLOW[currentStep];
    const updatedHistory = [...conversationHistory];
    
    // Add user response to current step
    updatedHistory[currentStep] = {
      ...currentStepData,
      userResponse: response
    };

    // If user selects a symptom domain
    if (currentStep === 0) {
      const selectedDomain = SYMPTOM_DOMAINS.find(
        domain => `${domain.emoji} ${domain.name}` === response
      );
      
      if (selectedDomain) {
        if (selectedDomain.id === 'other') {
          // Skip to doctor recommendations for 'other' category
          setCurrentStep(10);
          updatedHistory.push({
            ...CONVERSATION_FLOW[10],
            botMessage: "I understand you have symptoms that might need direct medical attention. Would you like to find nearby healthcare providers?"
          });
        } else {
          // Update next step with domain-specific symptoms
          setCurrentStep(1);
          const nextStep = {
            ...CONVERSATION_FLOW[1],
            options: selectedDomain.commonSymptoms
          };
          updatedHistory.push(nextStep);
        }
      }
    }

    // Update conversation history
    setConversationHistory(updatedHistory);

    // Process response based on step
    if (currentStep === 0) {
      // Initial mode selection
      if (response === 'I\'m Not Feeling Well') {
        setCurrentStep(1);
        updatedHistory.push(CONVERSATION_FLOW[1]);
      } else if (response === 'I Need Follow-Up Advice') {
        // Handle post-diagnosis flow
        setCurrentStep(1);
        updatedHistory.push({
          ...CONVERSATION_FLOW[1],
          botMessage: "I understand you're seeking follow-up advice. Please describe your current diagnosis or condition, and what specific guidance you're looking for."
        });
      } else {
        // Help/FAQ flow
        setCurrentStep(1);
        updatedHistory.push({
          ...CONVERSATION_FLOW[1],
          botMessage: "I'm here to help! Here are some frequently asked questions:\n\n• How does Mnemosyne work?\n• Is my data secure?\n• When should I seek emergency care?\n• How accurate are the assessments?\n\nWhat would you like to know more about?"
        });
      }
    } else if (currentStep === 1) {
      // Chronic illness awareness step
      const contextUpdate = parseChronicConditions(response);
      setPatientContext(prev => ({
        ...prev,
        ...contextUpdate
      }));
      setCurrentStep(2);
      updatedHistory.push(CONVERSATION_FLOW[2]);
    } else if (currentStep === 2) {
      // Primary symptom description
      const analysis: SymptomAnalysis = {
        primarySymptom: response.toLowerCase(),
        severity: 5, // Default moderate
        duration: 'unspecified',
        associatedSymptoms: [],
        triggers: [],
        confidence: 20,
        urgencyLevel: 'low',
        preliminaryDiagnosis: 'Under evaluation'
      };
      
      // Apply contextual awareness based on chronic conditions
      const contextualAnalysis = adjustAnalysisForChronicConditions(analysis, patientContext);
      setSymptomAnalysis(contextualAnalysis);
      setCurrentStep(3);
      updatedHistory.push(CONVERSATION_FLOW[3]);
    } else if (currentStep === 3) {
      // Fever confirmation
      if (response === 'Yes') {
        setCurrentStep(4);
        updatedHistory.push(CONVERSATION_FLOW[4]);
      } else {
        // Skip fever-specific questions
        setCurrentStep(5);
        updatedHistory.push({
          ...CONVERSATION_FLOW[5],
          botMessage: "I understand. Let me ask about the duration of your symptoms. How long have you been experiencing these symptoms?"
        });
      }
    } else if (currentStep === 4) {
      // Duration question
      if (symptomAnalysis) {
        const updatedAnalysis = {
          ...symptomAnalysis,
          duration: response,
          confidence: symptomAnalysis.confidence + 20
        };
        setSymptomAnalysis(updatedAnalysis);
      }
      setCurrentStep(5);
      updatedHistory.push(CONVERSATION_FLOW[5]);
    } else if (currentStep === 5) {
      // Additional symptoms
      if (response.includes('Sore Throat') || response.includes('Difficulty Swallowing')) {
        setCurrentStep(6);
        updatedHistory.push(CONVERSATION_FLOW[6]);
      } else if (response.includes('Severe Pain')) {
        // High urgency path
        if (symptomAnalysis) {
          const updatedAnalysis = {
            ...symptomAnalysis,
            urgencyLevel: 'high' as const,
            confidence: symptomAnalysis.confidence + 30
          };
          setSymptomAnalysis(updatedAnalysis);
        }
        setCurrentStep(9);
        updatedHistory.push({
          ...CONVERSATION_FLOW[9],
          botMessage: "⚠️ Severe pain is a concerning symptom that requires prompt medical attention. Based on your symptoms, I recommend seeking urgent care immediately.\n\nWould you like me to help you find nearby urgent care facilities?"
        });
      } else {
        setCurrentStep(9);
        updatedHistory.push(CONVERSATION_FLOW[9]);
      }
    } else if (currentStep === 6) {
      // Difficulty swallowing
      if (response === 'Yes') {
        setCurrentStep(7);
        updatedHistory.push(CONVERSATION_FLOW[7]);
      } else {
        setCurrentStep(9);
        updatedHistory.push(CONVERSATION_FLOW[9]);
      }
    } else if (currentStep === 7) {
      // Throat vs mouth pain
      setCurrentStep(8);
      updatedHistory.push(CONVERSATION_FLOW[8]);
    } else if (currentStep === 8) {
      // Preliminary assessment
      if (symptomAnalysis) {
        const updatedAnalysis = {
          ...symptomAnalysis,
          preliminaryDiagnosis: response === 'Throat/Tonsil Pain' ? 'Tonsillitis/Pharyngitis' : 'Oral Ulcers',
          confidence: 78,
          urgencyLevel: 'medium' as const
        };
        setSymptomAnalysis(updatedAnalysis);
        
        // Create dynamic assessment message with actual duration
        const durationText = updatedAnalysis.duration !== 'unspecified' ? ` for ${updatedAnalysis.duration}` : '';
        const assessmentMessage = `Based on your symptoms (Fever${durationText}, difficulty swallowing, throat/tonsil pain), this strongly suggests an acute condition, such as Tonsillitis or Pharyngitis.\n\nI am 78% confident in this preliminary assessment.\n\nWould you like to explore next steps for managing this, including medication and local doctor recommendations?`;
        
        setCurrentStep(9);
        updatedHistory.push({
          ...CONVERSATION_FLOW[9],
          botMessage: assessmentMessage
        });
      } else {
        setCurrentStep(9);
        updatedHistory.push(CONVERSATION_FLOW[9]);
      }
    } else if (currentStep === 9) {
      // Next steps
      if (response === 'Yes') {
        setCurrentStep(10);
        updatedHistory.push(CONVERSATION_FLOW[10]);
      } else {
        // End conversation
        setCurrentStep(12);
        updatedHistory.push({
          ...CONVERSATION_FLOW[12],
          botMessage: "Thank you for using Mnemosyne. Remember to monitor your symptoms and seek medical attention if they worsen. Take care!"
        });
      }
    } else if (currentStep === 10) {
      // GPS permission
      if (response === 'Yes') {
        setCurrentStep(11);
        updatedHistory.push(CONVERSATION_FLOW[11]);
      } else {
        setCurrentStep(12);
        updatedHistory.push({
          ...CONVERSATION_FLOW[12],
          botMessage: "No problem! You can always search for doctors manually. Take care and feel better soon!"
        });
      }
    } else if (currentStep === 11) {
      // Location access
      try {
        const location = await getUserLocation();
        await findNearbyDoctors(location);
        setCurrentStep(12);
        updatedHistory.push(CONVERSATION_FLOW[12]);
      } catch (error) {
        setCurrentStep(12);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        updatedHistory.push({
          ...CONVERSATION_FLOW[12],
          botMessage: `I couldn't access your location: ${errorMessage}\n\nYou can search for doctors manually using online directories or try again later. Take care!`
        });
      }
    }

    setConversationHistory(updatedHistory);
  };

  const DoctorCard = ({ doctor }: { doctor: Doctor }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg p-4 shadow-md border border-teal-100 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 bg-teal-100 rounded-full flex-shrink-0 overflow-hidden">
          {doctor.photo ? (
            <img src={doctor.photo} alt={doctor.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-teal-500">
              <UserIcon className="w-8 h-8" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-teal-900">{doctor.name}</h3>
          <p className="text-sm text-teal-600">{doctor.specialty}</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center text-yellow-500">
              {'★'.repeat(Math.floor(doctor.rating))}
              {'☆'.repeat(5 - Math.floor(doctor.rating))}
            </div>
            <span className="text-sm text-teal-600">({doctor.reviews} reviews)</span>
          </div>
          <p className="text-sm text-teal-600 mt-1">{doctor.address}</p>
          <p className="text-sm text-teal-600">
            {doctor.distance ? `${doctor.distance.toFixed(1)} km away` : 'Distance unknown'}
          </p>
          {doctor.availability && (
            <p className="text-sm text-teal-600 mt-1">
              Next available: {doctor.availability.nextAvailable.toLocaleDateString()}
            </p>
          )}
          <div className="flex gap-2 mt-2">
            <Button size="sm" variant="outline" onClick={() => window.location.href = `tel:${doctor.phone}`}>
              <Phone className="w-4 h-4 mr-1" />
              Call
            </Button>
            <Button size="sm" variant="outline" onClick={() => window.location.href = `mailto:${doctor.email}`}>
              <Mail className="w-4 h-4 mr-1" />
              Email
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex flex-col">
      <div className="bg-white/80 backdrop-blur-sm border-b border-teal-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {onBack && (
                  <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-teal-700 hover:text-teal-900 transition-colors body-regular"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Back
                  </button>
                )}
                <h1 className="text-teal-900 body-medium">AI Health Companion</h1>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10">
                  <MnemosyneLogo />
                </div>
                {symptomAnalysis && (
                  <div className="flex items-center gap-2">
                    <div 
                      className={`h-2 w-2 rounded-full ${
                        symptomAnalysis.urgencyLevel === 'emergency' ? 'bg-red-500' :
                        symptomAnalysis.urgencyLevel === 'high' ? 'bg-orange-500' :
                        symptomAnalysis.urgencyLevel === 'medium' ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`} 
                    />
                    <p className="text-teal-600 text-sm body-regular">
                      Risk Level: {symptomAnalysis.urgencyLevel.toUpperCase()} 
                      (Confidence: {Math.round(symptomAnalysis.confidence)}%)
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(true)}
                className="flex items-center gap-2 text-teal-700 hover:text-teal-900"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </Button>
              {onLogout && (
                <LogoutButton 
                  onLogout={onLogout}
                  username={username || undefined}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="bg-teal-50/80 border-b border-teal-200/50 px-6 py-3">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <p className="text-teal-800 text-sm body-regular">
              ⚠️ Medical Disclaimer: I'm an AI assistant designed to help understand your symptoms and guide you to appropriate care. 
              I don't make diagnoses or replace professional medical advice. If you're experiencing severe symptoms, please seek immediate medical attention.
            </p>
            {isGPT4Enabled && (
              <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs">
                <Brain className="w-3 h-3" />
                <span>GPT-4 Enhanced</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Doctor Recommendations */}
      {showDoctorsList && (
        <div className="bg-white/80 border-b border-teal-100 px-6 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-teal-900">Recommended Healthcare Providers</h2>
            </div>
            {isLoadingDoctors ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex gap-2">
                  <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {nearbyDoctors.map(doctor => (
                  <DoctorCard key={doctor.id} doctor={doctor} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Conversation */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <AnimatePresence>
            {conversationHistory.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {/* Bot Message */}
                <div className="flex gap-4 justify-start">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="max-w-2xl px-6 py-4 rounded-2xl bg-white/80 backdrop-blur-sm text-teal-900 border border-teal-100 shadow-sm">
                    <p className="body-regular whitespace-pre-line">{step.botMessage}</p>
                    <LanguageTranslator text={step.botMessage} className="mt-4" />
                  </div>
                </div>

                {/* User Response */}
                {step.userResponse && (
                  <div className="flex gap-4 justify-end">
                    <div className="max-w-2xl px-6 py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white">
                      <p className="body-regular">{step.userResponse}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-teal-200 flex items-center justify-center flex-shrink-0">
                      <UserIcon className="w-5 h-5 text-teal-700" />
                    </div>
                  </div>
                )}

                {/* Current Step Input */}
                {index === conversationHistory.length - 1 && !step.userResponse && (
                  <div className="mt-4">
                    {step.inputType === 'options' && step.options && (
                      <div className="space-y-2">
                        {step.options.map((option, optionIndex) => (
                          <Button
                            key={optionIndex}
                            variant="outline"
                            className="w-full justify-start text-left"
                            onClick={() => handleUserResponse(option)}
                          >
                            {option}
                          </Button>
                        ))}
                      </div>
                    )}
                    {step.inputType === 'text' && (
                      <div className="space-y-3">
                        <div className="flex gap-3">
                          <Textarea
                            placeholder={isGPT4Enabled ? "Type your response here... (GPT-4 Enhanced)" : "Type your response here..."}
                            className="flex-1 resize-none bg-white border-teal-200 focus:border-teal-400 focus:ring-teal-400 body-regular min-h-[60px] max-h-[120px]"
                            onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                const target = e.currentTarget;
                                if (target.value.trim()) {
                                  handleUserResponse(target.value.trim());
                                  target.value = '';
                                }
                              }
                            }}
                          />
                          <Button
                            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                              const textarea = (e.currentTarget as HTMLElement).parentElement?.querySelector('textarea') as HTMLTextAreaElement;
                              if (textarea?.value.trim()) {
                                handleUserResponse(textarea.value.trim());
                                textarea.value = '';
                              }
                            }}
                            disabled={isGeneratingResponse}
                            className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white rounded-xl px-6 shadow-lg shadow-teal-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/40 disabled:opacity-50"
                          >
                            {isGeneratingResponse ? (
                              <div className="flex gap-1">
                                <span className="w-2 h-2 bg-white rounded-full animate-bounce" />
                                <span className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:0.2s]" />
                                <span className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:0.4s]" />
                              </div>
                            ) : (
                              <Send className="w-5 h-5" />
                            )}
                          </Button>
                        </div>
                        {isGPT4Enabled && (
                          <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                            <Brain className="w-3 h-3" />
                            <span>GPT-4 is analyzing your response for more intelligent guidance</span>
                          </div>
                        )}
                      </div>
                    )}
                    {step.inputType === 'location' && (
                      <div className="space-y-2">
                        <Button
                          onClick={() => handleUserResponse('Yes')}
                          className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
                        >
                          <MapPin className="w-4 h-4 mr-2" />
                          Allow Location Access
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleUserResponse('No')}
                          className="w-full"
                        >
                          No, I prefer not to share my location
                        </Button>
                      </div>
                    )}
                    {step.inputType === 'confirmation' && (
                      <div className="text-center">
                        <p className="text-teal-700 body-regular mb-4">
                          Thank you for using Mnemosyne! Remember to call ahead before visiting any doctor.
                        </p>
                        <Button
                          onClick={() => {
                            setCurrentStep(0);
                            setConversationHistory([CONVERSATION_FLOW[0]]);
                            setSymptomAnalysis(null);
                            setShowDoctorsList(false);
                          }}
                          variant="outline"
                        >
                          Start New Assessment
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Settings Modal */}
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => {
          setShowSettings(false);
          // Refresh GPT-4 status after closing settings
          const apiKey = localStorage.getItem('openai_api_key');
          setIsGPT4Enabled(!!apiKey);
        }} 
      />
    </div>
  );
}
