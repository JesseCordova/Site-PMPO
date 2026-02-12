
import React from 'react';
import { Administration } from '../types';
import { ADMS } from '../constants';
import { AlertCircle, Music4, BarChart3, ChevronRight } from 'lucide-react';

interface AdmSelectionViewProps {
  isAdmPending: (adm: Administration) => boolean;
  onSelectAdm: (adm: Administration) => void;
  onOpenReports: () => void;
}

export const AdmSelectionView: React.FC<AdmSelectionViewProps> = ({ isAdmPending, onSelectAdm, onOpenReports }) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {ADMS.map((adm) => {
          const pending = isAdmPending(adm);
          return (
            <button
              key={adm}
              onClick={() => onSelectAdm(adm)}
              className={`relative group bg-white p-8 rounded-3xl shadow-sm border transition-all hover:shadow-xl hover:-translate-y-1 text-left flex flex-col justify-between h-64 overflow-hidden ${
                pending 
                ? 'border-red-200 bg-red-50/30' 
                : 'border-slate-100 hover:border-blue-500'
              }`}
            >
              {pending && (
                <div className="absolute top-0 right-0 bg-red-500 text-white px-4 py-1.5 rounded-bl-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                  <AlertCircle size={12} />
                  Pendências
                </div>
              )}
              
              <div className="p-4 bg-slate-50 rounded-2xl w-fit group-hover:bg-blue-50 transition-colors border border-slate-100">
                <Music4 size={32} className={pending ? 'text-red-500' : 'text-sky-300 group-hover:text-sky-400'} />
              </div>

              <div>
                <h3 className="text-2xl font-bold text-slate-800">
                  {adm}
                </h3>
              </div>
              
              <div className="absolute -bottom-6 -right-6 opacity-20 pointer-events-none group-hover:opacity-30 transition-opacity">
                <Music4 size={140} className="text-sky-200" />
              </div>
            </button>
          );
        })}

        {/* Reports Card */}
        <button
          onClick={onOpenReports}
          className="relative group bg-slate-800 p-8 rounded-3xl shadow-xl border border-slate-700 transition-all hover:shadow-2xl hover:bg-slate-900 hover:-translate-y-1 text-left flex flex-col justify-between h-64 overflow-hidden"
        >
          <div className="p-4 bg-slate-700 rounded-2xl w-fit border border-slate-600 group-hover:bg-indigo-600 transition-colors">
            <BarChart3 size={32} className="text-indigo-300" />
          </div>

          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-white">Relatórios Gerais</h3>
            <div className="flex items-center gap-1 text-indigo-400 text-xs font-bold uppercase tracking-wider">
              Visualizar Registros
              <ChevronRight size={14} />
            </div>
          </div>
          
          <div className="absolute -bottom-6 -right-6 opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity">
            <BarChart3 size={160} className="text-white" />
          </div>
        </button>
      </div>
    </div>
  );
};
