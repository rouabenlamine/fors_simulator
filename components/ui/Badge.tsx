import { clsx } from "clsx";

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "orange" | "blue" | "green" | "red" | "yellow" | "purple";
}

const variantStyles = {
  default: "bg-slate-100 text-slate-700 border border-slate-200",
  orange: "bg-orange-100 text-orange-800 border border-orange-200",
  blue: "bg-blue-100 text-blue-800 border border-blue-200",
  green: "bg-green-100 text-green-800 border border-green-200",
  red: "bg-red-100 text-red-800 border border-red-200",
  yellow: "bg-yellow-100 text-yellow-800 border border-yellow-200",
  purple: "bg-purple-100 text-purple-800 border border-purple-200",
};

export function Badge({ children, className, variant = "default" }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
