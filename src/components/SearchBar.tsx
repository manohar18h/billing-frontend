import { Input } from "./ui/input";

interface Props {
  value: string;
  onChange: (val: string) => void;
}

export function SearchBar({ value, onChange }: Props) {
  return (
    <Input
      placeholder="Search for Customer..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="shadow-lg rounded-xl focus:ring-2 focus:ring-blue-400"
    />
  );
}
