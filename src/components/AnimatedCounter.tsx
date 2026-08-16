import { useCountUp } from "@/hooks/useCountUp";

interface Props {
  value: number;
  suffix?: string;
  prefix?: string;
  format?: "short" | "full";
  className?: string;
  duration?: number;
}

const formatShort = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".0", "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(".0", "")}K`;
  return String(n);
};

const AnimatedCounter = ({
  value,
  suffix = "",
  prefix = "",
  format = "short",
  className = "",
  duration = 1500,
}: Props) => {
  const { value: animated, ref } = useCountUp(value, duration);
  const display =
    format === "short"
      ? formatShort(animated)
      : new Intl.NumberFormat("fr-FR").format(animated);

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
};

export default AnimatedCounter;
