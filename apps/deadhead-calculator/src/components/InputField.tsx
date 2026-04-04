'use client';

interface InputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'number';
  prefix?: string;
  suffix?: string;
  hint?: string;
}

export default function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  prefix,
  suffix,
  hint,
}: InputFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-warp-muted uppercase tracking-wide">
        {label}
      </label>
      <div className="flex items-center bg-warp-card border border-warp-border rounded-lg overflow-hidden focus-within:border-warp-accent/50 transition-colors">
        {prefix && (
          <span className="px-3 py-2.5 text-warp-muted text-sm border-r border-warp-border bg-warp-bg/50">
            {prefix}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-3 py-2.5 bg-transparent text-white text-sm placeholder-warp-muted/50 outline-none"
          min={type === 'number' ? '0' : undefined}
          step={type === 'number' ? 'any' : undefined}
        />
        {suffix && (
          <span className="px-3 py-2.5 text-warp-muted text-sm border-l border-warp-border bg-warp-bg/50">
            {suffix}
          </span>
        )}
      </div>
      {hint && <p className="text-xs text-warp-muted/70">{hint}</p>}
    </div>
  );
}
