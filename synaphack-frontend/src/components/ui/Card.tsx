import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  roleColor?: 'purple' | 'blue' | 'green' | 'orange';
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  hover = true,
  roleColor = 'purple'
}) => {
  const getCardClasses = () => {
    const colorMap = {
      purple: 'neon-card',
      blue: 'neon-card-blue',
      green: 'neon-card-green',
      orange: 'neon-card-orange'
    };
    return colorMap[roleColor];
  };

  return (
    <motion.div
      whileHover={hover ? { scale: 1.02, y: -5 } : {}}
      className={`${getCardClasses()} rounded-lg p-6 ${className}`}
    >
      {children}
    </motion.div>
  );
};