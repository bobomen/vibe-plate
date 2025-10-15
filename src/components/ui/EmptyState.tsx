import React, { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  variant?: 'default' | 'compact';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  variant = 'default'
}) => {
  if (variant === 'compact') {
    return (
      <div className="text-center py-8">
        <div className="flex justify-center mb-3 text-muted-foreground">
          {icon}
        </div>
        <h3 className="text-base font-semibold mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground mb-3">{description}</p>
        {action}
      </div>
    );
  }

  return (
    <div className="text-center py-16">
      <div className="flex justify-center mb-4 text-muted-foreground">
        {icon}
      </div>
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-muted-foreground mb-4">{description}</p>
      {action}
    </div>
  );
};
