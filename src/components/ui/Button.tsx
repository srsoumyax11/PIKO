
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger";
  fullWidth?: boolean;
}

export function Button({ variant = "ghost", fullWidth, className = "", style, children, ...props }: ButtonProps) {
  const baseClass = `btn btn--${variant}`;
  const widthStyle = fullWidth ? { width: "100%" } : {};

  return (
    <button
      className={`${baseClass} ${className}`}
      style={{ ...widthStyle, ...style }}
      {...props}
    >
      {children}
    </button>
  );
}
