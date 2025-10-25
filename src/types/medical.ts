export interface MedicalRecord {
  _id?: string;
  userId: string;
  timestamp: Date;
  symptoms: string[];
  description: string;
  duration: string;
  intensity: number;
  medications?: string[];
  notes?: string;
  followUp?: string;
}

export interface MedicalHistory {
  userId: string;
  records: MedicalRecord[];
  lastUpdated: Date;
}

export interface HealthSummary {
  userId: string;
  timestamp: Date;
  symptoms: {
    name: string;
    frequency: number;
    lastReported: Date;
  }[];
  insights: string[];
  recommendations: string[];
  redFlags?: string[];
}