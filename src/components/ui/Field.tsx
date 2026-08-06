export function Field({
  label,
  name,
  defaultValue,
  suffix,
  step = 1,
  min,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: number | string | null;
  suffix?: string;
  step?: number;
  min?: number;
  required?: boolean;
}) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <div className="relative">
        <input
          className={"input" + (suffix ? " pr-9" : "")}
          id={name}
          name={name}
          type="number"
          defaultValue={defaultValue ?? undefined}
          step={step}
          min={min}
          required={required}
        />
        {suffix && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[12px] pointer-events-none" style={{ color: "var(--faint)", fontFamily: "var(--font-display)" }}>
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

export function TextField({
  label,
  name,
  defaultValue,
  placeholder,
  required,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <input className="input" id={name} name={name} type={type} defaultValue={defaultValue ?? undefined} placeholder={placeholder} required={required} />
    </div>
  );
}

export function SelectField({
  label,
  name,
  defaultValue,
  options,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  options: { value: string; label: string }[];
  required?: boolean;
}) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <select className="input" id={name} name={name} defaultValue={defaultValue ?? undefined} required={required}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
