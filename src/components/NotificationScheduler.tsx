import React, { useEffect, useState } from 'react';
import { Appointment } from '../lib/types.js';

interface NotificationSchedulerProps {
  appointments: Appointment[];
}

export const NotificationScheduler: React.FC<NotificationSchedulerProps> = ({ appointments }) => {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
      if (Notification.permission === 'default') {
        Notification.requestPermission().then((res) => {
          setPermission(res);
        });
      }
    }
  }, []);

  useEffect(() => {
    if (permission !== 'granted' || !('Notification' in window)) return;

    // Check upcoming appointments every 30 seconds
    const interval = setInterval(() => {
      const now = new Date().getTime();

      appointments.forEach((apt) => {
        if ((apt.status || '').toUpperCase() !== 'CONFIRMED') return;

        // Parse date and time e.g., "2026-09-24", "04:15 PM"
        try {
          const dateParts = apt.date.split('-');
          const [timeStr, period] = apt.time.split(' ');
          const [hourStr, minStr] = timeStr.split(':');
          let hour = parseInt(hourStr, 10);
          if (period === 'PM' && hour < 12) hour += 12;
          if (period === 'AM' && hour === 12) hour = 0;

          const aptTime = new Date(
            parseInt(dateParts[0], 10),
            parseInt(dateParts[1], 10) - 1,
            parseInt(dateParts[2], 10),
            hour,
            parseInt(minStr, 10)
          ).getTime();

          const oneHourBefore = aptTime - 60 * 60 * 1000;
          const timeDiff = oneHourBefore - now;

          // If we are within 30 seconds of the 1-hour mark and haven't notified yet for this appointment
          const notifiedKey = `notified_${apt.id}`;
          const alreadyNotified = sessionStorage.getItem(notifiedKey);

          if (timeDiff >= -30000 && timeDiff <= 30000 && !alreadyNotified) {
            sessionStorage.setItem(notifiedKey, 'true');
            new Notification('Dental Appointment Reminder 🦷', {
              body: `Hi ${apt.patientName}, your appointment for ${apt.serviceNames.join(', ')} is in 1 hour (${apt.time}) at Aura Dental Care.`,
              icon: '/favicon.ico'
            });
          }
        } catch (e) {
          console.error('Error scheduling notification for apt', apt.id, e);
        }
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [appointments, permission]);

  return null;
};
