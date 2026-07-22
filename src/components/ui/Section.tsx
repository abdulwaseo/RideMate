import React from 'react';
import { cn } from '../../utils/cn';

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  showGrid?: boolean;
  glow?: 'none' | 'emerald' | 'sky' | 'both';
  containerClassName?: string;
}

export const Section: React.FC<SectionProps> = ({
  className,
  children,
  showGrid = false,
  glow = 'none',
  containerClassName,
  ...props
}) => {
  return (
    <section
      className={cn(
        "py-16 md:py-24 relative overflow-hidden",
        showGrid && "bg-grid",
        className
      )}
      {...props}
    >
      {/* Glow blobs */}
      {glow === 'emerald' && (
        <div className="glow-blob glow-emerald -top-40 -left-40" />
      )}
      {glow === 'sky' && (
        <div className="glow-blob glow-sky -bottom-40 -right-40" />
      )}
      {glow === 'both' && (
        <>
          <div className="glow-blob glow-emerald -top-40 -left-40" />
          <div className="glow-blob glow-sky -bottom-40 -right-40" />
        </>
      )}
      
      <div className={cn("relative z-10 w-full", containerClassName)}>
        {children}
      </div>
    </section>
  );
};
