import React, { useState, useMemo } from 'react';
import { DataTable } from './ui/DataTable';
import { CardGrid } from './ui/CardGrid';
import { JsonViewer } from './ui/JsonViewer';
import { MetricCard } from './ui/MetricCard';
import { CodeBlock } from './ui/CodeBlock';
import { StatusMessage } from './ui/StatusMessage';
import { LayoutGrid, Table as TableIcon, Code, FileJson, AlignLeft } from 'lucide-react';
import { cn } from '../lib/utils';

interface SmartRendererProps {
  content: string;
}

type ViewType = 'text' | 'table' | 'cards' | 'json' | 'code';

export function SmartRenderer({ content }: SmartRendererProps) {
  const [view, setView] = useState<ViewType | null>(null);

  const parsedData = useMemo(() => {
    // 1. Try direct JSON parse
    try {
      const json = JSON.parse(content);
      return { data: json, isJson: true };
    } catch (e) {
      // 2. Try extracting from markdown ```json ... ```
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        try {
          return { data: JSON.parse(jsonMatch[1]), isJson: true };
        } catch (e2) { /* ignore */ }
      }
      // 3. Try extracting from markdown ``` ... ``` (generic code block)
      const codeMatch = content.match(/```(\w*)\n([\s\S]*?)\n```/);
      if (codeMatch) {
          return { data: codeMatch[2], isJson: false, language: codeMatch[1] || 'text', isCode: true };
      }
    }
    return { data: null, isJson: false };
  }, [content]);

  // Determine available views and default view
  const { availableViews, defaultView } = useMemo(() => {
    const views: ViewType[] = ['text'];
    let def: ViewType = 'text';

    if (parsedData.isJson) {
      views.push('json');
      def = 'json';

      const { data } = parsedData;
      
      if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
        views.push('table', 'cards');
        def = 'table';
      } else if (typeof data === 'object' && data !== null) {
        // Single object
        const keys = Object.keys(data);
        if (keys.length === 1 && typeof Object.values(data)[0] === 'number') {
           // It's a metric
           // We don't necessarily need a switcher for metric, just render it inline?
           // For now treat as card/json
        }
      }
    } else if (parsedData.isCode) {
        views.push('code');
        def = 'code';
    }

    return { availableViews: views, defaultView: def };
  }, [parsedData]);

  // Initialize view state if not set
  const currentView = view || defaultView;

  // Determine if we should render a simple component without switcher
  if (parsedData.isJson && typeof parsedData.data === 'object' && !Array.isArray(parsedData.data)) {
       const keys = Object.keys(parsedData.data);
       // Single metric case: { "count": 42 }
       if (keys.length === 1 && (typeof parsedData.data[keys[0]] === 'number' || typeof parsedData.data[keys[0]] === 'string')) {
           return (
             <div className="my-2">
               <MetricCard 
                  label={keys[0]} 
                  value={parsedData.data[keys[0]]} 
                  trend="neutral" 
               />
             </div>
           );
       }
  }

  // If it's just text (no JSON/Code detected), render generic text with simple styling
  if (availableViews.length === 1 && availableViews[0] === 'text') {
      // Check for short status messages
      if (content.length < 100 && !content.includes('\n')) {
         // Heuristic for simple status
         return <StatusMessage message={content} />;
      }
      return <div className="whitespace-pre-wrap">{content}</div>;
  }

  const renderContent = () => {
    switch (currentView) {
      case 'table':
        return <DataTable data={parsedData.data} />;
      case 'cards':
        return <CardGrid data={parsedData.data} />;
      case 'json':
        return <JsonViewer data={parsedData.data} />;
      case 'code':
        return <CodeBlock code={parsedData.isCode ? parsedData.data : content} language={parsedData.language} />;
      case 'text':
      default:
        return <div className="whitespace-pre-wrap text-gray-300">{content}</div>;
    }
  };

  return (
    <div className="space-y-3 w-full">
      {availableViews.length > 1 && (
        <div className="flex items-center gap-1 bg-[#202222] w-fit p-1 rounded-lg border border-gray-800">
            {availableViews.includes('table') && (
                <button 
                    onClick={() => setView('table')}
                    className={cn("p-1.5 rounded-md transition-all", currentView === 'table' ? "bg-[#20b8cd] text-[#191A1A]" : "text-gray-400 hover:text-gray-200")}
                    title="Table View"
                >
                    <TableIcon size={16} />
                </button>
            )}
            {availableViews.includes('cards') && (
                <button 
                    onClick={() => setView('cards')}
                    className={cn("p-1.5 rounded-md transition-all", currentView === 'cards' ? "bg-[#20b8cd] text-[#191A1A]" : "text-gray-400 hover:text-gray-200")}
                    title="Grid View"
                >
                    <LayoutGrid size={16} />
                </button>
            )}
             {availableViews.includes('json') && (
                <button 
                    onClick={() => setView('json')}
                    className={cn("p-1.5 rounded-md transition-all", currentView === 'json' ? "bg-[#20b8cd] text-[#191A1A]" : "text-gray-400 hover:text-gray-200")}
                    title="JSON View"
                >
                    <FileJson size={16} />
                </button>
            )}
             {availableViews.includes('code') && (
                <button 
                    onClick={() => setView('code')}
                    className={cn("p-1.5 rounded-md transition-all", currentView === 'code' ? "bg-[#20b8cd] text-[#191A1A]" : "text-gray-400 hover:text-gray-200")}
                    title="Code View"
                >
                    <Code size={16} />
                </button>
            )}
             {availableViews.includes('text') && (
                <button 
                    onClick={() => setView('text')}
                    className={cn("p-1.5 rounded-md transition-all", currentView === 'text' ? "bg-[#20b8cd] text-[#191A1A]" : "text-gray-400 hover:text-gray-200")}
                    title="Text View"
                >
                    <AlignLeft size={16} />
                </button>
            )}
        </div>
      )}
      
      <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
        {renderContent()}
      </div>
    </div>
  );
}

