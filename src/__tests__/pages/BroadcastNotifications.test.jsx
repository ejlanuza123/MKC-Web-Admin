import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import BroadcastNotifications from '../../pages/BroadcastNotifications';

const mocks = vi.hoisted(() => ({
  getAudienceEstimates: vi.fn(),
  sendBroadcast: vi.fn(),
  getBroadcastHistory: vi.fn(),
  notifySuccess: vi.fn(),
}));

vi.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

vi.mock('../../utils/successNotifier', () => ({
  notifySuccess: (...args) => mocks.notifySuccess(...args),
}));

vi.mock('../../services/broadcastNotificationService', () => ({
  broadcastNotificationService: {
    getAudienceEstimates: () => mocks.getAudienceEstimates(),
    sendBroadcast: (args) => mocks.sendBroadcast(args),
    getBroadcastHistory: (args) => mocks.getBroadcastHistory(args),
  },
  BROADCAST_CATEGORIES: [
    { id: 'weather_advisory', name: 'Weather & Operations', icon: 'CloudRain', color: '#EAB308' },
    { id: 'promo', name: 'Flash Promo & Discounts', icon: 'Flame', color: '#EC4899' },
    { id: 'announcement', name: 'General Announcement', icon: 'Megaphone', color: '#3B82F6' },
    { id: 'emergency', name: 'Emergency & Advisories', icon: 'AlertTriangle', color: '#EF4444' }
  ],
  PRESET_TEMPLATES: [
    {
      id: 'friday_promo',
      category: 'promo',
      targetAudience: 'customers',
      title: '🍗 Friday Special Promo!',
      message: 'Enjoy 15% off all MKC Platters and Bundles from 5:00 PM to 8:00 PM today!'
    }
  ]
}));

describe('BroadcastNotifications Page (MKC)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.getAudienceEstimates.mockResolvedValue({
      success: true,
      customers: 40,
      riders: 8,
      total: 48,
      pushTokens: { customers: 30, riders: 6, total: 36 }
    });

    mocks.getBroadcastHistory.mockResolvedValue({
      success: true,
      data: [
        {
          id: 'b-1',
          created_at: '2026-09-11T09:00:00Z',
          target_audience: 'customers',
          category: 'promo',
          title: '🍗 Friday Special Promo!',
          message: 'Enjoy 15% off all MKC Platters and Bundles from 5:00 PM to 8:00 PM today!',
          recipient_count: 40,
          push_tokens_count: 30,
          profiles: { full_name: 'Admin User' }
        }
      ]
    });
  });

  it('renders title, audience selectors, and initial audience estimates', async () => {
    render(<BroadcastNotifications />);

    expect(screen.getByText('Push Notification Broadcaster')).toBeTruthy();
    expect(screen.getByText('1. Select Target Audience')).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByText('Everyone')).toBeTruthy();
      expect(screen.getByText('Customers')).toBeTruthy();
      expect(screen.getByText('Riders')).toBeTruthy();
    });
  });

  it('clicking a preset template fills title and message inputs', async () => {
    render(<BroadcastNotifications />);

    await waitFor(() => {
      expect(screen.getByText(/Friday Special Promo/i)).toBeTruthy();
    });

    const presetBtn = screen.getByText(/Friday Special Promo/i);
    fireEvent.click(presetBtn);

    const titleInput = screen.getByPlaceholderText(/e.g. 🍗 Friday Special Promo!/i);
    expect(titleInput.value).toContain('Friday Special Promo');

    const messageInput = screen.getByPlaceholderText(/Enjoy 15% off all MKC Platters/i);
    expect(messageInput.value).toContain('Enjoy 15% off all MKC Platters');
  });

  it('submits form, opens confirmation modal, and confirms dispatch', async () => {
    mocks.sendBroadcast.mockResolvedValueOnce({
      success: true,
      broadcastId: 'b-999',
      recipientCount: 40,
      pushSentCount: 30
    });

    render(<BroadcastNotifications />);

    // Fill form
    const titleInput = screen.getByPlaceholderText(/e.g. 🍗 Friday Special Promo!/i);
    const messageInput = screen.getByPlaceholderText(/Enjoy 15% off all MKC Platters/i);

    fireEvent.change(titleInput, { target: { value: 'Weekend Platter Sale' } });
    fireEvent.change(messageInput, { target: { value: 'Special bundle deal!' } });

    const submitBtn = screen.getByText(/Review & Dispatch Broadcast/i);
    fireEvent.click(submitBtn);

    // Confirmation modal should appear
    const confirmModalTitle = await screen.findByText('Confirm Broadcast Dispatch');
    expect(confirmModalTitle).toBeTruthy();

    const confirmBtn = screen.getByText('Yes, Dispatch Now');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mocks.sendBroadcast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Weekend Platter Sale',
        message: 'Special bundle deal!'
      }));
      expect(mocks.notifySuccess).toHaveBeenCalled();
    });
  });

  it('switches to history tab and displays past broadcasts', async () => {
    render(<BroadcastNotifications />);

    const historyTabBtn = screen.getByRole('button', { name: /History/i });
    fireEvent.click(historyTabBtn);

    const pastHeader = await screen.findByText('Past Dispatched Broadcasts');
    expect(pastHeader).toBeTruthy();
    expect(screen.getByText('🍗 Friday Special Promo!')).toBeTruthy();
  });
});
