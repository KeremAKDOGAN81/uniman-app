import type { UserProfile } from '@/lib/types';

export function isProfileComplete(profile: UserProfile | null): boolean {
  if (!profile) return false;
  return (
    profile.firstName.trim().length > 0 &&
    profile.lastName.trim().length > 0 &&
    profile.department.trim().length > 0
  );
}

export function displayName(profile: UserProfile | null): string {
  if (!profile) return 'UniMan';
  const first = profile.firstName.trim();
  const last = profile.lastName.trim();
  if (first && last) return `${first} ${last}`;
  if (first) return first;
  return 'UniMan';
}

export function profileSubtitle(profile: UserProfile | null): string | null {
  if (!profile) return null;
  const parts = [profile.department.trim(), profile.university.trim(), profile.year.trim()].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : null;
}

export function emptyProfile(): UserProfile {
  return {
    firstName: '',
    lastName: '',
    department: '',
    university: '',
    year: '',
  };
}
