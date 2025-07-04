type Data = {
  name: string;
  age: number;
  num1: number;
  num2: number;
  total: number;
};

export function greetUser(
  name: string,
  age: number,
  num1: number,
  num2: number
): Data {
  const total = num1 + num2;
  return {
    name,
    age,
    num1,
    num2,
    total,
  };
}
