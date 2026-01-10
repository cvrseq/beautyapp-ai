import React from 'react';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ChevronArrowProps {
  color?: string;
  size?: number;
  direction?: 'left' | 'right' | 'up' | 'down';
}

export const ChevronArrow = ({ 
  color = '#8E8E93', 
  size = 20,
  direction = 'right' 
}: ChevronArrowProps) => {
  const iconName = {
    right: 'chevron-forward' as keyof typeof Ionicons.glyphMap,
    left: 'chevron-back' as keyof typeof Ionicons.glyphMap,
    up: 'chevron-up' as keyof typeof Ionicons.glyphMap,
    down: 'chevron-down' as keyof typeof Ionicons.glyphMap,
  }[direction];

  return (
    <Ionicons 
      name={iconName} 
      size={size} 
      color={color} 
      style={styles.icon}
    />
  );
};

const styles = StyleSheet.create({
  icon: {
    opacity: 0.8,
  },
});

