// @/components/Card.tsx
import { View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  className?: string;
}

export const Card = ({ className = '', ...props }: CardProps) => {
  return (
    <View 
      className={`bg-surface p-4 rounded-2xl border border-slate-800/60 shadow-sm ${className}`} 
      {...props} 
    />
  );
};