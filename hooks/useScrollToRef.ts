import { useEffect, useRef, type RefObject } from 'react';
import { ScrollView, View, findNodeHandle } from 'react-native';

export function useScrollToRef(scrollRef: RefObject<ScrollView | null>, targetRef: RefObject<View | null>, trigger: unknown) {
  useEffect(() => {
    if (trigger === null || trigger === undefined || trigger === false) return;
    const scrollNode = scrollRef.current;
    const targetNode = targetRef.current;
    if (!scrollNode || !targetNode) return;

    requestAnimationFrame(() => {
      const scrollHandle = findNodeHandle(scrollNode);
      if (!scrollHandle) return;
      targetNode.measureLayout(
        scrollHandle,
        (_x, y) => scrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true }),
        () => {}
      );
    });
  }, [scrollRef, targetRef, trigger]);
}
