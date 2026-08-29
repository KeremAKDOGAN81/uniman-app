export const SWIPE_TABS = [
  { key: 'index', title: 'Ana Sayfa', subtitle: 'Günün özeti ve derslerin', href: '/(tabs)/' },
  { key: 'schedule', title: 'Program', subtitle: 'Haftalık ders saatleri', href: '/(tabs)/schedule' },
  { key: 'calculator', title: 'Hesap', subtitle: 'Not ortalaması ve final', href: '/(tabs)/calculator' },
  { key: 'notes', title: 'Notlar', subtitle: 'Ders notları ve etiketler', href: '/(tabs)/notes' },
  { key: 'track', title: 'Takip', subtitle: 'Hatırlatmalar ve devamsızlık', href: '/(tabs)/track' },
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
