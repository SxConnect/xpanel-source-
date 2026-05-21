import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'success';
    size?: 'sm' | 'md' | 'lg';
    children: ReactNode;
    isLoading?: boolean;
}

export function Button({
    variant = 'primary',
    size = 'md',
    children,
    isLoading,
    className,
    disabled,
    ...props
}: ButtonProps) {
    const sizeClasses = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2',
        lg: 'px-6 py-3 text-lg',
    };

    return (
        <button
            className={cn(
                'btn',
                `btn-${variant}`,
                sizeClasses[size],
                isLoading && 'opacity-50 cursor-not-allowed',
                className
            )}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? 'Carregando...' : children}
        </button>
    );
}
