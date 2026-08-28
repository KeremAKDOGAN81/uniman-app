import { computeGpa4, formatGpa } from '@/lib/gpa';
import type { Course, ExamTarget } from '@/lib/types';

export type StatCopy = {
  label: string;
  value: string;
  hint: string;
};

export function statAgno(courses: Course[]): StatCopy {
  if (courses.length === 0) {
    return { label: 'AGNO', value: 'Hesaplanmadı', hint: 'Ders ekleyince görünür' };
  }
  return {
    label: 'AGNO',
    value: formatGpa(computeGpa4(courses)),
    hint: `${courses.length} ders · 4.00 sistem`,
  };
}

export function statLatestFinal(targets: ExamTarget[]): StatCopy {
  if (targets.length === 0) {
    return { label: 'Final hedefi', value: 'Hesaplanmadı', hint: 'Vize ve yüzdeleri gir' };
  }
  const latest = targets[0];
  const value =
    latest.requiredFinal <= 0 ? 'Geçiyorsun' : `${latest.requiredFinal} puan gerekli`;
  return { label: 'Son final', value, hint: latest.name };
}

export function statOpenReminders(count: number): StatCopy {
  if (count === 0) {
    return { label: 'Hatırlatma', value: 'Yok', hint: 'Planlı sınav veya ödev yok' };
  }
  return { label: 'Hatırlatma', value: String(count), hint: 'Açık hatırlatma' };
}

export function statAttendanceWarnings(count: number): StatCopy {
  if (count === 0) {
    return { label: 'Devamsızlık', value: 'Temiz', hint: 'Limit uyarısı yok' };
  }
  return {
    label: 'Devamsızlık',
    value: String(count),
    hint: count === 1 ? 'Ders hakkı dolmak üzere' : 'Ders hakkı dolmak üzere',
  };
}

export function statNotesTotal(count: number): StatCopy {
  if (count === 0) {
    return { label: 'Not', value: 'Yok', hint: 'İlk notunu aşağıdan ekle' };
  }
  return { label: 'Not', value: String(count), hint: 'Kayıtlı not' };
}

export function statNoteTags(tagCount: number): StatCopy {
  if (tagCount === 0) {
    return { label: 'Ders etiketi', value: 'Yok', hint: 'Notlara ders adı bağla' };
  }
  return { label: 'Ders etiketi', value: String(tagCount), hint: 'Farklı ders' };
}

export function attendanceSubtitle(used: number, limit: number): string {
  if (limit <= 0) return 'Limit tanımlı değil';
  if (used >= limit) return `${used}/${limit} hak — limit doldu`;
  const left = limit - used;
  return `${used}/${limit} hak kullanıldı · ${left} kaldı`;
}

export function weeklySummaryLine(input: {
  scheduleCount: number;
  examCount: number;
  gpaLabel: string | null;
  attendanceWarnings: number;
}): string {
  if (input.scheduleCount === 0 && !input.gpaLabel && input.examCount === 0) {
    return 'Program ve ders ekleyince haftalık özet dolacak';
  }
  const parts: string[] = [];
  if (input.scheduleCount > 0) {
    parts.push(`Haftada ${input.scheduleCount} ders`);
  } else {
    parts.push('Program boş');
  }
  if (input.examCount > 0) {
    parts.push(`7 gün içinde ${input.examCount} sınav`);
  }
  if (input.gpaLabel) {
    parts.push(`AGNO ${input.gpaLabel}`);
  }
  if (input.attendanceWarnings > 0) {
    parts.push(`${input.attendanceWarnings} ders devamsızlık limitinde`);
  }
  return parts.join(' · ');
}
