import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

if (!MONGODB_URI) {
    console.error('MONGODB_URI is not defined in environment variables');
    process.exit(1);
}

export const connectDB = async () => {
    try {
        const options = {
            dbName: 'mnemosyne',
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 10000,
            maxPoolSize: 50,
            retryWrites: true,
            w: 'majority'
        } as mongoose.ConnectOptions;

        console.log('Connecting to MongoDB:', MONGODB_URI);
        await mongoose.connect(MONGODB_URI, options);
        console.log('MongoDB Connected Successfully');
        
        // Set up error handlers
        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected');
        });

        process.on('SIGINT', async () => {
            try {
                await mongoose.connection.close();
                console.log('MongoDB connection closed through app termination');
                process.exit(0);
            } catch (err) {
                console.error('Error closing MongoDB connection:', err);
                process.exit(1);
            }
        });

    } catch (error) {
        console.error('MongoDB Connection Error:', error);
        process.exit(1);
    }
};