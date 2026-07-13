import mongoose from 'mongoose';
import { env } from './config/env';

export async function connectDB(): Promise<void> {
    try {
        const db = await mongoose.connect(env.MONGODB_URI);
        console.log(`MongoDB connected: ${db.connection.host}`);
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
}