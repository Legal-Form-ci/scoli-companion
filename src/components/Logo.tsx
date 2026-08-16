const logoImage = "/logo-scoly.png";

interface LogoProps {
  variant?: "default" | "white";
  size?: "sm" | "md" | "lg";
  showSlogan?: boolean;
}

const Logo = ({ variant = "default", size = "md", showSlogan = false }: LogoProps) => {
  const sizeClasses = {
    sm: "h-8",
    md: "h-10",
    lg: "h-14",
  };

  const sloganSizes = {
    sm: "text-[7px]",
    md: "text-[8px]",
    lg: "text-[10px]",
  };

  return (
    <div className="flex flex-col">
      <img
        src={logoImage}
        alt="Scoly"
        className={`${sizeClasses[size]} w-auto object-contain ${
          variant === "white" ? "brightness-0 invert" : ""
        }`}
        loading="eager"
        // @ts-ignore
        fetchpriority="high"
        decoding="sync"
      />
      {showSlogan && (
        <span
          className={`${sloganSizes[size]} ${
            variant === "white" ? "text-primary-foreground/80" : "text-muted-foreground"
          } mt-0.5 font-medium tracking-tight whitespace-nowrap`}
        >
          Scolaire & Bureautique — Livraison gratuite
        </span>
      )}
    </div>
  );
};

export default Logo;
