import React from "react";
import { cn } from "@/lib/utils";

interface CampusVoteLogoProps {
  variant?: "default" | "dark" | "light";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const CampusVoteLogo: React.FC<CampusVoteLogoProps> = ({
  variant = "default",
  size = "md",
  className,
}) => {
  const sizeClasses = {
    sm: {
      logo: "w-9 h-9",
      title: "text-sm",
      subtitle: "text-[9px]",
    },
    md: {
      logo: "w-10 h-10",
      title: "text-base",
      subtitle: "text-[10px]",
    },
    lg: {
      logo: "w-12 h-12",
      title: "text-lg",
      subtitle: "text-[10px]",
    },
  };

  const theme =
    variant === "light"
      ? {
          title: "text-white",
          subtitle: "text-white/60",
        }
      : {
          title: "text-text-primary",
          subtitle: "text-text-secondary",
        };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <img
        src="/image/dbit logo.jpeg"
        alt="DBIT Logo"
        className={cn(
          "rounded-xl object-cover shrink-0",
          sizeClasses[size].logo
        )}
      />
      <div className="flex flex-col">
        <span
          className={cn(
            "font-semibold tracking-wide",
            sizeClasses[size].title,
            theme.title
          )}
        >
          Don Bosco Institute of Technology
        </span>
        <span
          className={cn(
            "font-medium uppercase tracking-widest",
            sizeClasses[size].subtitle,
            theme.subtitle
          )}
        >
          Student Council Election 2026
        </span>
      </div>
    </div>
  );
};
