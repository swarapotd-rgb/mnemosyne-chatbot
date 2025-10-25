import { Router } from 'express';
import { MedicalRecord } from '../models/medicalRecord';
import { processMedicalJourney } from '../services/geminiService';
import { encryptData, decryptData } from '../utils/encryption';

const router = Router();

// Create a new medical record
router.post('/', async (req, res) => {
    try {
        const { userId, journeyDescription } = req.body;

        // Input validation
        if (!userId || !journeyDescription) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'Both userId and journeyDescription are required'
            });
        }

        if (typeof journeyDescription !== 'string' || journeyDescription.trim().length === 0) {
            return res.status(400).json({
                error: 'Invalid journeyDescription',
                message: 'Journey description must be a non-empty string'
            });
        }

        // Process the journey using Gemini
        const processedData = await processMedicalJourney(journeyDescription);

        // Encrypt sensitive data
        const encryptedData = encryptData(JSON.stringify({
            journeyDescription,
            processedData
        }));

        const medicalRecord = new MedicalRecord({
            userId,
            symptoms: processedData.symptoms,
            journeyDescription,
            processedSummary: processedData.summary,
            geminiInsights: processedData.insights,
            encryptedData
        });

        const savedRecord = await medicalRecord.save();
        res.status(201).json({ 
            message: 'Medical record created successfully',
            data: {
                symptoms: savedRecord.symptoms,
                summary: savedRecord.processedSummary,
                insights: savedRecord.geminiInsights
            }
        });
    } catch (error) {
        console.error('Error creating medical record:', error);
        res.status(500).json({ 
            error: 'Failed to create medical record',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});

// Get medical history for a user
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        if (!userId) {
            return res.status(400).json({
                error: 'Missing userId',
                message: 'User ID is required'
            });
        }

        // Validate userId format if needed
        if (typeof userId !== 'string' || userId.trim().length === 0) {
            return res.status(400).json({
                error: 'Invalid userId',
                message: 'User ID must be a non-empty string'
            });
        }

        const records = await MedicalRecord.find({ userId })
            .sort({ timestamp: -1 })
            .select('-__v') // Exclude version key

        // Decrypt data for each record
        const decryptedRecords = records.map(record => ({
            ...record.toObject(),
            decryptedData: record.encryptedData ? decryptData(record.encryptedData) : null
        }));

        if (decryptedRecords.length === 0) {
            return res.status(200).json({ 
                records: [],
                message: "No medical records found for this user"
            });
        }

        res.json({ records: decryptedRecords });
    } catch (error) {
        console.error('Error fetching medical records:', error);
        res.status(500).json({ 
            error: 'Failed to fetch medical records',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});

// Generate PDF report
router.get('/report/:recordId', async (req, res) => {
    try {
        const { recordId } = req.params;
        const record = await MedicalRecord.findById(recordId);

        if (!record) {
            return res.status(404).json({ error: 'Record not found' });
        }

        // Generate PDF logic here
        // You'll need to implement this using a PDF generation library

        res.json({ message: 'PDF generation endpoint' });
    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

export default router;
