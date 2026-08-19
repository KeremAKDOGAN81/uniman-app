import { useEffect, useState } from 'react';
import { Text } from 'react-native';

export function CountNumber({
  value,
  color,
}: {
  value: number;
  color: string;
}) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const target = value;
    const started = performance.now();
    const duration = 520;
    let frame = 0;
    const tick = (stamp: number) => {
      const t = Math.min(1, (stamp - started) / duration);
      const eased = 1 - (1 - t) * (1 - t);
      setShown(Math.round(target * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <Text style={{ color, fontWeight: '800', fontSize: 52, letterSpacing: -1.5 }}>
      {value <= 0 ? '0' : String(shown)}
    </Text>
  );
}
