import React from "react";

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const FormSelect = React.forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ label, error, options, id, className = "", ...props }, ref) => {
    const selectId = id ?? props.name;

    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={selectId} className="font-body text-xs font-semibold text-embroidery-dark">
          {label}
        </label>
        <select
          ref={ref}
          id={selectId}
          className={`font-body rounded-md border border-linen-600 bg-white/80 px-3 py-2 text-sm text-embroidery-black
            focus:outline-none focus:ring-2 focus:ring-terracotta-400 focus:border-terracotta-400
            disabled:opacity-60 ${error ? "border-red-500" : ""} ${className}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${selectId}-error` : undefined}
          {...props}
        >
          <option value="">Selecione...</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <span id={`${selectId}-error`} className="text-xs text-red-700">
            {error}
          </span>
        )}
      </div>
    );
  },
);

FormSelect.displayName = "FormSelect";
