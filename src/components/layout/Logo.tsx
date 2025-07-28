import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const Logo = ({ className, size = 'md', showText = true }: LogoProps) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };
  
  return (
    <div className={cn(
      "flex items-center gap-3 group cursor-pointer",
      className
    )}>
      <div
        className="relative flex items-center"
        style={{ background: "transparent" }} // Ensure container is transparent
      >
        <img 
          src="/event-sync-logo.png" 
          alt="EventSync TocH Logo" 
          className={cn(
            sizeClasses[size],
            "object-contain relative z-10 transition-all duration-300",
            "group-hover:scale-110 group-hover:rotate-3",
            "drop-shadow-sm group-hover:drop-shadow-md"
          )}
          style={{ background: "transparent" }} // Ensure image is transparent
        />
      </div>
      {showText && (
        <h1 className={cn(
          textSizeClasses[size],
          "font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent",
          "group-hover:from-primary/90 group-hover:to-primary/60 transition-all duration-300",
          "tracking-tight"
        )}>
          EventSync TocH
        </h1>
      )}
    </div>
  );
};