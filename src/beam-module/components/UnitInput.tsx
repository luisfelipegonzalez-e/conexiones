import React from 'react';
import { UnitSystem, convert, toMetric, UNITS } from '../utils/units';

interface UnitInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number;
  type: keyof typeof UNITS.metric;
  system: UnitSystem;
  onChange: (value: number) => void;
}

export default function UnitInput({ value, type, system, onChange, ...props }: UnitInputProps) {
  const displayValue = convert(value, type, system);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      onChange(toMetric(val, type, system));
    }
  };

  return (
    <input
      {...props}
      value={displayValue}
      onChange={(e) => handleChange(e as any)}
    />
  );
}
