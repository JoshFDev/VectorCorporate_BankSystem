export function initEnv(): void {
    const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI'] as const;
    for (const key of requiredEnvVars) {
        if (!process.env[key]) {
            throw new Error(`Missing required environment variable: ${key}`);
        }
    }
}

export const env = {
    get PORT() { return process.env.PORT || 3000; },
    get MONGODB_URI() { return process.env.MONGODB_URI!; },
    get JWT_SECRET() { return process.env.JWT_SECRET!; },
    get NODE_ENV() { return process.env.NODE_ENV || 'development'; },
    get CORS_ORIGINS() { return (process.env.CORS_ORIGINS || 'http://localhost:4200,http://127.0.0.1:4200').split(','); },
    get EMAIL_HOST() { return process.env.EMAIL_HOST || 'smtp.gmail.com'; },
    get EMAIL_PORT() { return parseInt(process.env.EMAIL_PORT || '587'); },
    get EMAIL_USER() { return process.env.EMAIL_USER || ''; },
    get EMAIL_PASS() { return process.env.EMAIL_PASS || ''; },
    get ABSTRACT_API_KEY() { return process.env.ABSTRACT_API_KEY || ''; },
};
