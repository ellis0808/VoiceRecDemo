const ArpabetTwoCharacter = new Set([
  "AA",
  "AE",
  "AH",
  "AO",
  "AW",
  "AY",
  "EH",
  "ER",
  "EY",
  "IH",
  "IY",
  "OW",
  "OY",
  "UH",
  "CH",
  "DH",
  "HH",
  "JH",
  "NG",
  "SH",
  "TH",
  "ZH"
]);

const ArpabetVowels = new Set([
  "AA",
  "AE",
  "AH",
  "AO",
  "AW",
  "AY",
  "EH",
  "ER",
  "EY",
  "IH",
  "IY",
  "OW",
  "OY",
  "UH",
  "UW"
]);

const getPhonemeWeight = (
  phoneme: string,
  targetPhonemes?: Set<string>
): number => {
  const basePhoneme = phoneme.replace(/[0-2]$/, "");

  const isVowel = ArpabetVowels.has(basePhoneme);
  let weight = isVowel ? 2 : 1;

  if (
    targetPhonemes &&
    (targetPhonemes.has(phoneme) || targetPhonemes.has(basePhoneme))
  )
    weight *= 2;

  return weight;
};

const getPhonemeArrayWeight = (
  array: string[],
  targetPhonemes?: Set<string>
): number => {
  return array.reduce((sum, p) => sum + getPhonemeWeight(p, targetPhonemes), 0);
};

const levenshteinDistance = (
  phonemeArray1: string[],
  phonemeArray2: string[],
  targetPhonemes?: string[] | Set<string>
): number => {
  const m = phonemeArray1.length;
  const n = phonemeArray2.length;

  const targets = targetPhonemes
    ? targetPhonemes instanceof Set
      ? targetPhonemes
      : new Set(targetPhonemes)
    : undefined;

  const weight1 = phonemeArray1.map((phoneme) =>
    getPhonemeWeight(phoneme, targets)
  );
  const weight2 = phonemeArray2.map((phoneme) =>
    getPhonemeWeight(phoneme, targets)
  );

  const matrix: number[][] | undefined = Array.from({ length: m + 1 }, () =>
    new Array<number>(n + 1).fill(0)
  );

  for (let i = 1; i <= m; ++i)
    matrix[i]![0] = matrix[i - 1]![0]! + weight1[i - 1]!;
  for (let j = 1; j <= n; ++j)
    matrix[0]![j] = matrix[0]![j - 1]! + weight2[j - 1]!;

  for (let i = 1; i <= m; ++i) {
    for (let j = 1; j <= n; ++j) {
      if (phonemeArray1[i - 1] === phonemeArray2[j - 1]) {
        matrix[i]![j] = matrix[i - 1]![j - 1]!;
      } else {
        const deleteCost = matrix[i - 1]![j]! + weight1[i - 1]!;
        const insertCost = matrix[i]![j - 1]! + weight2[j - 1]!;
        const substituteCost =
          matrix[i - 1]![j - 1]! + Math.max(weight1[i - 1]!, weight2[j - 1]!);

        matrix[i]![j] = Math.min(deleteCost, insertCost, substituteCost);
      }
    }
  }
  return matrix[m]![n]!;
};

export const arpabetCheck = (
  array1: string[],
  array2: string[],
  targetPhonemes?: string[] | Set<string>
): number => {
  console.log("str1", array1, "str2", array2);

  const targets = targetPhonemes
    ? targetPhonemes instanceof Set
      ? targetPhonemes
      : new Set(targetPhonemes)
    : undefined;

  const weight1 = getPhonemeArrayWeight(array1, targets);
  const weight2 = getPhonemeArrayWeight(array2, targets);
  const maxWeight = Math.max(weight1, weight2);

  if (maxWeight === 0) return 1.0;

  const distance = levenshteinDistance(array1, array2, targets);
  return Math.max(0, (maxWeight - distance) / maxWeight);
};

export const simpleCheckAnswer = (
  target: string[],
  userAnswer: string[]
): boolean => {
  if (JSON.stringify(target) === JSON.stringify(userAnswer)) {
    return true;
  } else return false;
};

export default arpabetCheck;
