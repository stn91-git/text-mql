import React from 'react';
import { cn } from '../../lib/utils';
import { Info, CheckCircle2, AlertCircle } from 'lucide-react';

interface StatusMessageProps {
  type?: 'info' | 'success' | 'error';
  message: string;
  className?: string;
}

export function StatusMessage({ type = 'info', message, className }: StatusMessageProps) {
  const styles = {
    info: 'bg-[#202222] border-gray-700 text-gray-200',
    success: 'bg-[#0f2f2f] border-[#20b8cd]/30 text-[#5ddce8]',
    error: 'bg-[#2f1f1f] border-red-500/40 text-red-200',
  };

  const icons = {
    info: <Info size={18} />,
    success: <CheckCircle2 size={18} />,
    error: <AlertCircle size={18} />,
  };

  return (
    <div className={cn(
      "flex items-start gap-3 p-4 rounded-xl border text-sm leading-relaxed",
      styles[type],
      className
    )}>
      <div className="flex-shrink-0 mt-0.5 opacity-80">
        {icons[type]}
      </div>
      <div>{message}</div>
    </div>
  );
}

