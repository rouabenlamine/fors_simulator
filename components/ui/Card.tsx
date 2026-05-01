import { clsx } from "clsx";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className, onClick }: CardProps) {
  return (
    <div
      className={clsx(
        "bg-white/80 backdrop-blur-xl rounded-[1.5rem] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]",
        onClick && "cursor-pointer hover:shadow-[0_20px_50px_rgba(79,70,229,0.15)] hover:-translate-y-1 transition-all duration-300",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx("px-5 py-4 border-b border-white/40 bg-white/30 backdrop-blur-sm", className)}>
      {children}
    </div>
  );
}

export function CardBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx("p-5", className)}>
      {children}
    </div>
  );
}
