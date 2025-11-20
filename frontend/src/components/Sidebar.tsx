import React from 'react';
import { Home, Compass, LayoutGrid, Library, User, Settings, Plus } from 'lucide-react';
import { clsx } from 'clsx';

interface SidebarProps {
  onNewChat: () => void;
}

export function Sidebar({ onNewChat }: SidebarProps) {
  return (
    <div className="flex flex-col h-full w-20 bg-[#202222] border-r border-gray-800/50 items-center py-6">
      {/* Logo Area */}
      <div className="mb-8">
         <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center cursor-pointer hover:bg-white/20 transition-colors" onClick={onNewChat}>
            <span className="text-2xl font-serif italic text-white">J</span>
         </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 flex flex-col gap-6 w-full px-4">
        <NavIcon icon={<Home size={24} />} label="Home" active onClick={onNewChat} />
        <NavIcon icon={<Compass size={24} />} label="Discover" />
        <NavIcon icon={<LayoutGrid size={24} />} label="Spaces" />
        <NavIcon icon={<Library size={24} />} label="Library" />
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-col gap-6 w-full px-4 mt-auto">
         <div className="w-full h-[1px] bg-gray-800" />
         <NavIcon icon={<User size={24} />} label="Profile" />
      </div>
    </div>
  );
}

function NavIcon({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <div 
        onClick={onClick}
        className={clsx(
        "flex flex-col items-center gap-1 cursor-pointer group",
        active ? "text-[#20b8cd]" : "text-gray-400 hover:text-gray-200"
      )}
    >
      <div className={clsx(
          "p-2 rounded-lg transition-colors",
          active ? "bg-[#20b8cd]/10" : "group-hover:bg-white/5"
      )}>
        {icon}
      </div>
      <span className="text-[10px] font-medium">{label}</span>
    </div>
  );
}
