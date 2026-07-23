import React from "react";

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, id, className = "", ...props }, ref) => {
    const inputId = id ?? props.name;

    return (
      <div className="flex flex-col gap-1">
        {/* Rótulo em caixa alta, como no design do cliente (Login.jpg:
            "CPF" / "SENHA" bordados acima de cada campo). */}
        <label
          htmlFor={inputId}
          className="font-marker text-sm uppercase tracking-wide text-embroidery-dark"
        >
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          className={`font-body rounded-md border border-linen-600 bg-white/80 px-3 py-2 text-sm text-embroidery-black
            focus:outline-none focus:ring-2 focus:ring-terracotta-400 focus:border-terracotta-400
            disabled:opacity-60 ${error ? "border-red-500" : ""} ${className}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {error && (
          <span id={`${inputId}-error`} className="text-xs text-red-700">
            {error}
          </span>
        )}
      </div>
    );
  },
);

FormField.displayName = "FormField";
