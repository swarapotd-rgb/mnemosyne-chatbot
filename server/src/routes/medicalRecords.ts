import { Router, Request, Response } from 'express';
import { MedicalRecord } from '../models/medicalRecord';
import { processMedicalJourney } from '../services/geminiService';
import { encryptData, decryptData } from '../utils/encryption';
import { createSuccessResponse, createErrorResponse } from '../utils/apiResponse';

const router = Router();

// Create a new medical record
router.post('/', async (req: Request, res: Response) => {
    try {
        const { userId, journeyDescription } = req.body;

        if (!userId || !journeyDescription) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                details: {
                    userId: !userId ? 'User ID is required' : null,
                    journeyDescription: !journeyDescription ? 'Journey description is required' : null
                }
            });
        }

        // Process the journey using Gemini
        const processedData = await processMedicalJourney(journeyDescription);
        
        if (!processedData) {
            return res.status(500).json({ error: 'Failed to process medical data' });
        }

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

        await medicalRecord.save();
        
        // Return the processed data along with success message
        res.status(201).json({ 
            message: 'Medical record created successfully',
            data: processedData
        });
    } catch (error) {
        console.error('Error creating medical record:', error);
        res.status(500).json({ 
            error: 'Failed to create medical record',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Get medical history for a user
router.get('/user/:userId', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        
        if (!userId) {
            return res.status(400).json({
                error: {
                    message: 'User ID is required',
                    code: 'INVALID_REQUEST'
                }
            });
        }

        const records = await MedicalRecord.find({ userId })
            .sort({ timestamp: -1 })
            .lean();

        if (!records || records.length === 0) {
            return res.json({ 
                records: [],
                message: 'No medical records found for this user'
            });
        }

        // Decrypt data for each record
        const decryptedRecords = records.map(record => {
            try {
                const decrypted = record.encryptedData ? decryptData(record.encryptedData) : null;
                return {
                    ...record,
                    decryptedData: decrypted ? JSON.parse(decrypted) : null,
                    _id: record._id.toString()
                };
            } catch (err) {
                console.error('Error decrypting record:', err);
                return {
                    ...record,
                    _id: record._id.toString(),
                    decryptionError: true
                };
            }
        });

        res.json({
            records: decryptedRecords,
            count: decryptedRecords.length
        });
    } catch (error) {
        console.error('Error fetching medical records:', error);
        res.status(500).json({ 
            error: {
                message: 'Failed to fetch medical records',
                code: 'FETCH_ERROR',
                details: error instanceof Error ? error.message : 'Unknown error'
            }
        });
    }
});

// Generate PDF report
router.get('/report/:recordId', async (req: Request, res: Response) => {
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