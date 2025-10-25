import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import medicalRecordsRouter from './routes/medicalRecords';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to MongoDB
(async () => {
    try {
        await connectDB();
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        process.exit(1);
    }
})();

// Middleware
app.use(cors());
app.use(express.json());

// Handle favicon.ico requests
app.get('/favicon.ico', (req, res) => {
    res.status(204).end(); // No content response for favicon
});

// Routes
app.use('/api/medical-records', medicalRecordsRouter);

// Health check endpoint
app.get('/health', (req: express.Request, res: express.Response) => {
    res.json({ status: 'OK' });
});

import { errorHandler } from './middleware/errorHandler';

// Error handling middleware
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});