import mongoose from 'mongoose';
// mongoose: libreria para conectar y modelar datos en MongoDB

export async function connectDB(): Promise<void> {
    // async/await: funciona de forma asincrona, espera a que la DB responda
    try {
        // Intenta conectar a MongoDB en el puerto default 27017
        // 'vectorbank' es el nombre de la base de datos
        const db = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vectorbank');
        // Si funciona, muestra el host al que se conecto
        console.log(`MongoDB connected: ${db.connection.host}`);
    } catch (error) {
        // Si falla, muestra el error y termina el proceso con codigo 1 (error)
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
}