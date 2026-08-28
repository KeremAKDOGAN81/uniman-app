import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { useColors } from '@/components/ui';
import { padTime } from '@/lib/dates';
import { hapticSelect } from '@/lib/haptics';

const HOURS = Array.from({ length: 16 }, (_, index) => String(index + 7).padStart(2, '0'));
const MINUTES = Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, '0'));

function splitTime(value: string): { hour: string; minute: string } {
  const padded = padTime(value);
  const match = /^(\d{2}):(\d{2})$/.exec(padded);
  if (!match) return { hour: '09', minute: '00' };
  const minuteNum = Number(match[2]);
  const snapped = String(Math.min(55, Math.round(minuteNum / 5) * 5)).padStart(2, '0');
  return { hour: match[1], minute: snapped };
}

function WheelColumn({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (next: string) => void;
}) {
  const c = useColors();
  return (
    <View style={{ flex: 1, gap: 8 }}>
      <Text style={{ color: c.muted, fontSize: 12, fontWeight: '700', textAlign: 'center' }}>{label}</Text>
      <ScrollView
        style={{ maxHeight: 220, borderRadius: 16, backgroundColor: c.bg, borderWidth: 1, borderColor: c.line }}
        showsVerticalScrollIndicator={false}>
        {options.map((option) => {
          const selected = option === value;
          return (
            <Pressable
              key={option}
              onPress={() => {
                hapticSelect();
                onChange(option);
              }}
              style={{
                paddingVertical: 12,
                alignItems: 'center',
                backgroundColor: selected ? c.accent : 'transparent',
              }}>
              <Text style={{ color: selected ? c.onAccent : c.text, fontWeight: '800', fontSize: 18 }}>{option}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function TimePickerField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (time: string) => void;
}) {
  const c = useColors();
  const [open, setOpen] = useState(false);
  const display = useMemo(() => padTime(value), [value]);
  const initial = useMemo(() => splitTime(value), [value]);
  const [draftHour, setDraftHour] = useState(initial.hour);
  const [draftMinute, setDraftMinute] = useState(initial.minute);

  useEffect(() => {
    if (open) {
      const parts = splitTime(value);
      setDraftHour(parts.hour);
      setDraftMinute(parts.minute);
    }
  }, [open, value]);

  const confirm = () => {
    onChange(`${draftHour}:${draftMinute}`);
    setOpen(false);
  };

  return (
    <>
      <View style={{ gap: 6, flex: 1 }}>
        <Text
          style={{
            color: c.muted,
            fontSize: 12,
            fontWeight: '700',
            letterSpacing: 0.3,
            textTransform: 'uppercase',
          }}>
          {label}
        </Text>
        <Pressable
          onPress={() => setOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={`${label} seç`}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: c.bgElevated,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: c.line,
            paddingHorizontal: 14,
            paddingVertical: 14,
            opacity: pressed ? 0.88 : 1,
          })}>
          <Text style={{ color: c.text, fontSize: 18, fontWeight: '800', letterSpacing: 0.3 }}>{display}</Text>
          <Text style={{ fontSize: 18 }}>🕐</Text>
        </Pressable>
        <Text style={{ color: c.muted, fontSize: 11 }}>Dokun — saat seç</Text>
      </View>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' }} onPress={() => setOpen(false)} />
        <View
          style={{
            backgroundColor: c.card,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 24,
            gap: 16,
            borderWidth: 1,
            borderColor: c.line,
          }}>
          <Text style={{ color: c.text, fontSize: 18, fontWeight: '900', textAlign: 'center' }}>{label} seç</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <WheelColumn label="Saat" options={HOURS} value={draftHour} onChange={setDraftHour} />
            <WheelColumn label="Dakika" options={MINUTES} value={draftMinute} onChange={setDraftMinute} />
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable
              onPress={() => setOpen(false)}
              style={{
                flex: 1,
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: 'center',
                backgroundColor: c.bg,
                borderWidth: 1,
                borderColor: c.line,
              }}>
              <Text style={{ color: c.text, fontWeight: '800' }}>İptal</Text>
            </Pressable>
            <Pressable
              onPress={confirm}
              style={{
                flex: 1,
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: 'center',
                backgroundColor: c.accent,
              }}>
              <Text style={{ color: c.onAccent, fontWeight: '800' }}>Tamam</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}
