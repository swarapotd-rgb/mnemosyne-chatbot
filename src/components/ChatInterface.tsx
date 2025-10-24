import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  ArrowLeft, 
  Bot, 
  User as UserIcon, 
  Mic, 
  Camera, 
  Phone, 
  Mail, 
  X,
  Star,
  MapPin,
  Calendar
} from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { MnemosyneLogo } from './MnemosyneLogo';
import { LogoutButton } from './LogoutButton';
import { LanguageTranslator } from './LanguageTranslator';
import { GeolocationPermission } from './GeolocationPermission';
import { googleMapsService } from '../services/googleMapsService';
import { gpt4Service } from '../services/gpt4Service';

type ChatMode = 'pre-diagnosis' | 'post-diagnosis';

interface SymptomData {
  severity: number;
  duration: string;
  frequency: string;
  triggers: string[];
  associatedSymptoms: string[];
}

interface RiskAssessment {
  score: number;
  confidence: number;
  urgencyLevel: 'low' | 'medium' | 'high' | 'emergency';
  recommendedAction: string;
}

interface DoctorLocation {
  latitude: number;
  longitude: number;
}

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  photo?: string;
  qualifications: string[];
  address: string;
  location: DoctorLocation;
  phone: string;
  email: string;
  rating: number;
  reviews: number;
  availability?: {
    nextAvailable: Date;
    slots: string[];
  };
  distance?: number; // calculated based on user location
}

interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: {
    type: 'image' | 'audio';
    url: string;
  }[];
  symptomData?: SymptomData;
  riskAssessment?: RiskAssessment;
  followUpQuestions?: string[];
  confidenceScore?: number;
}

interface ChatInterfaceProps {
  mode: ChatMode;
  onBack?: () => void;
  username?: string | null;
  onLogout?: () => void;
}

const CHAT_PERSONALITIES = {
  'pre-diagnosis': {
    title: 'Pre-Diagnosis Assessment',
    greeting: "Hello! I'm your AI health companion, here to help understand your health concerns with care and attention. I'll consider your full health history and ongoing conditions to provide better insights. You can describe your symptoms, share images of visible symptoms, or even use voice input. Please know that everything you share is confidential. Shall we begin by discussing what's concerning you?",
    placeholder: 'Describe your symptoms, or click the microphone/camera icons...',
    tone: 'empathetic',
    disclaimer: `⚠️ Medical Disclaimer: I'm an AI assistant designed to help understand your symptoms and guide you to appropriate care. I don't make diagnoses or replace professional medical advice. 

If you're experiencing severe symptoms like chest pain, difficulty breathing, or other emergency conditions, please seek immediate medical attention.

Your privacy matters: All information is encrypted and handled according to HIPAA standards.`,
    safetyPrompts: [
      "If your symptoms are severe or rapidly worsening, don't hesitate to seek emergency care.",
      "I notice this could be serious - have you considered calling your doctor or visiting urgent care?",
      "Given what you've described, it would be best to have this evaluated by a healthcare provider soon."
    ],
  },
  'post-diagnosis': {
    title: 'Second Opinion Consultation',
    greeting: "Welcome back. I'm here to review your existing diagnosis and treatment plan with you. Let's revisit your medical journey together. What diagnosis have you received, and what are your main concerns?",
    placeholder: 'Share your diagnosis and concerns...',
    tone: 'consultative',
    disclaimer: '📋 This consultation helps organize your medical information for a second opinion. Always discuss findings with your healthcare team.',
    safetyPrompts: [],
  },
};

const generateUniqueId = (() => {
  let counter = 0;
  return (prefix: string = '') => `${prefix}-${Date.now()}-${counter++}`;
})();

