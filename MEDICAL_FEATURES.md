# Medical Features Guide

## Symptom Analysis Flow

1. **Symptom Selection**
   - Users select from categorized symptom domains
   - Multiple symptoms can be selected across categories
   - Visual feedback shows selected symptoms

2. **AI Analysis**
   - GPT-4 powered analysis of symptoms
   - Structured output includes:
     - Possible conditions (general terms)
     - Safe home remedies
     - Over-the-counter medicines
     - Next steps
     - Urgency level assessment

3. **Location-Based Doctor Search**
   - Optional geolocation access
   - Shows nearby healthcare providers
   - Includes:
     - Doctor/clinic names
     - Distances
     - Specialties
     - Contact information

## Safety Features

- Clear medical disclaimers
- No definitive diagnoses
- Professional consultation recommendations
- Emergency warnings for severe symptoms
- Privacy-focused location handling

## Technical Details

### API Integration

```typescript
// Analyze symptoms
const analysis = await gpt4Service.analyzeSymptoms(
  selectedSymptoms.join(", "),
  patientContext
);

// Response structure
interface MedicalResponse {
  possibleConditions: string[];    // General conditions
  homeRemedies: string[];         // Safe self-care options
  commonMedicines: string[];      // OTC recommendations
  nextSteps: string[];           // Action items
  urgencyLevel: 'low' | 'medium' | 'high' | 'emergency';
  confidence: number;            // Analysis confidence (0-100)
  assessment: string;           // Brief text assessment
  recommendations: string[];    // General recommendations
}
```

### Location Services

```typescript
// Get user location
const location = await getUserLocation();

// Find nearby doctors
const doctors = await findNearbyDoctors(location);

// Doctor information structure
interface Doctor {
  id: string;
  name: string;
  specialty: string;
  address: string;
  location: {
    latitude: number;
    longitude: number;
  };
  distance?: number;     // Calculated from user location
  phone: string;
  email: string;
  rating: number;
  reviews: number;
}
```

## Important Notes

1. **Privacy**
   - Location data is only used for doctor search
   - No medical data is stored permanently
   - GPT-4 conversations are ephemeral

2. **Medical Disclaimer**
   - This is not a diagnostic tool
   - All medical advice is general in nature
   - Always consult healthcare professionals
   - Call emergency services for urgent conditions

3. **API Keys**
   - Requires OpenAI API key for GPT-4 analysis
   - Set in `.env` file (see `.env.example`)
   - Configure in settings modal

## Development

1. **Environment Setup**
   ```bash
   npm install
   cp .env.example .env
   # Add your OpenAI API key to .env
   ```

2. **Running the App**
   ```bash
   npm run dev
   ```

3. **Building for Production**
   ```bash
   npm run build
   ```

## Contributing

1. Keep medical safety in mind
2. Maintain clear disclaimers
3. Test thoroughly
4. Document safety features