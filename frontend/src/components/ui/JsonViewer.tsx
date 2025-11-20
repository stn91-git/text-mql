import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { Copy, Check } from 'lucide-react';

interface JsonViewerProps {
  data: any;
  className?: string;
}

export function JsonViewer({ data, className }: JsonViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("relative group", className)}>
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleCopy}
          className="p-1.5 rounded bg-[#2d2f2f] text-gray-400 hover:text-white hover:bg-[#3d3f3f] transition-colors"
          aria-label="Copy JSON"
        >
          {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
        </button>
      </div>
      <pre className="bg-[#1b1c1c] border border-gray-800 rounded-lg p-4 overflow-x-auto text-xs font-mono text-gray-300 leading-relaxed">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

