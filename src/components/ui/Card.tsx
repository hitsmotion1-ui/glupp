interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export function Card({
  hover = false,
  className = "",
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={`bg-glupp-card border border-glupp-border rounded-glupp-lg shadow-glupp ${
        hover
          ? "cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
          : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
