import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { NotificationProvider } from '../NotificationProvider';
import { useNotification } from '@hooks/useNotification';

// Mock the generateId function to return predictable IDs for testing
jest.mock('@utils/common', () => ({
  generateId: jest.fn().mockImplementation(() => 'test-id-123'),
}));

// Mock the timer functions
jest.useFakeTimers();

// Create a test component that uses the notification context
const TestComponent = () => {
  const {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
  } = useNotification();

  return (
    <div>
      <button
        data-testid="add-notification"
        onClick={() =>
          addNotification({
            title: 'Test Title',
            message: 'Test Message',
            type: 'info',
            timeout: 3000,
          })
        }
      >
        Add Notification
      </button>
      <button
        data-testid="add-duplicate"
        onClick={() =>
          addNotification({
            title: 'Test Title',
            message: 'Test Message',
            type: 'info',
            timeout: 3000,
          })
        }
      >
        Add Duplicate
      </button>
      <button
        data-testid="add-different-type"
        onClick={() =>
          addNotification({
            title: 'Test Title',
            message: 'Test Message',
            type: 'success',
            timeout: 3000,
          })
        }
      >
        Add Different Type
      </button>
      <button
        data-testid="add-persistent"
        onClick={() =>
          addNotification({
            title: 'Persistent',
            message: 'No Timeout',
            type: 'warning',
          })
        }
      >
        Add Persistent
      </button>
      <button
        data-testid="remove-notification"
        onClick={() => removeNotification('test-id-123')}
      >
        Remove Notification
      </button>
      <button data-testid="clear-all" onClick={clearAllNotifications}>
        Clear All
      </button>
      <div data-testid="notification-count">{notifications.length}</div>
    </div>
  );
};

describe('NotificationProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  test('renders children properly', () => {
    render(
      <NotificationProvider>
        <div data-testid="child-element">Child Element</div>
      </NotificationProvider>,
    );

    expect(screen.getByTestId('child-element')).toBeInTheDocument();
  });

  test('adds a notification correctly', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>,
    );

    act(() => {
      screen.getByTestId('add-notification').click();
    });

    expect(screen.getByTestId('notification-count').textContent).toBe('1');
  });

  test('deduplicates notifications with the same title and message', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>,
    );

    // Add initial notification
    act(() => {
      screen.getByTestId('add-notification').click();
    });

    expect(screen.getByTestId('notification-count').textContent).toBe('1');

    // Add a duplicate notification (same title, message, and type)
    act(() => {
      screen.getByTestId('add-duplicate').click();
    });

    // Should still only have 1 notification (deduplicated)
    expect(screen.getByTestId('notification-count').textContent).toBe('1');

    // Wait to ensure the notification would have disappeared if timeout wasn't updated
    jest.advanceTimersByTime(2999);

    // Check notification still exists (its timeout was updated)
    expect(screen.getByTestId('notification-count').textContent).toBe('1');
  });

  test('allows notifications with same title and message but different type', () => {
    jest.spyOn(console, 'error');
    console.error.mockImplementation(() => null);
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>,
    );

    // Add initial notification
    act(() => {
      screen.getByTestId('add-notification').click();
    });

    expect(screen.getByTestId('notification-count').textContent).toBe('1');

    // Add a notification with same title and message but different type
    act(() => {
      screen.getByTestId('add-different-type').click();
    });

    // Should now have 2 notifications (not deduplicated due to different type)
    expect(screen.getByTestId('notification-count').textContent).toBe('2');
  });

  test('removes a notification correctly', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>,
    );

    act(() => {
      screen.getByTestId('add-notification').click();
    });

    expect(screen.getByTestId('notification-count').textContent).toBe('1');

    act(() => {
      screen.getByTestId('remove-notification').click();
    });

    expect(screen.getByTestId('notification-count').textContent).toBe('0');
  });

  test('clears all notifications', () => {
    jest.spyOn(console, 'error');
    // @ts-expect-error: jest.spyOn adds this functionallity
    console.error.mockImplementation(() => null);

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>,
    );

    act(() => {
      screen.getByTestId('add-notification').click();
      screen.getByTestId('add-persistent').click();
    });

    expect(screen.getByTestId('notification-count').textContent).toBe('2');

    act(() => {
      screen.getByTestId('clear-all').click();
    });

    expect(screen.getByTestId('notification-count').textContent).toBe('0');
  });

  test('automatically removes notifications after timeout', async () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>,
    );

    act(() => {
      screen.getByTestId('add-notification').click();
    });

    expect(screen.getByTestId('notification-count').textContent).toBe('1');

    // Fast-forward time by 3000ms (the timeout value)
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(screen.getByTestId('notification-count').textContent).toBe('0');
    });
  });

  test('persistent notifications without timeout remain visible', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>,
    );

    act(() => {
      screen.getByTestId('add-persistent').click();
    });

    expect(screen.getByTestId('notification-count').textContent).toBe('1');

    // Fast-forward time by a significant amount
    act(() => {
      jest.advanceTimersByTime(10000);
    });

    // The notification should still be there
    expect(screen.getByTestId('notification-count').textContent).toBe('1');
  });

  test('removing a non-existent notification has no effect', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>,
    );

    // Try to remove a notification that doesn't exist
    act(() => {
      screen.getByTestId('remove-notification').click();
    });

    expect(screen.getByTestId('notification-count').textContent).toBe('0');
  });

  test('clearing notifications when there are none has no effect', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>,
    );

    // Try to clear notifications when there are none
    act(() => {
      screen.getByTestId('clear-all').click();
    });

    expect(screen.getByTestId('notification-count').textContent).toBe('0');
  });

  test('cleanup is performed properly on unmount', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

    const { unmount } = render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>,
    );

    // Add notifications with timeouts
    act(() => {
      screen.getByTestId('add-notification').click();
      screen.getByTestId('add-persistent').click();
    });

    // Unmount the component
    unmount();

    // Verify that clearTimeout was called
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
