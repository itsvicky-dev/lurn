import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'cyber' | 'pulse' | 'dots';
  className?: string;
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  variant = 'default',
  className,
  text
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  };

  if (variant === 'cyber') {
    return (
      <div className={clsx('flex flex-col items-center space-y-3', className)}>
        <div className="relative">
          <motion.div
            className={clsx(
              'rounded-full border-2 border-primary/30',
              sizeClasses[size]
            )}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className={clsx(
              'absolute inset-0 rounded-full border-2 border-transparent border-t-primary',
              sizeClasses[size]
            )}
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            style={{ filter: 'drop-shadow(0 0 10px hsl(var(--primary) / 0.3))' }}
          />
          <motion.div
            className={clsx(
              'absolute inset-1 rounded-full bg-gradient-to-r from-primary/20 to-accent/20',
              size === 'sm' ? 'inset-0.5' : size === 'md' ? 'inset-1' : 'inset-1.5'
            )}
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </div>
        {text && (
          <motion.p 
            className={clsx(
              'font-robotic text-primary tracking-wider',
              textSizeClasses[size]
            )}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {text}
          </motion.p>
        )}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={clsx('flex flex-col items-center space-y-3', className)}>
        <div className="relative">
          <motion.div
            className={clsx(
              'rounded-full bg-gradient-to-r from-primary to-accent',
              sizeClasses[size]
            )}
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{ duration: 1, repeat: Infinity }}
            style={{ filter: 'drop-shadow(0 0 15px hsl(var(--primary) / 0.4))' }}
          />
          <motion.div
            className={clsx(
              'absolute inset-0 rounded-full bg-gradient-to-r from-primary/80 to-accent/80',
              sizeClasses[size]
            )}
            animate={{ 
              scale: [1, 1.5, 1],
              opacity: [0.5, 0, 0.5]
            }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
          />
        </div>
        {text && (
          <p className={clsx(
            'font-robotic text-muted-foreground',
            textSizeClasses[size]
          )}>
            {text}
          </p>
        )}
      </div>
    );
  }

  if (variant === 'dots') {
    return (
      <div className={clsx('flex flex-col items-center space-y-3', className)}>
        <div className="flex space-x-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className={clsx(
                'rounded-full bg-primary',
                size === 'sm' ? 'h-2 w-2' : size === 'md' ? 'h-3 w-3' : 'h-4 w-4'
              )}
              animate={{
                y: [0, -10, 0],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.1
              }}
            />
          ))}
        </div>
        {text && (
          <p className={clsx(
            'font-robotic text-muted-foreground',
            textSizeClasses[size]
          )}>
            {text}
          </p>
        )}
      </div>
    );
  }

  // Default spinner
  return (
    <div className={clsx('flex flex-col items-center space-y-3', className)}>
      <motion.div
        className={clsx(
          'rounded-full border-2 border-muted border-t-primary',
          sizeClasses[size]
        )}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        style={{ filter: 'drop-shadow(0 0 8px hsl(var(--primary) / 0.25))' }}
      />
      {text && (
        <p className={clsx(
          'font-robotic text-muted-foreground',
          textSizeClasses[size]
        )}>
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;