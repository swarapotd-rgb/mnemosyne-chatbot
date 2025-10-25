import { Schema, model, Document } from 'mongoose';

interface IMedicalRecord extends Document {
    userId: string;
    timestamp: Date;
    symptoms: string[];
    journeyDescription: string;
    processedSummary: string;
    geminiInsights: {
        symptomTrends: string[];
        progressNotes: string;
        lifestyleTips: string[];
        redFlags: string[];
    };
    encryptedData: string; // For HIPAA compliance
    lastUpdated: Date;
}

const MedicalRecordSchema = new Schema<IMedicalRecord>({
    userId: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    symptoms: [{ type: String }],
    journeyDescription: { type: String, required: true },
    processedSummary: { type: String },
    geminiInsights: {
        symptomTrends: [{ type: String }],
        progressNotes: { type: String },
        lifestyleTips: [{ type: String }],
        redFlags: [{ type: String }]
    },
    encryptedData: { type: String },
    lastUpdated: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// Middleware to update lastUpdated timestamp
MedicalRecordSchema.pre('save', function(next) {
    this.lastUpdated = new Date();
    next();
});

export const MedicalRecord = model<IMedicalRecord>('MedicalRecord', MedicalRecordSchema);
