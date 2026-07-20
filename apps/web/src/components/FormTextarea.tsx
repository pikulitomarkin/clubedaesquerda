import React from "react";

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export const FormTextarea = React.forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ label, error, id, className = "", ...props }, ref) => {
    const areaId = id ?? props.name;

    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={areaId} className="font-body text-xs font-semibold text-embroidery-dark">
          {label}
        </label>
        <textarea
          ref={ref}
          id={areaId}
          className={`font-body rounded-md border border-linen-600 bg-white/80 px-3 py-2 text-sm text-embroidery-black
            focus:outline-none focus:ring-2 focus:ring-terracotta-400 focus:border-terracotta-400
            disabled:opacity-60 ${error ? "border-red-500" : ""} ${className}`}
          aria-invalid={!!error}
          {...props}
        />
        {error && <span className="text-xs text-red-700">{error}</span>}
      </div>
    );
  },
);

FormTextarea.displayName = "FormTextarea";
