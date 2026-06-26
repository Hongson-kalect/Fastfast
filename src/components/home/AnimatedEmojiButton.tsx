// components/AnimatedEmojiButton.tsx
import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, SharedValue } from 'react-native-reanimated';
import { RADIAL_ANGLES, RADIUS } from '@/constants/data';

interface Props {
  index: number;
  emoji: string;
  isOpen: SharedValue<boolean>;
  onSelect: (emoji: string) => void;
}

export const AnimatedEmojiButton = ({ index, emoji, isOpen, onSelect }: Props) => {
  const animatedStyle = useAnimatedStyle(() => {
    // Chuyển đổi góc từ Độ sang Radian
    const angleRad = (RADIAL_ANGLES[index] * Math.PI) / 180;
    
    // Nếu mở thì nhân với Bán kính, nếu đóng thì thu về tâm (0)
    const distance = isOpen.value ? RADIUS : 0;
    
    const translateX = distance * Math.cos(angleRad);
    const translateY = distance * Math.sin(angleRad); // Trong RN, Y âm là bay lên trên
    
    return {
      transform: [
        { translateX: withSpring(translateX, { damping: 12, stiffness: 90 }) },
        { translateY: withSpring(translateY, { damping: 12, stiffness: 90 }) },
        { scale: withSpring(isOpen.value ? 1.2 : 0, { damping: 10 }) },
      ],
      opacity: withSpring(isOpen.value ? 1 : 0),
    };
  });

  return (
    <Animated.View 
      style={[animatedStyle, { position: 'absolute' }]}
    >
      <TouchableOpacity 
        activeOpacity={0.7}
        onPress={() => onSelect(emoji)}
        className="w-12 h-12 bg-neutral-800 rounded-full items-center justify-center border border-neutral-700 shadow-lg shadow-black/50"
      >
        <Text className="text-2xl">{emoji}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};