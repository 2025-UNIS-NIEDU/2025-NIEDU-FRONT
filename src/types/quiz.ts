export type Level = {
  code: "N" | "E" | "I";
  name: string;
};

export type Question = {
  id: number;
  question: string;
  options: string[];
  answer: string;
};
