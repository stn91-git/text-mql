import React from 'react';
import { cn } from '../../lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DataTableProps {
  data: Record<string, any>[];
  className?: string;
}

export function DataTable({ data, className }: DataTableProps) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  if (!data || data.length === 0) {
    return (
      <div className={cn("p-4 text-center text-gray-500 border border-gray-800 rounded-lg bg-[#202222]", className)}>
        No data available
      </div>
    );
  }

  // Get all unique keys from all objects to form columns
  const columns = Array.from(
    new Set(data.flatMap((item) => Object.keys(item)))
  );

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = data.slice(startIndex, startIndex + itemsPerPage);

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'object') return JSON.stringify(value);
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  };

  return (
    <div className={cn("w-full space-y-2 font-mono text-sm", className)}>
      <div className="rounded-md border border-gray-800 bg-[#1b1c1c] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#202222] text-gray-400 text-xs uppercase">
              <tr>
                {columns.map((col) => (
                  <th key={col} className="px-4 py-3 font-medium whitespace-nowrap border-b border-gray-800">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {currentData.map((row, i) => (
                <tr key={i} className="hover:bg-[#202222]/50 transition-colors">
                  {columns.map((col) => (
                    <td key={col} className="px-4 py-3 text-gray-300 whitespace-nowrap max-w-[200px] truncate">
                      {formatValue(row[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-xs text-gray-500">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, data.length)} of {data.length} entries
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded hover:bg-[#202222] disabled:opacity-50 disabled:cursor-not-allowed text-gray-400"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs text-gray-400 px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded hover:bg-[#202222] disabled:opacity-50 disabled:cursor-not-allowed text-gray-400"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

