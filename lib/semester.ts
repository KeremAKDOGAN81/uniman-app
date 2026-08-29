import type { Course } from '@/lib/types';

export function filterCoursesBySemester(courses: Course[], activeSemester: string): Course[] {
  const semester = activeSemester.trim();
  if (!semester) return courses;
  return courses.filter((course) => course.semester?.trim() === semester);
}
