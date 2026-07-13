import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app';

describe('Auth', () => {
    const testUser = {
        name: 'Test User',
        email: `test${Date.now()}@example.com`,
        password: 'test123456',
        dni: `DNI${Date.now()}`,
        phone: '12345678',
        dateOfBirth: '2000-01-01',
    };

    it('POST /api/auth/register - creates user', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send(testUser);

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('token');
        expect(res.body.user.email).toBe(testUser.email);
    });

    it('POST /api/auth/register - rejects duplicate email', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send(testUser);

        expect(res.status).toBe(409);
    });

    it('POST /api/auth/register - rejects invalid data', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ email: 'bad' });

        expect(res.status).toBe(422);
    });

    it('POST /api/auth/login - success', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: testUser.email, password: testUser.password });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('token');
    });

    it('POST /api/auth/login - wrong password', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: testUser.email, password: 'wrongpassword' });

        expect(res.status).toBe(401);
    });

    it('GET /api/users/me - returns profile with valid token', async () => {
        const login = await request(app)
            .post('/api/auth/login')
            .send({ email: testUser.email, password: testUser.password });

        const token = login.body.token;

        const res = await request(app)
            .get('/api/users/me')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.user.email).toBe(testUser.email);
    });

    it('GET /api/users/me - rejects without token', async () => {
        const res = await request(app).get('/api/users/me');
        expect(res.status).toBe(401);
    });
});
