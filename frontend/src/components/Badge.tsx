type BadgeProps = {
  label: string;
  tone?: "primary" | "success" | "warning" | "neutral";
};

const Badge = ({ label, tone = "neutral" }: BadgeProps) => {
  return <span className={`badge badge--${tone}`}>{label}</span>;
};

export default Badge;

