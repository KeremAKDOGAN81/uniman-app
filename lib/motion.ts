export const motionSpring = {
  tab: { damping: 22, stiffness: 220, mass: 0.92 },
  press: { damping: 18, stiffness: 420 },
  soft: { damping: 20, stiffness: 280 },
} as const;

export const motionTiming = {
  tabExit: 260,
  tabEnter: 300,
  fade: 240,
} as const;
