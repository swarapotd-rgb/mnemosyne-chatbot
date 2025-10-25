// Test file to demonstrate the new response format
// This file can be deleted after testing

import { aiService } from './services/aiService';

// Test the new response format
async function testNewResponseFormat() {
  console.log('Testing new AI response format...');
  
  const testSymptoms = "I have shortness of breath, chest pain, and a persistent cough";
  const patientContext = {
    chronicConditions: [],
    medications: [],
    medicalHistory: [],
    age: 35,
    gender: 'male'
  };

  try {
    const analysis = await aiService.analyzeSymptoms(testSymptoms, patientContext);
    
    console.log('✅ New Response Format Test Results:');
    console.log('=====================================');
    console.log('Assessment:', analysis.assessment);
    console.log('Urgency Level:', analysis.urgencyLevel);
    console.log('Possible Conditions:', analysis.possibleConditions);
    console.log('Recommendations:', analysis.recommendations);
    console.log('Next Steps:', analysis.nextSteps);
    console.log('=====================================');
    
    // Verify the new format doesn't include confidence
    if ('confidence' in analysis) {
      console.log('❌ ERROR: Confidence level still present in response');
    } else {
      console.log('✅ SUCCESS: Confidence level removed from response');
    }
    
    // Verify all required fields are present
    const requiredFields = ['assessment', 'urgencyLevel', 'possibleConditions', 'recommendations', 'nextSteps'];
    const missingFields = requiredFields.filter(field => !(field in analysis));
    
    if (missingFields.length === 0) {
      console.log('✅ SUCCESS: All required fields present in response');
    } else {
      console.log('❌ ERROR: Missing fields:', missingFields);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testNewResponseFormat();

export { testNewResponseFormat };




