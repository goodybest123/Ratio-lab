
export enum Level {
  LEVEL_1 = 'level1',
  LEVEL_2 = 'level2',
  LEVEL_3 = 'level3',
}

export interface Level2Challenge {
  potionName: string;
  ingredient1Name: string;
  ingredient2Name: string;
  baseRatio1: number;
  baseRatio2: number;
  scaleFactor: number;
  givenPart1: number;
  scaled_part_2: number;
  total_units: number;
  hint: string;
}

export interface Level2Response {
  scaled_part_2: number;
  total_units: number;
  hint: string;
}

export interface SphinxRiddle {
  riddleText: string;
  ingredient1Name: string;
  ingredient2Name: string;
  ratio1: number;
  ratio2: number;
  givenAmount: number;
  requiredAmount: number; // The answer
  explanation: string;
}
