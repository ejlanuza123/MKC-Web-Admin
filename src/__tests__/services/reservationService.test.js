// src/__tests__/services/reservationService.test.js
// MKC Foods Corporation - mkc-admin-web
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockOrder = vi.fn();
const mockLte = vi.fn();
const mockGte = vi.fn();
const mockEq = vi.fn();
const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockChannel = vi.fn();
const mockChannelOn = vi.fn();
const mockChannelSubscribe = vi.fn();

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: (...args) => mockFrom(...args),
    channel: (...args) => mockChannel(...args),
  },
}));

import { reservationService } from '../../services/reservationService';

describe('reservationService.getByDate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrder.mockResolvedValue({ data: [], error: null });
    mockLte.mockReturnValue({ order: mockOrder });
    mockGte.mockReturnValue({ lte: mockLte });
    mockEq.mockReturnValue({ gte: mockGte });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });
  });

  it('queries the reservations table', async () => {
    await reservationService.getByDate('2026-09-01');
    expect(mockFrom).toHaveBeenCalledWith('reservations');
  });

  it('filters by status = reserved', async () => {
    await reservationService.getByDate('2026-09-01');
    expect(mockEq).toHaveBeenCalledWith('status', 'reserved');
  });

  it('applies gte and lte bounds for the given date', async () => {
    await reservationService.getByDate('2026-09-01');
    const expectedGte = new Date('2026-09-01T00:00:00').toISOString();
    const expectedLte = new Date('2026-09-01T23:59:59.999').toISOString();
    expect(mockGte.mock.calls[0][0]).toBe('scheduled_at');
    expect(mockGte.mock.calls[0][1]).toBe(expectedGte);
    expect(mockLte.mock.calls[0][0]).toBe('scheduled_at');
    expect(mockLte.mock.calls[0][1]).toBe(expectedLte);
  });

  it('returns data on success', async () => {
    const rows = [{ id: 'r1', scheduled_at: '2026-09-01T10:00:00Z' }];
    mockOrder.mockResolvedValue({ data: rows, error: null });
    const result = await reservationService.getByDate('2026-09-01');
    expect(result).toEqual(rows);
  });

  it('returns empty array when data is null', async () => {
    mockOrder.mockResolvedValue({ data: null, error: null });
    const result = await reservationService.getByDate('2026-09-01');
    expect(result).toEqual([]);
  });

  it('throws on error', async () => {
    mockOrder.mockResolvedValue({ data: null, error: new Error('query failed') });
    await expect(reservationService.getByDate('2026-09-01')).rejects.toThrow('query failed');
  });
});

describe('reservationService.getMonthReservations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrder.mockResolvedValue({ data: [], error: null });
    mockLte.mockReturnValue({ order: mockOrder });
    mockGte.mockReturnValue({ lte: mockLte });
    mockEq.mockReturnValue({ gte: mockGte });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });
  });

  it('applies first day of month as gte', async () => {
    await reservationService.getMonthReservations(new Date('2026-09-15'));
    const expectedStart = new Date(2026, 8, 1, 0, 0, 0, 0).toISOString();
    expect(mockGte.mock.calls[0][1]).toBe(expectedStart);
  });

  it('applies last day of month as lte', async () => {
    await reservationService.getMonthReservations(new Date('2026-09-15'));
    const expectedEnd = new Date(2026, 9, 0, 23, 59, 59, 999).toISOString();
    expect(mockLte.mock.calls[0][1]).toBe(expectedEnd);
  });

  it('returns data on success', async () => {
    mockOrder.mockResolvedValue({ data: [{ id: 'r2' }], error: null });
    const result = await reservationService.getMonthReservations(new Date('2026-09-01'));
    expect(result).toHaveLength(1);
  });

  it('throws on error', async () => {
    mockOrder.mockResolvedValue({ data: null, error: new Error('month error') });
    await expect(
      reservationService.getMonthReservations(new Date('2026-09-01'))
    ).rejects.toThrow('month error');
  });
});

describe('reservationService.subscribe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChannelSubscribe.mockReturnValue({});
    mockChannelOn.mockReturnValue({ subscribe: mockChannelSubscribe });
    mockChannel.mockReturnValue({ on: mockChannelOn });
  });

  it('subscribes to the admin-reservations-channel', () => {
    reservationService.subscribe(vi.fn());
    expect(mockChannel).toHaveBeenCalledWith('admin-reservations-channel');
  });

  it('listens for postgres_changes on reservations table', () => {
    const cb = vi.fn();
    reservationService.subscribe(cb);
    expect(mockChannelOn).toHaveBeenCalledWith(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'reservations' },
      cb
    );
  });
});
