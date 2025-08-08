import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'cyber' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  glow?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  glow = false,
  className,
  disabled,
  children,
  onClick,
  type,
  form,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium font-robotic tracking-wide transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background relative overflow-hidden';

  const variantClasses = {
    primary: 'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 active:from-primary-800 active:to-primary-900 shadow-glow hover:shadow-glow-lg',
    secondary: 'bg-card text-card-foreground border border-border hover:bg-accent-semantic hover:text-accent-foreground shadow-md hover:shadow-lg',
    outline: 'border-2 border-primary-500 bg-transparent text-primary-600 dark:text-primary-400 hover:bg-primary-500 hover:text-white hover:shadow-glow',
    ghost: 'hover:bg-accent-semantic hover:text-accent-foreground',
    cyber: 'bg-gradient-to-r from-primary-600 via-accent-500 to-primary-600 bg-size-200 animate-gradient-x text-white shadow-cyber hover:shadow-neon',
    destructive: 'bg-gradient-to-r from-error-600 to-error-700 text-white hover:from-error-700 hover:to-error-800 shadow-glow hover:shadow-glow-lg',
  };

  const sizeClasses = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 py-2 text-sm',
    lg: 'h-12 px-8 text-base',
  };

  const glowClasses = glow ? 'shadow-glow hover:shadow-glow-lg' : '';

  return (
    <motion.button
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        glowClasses,
        className
      )}
      disabled={disabled || loading}
      onClick={onClick}
      type={type}
      form={form}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Background animation for cyber variant */}
      {variant === 'cyber' && (
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600 via-accent-500 to-primary-600 opacity-0 hover:opacity-100 transition-opacity duration-300" />
      )}

      {/* Content */}
      <div className="relative z-10 flex items-center space-x-2">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          icon && iconPosition === 'left' && (
            <span className="flex-shrink-0">{icon}</span>
          )
        )}
        
        <span>{children}</span>
        
        {!loading && icon && iconPosition === 'right' && (
          <span className="flex-shrink-0">{icon}</span>
        )}
      </div>

      {/* Glow effect */}
      {glow && (
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary-500/20 to-accent-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-sm" />
      )}
    </motion.button>
  );
};

export default Button;