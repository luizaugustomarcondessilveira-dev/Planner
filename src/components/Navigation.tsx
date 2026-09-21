import React from 'react';
import { AppTab } from '../types';
import { Sun, Calendar, BookOpen, Sparkles, GraduationCap } from 'lucide-react';

interface NavigationProps {
  currentTab: AppTab;
  onChangeTab: (tab: AppTab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentTab, onChangeTab }) => {
  const tabs: Array<{ id: AppTab; label: string; icon: React.ReactNode }> = [
    { id: 'hoje', label: 'Hoje', icon: <Sun className="w-5 h-5" /> },
    { id: 'agenda', label: 'Agenda', icon: <Calendar className="w-5 h-5" /> },
    { id: 'diario', label: 'Diário', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'metas', label: 'Metas', icon: <Sparkles className="w-5 h-5" /> },
    { id: 'estudos', label: 'Estudos', icon: <GraduationCap className="w-5 h-5" /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-lg border-t border-[#EBDED5] py-2 px-3 pb-safe">
      <div className="max-w-xl mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 relative ${
                isActive
                  ? 'text-[#6B3F2A] font-semibold scale-105'
                  : 'text-[#8C6E5E] hover:text-[#452414]'
              }`}
            >
              <div
                className={`p-1.5 rounded-full transition-colors ${
                  isActive ? 'bg-[#FDF4F5] text-[#6B3F2A]' : 'text-[#8C6E5E]'
                }`}
              >
                {tab.icon}
              </div>
              <span className="text-[11px] tracking-tight leading-none mt-0.5">
                {tab.label}
              </span>

              {/* Active indicator dot */}
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-[#6B3F2A] mt-1" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
