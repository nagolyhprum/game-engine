export const shuffle = <T>(input: T[]): T[] => {
  for (let from = 0; from < input.length; from++) {
    const temp = input[from]!;
    const to = Math.floor(Math.random() * input.length);
    input[from] = input[to]!;
    input[to] = temp;
  }
  return input;
};
