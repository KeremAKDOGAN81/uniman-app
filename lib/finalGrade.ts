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
      text: `Yıl içi notun yetmiyor — finalden en az ${requiredFinal} puan gerekir.`,
    };
  }
  if (requiredFinal > 75) {
    return {
      tone: 'hard',
      text: `Finalden en az ${requiredFinal} puan alman gerekiyor.`,
    };
  }
  if (requiredFinal > 40) {
    return {
      tone: 'ok',
      text: `Finalden en az ${requiredFinal} puan hedefle.`,
    };
  }
  if (requiredFinal > 0) {
    return {
      tone: 'easy',
      text: `Finalden ${requiredFinal} puan yeterli.`,
    };
  }
  return {
    tone: 'passed',
    text: 'Yıl içi notun geçmeye yetiyor — final şart değil.',
  };
}
