import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import request from 'supertest';
import { createApp } from '../src/app';
import {
  getValidBookingPayload,
  setupTestDatabase,
  teardownTestDatabase,
} from './helpers/test-db';

describe('API endpoints', () => {
  const app = createApp();

  before(() => {
    setupTestDatabase('api');
  });

  after(() => {
    teardownTestDatabase();
  });

  it('GET /api/health returns service status', async () => {
    const response = await request(app).get('/api/health');

    assert.equal(response.status, 200);
    assert.equal(response.body.status, 'ok');
    assert.equal(response.body.database, 'connected');
  });

  it('GET /api/rooms returns seeded rooms', async () => {
    const response = await request(app).get('/api/rooms');

    assert.equal(response.status, 200);
    assert.ok(Array.isArray(response.body));
    assert.equal(response.body.length, 1);
    assert.equal(response.body[0].name, 'Conference A');
  });

  it('GET /api/bookings returns an array', async () => {
    const response = await request(app).get('/api/bookings');

    assert.equal(response.status, 200);
    assert.ok(Array.isArray(response.body));
  });

  it('POST /api/bookings creates a booking', async () => {
    const response = await request(app)
      .post('/api/bookings')
      .send(getValidBookingPayload({ title: 'Planning session' }));

    assert.equal(response.status, 201);
    assert.equal(response.body.title, 'Planning session');
    assert.equal(response.body.roomId, 1);
    assert.equal(response.body.userId, 1);
  });

  it('POST /api/bookings rejects overlapping bookings with 409', async () => {
    const payload = getValidBookingPayload({
      title: 'Conflict test',
      startTime: '2030-06-15T07:00:00.000Z',
      endTime: '2030-06-15T07:30:00.000Z',
    });

    const first = await request(app).post('/api/bookings').send(payload);
    assert.equal(first.status, 201);

    const second = await request(app).post('/api/bookings').send(payload);

    assert.equal(second.status, 409);
    assert.match(second.body.message, /already booked/i);
  });

  it('POST /api/bookings rejects invalid payload with 400', async () => {
    const response = await request(app).post('/api/bookings').send({
      roomId: 1,
      userId: 1,
      title: '',
      startTime: '2030-06-15T06:00:00.000Z',
      endTime: '2030-06-15T06:30:00.000Z',
    });

    assert.equal(response.status, 400);
    assert.match(response.body.message, /title/i);
  });

  it('POST /api/bookings returns 404 when room does not exist', async () => {
    const response = await request(app).post('/api/bookings').send(
      getValidBookingPayload({
        roomId: 999,
        startTime: '2030-06-15T08:00:00.000Z',
        endTime: '2030-06-15T08:30:00.000Z',
      }),
    );

    assert.equal(response.status, 404);
    assert.match(response.body.message, /Room with id 999/);
  });

  it('GET /api/unknown returns 404', async () => {
    const response = await request(app).get('/api/unknown');

    assert.equal(response.status, 404);
    assert.equal(response.body.message, 'Not found');
  });
});
