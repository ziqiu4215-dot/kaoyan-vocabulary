import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import db from '../config/db';
import app from '../index';

// Seed minimal test data
beforeAll(() => {
  // Insert a test word
  db.prepare(`
    INSERT INTO words (id, word, phonetic_us, phonetic_uk, meanings, level, frequency_rank)
    VALUES (1, 'test', '/tɛst/', '/test/', '[{"pos":"n","meaning":"测试"}]', 'core', 1)
  `).run();

  db.prepare(`
    INSERT INTO examples (word_id, sentence, translation)
    VALUES (1, 'This is a test.', '这是一个测试。')
  `).run();
});

describe('Health API', () => {
  it('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('研词');
  });
});

// ─── Auth ───

describe('Auth API', () => {
  const testUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: '123456',
  };
  let token = '';

  it('POST /api/auth/register creates a new user', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.username).toBe(testUser.username);
    token = res.body.data.token;
  });

  it('POST /api/auth/register rejects duplicate username', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/auth/register rejects short password', async () => {
    const res = await request(app).post('/api/auth/register').send({
      username: 'newuser',
      email: 'new@example.com',
      password: '123',
    });
    expect(res.status).toBe(400);
  });

  it('POST /api/auth/login with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      username: testUser.username,
      password: testUser.password,
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    token = res.body.data.token;
  });

  it('POST /api/auth/login with wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      username: testUser.username,
      password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
  });

  it('GET /api/auth/me returns current user', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.username).toBe(testUser.username);
    expect(res.body.data.email).toBe(testUser.email);
  });

  it('GET /api/auth/me without token returns 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('GET /api/auth/me with invalid token returns 401', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid-token-here');
    expect(res.status).toBe(401);
  });
});

// ─── Learn ───

describe('Learn API', () => {
  let token = '';

  beforeAll(async () => {
    // Register a fresh user for learn tests
    const res = await request(app).post('/api/auth/register').send({
      username: 'learner',
      email: 'learner@example.com',
      password: '123456',
    });
    token = res.body.data.token;
  });

  it('GET /api/learn/next-word returns a word', async () => {
    const res = await request(app)
      .get('/api/learn/next-word?wordbookId=core')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).not.toBeNull();
    expect(res.body.data.word).toBe('test');
    expect(res.body.data.meanings).toBeDefined();
  });

  it('GET /api/learn/next-word without auth still works (userId=0)', async () => {
    const res = await request(app).get('/api/learn/next-word?wordbookId=core');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /api/learn/record saves a learning record', async () => {
    const res = await request(app)
      .post('/api/learn/record')
      .set('Authorization', `Bearer ${token}`)
      .send({ wordId: '1', status: 'learning', quality: 3 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.xpEarned).toBe(5);
  });

  it('POST /api/learn/record returns 400 without wordId', async () => {
    const res = await request(app)
      .post('/api/learn/record')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'learning' });
    expect(res.status).toBe(400);
  });

  it('POST /api/learn/record mastered word earns 10 XP', async () => {
    // Insert another word for testing mastery
    db.prepare(`
      INSERT INTO words (id, word, phonetic_us, meanings, level, frequency_rank)
      VALUES (2, 'master', '/ˈmæstər/', '[{"pos":"v","meaning":"掌握"}]', 'core', 2)
    `).run();

    const res = await request(app)
      .post('/api/learn/record')
      .set('Authorization', `Bearer ${token}`)
      .send({ wordId: '2', status: 'mastered', quality: 5 });
    expect(res.status).toBe(200);
    expect(res.body.data.xpEarned).toBe(10);
  });
});

// ─── Review ───

describe('Review API', () => {
  let token = '';

  beforeAll(async () => {
    const res = await request(app).post('/api/auth/register').send({
      username: 'reviewer',
      email: 'reviewer@example.com',
      password: '123456',
    });
    token = res.body.data.token;

    // Create a learning record due for review (next_review_at in the past)
    db.prepare(`
      INSERT INTO learning_records (user_id, word_id, status, ease_factor, interval, repetitions, last_review_at, next_review_at)
      VALUES (?, 1, 'learning', 2.5, 0, 0, datetime('now', '-1 day'), datetime('now', '-1 hour'))
    `).run(3); // user_id = 3 (reviewer)
  });

  it('GET /api/review returns due words', async () => {
    const res = await request(app)
      .get('/api/review')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.dueTotal).toBeGreaterThanOrEqual(1);
    expect(res.body.data.words.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.words[0].word).toBeDefined();
  });

  it('POST /api/review/rate submits a rating', async () => {
    const res = await request(app)
      .post('/api/review/rate')
      .set('Authorization', `Bearer ${token}`)
      .send({ wordId: '1', quality: 5 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.xpEarned).toBe(10);
  });

  it('POST /api/review/rate returns 400 without quality', async () => {
    const res = await request(app)
      .post('/api/review/rate')
      .set('Authorization', `Bearer ${token}`)
      .send({ wordId: '1' });
    expect(res.status).toBe(400);
  });

  it('POST /api/review/rate returns 404 for non-existent record', async () => {
    const res = await request(app)
      .post('/api/review/rate')
      .set('Authorization', `Bearer ${token}`)
      .send({ wordId: '999', quality: 3 });
    expect(res.status).toBe(404);
  });
});

// ─── User Profile ───

describe('User Profile API', () => {
  let token = '';

  beforeAll(async () => {
    const res = await request(app).post('/api/auth/register').send({
      username: 'profileuser',
      email: 'profile@example.com',
      password: '123456',
    });
    token = res.body.data.token;
  });

  it('GET /api/user/profile returns profile data', async () => {
    const res = await request(app)
      .get('/api/user/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.username).toBe('profileuser');
    expect(res.body.data.email).toBe('profile@example.com');
    expect(res.body.data.xp).toBe(0);
    expect(res.body.data.level).toBe(1);
    expect(res.body.data.streak).toBe(0);
    expect(res.body.data.achievements).toBeDefined();
  });

  it('GET /api/user/profile without token returns 401', async () => {
    const res = await request(app).get('/api/user/profile');
    expect(res.status).toBe(401);
  });

  it('PUT /api/user/profile updates username', async () => {
    const res = await request(app)
      .put('/api/user/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ username: 'updateduser' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.username).toBe('updateduser');
  });

  it('PUT /api/user/profile updates email', async () => {
    const res = await request(app)
      .put('/api/user/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'updated@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('updated@example.com');
  });

  it('PUT /api/user/profile rejects duplicate username', async () => {
    // First create another user
    await request(app).post('/api/auth/register').send({
      username: 'otheruser',
      email: 'other@example.com',
      password: '123456',
    });

    const res = await request(app)
      .put('/api/user/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ username: 'otheruser' });
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('PUT /api/user/password changes password', async () => {
    const res = await request(app)
      .put('/api/user/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: '123456', newPassword: 'newpass123' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('PUT /api/user/password with wrong current password returns 401', async () => {
    const res = await request(app)
      .put('/api/user/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'wrongpassword', newPassword: 'another123' });
    expect(res.status).toBe(401);
  });

  it('PUT /api/user/password with short new password returns 400', async () => {
    const res = await request(app)
      .put('/api/user/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'newpass123', newPassword: '123' });
    expect(res.status).toBe(400);
  });
});

// ─── Rate Limiting ───

describe('Rate Limiting', () => {
  it('returns 200 for normal requests', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
  });
});
