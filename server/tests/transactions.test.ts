import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app';

describe('Transactions', () => {
    let token: string;
    let accountNumber: string;

    const testUser = {
        name: 'Transaction Tester',
        email: `txtest${Date.now()}@example.com`,
        password: 'test123456',
        dni: `TXDNI${Date.now()}`,
        phone: '87654321',
        dateOfBirth: '1995-05-15',
    };

    beforeAll(async () => {
        const reg = await request(app).post('/api/auth/register').send(testUser);
        token = reg.body.token;
        accountNumber = reg.body.account.number;
    });

    it('POST /api/transactions/deposit - adds money', async () => {
        const res = await request(app)
            .post('/api/transactions/deposit')
            .set('Authorization', `Bearer ${token}`)
            .send({ accountNumber, amount: 1000 });

        expect(res.status).toBe(200);
        expect(res.body.account.balance).toBe(1000);
    });

    it('POST /api/transactions/withdraw - removes money', async () => {
        const res = await request(app)
            .post('/api/transactions/withdraw')
            .set('Authorization', `Bearer ${token}`)
            .send({ accountNumber, amount: 300 });

        expect(res.status).toBe(200);
        expect(res.body.account.balance).toBe(700);
    });

    it('POST /api/transactions/withdraw - rejects insufficient funds', async () => {
        const res = await request(app)
            .post('/api/transactions/withdraw')
            .set('Authorization', `Bearer ${token}`)
            .send({ accountNumber, amount: 99999 });

        expect(res.status).toBe(400);
    });

    it('POST /api/transactions/deposit - rejects negative amount', async () => {
        const res = await request(app)
            .post('/api/transactions/deposit')
            .set('Authorization', `Bearer ${token}`)
            .send({ accountNumber, amount: -100 });

        expect(res.status).toBe(422);
    });

    it('GET /api/accounts/:accountNumber - returns account', async () => {
        const res = await request(app)
            .get(`/api/accounts/${accountNumber}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.account.number).toBe(accountNumber);
    });
});
