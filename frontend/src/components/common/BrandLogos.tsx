import React from 'react';

export const JaAssureLogo: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ 
  size = 'md',
  className = ''
}) => {
  const dimensions = {
    sm: { box: 'w-6 h-6', text: 'text-sm', logoText: 'text-xs', gap: 'gap-2' },
    md: { box: 'w-8 h-8', text: 'text-xl', logoText: 'text-sm', gap: 'gap-2.5' },
    lg: { box: 'w-10 h-10', text: 'text-2xl', logoText: 'text-base', gap: 'gap-3' }
  }[size];

  return (
    <div className={`flex items-center ${dimensions.gap} select-none ${className}`}>
      {/* JA Diamond Icon */}
      <div className="relative flex items-center justify-center">
        <div 
          className={`${dimensions.box} rounded-md rotate-45 flex items-center justify-center shadow-sm transition-transform`}
          style={{ backgroundColor: '#0c2340' }}
        >
          <span 
            className={`-rotate-45 font-bold text-white tracking-tighter ${dimensions.logoText}`}
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            ja
          </span>
        </div>
      </div>

      {/* "assure" brand text */}
      <span 
        className={`font-semibold tracking-tight ${dimensions.text}`}
        style={{ color: '#0c2340', letterSpacing: '-0.03em' }}
      >
        assure
      </span>
    </div>
  );
};

export const LloydsCoverholderBadge: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      {/* LLOYD'S Black Box */}
      <div className="bg-black text-white px-2.5 py-1 text-xs sm:text-sm font-serif font-bold tracking-wider flex items-center justify-center">
        LLOYD'S
      </div>
      {/* Coverholder Text */}
      <span className="text-sm sm:text-base font-normal text-slate-900 tracking-tight">
        Coverholder
      </span>
    </div>
  );
};
