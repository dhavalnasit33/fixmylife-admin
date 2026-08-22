
'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { format, formatDistanceToNow, isValid } from 'date-fns';
// Optional: import { enUS } from 'date-fns/locale'; // For consistent locale if needed

interface ClientFormattedDateProps {
  dateInput?: string | number | Date | null;
  formatString?: string;
  relative?: boolean;
  fallback?: ReactNode;
  className?: string;
}

export default function ClientFormattedDate({
  dateInput,
  formatString = "PPpp", // Default format (e.g., Jul 20, {new Date().getFullYear()}, 1:30:00 PM)
  relative = false,
  fallback = "N/A",
  className,
}: ClientFormattedDateProps) {
  const [formattedDate, setFormattedDate] = useState<ReactNode>(null);

  useEffect(() => {
    if (dateInput) {
      try {
        const date = new Date(dateInput);
        if (!isValid(date)) {
          setFormattedDate(fallback);
          return;
        }

        if (relative) {
          setFormattedDate(formatDistanceToNow(date, { addSuffix: true }));
        } else {
          setFormattedDate(format(date, formatString /*, { locale: enUS } */));
        }
      } catch (e) {
        console.error("Error formatting date:", dateInput, e);
        setFormattedDate(fallback);
      }
    } else {
      setFormattedDate(fallback);
    }
  }, [dateInput, formatString, relative, fallback]);

  // Render a placeholder or the fallback if formattedDate is not yet set.
  // This helps ensure the initial render matches the server if dateInput is passed.
  const initialDisplay = dateInput ? new Date(dateInput).toLocaleDateString() : fallback;

  return <span className={className}>{formattedDate === null ? initialDisplay : formattedDate}</span>;
}
