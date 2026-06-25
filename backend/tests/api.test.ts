import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import supertest from 'supertest';
import app from '../src/app';
import UserStats from '../src/models/UserStats';
import Transaction from '../src/models/Transaction';
import User from '../src/models/User';

let mongoServer: MongoMemoryServer;
let request: supertest.SuperTest<supertest.Test>;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  request = supertest(app);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  // Clear collections between tests
  await Transaction.deleteMany({});
  await UserStats.deleteMany({});
  await User.deleteMany({});
});

describe('POST /transaction validation', () => {
  it('should reject missing userId', async () => {
    const res = await request.post('/transaction').send({
      amount: 10,
      type: 'credit',
      idempotencyKey: 'abc-123',
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should reject amount <= 0', async () => {
    const res = await request.post('/transaction').send({
      userId: 'u1',
      amount: 0,
      type: 'credit',
      idempotencyKey: 'abc-123',
    });
    expect(res.status).toBe(400);
  });

  it('should reject amount > 1,000,000', async () => {
    const res = await request.post('/transaction').send({
      userId: 'u1',
      amount: 2_000_000,
      type: 'credit',
      idempotencyKey: 'abc-123',
    });
    expect(res.status).toBe(400);
  });

  it('should reject unknown fields', async () => {
    const res = await request.post('/transaction').send({
      userId: 'u1',
      amount: 10,
      type: 'credit',
      idempotencyKey: 'abc-123',
      extra: true,
    });
    expect(res.status).toBe(400);
  });

  it('should reject invalid type', async () => {
    const res = await request.post('/transaction').send({
      userId: 'u1',
      amount: 10,
      type: 'invalid',
      idempotencyKey: 'abc-123',
    });
    expect(res.status).toBe(400);
  });

  it('should accept valid transaction', async () => {
    const res = await request.post('/transaction').send({
      userId: 'u1',
      amount: 100,
      type: 'credit',
      idempotencyKey: 'valid-key-1',
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('transactionId');
    expect(res.body.status).toBe('completed');
  });
});

describe('Idempotency', () => {
  it('should return same transaction on duplicate key', async () => {
    const payload = {
      userId: 'u1',
      amount: 50,
      type: 'credit',
      idempotencyKey: 'idem-1',
    };
    const first = await request.post('/transaction').send(payload);
    expect(first.status).toBe(201);
    const second = await request.post('/transaction').send(payload);
    expect(second.status).toBe(200);
    expect(second.body.transactionId).toBe(first.body.transactionId);
    expect(second.body.status).toBe('completed');
  });

  it('should not double-count stats for duplicate', async () => {
    const payload = {
      userId: 'u1',
      amount: 20,
      type: 'credit',
      idempotencyKey: 'idem-2',
    };
    await request.post('/transaction').send(payload);
    await request.post('/transaction').send(payload);
    const summary = await request.get('/summary/u1');
    expect(summary.body.transactionCount).toBe(1);
    expect(summary.body.totalAmount).toBe(20);
  });
});

describe('Concurrency safety', () => {
  it('should correctly sum stats for concurrent distinct transactions', async () => {
    const userId = 'concurrent-user';
    const keys = ['c1', 'c2', 'c3', 'c4', 'c5'];
    const amounts = [10, 20, 30, 40, 50];
    const promises = keys.map((key, i) =>
      request.post('/transaction').send({
        userId,
        amount: amounts[i],
        type: 'credit',
        idempotencyKey: key,
      })
    );
    await Promise.all(promises);
    const summary = await request.get(`/summary/${userId}`);
    expect(summary.status).toBe(200);
    expect(summary.body.transactionCount).toBe(5);
    expect(summary.body.totalAmount).toBe(150);
  });
});

describe('GET /summary/:userId', () => {
  it('should return 404 for unknown user', async () => {
    const res = await request.get('/summary/nobody');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('USER_NOT_FOUND');
  });

  it('should return correct summary for existing user', async () => {
    await request.post('/transaction').send({
      userId: 'u1',
      amount: 100,
      type: 'credit',
      idempotencyKey: 'k1',
    });
    const res = await request.get('/summary/u1');
    expect(res.status).toBe(200);
    expect(res.body.totalAmount).toBe(100);
    expect(res.body.transactionCount).toBe(1);
    expect(res.body.rankScore).toBeGreaterThan(0);
    expect(res.body.rank).toBe(1);
  });
});

describe('GET /ranking', () => {
  it('should return users sorted by rankScore desc', async () => {
    // Create three users with different stats
    await request.post('/transaction').send({
      userId: 'a', amount: 10, type: 'credit', idempotencyKey: 'a1',
    });
    await request.post('/transaction').send({
      userId: 'b', amount: 500, type: 'credit', idempotencyKey: 'b1',
    });
    await request.post('/transaction').send({
      userId: 'c', amount: 100, type: 'credit', idempotencyKey: 'c1',
    });
    // Add a second transaction for user 'a' to increase count (but small amount)
    await request.post('/transaction').send({
      userId: 'a', amount: 5, type: 'credit', idempotencyKey: 'a2',
    });

    const res = await request.get('/ranking');
    expect(res.status).toBe(200);
    const ranking = res.body.ranking;
    expect(ranking.length).toBe(3);
    // User b with 500 should have highest rankScore, then c (100), then a (15 but two tx)
    // but rankScore weights: 0.6*amount + 0.3*10*min(count,50) + 0.1*min(days,30)
    // b: 0.6*500 + 0.3*10*1 + 0.1*1 = 300 + 3 + 0.1 = 303.1
    // c: 0.6*100 + 3 + 0.1 = 60 + 3 + 0.1 = 63.1
    // a: total amount 15, count 2 => 0.6*15 + 0.3*10*2 + 0.1*1 = 9 + 6 + 0.1 = 15.1
    expect(ranking[0].userId).toBe('b');
    expect(ranking[1].userId).toBe('c');
    expect(ranking[2].userId).toBe('a');
  });

  it('should respect tie-break', async () => {
    // Two users with identical totalAmount but different counts
    await request.post('/transaction').send({
      userId: 'x', amount: 100, type: 'credit', idempotencyKey: 'x1',
    });
    await request.post('/transaction').send({
      userId: 'y', amount: 50, type: 'credit', idempotencyKey: 'y1',
    });
    await request.post('/transaction').send({
      userId: 'y', amount: 50, type: 'credit', idempotencyKey: 'y2',
    });
    // Both total 100, but x has 1 tx, y has 2 tx
    const res = await request.get('/ranking');
    const ranking = res.body.ranking;
    // y: rankScore = 0.6*100 + 0.3*10*2 + 0.1*1 = 60+6+0.1=66.1
    // x: 0.6*100 + 0.3*10*1 + 0.1*1 = 60+3+0.1=63.1
    // y should rank higher because higher transaction count in tie-break (already covered by rankScore formula here, but for equal rankScore the tie-break sorts by transactionCount desc)
    expect(ranking[0].userId).toBe('y');
    expect(ranking[1].userId).toBe('x');
  });

  it('should exclude flagged users', async () => {
    // Create a flagged user via velocity abuse (mock many transactions)
    const userId = 'spammer';
    // We'll directly flag the stats to simplify test
    await UserStats.create({
      userId,
      totalAmount: 1000,
      transactionCount: 100,
      rankScore: 999,
      flagged: true,
      activeDays: ['2023-01-01'],
    });
    const res = await request.get('/ranking');
    expect(res.body.ranking.find((u: any) => u.userId === userId)).toBeUndefined();
    // Their own summary should still be accessible
    const summaryRes = await request.get(`/summary/${userId}`);
    expect(summaryRes.status).toBe(200);
    expect(summaryRes.body.flagged).toBe(true);
  });
});
