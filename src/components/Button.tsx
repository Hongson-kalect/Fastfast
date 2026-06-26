// @/components/Button.tsx
import {
  ActivityIndicator,
  TouchableOpacity,
  TouchableOpacityProps,
} from "react-native";
import { ThemedText } from "./themed-text";

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: "primary" | "secondary";
  loading?: boolean;
  className?: string;
}

export const Button = ({
  title,
  variant = "primary",
  loading = false,
  className = "",
  ...props
}: ButtonProps) => {
  const baseStyle =
    "h-14 rounded-2xl flex-row items-center justify-center px-6 my-2";
  const variantStyle =
    variant === "primary"
      ? "bg-brand shadow-lg shadow-brand/20"
      : "bg-surface border border-slate-700";

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={loading}
      className={`${baseStyle} ${variantStyle} ${loading ? "opacity-60" : ""} ${className}`}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color="#38BDF8" />
      ) : (
        <ThemedText
          color={variant === "primary" ? "white" : "textSecondary"}
          className={`font-bold`}
        >
          {title}
        </ThemedText>
      )}
    </TouchableOpacity>
  );
};
