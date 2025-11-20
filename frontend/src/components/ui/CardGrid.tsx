import React from 'react';
import { cn } from '../../lib/utils';

interface CardGridProps {
  data: Record<string, any>[];
  className?: string;
}

export function CardGrid({ data, className }: CardGridProps) {
  if (!data || data.length === 0) return null;

  // Limit to first 12 items to prevent overwhelming grid
  const displayData = data.slice(0, 12);
  const hasMore = data.length > 12;

  const formatValue = (value: any): React.ReactNode => {
    if (value === null || value === undefined) return <span className="text-gray-600">-</span>;
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {displayData.map((item, i) => (
          <div 
            key={i} 
            className="bg-[#202222] border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-all"
          >
            <div className="space-y-2">
              {Object.entries(item).slice(0, 5).map(([key, value]) => (
                <div key={key} className="flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">
                    {key}
                  </span>
                  <span className="text-sm text-gray-200 font-mono break-all">
                    {formatValue(value)}
                  </span>
                </div>
              ))}
              {Object.keys(item).length > 5 && (
                <div className="pt-2 text-xs text-gray-500 italic">
                  + {Object.keys(item).length - 5} more fields
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {hasMore && (
        <div className="text-center text-xs text-gray-500">
          And {data.length - 12} more items...
        </div>
      )}
    </div>
  );
}

