import connectDB from '@/lib/db';
import NotificationDelivery from '@/models/NotificationDelivery';
import { getEmailProvider, getSmsProvider } from '@/lib/verification/providers/index.js';

const STATUS_NOTIFICATION_TYPES = {
  confirmed: 'booking-confirmed',
  cancelled: 'booking-cancelled',
};

function formatEventDate(date) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(date));
}

/** Builds the smallest useful recipient message; it is never persisted or logged. */
export function buildBookingNotificationPayload({ booking, event, notificationType }) {
  const eventSummary = `${event.title} on ${formatEventDate(event.eventDate)}${event.startTime ? `, ${event.startTime}` : ''}`;
  const greeting = `Hello ${booking.name},`;
  const reference = `Booking reference: ${booking.bookingReference}.`;

  let subject = 'Your StrongerSteps booking';
  let message = `Your booking for ${eventSummary} is confirmed. ${reference}`;

  if (notificationType === 'booking-cancelled') {
    subject = 'Your StrongerSteps booking was cancelled';
    message = `Your booking for ${eventSummary} was cancelled. ${reference}`;
  } else if (notificationType === 'booking-confirmed') {
    subject = 'Your StrongerSteps booking is confirmed';
  }

  return {
    subject,
    emailText: `${greeting}\n\n${message}\n\nStrongerSteps`,
    smsText: `${message} StrongerSteps`,
  };
}

export function notificationTypeForStatusChange(previousStatus, nextStatus) {
  if (previousStatus === nextStatus) return null;
  return STATUS_NOTIFICATION_TYPES[nextStatus] || null;
}

function providerNameFor(channel) {
  return channel === 'email'
    ? process.env.NOTIFICATION_EMAIL_PROVIDER || 'mock'
    : process.env.NOTIFICATION_SMS_PROVIDER || 'mock';
}

function providerFor(channel, name) {
  return channel === 'email' ? getEmailProvider(name) : getSmsProvider(name);
}

function failureCode() {
  // Provider errors can include recipient details. Keep only a stable, safe
  // operational outcome in the audit record.
  return 'provider-delivery-failed';
}

/**
 * Best-effort worker. It records channel-level outcomes but never throws back
 * into an already-successful booking/status response.
 */
export async function deliverBookingNotification({ booking, event, notificationType }) {
  const payload = buildBookingNotificationPayload({ booking, event, notificationType });
  await connectDB();

  await Promise.all(
    ['email', 'sms'].map(async (channel) => {
      const providerName = providerNameFor(channel);
      let audit;
      try {
        audit = await NotificationDelivery.create({
          booking: booking._id,
          event: event._id,
          notificationType,
          channel,
          provider: providerName,
        });
        const result = await providerFor(channel, providerName).send({
          to: channel === 'email' ? booking.email : booking.mobile,
          channel,
          subject: payload.subject,
          text: channel === 'email' ? payload.emailText : payload.smsText,
        });
        await NotificationDelivery.updateOne(
          { _id: audit._id },
          { status: result?.success === false ? 'failed' : 'sent', providerRef: result?.providerRef || '', completedAt: new Date() }
        );
      } catch {
        if (audit?._id) {
          await NotificationDelivery.updateOne(
            { _id: audit._id },
            { status: 'failed', failureCode: failureCode(), completedAt: new Date() }
          ).catch(() => {});
        }
      }
    })
  );
}

/** Queues only a completed write's notification; no request waits on delivery. */
export function queueBookingNotification({ writeSucceeded, booking, event, notificationType }, deliver = deliverBookingNotification) {
  if (!writeSucceeded || !booking || !event || !notificationType) return false;
  void deliver({ booking, event, notificationType }).catch(() => {});
  return true;
}
