export type TabTransitionDirection = 'forward' | 'back';

let pendingDirection: TabTransitionDirection | null = null;

export function setTabTransitionDirection(direction: TabTransitionDirection) {
  pendingDirection = direction;
}

export function consumeTabTransitionDirection(): TabTransitionDirection | null {
  const direction = pendingDirection;
  pendingDirection = null;
  return direction;
}
