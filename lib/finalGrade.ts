export type ActivityInput = {
  score: number;
  weight: number;
};

export type FinalCalcOk = {
  ok: true;
  yearPoints: number;
  yearWeight: number;
  finalWeight: number;
  requiredFinal: number;
};

export type FinalCalcErr = {
  ok: false;
  error: string;
};

export function calculateRequiredFinal(input: {
  passing: number;
  midtermScore: number;
  midtermWeight: number;
  extras: ActivityInput[];
}): FinalCalcOk | FinalCalcErr {
  let yearPoints = input.midtermScore * (input.midtermWeight / 100);
  let yearWeight = input.midtermWeight;

  for (const extra of input.extras) {
    yearPoints += extra.score * (extra.weight / 100);
    yearWeight += extra.weight;
  }

  const finalWeight = 100 - yearWeight;
  if (finalWeight <= 0) {
    return { ok: false, error: "Yüzdeler toplamı 100'ü geçemez!" };
  }

  const requiredFinal = Math.ceil((input.passing - yearPoints) / (finalWeight / 100));
  return {
    ok: true,
    yearPoints,
    yearWeight,
    finalWeight,
    requiredFinal,
  };
}

export function finalMessage(requiredFinal: number): {
  text: string;
  tone: 'critical' | 'hard' | 'ok' | 'easy' | 'passed';
} {
  if (requiredFinal > 100) {
    return {
      tone: 'critical',
      text: `Kritik durum: Finalden ${requiredFinal} alman lazım. Mucizelere ihtiyacımız var!`,
    };
  }
  if (requiredFinal > 75) {
    return {
      tone: 'hard',
      text: `Zorlu görev: Finalden en az ${requiredFinal} almalısın. Sıkı çalışman gerekecek!`,
    };
  }
  if (requiredFinal > 40) {
    return {
      tone: 'ok',
      text: `Hedef: Finalden en az ${requiredFinal} almalısın. Rahatlıkla yapabilirsin!`,
    };
  }
  if (requiredFinal > 0) {
    return {
      tone: 'easy',
      text: `Çok rahat: Finalden sadece ${requiredFinal} alman yetiyor.`,
    };
  }
  return {
    tone: 'passed',
    text: 'Geçtin bile: Finalden 0 alsan da geçiyorsun.',
  };
}
