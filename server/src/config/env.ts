const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI'] as const;

for (const key of requiredEnvVars) {
    if (!process.env[key]) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
}

export const env = {
    PORT: process.env.PORT || 3000,
    MONGODB_URI: process.env.MONGODB_URI!,
    JWT_SECRET: process.env.JWT_SECRET!,
    NODE_ENV: process.env.NODE_ENV || 'development',
    CORS_ORIGINS: (process.env.CORS_ORIGINS || 'http://localhost:4200,http://127.0.0.1:4200').split(','),
    EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
    EMAIL_PORT: parseInt(process.env.EMAIL_PORT || '587'),
    EMAIL_USER: process.env.EMAIL_USER || '',
    EMAIL_PASS: process.env.EMAIL_PASS || '',
    ABSTRACT_API_KEY: process.env.ABSTRACT_API_KEY || '',
};
