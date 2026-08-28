export const SWIPE_TABS = [
  { key: 'index', title: 'Ana Sayfa', href: '/(tabs)/' },
  { key: 'schedule', title: 'Program', href: '/(tabs)/schedule' },
  { key: 'calculator', title: 'Hesap', href: '/(tabs)/calculator' },
  { key: 'notes', title: 'Notlar', href: '/(tabs)/notes' },
  { key: 'track', title: 'Takip', href: '/(tabs)/track' },
] as const;

export type SwipeTabKey = (typeof SWIPE_TABS)[number]['key'];

export function getAdjacentTabs(key: SwipeTabKey) {
  const index = SWIPE_TABS.findIndex((tab) => tab.key === key);
  const len = SWIPE_TABS.length;
  return {
    current: SWIPE_TABS[index],
    prev: SWIPE_TABS[(index - 1 + len) % len],
    next: SWIPE_TABS[(index + 1) % len],
  };
}

export function hrefForSwipeTab(key: SwipeTabKey): string {
  return SWIPE_TABS.find((tab) => tab.key === key)?.href ?? '/(tabs)/';
}
