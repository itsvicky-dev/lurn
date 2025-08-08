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

  const dotSizeClasses = {
    sm: 'h-1.5 w-1.5',
    md: 'h-2 w-2',
    lg: 'h-3 w-3',
    xl: 'h-4 w-4'
  };

  if (variant === 'cyber') {
    return (
      <div className={clsx('flex flex-col items-center justify-center space-y-3', className)}>
        <div className="relative flex items-center justify-center">
          {/* Outer ring */}
          <motion.div
            className={clsx(
              'rounded-full border-2 border-primary-500/30',
              sizeClasses[size]
            )}
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />
          {/* Inner spinning ring */}
          <motion.div
            className={clsx(
              'absolute inset-0 rounded-full border-2 border-transparent border-t-primary-500',
              sizeClasses[size]
            )}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{ 
              filter: 'drop-shadow(0 0 8px hsl(var(--primary) / 0.4))',
              boxShadow: '0 0 15px hsl(var(--primary) / 0.2)'
            }}
          />
          {/* Pulsing core */}
          <motion.div
            className={clsx(
              'absolute rounded-full bg-gradient-to-r from-primary-500/30 to-accent-500/30',
              size === 'sm' ? 'inset-1' : size === 'md' ? 'inset-1.5' : size === 'lg' ? 'inset-2' : 'inset-3'
            )}
            animate={{ 
              scale: [0.8, 1.1, 0.8],
              opacity: [0.4, 0.8, 0.4]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
        {text && (
          <motion.p 
            className={clsx(
              'font-robotic text-primary-600 dark:text-primary-400 tracking-wider text-center',
              textSizeClasses[size]
            )}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            {text}
          </motion.p>
        )}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={clsx('flex flex-col items-center justify-center space-y-3', className)}>
        <div className="relative flex items-center justify-center">
          {/* Main pulsing circle */}
          <motion.div
            className={clsx(
              'rounded-full bg-gradient-to-r from-primary-500 to-accent-500',
              sizeClasses[size]
            )}
            animate={{ 
              scale: [1, 1.15, 1],
              opacity: [0.8, 1, 0.8]
            }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ 
              filter: 'drop-shadow(0 0 12px hsl(var(--primary) / 0.5))',
              boxShadow: '0 0 20px hsl(var(--primary) / 0.3)'
            }}
          />
          {/* Expanding ring effect */}
          <motion.div
            className={clsx(
              'absolute inset-0 rounded-full bg-gradient-to-r from-primary-400/60 to-accent-400/60',
              sizeClasses[size]
            )}
            animate={{ 
              scale: [1, 1.8, 1],
              opacity: [0.6, 0, 0.6]
            }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.3, ease: 'easeOut' }}
          />
          {/* Secondary expanding ring */}
          <motion.div
            className={clsx(
              'absolute inset-0 rounded-full bg-gradient-to-r from-primary-300/40 to-accent-300/40',
              sizeClasses[size]
            )}
            animate={{ 
              scale: [1, 2.2, 1],
              opacity: [0.4, 0, 0.4]
            }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.6, ease: 'easeOut' }}
          />
        </div>
        {text && (
          <motion.p 
            className={clsx(
              'font-robotic text-muted-foreground text-center',
              textSizeClasses[size]
            )}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            {text}
          </motion.p>
        )}
      </div>
    );
  }

  if (variant === 'dots') {
    const bounceHeight = size === 'sm' ? -6 : size === 'md' ? -8 : size === 'lg' ? -10 : -12;
    const spacing = size === 'sm' ? 'space-x-1' : size === 'md' ? 'space-x-1.5' : 'space-x-2';
    
    return (
      <div className={clsx('flex flex-col items-center justify-center space-y-3', className)}>
        <div className={clsx('flex items-center', spacing)}>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className={clsx(
                'rounded-full bg-gradient-to-r from-primary-500 to-primary-600',
                dotSizeClasses[size]
              )}
              animate={{
                y: [0, bounceHeight, 0],
                opacity: [0.6, 1, 0.6],
                scale: [1, 1.1, 1]
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.15,
                ease: 'easeInOut'
              }}
              style={{ 
                filter: 'drop-shadow(0 0 4px hsl(var(--primary) / 0.4))',
                boxShadow: '0 0 8px hsl(var(--primary) / 0.2)'
              }}
            />
          ))}
        </div>
        {text && (
          <motion.p 
            className={clsx(
              'font-robotic text-muted-foreground text-center',
              textSizeClasses[size]
            )}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            {text}
          </motion.p>
        )}
      </div>
    );
  }

  // Default spinner
  return (
    <div className={clsx('flex flex-col items-center justify-center space-y-3', className)}>
      <div className="relative flex items-center justify-center">
        <motion.div
          className={clsx(
            'rounded-full border-2 border-muted border-t-primary-500',
            sizeClasses[size]
          )}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          style={{ 
            filter: 'drop-shadow(0 0 6px hsl(var(--primary) / 0.3))',
            boxShadow: '0 0 12px hsl(var(--primary) / 0.15)'
          }}
        />
        {/* Subtle inner glow */}
        <motion.div
          className={clsx(
            'absolute rounded-full bg-primary-500/10',
            size === 'sm' ? 'inset-1' : size === 'md' ? 'inset-1.5' : size === 'lg' ? 'inset-2' : 'inset-3'
          )}
          animate={{ 
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
      {text && (
        <motion.p 
          className={clsx(
            'font-robotic text-muted-foreground text-center',
            textSizeClasses[size]
          )}
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
};

export default LoadingSpinner;