export function ChatInterface({ mode, onBack, username, onLogout }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentRiskAssessment, setCurrentRiskAssessment] = useState<RiskAssessment | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [nearbyDoctors, setNearbyDoctors] = useState<Doctor[]>([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [showDoctorsList, setShowDoctorsList] = useState(false);
  const [patientContext, setPatientContext] = useState({
    chronicConditions: [] as string[],
    medications: [] as string[],
    medicalHistory: [] as string[],
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const personality = CHAT_PERSONALITIES[mode];

  // Get user's location
  const getUserLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by your browser');
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        });
      });

      setUserLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      });
    } catch (error) {
      console.error('Error getting location:', error);
    }
  }, []);

  // Find nearby doctors using Google Maps API
  const findNearbyDoctors = useCallback(async (symptoms: SymptomData, urgencyLevel: string) => {
    if (!userLocation) {
      await getUserLocation();
    }

    if (!userLocation) {
      alert('Location is required to find nearby doctors. Please enable location access.');
      return;
    }

    setIsLoadingDoctors(true);
    try {
      // Determine specialty based on symptoms
      const specialty = getSpecialtyFromSymptoms(symptoms);
      
      // Use Google Maps service to find nearby doctors
      const doctors = await googleMapsService.findNearbyDoctors(
        userLocation.latitude,
        userLocation.longitude,
        10000, // 10km radius
        specialty
      );

      setNearbyDoctors(doctors);
      setShowDoctorsList(true);
    } catch (error) {
      console.error('Error finding doctors:', error);
      alert('Unable to find nearby doctors. Please check your internet connection and try again.');
    } finally {
      setIsLoadingDoctors(false);
    }
  }, [userLocation, getUserLocation]);

  // Determine specialty based on symptoms
  const getSpecialtyFromSymptoms = (symptoms: SymptomData): string => {
    // This is a simplified mapping - in a real app, you'd use AI to determine the best specialty
    if (symptoms.associatedSymptoms.some(s => s.toLowerCase().includes('heart') || s.toLowerCase().includes('chest'))) {
      return 'cardiologist';
    } else if (symptoms.associatedSymptoms.some(s => s.toLowerCase().includes('skin') || s.toLowerCase().includes('rash'))) {
      return 'dermatologist';
    } else if (symptoms.associatedSymptoms.some(s => s.toLowerCase().includes('child') || s.toLowerCase().includes('pediatric'))) {
      return 'pediatrician';
    }
    return 'doctor'; // General practice
  };

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

  useEffect(() => {
    // Add initial greeting message
    setMessages([
      {
        id: generateUniqueId('greeting'),
        role: 'assistant',
        content: personality.greeting,
        timestamp: new Date(),
      },
    ]);
  }, [mode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const extractSymptomInfo = (text: string) => {
    const durationMatches = text.match(/(\d+)\s*(day|days|week|weeks|month|months|year|years)/gi) || [];
    const frequencyMatches = text.match(/(daily|weekly|monthly|constant|sometimes|occasionally|frequently|rarely)/gi) || [];
    const severityMatches = text.match(/(mild|moderate|severe|intense|unbearable|slight)/gi) || [];
    const triggersMatches = text.match(/(triggered by|worse with|after|during) ([^,.;]+)/gi) || [];
    
    return {
      hasDuration: durationMatches.length > 0,
      hasFrequency: frequencyMatches.length > 0,
      hasSeverity: severityMatches.length > 0,
      hasTriggers: triggersMatches.length > 0,
    };
  };

  const analyzeSymptoms = useCallback((message: string, previousMessages: Message[]): SymptomData => {
    const info = extractSymptomInfo(message);
    const prevResponses = previousMessages.filter(m => m.role === 'user').length;
    
    // Calculate severity based on keywords and context
    const severityKeywords = {
      unbearable: 9, severe: 8, intense: 7, moderate: 5, mild: 3, slight: 2
    };
    let severity = 5; // default moderate
    Object.entries(severityKeywords).forEach(([keyword, value]) => {
      if (message.toLowerCase().includes(keyword)) {
        severity = value;
      }
    });

    // Emergency keywords increase severity
    const emergencyKeywords = ['chest pain', 'difficulty breathing', 'unconscious', 'severe bleeding'];
    emergencyKeywords.forEach(keyword => {
      if (message.toLowerCase().includes(keyword)) {
        severity = 10;
      }
    });

    return {
      severity,
      duration: extractDuration(message),
      frequency: extractFrequency(message),
      triggers: extractTriggers(message),
      associatedSymptoms: extractAssociatedSymptoms(message)
    };
  }, []);

  const calculateRiskAssessment = useCallback((
    symptoms: SymptomData,
    context: typeof patientContext,
    message: string,
    previousMessages: Message[]
  ): RiskAssessment => {
    const info = extractSymptomInfo(message);
    const messageCount = previousMessages.filter(m => m.role === 'user').length;
    
    // Base confidence on amount of information provided
    let confidence = 20; // start with base confidence
    if (info.hasDuration) confidence += 20;
    if (info.hasFrequency) confidence += 20;
    if (info.hasSeverity) confidence += 20;
    if (info.hasTriggers) confidence += 20;

    // Adjust for conversation context
    confidence = Math.min(confidence + (messageCount * 5), 95); // Cap at 95%

    // Calculate risk score
    const score = Math.min(
      symptoms.severity * 10 + 
      (context.chronicConditions.length * 5) + 
      (context.medications.length * 5),
      100
    );

    return {
      score,
      confidence,
      urgencyLevel: score > 80 ? 'emergency' : score > 60 ? 'high' : score > 40 ? 'medium' : 'low',
      recommendedAction: getRecommendedAction(score, symptoms)
    };
  }, []);

  const extractDuration = (text: string): string => {
    const match = text.match(/(\d+)\s*(day|days|week|weeks|month|months|year|years)/i);
    return match ? match[0] : "unspecified";
  };

  const extractFrequency = (text: string): string => {
    const frequencies = [
      'constant', 'daily', 'weekly', 'monthly', 'sometimes', 
      'occasionally', 'frequently', 'rarely', 'intermittent'
    ];
    for (const freq of frequencies) {
      if (text.toLowerCase().includes(freq)) {
        return freq;
      }
    }
    return "unspecified";
  };

  const extractTriggers = (text: string): string[] => {
    const triggers: string[] = [];
    const triggerPatterns = [
      /triggered by ([^,.;]+)/gi,
      /worse with ([^,.;]+)/gi,
      /worsens? (?:with|during|after) ([^,.;]+)/gi
    ];

    triggerPatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) triggers.push(match[1].trim());
      }
    });

    return triggers;
  };

  const extractAssociatedSymptoms = (text: string): string[] => {
    const symptoms: string[] = [];
    const patterns = [
      /also (experiencing|having|feeling) ([^,.;]+)/gi,
      /along with ([^,.;]+)/gi,
      /accompanied by ([^,.;]+)/gi
    ];

    patterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) symptoms.push(match[1].trim());
      }
    });

    return symptoms;
  };

  const getRecommendedAction = (score: number, symptoms: SymptomData): string => {
    if (score > 80) {
      return "Please seek immediate emergency medical attention";
    } else if (score > 60) {
      return "Schedule an urgent care appointment within 24 hours";
    } else if (score > 40) {
      return "Schedule a consultation with your primary care physician";
    }
    return "Monitor your symptoms and schedule a routine check-up";
  };

  const generateFollowUpQuestions = useCallback((
    symptoms: SymptomData, 
    context: typeof patientContext,
    previousMessages: Message[]
  ): string[] => {
    const questions: string[] = [];
    const previousResponses = new Set(previousMessages.flatMap(m => 
      m.role === 'user' ? m.content.toLowerCase() : []
    ));

    // If duration is unspecified, ask about timing
    if (symptoms.duration === "unspecified" && !previousResponses.has("how long")) {
      questions.push("How long have you been experiencing these symptoms?");
    }

    // If no triggers mentioned, ask about them
    if (symptoms.triggers.length === 0 && !previousResponses.has("trigger")) {
      questions.push("Have you noticed any specific triggers or situations that make the symptoms worse?");
    }

    // If frequency is unspecified, ask about pattern
    if (symptoms.frequency === "unspecified" && !previousResponses.has("how often")) {
      questions.push("How often do these symptoms occur? Is there a pattern to when they appear?");
    }

    // Ask about impact on daily life if not mentioned
    if (!previousResponses.has("affect") && !previousResponses.has("impact")) {
      questions.push("How are these symptoms affecting your daily activities or sleep?");
    }

    // If no medications mentioned, ask about treatments
    if (context.medications.length === 0 && !previousResponses.has("medication")) {
      questions.push("Have you tried any medications or treatments to manage these symptoms?");
    }

    // If no medical history provided, ask about it
    if (context.chronicConditions.length === 0 && !previousResponses.has("condition")) {
      questions.push("Do you have any ongoing medical conditions or significant medical history?");
    }

    // Always ensure we have at least one follow-up question
    if (questions.length === 0) {
      questions.push("Have you noticed any changes in the intensity or frequency of your symptoms recently?");
    }

    return questions;
  }, []);

  const DoctorCard = ({ doctor }: { doctor: Doctor }) => (
    <div className="bg-white rounded-lg p-4 shadow-md border border-teal-100 hover:shadow-lg transition-shadow">
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
    </div>
  );

  const generateResponse = async (userInput: string): Promise<Message> => {
    const symptomData = analyzeSymptoms(userInput, messages);
    const riskAssessment = calculateRiskAssessment(symptomData, patientContext, userInput, messages);
    
    setCurrentRiskAssessment(riskAssessment);

    // If this is a high-risk case, trigger doctor search
    if (riskAssessment.urgencyLevel === 'high' || riskAssessment.urgencyLevel === 'emergency') {
      findNearbyDoctors(symptomData, riskAssessment.urgencyLevel);
    }

    try {
      // Use GPT-4 for intelligent response generation
      const conversationHistory = messages.map(msg => ({
        botMessage: msg.role === 'assistant' ? msg.content : '',
        userResponse: msg.role === 'user' ? msg.content : undefined
      })).filter(msg => msg.botMessage || msg.userResponse);

      const gpt4Response = await gpt4Service.generateResponse(
        userInput,
        conversationHistory,
        patientContext,
        {
          primarySymptom: userInput,
          severity: symptomData.severity,
          duration: symptomData.duration,
          associatedSymptoms: symptomData.associatedSymptoms,
          triggers: symptomData.triggers,
          confidence: riskAssessment.confidence,
          urgencyLevel: riskAssessment.urgencyLevel
        }
      );

      return {
        id: generateUniqueId('assistant'),
        role: 'assistant',
        content: gpt4Response,
        timestamp: new Date(),
        symptomData,
        riskAssessment,
        confidenceScore: riskAssessment.confidence
      };

    } catch (error) {
      console.error('Error generating GPT-4 response:', error);
      
      // Fallback to basic response if GPT-4 fails
      const followUpQuestions = generateFollowUpQuestions(symptomData, patientContext, messages);
      
      let response = "";
      
      // Vary acknowledgments based on conversation context
      const acknowledgments = [
        "I understand how challenging this must be. ",
        "Thank you for sharing these details. ",
        "I appreciate you providing this information. ",
        "I'm listening carefully to your concerns. ",
        "Let me help you understand what might be happening. "
      ];
      response += acknowledgments[messages.filter(m => m.role === 'user').length % acknowledgments.length];

      // Add contextual symptom analysis
      if (symptomData.duration !== "unspecified") {
        response += `You've been experiencing these symptoms for ${symptomData.duration}. `;
      }
      
      if (symptomData.frequency !== "unspecified") {
        response += `They occur ${symptomData.frequency}. `;
      }

      if (symptomData.triggers.length > 0) {
        response += `I notice these symptoms are triggered by ${symptomData.triggers.join(", ")}. `;
      }

      response += "Based on your description, these symptoms appear to be " +
        (symptomData.severity > 7 ? "quite severe" : 
         symptomData.severity > 5 ? "moderate to severe" : 
         symptomData.severity > 3 ? "moderate" : "mild") + ". ";

      // Add safety prompt if needed
      if (riskAssessment.urgencyLevel === 'emergency') {
        response += `\n\n⚠️ ${personality.safetyPrompts[0] || "Please seek immediate medical attention."}\n`;
      } else if (riskAssessment.urgencyLevel === 'high') {
        response += `\n\n⚠️ ${personality.safetyPrompts[1] || "Consider seeking urgent care soon."}\n`;
      }

      // Add differential insights based on confidence
      if (riskAssessment.confidence < 40) {
        response += "\n\nI need more information to better understand your situation. ";
      } else if (riskAssessment.confidence < 70) {
        response += "\n\nI'm building a clearer picture, but a few more details would help. ";
      } else {
        response += "\n\nI have a good understanding of your symptoms, but let me verify a few things. ";
      }

      // Add follow-up questions with context
      if (followUpQuestions.length > 0) {
        response += "\nPlease help me with these additional details:\n" +
          followUpQuestions.map(q => `• ${q}`).join("\n");
      }

      // Add recommended action with confidence context
      response += `\n\nBased on my analysis ${
        riskAssessment.confidence > 80 ? "(which I'm quite confident about)" :
        riskAssessment.confidence > 60 ? "(with moderate confidence)" :
        "(noting that we need more information)"
      }, ${riskAssessment.recommendedAction}.`;

      return {
        id: generateUniqueId('assistant'),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        symptomData,
        riskAssessment,
        followUpQuestions,
        confidenceScore: riskAssessment.confidence
      };
    }
  };

  const handleVoiceInput = async () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Voice input is not supported in your browser');
      return;
    }

    try {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
      };

      recognition.start();
    } catch (error) {
      console.error('Speech recognition error:', error);
      alert('Error starting voice recognition');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload only image files');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const userMessage: Message = {
        id: generateUniqueId('user-image'),
        role: 'user',
        content: 'Uploaded an image of symptoms',
        timestamp: new Date(),
        attachments: [{
          type: 'image',
          url: reader.result as string
        }]
      };
      setMessages(prev => [...prev, userMessage]);

      // Process the image message
      setIsTyping(true);
      try {
        const response = await generateResponse('Image uploaded: Visual symptom analysis');
        setMessages(prev => [...prev, response]);
      } catch (error) {
        console.error('Error processing image:', error);
      } finally {
        setIsTyping(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: generateUniqueId('user'),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await generateResponse(input);
      setMessages(prev => [...prev, response]);
    } catch (error) {
      console.error('Error generating response:', error);
      setMessages(prev => [...prev, {
        id: generateUniqueId('error'),
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your message. Please try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex flex-col">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-teal-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
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
              <div className="flex items-center gap-3">
                <div className="w-10 h-10">
                  <MnemosyneLogo />
                </div>
                <div>
                  <h1 className="text-teal-900 body-medium">{personality.title}</h1>
                  {currentRiskAssessment && (
                    <div className="flex items-center gap-2">
                      <div 
                        className={`h-2 w-2 rounded-full ${
                          currentRiskAssessment.urgencyLevel === 'emergency' ? 'bg-red-500' :
                          currentRiskAssessment.urgencyLevel === 'high' ? 'bg-orange-500' :
                          currentRiskAssessment.urgencyLevel === 'medium' ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`} 
                      />
                      <p className="text-teal-600 text-sm body-regular">
                        Risk Level: {currentRiskAssessment.urgencyLevel.toUpperCase()} 
                        (Confidence: {Math.round(currentRiskAssessment.confidence)}%)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <GeolocationPermission 
                onLocationGranted={(location) => {
                  setUserLocation({
                    latitude: location.latitude,
                    longitude: location.longitude,
                    accuracy: 10 // Default accuracy value
                  });
                }}
                onLocationDenied={() => {
                  console.log('Location access denied');
                }}
              />
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

      {/* Disclaimer */}
      <div className="bg-teal-50/80 border-b border-teal-200/50 px-6 py-3">
        <div className="max-w-4xl mx-auto">
          <p className="text-teal-800 text-sm body-regular">{personality.disclaimer}</p>
        </div>
      </div>

      {/* Doctor Recommendations */}
      {showDoctorsList && (
        <div className="bg-white/80 border-b border-teal-100 px-6 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-teal-900">Recommended Healthcare Providers</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDoctorsList(false)}
              >
                <X className="w-4 h-4" />
              </Button>
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
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {nearbyDoctors.map(doctor => (
                    <DoctorCard key={doctor.id} doctor={doctor} />
                  ))}
                </div>
                <div 
                  ref={mapRef} 
                  className="w-full h-64 bg-gray-100 rounded-lg"
                  // This would integrate with a mapping service like Google Maps
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex gap-4 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-2xl px-6 py-4 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white'
                      : 'bg-white/80 backdrop-blur-sm text-teal-900 border border-teal-100 shadow-sm'
                  }`}
                >
                  <p className="body-regular whitespace-pre-line">{message.content}</p>
                  {message.attachments?.map((attachment, index) => (
                    <div key={index} className="mt-2">
                      {attachment.type === 'image' && (
                        <img
                          src={attachment.url}
                          alt="Uploaded symptom"
                          className="max-w-full rounded"
                        />
                      )}
                    </div>
                  ))}
                  {message.role === 'assistant' && (
                    <div className="mt-3 flex items-center justify-end">
                      <LanguageTranslator text={message.content} />
                    </div>
                  )}
                  {message.confidenceScore !== undefined && (
                    <div className="mt-2 text-xs opacity-75">
                      Confidence: {Math.round(message.confidenceScore)}%
                    </div>
                  )}
                  {message.riskAssessment && (
                    <div className="mt-2 text-xs">
                      <span className={`inline-block px-2 py-1 rounded ${
                        message.riskAssessment.urgencyLevel === 'emergency' ? 'bg-red-100 text-red-800' :
                        message.riskAssessment.urgencyLevel === 'high' ? 'bg-orange-100 text-orange-800' :
                        message.riskAssessment.urgencyLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {message.riskAssessment.urgencyLevel.toUpperCase()}
                      </span>
                    </div>
                  )}
                  <p className={`text-xs mt-2 ${
                    message.role === 'user' ? 'text-teal-100' : 'text-teal-600/60'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                {message.role === 'user' && (
                  <div className="w-10 h-10 rounded-full bg-teal-200 flex items-center justify-center flex-shrink-0">
                    <UserIcon className="w-5 h-5 text-teal-700" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing Indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-white/80 backdrop-blur-sm px-6 py-4 rounded-2xl border border-teal-100 shadow-sm">
                <div className="flex gap-2">
                  <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white/80 backdrop-blur-sm border-t border-teal-100 shadow-lg sticky bottom-0">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageUpload}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              className="flex-shrink-0"
            >
              <Camera className="w-5 h-5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleVoiceInput}
              className={`flex-shrink-0 ${isRecording ? 'bg-red-50 border-red-500 text-red-500' : ''}`}
            >
              <Mic className="w-5 h-5" />
            </Button>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={personality.placeholder}
              className="flex-1 resize-none bg-white border-teal-200 focus:border-teal-400 focus:ring-teal-400 body-regular min-h-[60px] max-h-[120px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <Button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white rounded-xl px-6 shadow-lg shadow-teal-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </Button>
          </form>
          <p className="text-teal-600/60 text-xs mt-2 body-regular">
            Press Enter to send, Shift + Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}