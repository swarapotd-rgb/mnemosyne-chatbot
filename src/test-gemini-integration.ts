// Test file for Gemini integration
import { aiService } from './services/aiService';

async function testGeminiIntegration() {
  console.log('Testing Gemini Integration...');
  
  // Test with different symptoms
  const testSymptoms = [
    'I have a fever and headache',
    'Chest pain and shortness of breath',
    'Stomach pain and nausea',
    'Dizziness and fatigue',
    'Persistent cough'
  ];

  for (const symptom of testSymptoms) {
    console.log(`\n--- Testing: ${symptom} ---`);
    
    try {
      const analysis = await aiService.analyzeSymptoms(
        symptom,
        { chronicConditions: [], medications: [], medicalHistory: [] }
      );
      
      console.log('Assessment:', analysis.assessment);
      console.log('Urgency Level:', analysis.urgencyLevel);
      console.log('Possible Conditions:', analysis.possibleConditions);
      console.log('Possible Precautions:', analysis.possiblePrecautions);
      console.log('Specialist to Consider:', analysis.specialistToConsider);
      
      if (analysis.error) {
        console.log('Error:', analysis.error);
      }
    } catch (error) {
      console.error('Test failed:', error);
    }
  }
}

// Run the test
testGeminiIntegration().catch(console.error);



