import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function maskPhoneNumber(phone: string): string {
  if (!phone) return '';
  const cleaned = phone.trim();
  // e.g. "+91 98401 23456" -> "+91 98••••••56"
  if (cleaned.length > 6) {
    const start = cleaned.slice(0, 7);
    const end = cleaned.slice(-2);
    return `${start}••••••${end}`;
  }
  return cleaned;
}

export function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export function calculateDuration(startDate: string, endDate: string): { weeks: number; months: number; text: string } {
  if (!startDate || !endDate) return { weeks: 0, months: 0, text: '-' };
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();
  if (diffMs <= 0) return { weeks: 0, months: 0, text: 'Invalid dates' };
  
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const weeks = Math.round(diffDays / 7);
  const months = Math.round((diffDays / 30.4375) * 10) / 10;
  
  return {
    weeks,
    months,
    text: `${weeks} weeks (${months} months)`,
  };
}

export function formatCurrency(amount: number, currency: string = '₹'): string {
  return `${currency}${amount.toLocaleString('en-IN')}`;
}
