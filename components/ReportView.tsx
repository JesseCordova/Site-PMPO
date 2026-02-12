
import React, { useState, useMemo } from 'react';
import { AppState, Administration, Maintenance, Organ, DeletedItem } from '../types';
import { ADMS } from '../constants';
import { FileText, Download, Calendar, MapPin, Search, Pencil, Trash2, History, AlertCircle, Trash, FilterX, Lock } from 'lucide-react';

interface ReportViewProps {
  state: AppState;
  isMaintenancePending: (id: string) => boolean;
  onEditMaintenance: (id: string) => void;
  onDeleteMaintenance: (id: string) => void;
  isHistoryAuthorized: boolean;
  onRequestHistoryAccess: () => void;
}

export const ReportView: React.FC<ReportViewProps> = ({ 
  state, 
  isMaintenancePending, 
  onEditMaintenance, 
  onDeleteMaintenance,
  isHistoryAuthorized,
  onRequestHistoryAccess
}) => {
  const [activeTab, setActiveTab] = useState<'maintenances' | 'deleted'>('maintenances');
  const [filterAdm, setFilterAdm] = useState<Administration | 'all'>('all');
  const [filterLoc, setFilterLoc] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const filteredLocations = useMemo(() => {
    return filterAdm === 'all' ? state.locations : state.locations.filter(l => l.adm === filterAdm);
  }, [filterAdm, state.locations]);

  const filteredMaintenances = useMemo(() => {
    return state.maintenances.filter(m => {
      const organ = state.organs.find(o => o.id === m.organId);
      if (!organ) return false;
      const location = state.locations.find(l => l.id === organ.locationId);
      if (!location) return false;

      const matchesAdm = filterAdm === 'all' || location.adm === filterAdm;
      const matchesLoc = filterLoc === 'all' || location.id === filterLoc;
      
      const matchesDateFrom = !dateFrom || m.date >= dateFrom;
      const matchesDateTo = !dateTo || m.date <= dateTo;

      return matchesAdm && matchesLoc && matchesDateFrom && matchesDateTo;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [state.maintenances, state.organs, state.locations, filterAdm, filterLoc, dateFrom, dateTo]);

  const filteredDeletedItems = useMemo(() => {
    return state.deletedItems.filter(item => {
      const matchesAdm = filterAdm === 'all' || item.metadata?.adm === filterAdm;
      const matchesLoc = filterLoc === 'all' || state.locations.find(l => l.id === filterLoc)?.name === item.metadata?.locationName;
      
      const dDate = item.deletedAt.split('T')[0];
      const matchesDateFrom = !dateFrom || dDate >= dateFrom;
      const matchesDateTo = !dateTo || dDate <= dateTo;

      return matchesAdm && matchesLoc && matchesDateFrom && matchesDateTo;
    }).sort((a, b) => b.deletedAt.localeCompare(a.deletedAt));
  }, [state.deletedItems, filterAdm, filterLoc, dateFrom, dateTo, state.locations]);

  const clearFilters = () => {
    setFilterAdm('all');
    setFilterLoc('all');
    setDateFrom('');
    setDateTo('');
  };

  const exportCSV = () => {
    const dataToExport = activeTab === 'maintenances' ? filteredMaintenances : filteredDeletedItems;
    if (activeTab === 'maintenances') {
      const headers = ['Data', 'Instrumento', 'Nº Patrimônio', 'ADM', 'Local', 'Técnicos', 'Ocorrência'];
      const rows = (dataToExport as Maintenance[]).map(m => {
        const organ = state.organs.find(o => o.id === m.organId);
        const location = state.locations.find(l => l.id === organ?.locationId);
        return [
          m.date,
          organ?.model || '',
          organ?.patrimonyNumber || '',
          location?.adm || '',
          location?.name || '',
          m.technicians.join(' & '),
          m.occurrence.replace(/,/g, ';')
        ];
      });
      const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
      downloadFile(csvContent, "relatorio_manutencao.csv");
    } else {
      const headers = ['Data Exclusão', 'Tipo', 'Instrumento/Info', 'Nº Patrimônio', 'ADM', 'Local', 'Motivo'];
      const rows = (dataToExport as DeletedItem[]).map(item => {
        const isOrgan = item.type === 'organ';
        const info = isOrgan 
          ? (item.data as Organ).model 
          : `Manutenção de ${(item.data as Maintenance).date}`;
        const patrimony = isOrgan 
          ? (item.data as Organ).patrimonyNumber 
          : '';

        return [
          new Date(item.deletedAt).toLocaleString('pt-BR'),
          item.type === 'organ' ? 'Órgão' : 'Manutenção',
          info,
          patrimony,
          item.metadata?.adm || '',
          item.metadata?.locationName || '',
          item.reason.replace(/,/g, ';')
        ];
      });
      const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
      downloadFile(csvContent, "historico_exclusoes.csv");
    }
  };

  const downloadFile = (content: string, fileName: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex p-1 bg-slate-200/50 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveTab('maintenances')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'maintenances' 
              ? 'bg-white text-slate-900 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText size={18} className={activeTab === 'maintenances' ? 'text-blue-500' : 'text-slate-400'} />
          Atendimentos Ativos
        </button>
        <button 
          onClick={() => {
            if (!isHistoryAuthorized) {
              onRequestHistoryAccess();
            } else {
              setActiveTab('deleted');
            }
          }}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'deleted' 
              ? 'bg-white text-slate-900 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {isHistoryAuthorized ? <History size={18} className="text-red-500" /> : <Lock size={18} className="text-slate-400" />}
          Histórico de Exclusão
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 font-bold text-slate-700">
            <Search size={20} className="text-sky-300" />
            Filtros de {activeTab === 'maintenances' ? 'Relatório' : 'Exclusão'}
          </div>
          <button 
            onClick={clearFilters}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-blue-500 transition-colors"
          >
            <FilterX size={14} />
            Limpar Filtros
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Adm</label>
            <select 
              value={filterAdm} 
              onChange={(e) => {
                setFilterAdm(e.target.value as any);
                setFilterLoc('all');
              }}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
            >
              <option value="all">Todas</option>
              {ADMS.map(adm => <option key={adm} value={adm}>{adm}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Localidade</label>
            <select 
              value={filterLoc} 
              onChange={(e) => setFilterLoc(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
            >
              <option value="all">Todas</option>
              {filteredLocations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">De</label>
            <input 
              type="date" 
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Até</label>
            <input 
              type="date" 
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" 
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button 
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors text-sm font-medium border border-slate-700 shadow-sm"
          >
            <Download size={16} className="text-sky-100" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {activeTab === 'maintenances' ? (
          filteredMaintenances.length === 0 ? (
            <div className="bg-white p-12 text-center text-slate-400 italic rounded-2xl border border-dashed border-slate-200">
               <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <Search size={32} className="text-sky-300" />
               </div>
               Nenhum atendimento encontrado para os filtros selecionados.
            </div>
          ) : (
            filteredMaintenances.map(m => {
              const organ = state.organs.find(o => o.id === m.organId);
              const location = state.locations.find(l => l.id === organ?.locationId);
              const isOrganPending = organ ? isMaintenancePending(organ.id) : false;

              return (
                <div key={m.id} className="relative group bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row">
                  <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 z-10 transition-all">
                    <button 
                      onClick={() => onEditMaintenance(m.id)}
                      className="p-2 bg-slate-50 text-slate-400 rounded-xl border border-slate-100 hover:bg-blue-50 hover:text-blue-600 shadow-sm"
                      title="Editar Registro"
                    >
                      <Pencil size={14} />
                    </button>
                    <button 
                      onClick={() => onDeleteMaintenance(m.id)}
                      className="p-2 bg-slate-50 text-slate-400 rounded-xl border border-slate-100 hover:bg-red-50 hover:text-red-600 shadow-sm"
                      title="Excluir Registro"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className={`p-6 border-b md:border-b-0 md:border-r border-slate-100 flex-1 ${isOrganPending ? 'border-l-4 border-l-red-500' : ''}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-sky-300" />
                        <span className="font-bold text-slate-800">{new Date(m.date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                      </div>
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold uppercase border border-slate-200">
                        {location?.adm}
                      </span>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-bold text-lg text-slate-800">{organ?.model}</h4>
                      <p className="text-slate-500 text-sm flex items-center gap-1">
                        <MapPin size={14} className="text-sky-300" />
                        {location?.name} - {organ?.churchLocation}
                      </p>
                      <div className="mt-2 space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nº Patrimônio: <span className="text-slate-700">{organ?.patrimonyNumber}</span></p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nº Série: <span className="text-slate-700">{organ?.serialNumber}</span></p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <span className="block text-xs font-semibold text-slate-400 uppercase">Técnicos</span>
                        <p className="text-sm font-medium text-slate-700">{m.technicians.join(' & ')}</p>
                      </div>
                      <div>
                        <span className="block text-xs font-semibold text-slate-400 uppercase">Peças Trocadas</span>
                        <p className="text-sm font-medium text-slate-700">{m.hasPartExchange ? 'Sim' : 'Não'}</p>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 shadow-inner">
                      <span className="block text-xs font-semibold text-slate-400 uppercase mb-2">Ocorrência</span>
                      <p className="text-sm text-slate-700 leading-relaxed">{m.occurrence}</p>
                    </div>
                  </div>

                  <div className="w-full md:w-64 bg-slate-50 p-6 flex flex-wrap gap-2 items-start content-start">
                    <span className="block w-full text-xs font-semibold text-slate-400 uppercase mb-2">Fotos do Registro</span>
                    {m.photos.length === 0 ? (
                      <div className="w-full h-32 flex flex-col items-center justify-center text-slate-300 border border-dashed border-slate-200 rounded-xl bg-white">
                        <FileText size={32} className="text-sky-200" />
                        <span className="text-[10px] mt-1">Sem fotos</span>
                      </div>
                    ) : (
                      m.photos.map((photo, i) => (
                        <img 
                          key={i} 
                          src={photo} 
                          alt="Anexo" 
                          className="w-16 h-16 object-cover rounded-lg border border-white shadow-sm cursor-zoom-in hover:scale-110 transition-transform" 
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })
          )
        ) : (
          /* DELETED ITEMS VIEW */
          filteredDeletedItems.length === 0 ? (
            <div className="bg-white p-12 text-center text-slate-400 italic rounded-2xl border border-dashed border-slate-200">
               <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <History size={32} className="text-slate-300" />
               </div>
               Nenhum registro de exclusão encontrado.
            </div>
          ) : (
            filteredDeletedItems.map(item => (
              <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 bg-red-50/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
                      <Trash size={20} />
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-red-400 uppercase tracking-widest leading-none">Excluído em</span>
                      <p className="text-sm font-bold text-slate-800">{new Date(item.deletedAt).toLocaleString('pt-BR')}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                    item.type === 'organ' 
                      ? 'bg-amber-100 text-amber-700 border-amber-200' 
                      : 'bg-indigo-100 text-indigo-700 border-indigo-200'
                  }`}>
                    {item.type === 'organ' ? 'Órgão' : 'Manutenção'}
                  </span>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Dados Originais</span>
                      {item.type === 'organ' ? (
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <h5 className="font-bold text-slate-800">{(item.data as Organ).model}</h5>
                          <p className="text-xs text-slate-500">Nº Série: {(item.data as Organ).serialNumber} • Nº Patrimônio: {(item.data as Organ).patrimonyNumber}</p>
                          <p className="text-xs text-slate-500">{item.metadata?.adm} • {item.metadata?.locationName}</p>
                        </div>
                      ) : (
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <h5 className="font-bold text-slate-800">Serviço de {(item.data as Maintenance).date}</h5>
                          <p className="text-xs text-slate-500">Técnicos: {(item.data as Maintenance).technicians.join(', ')}</p>
                          <p className="text-xs text-slate-700 mt-2 line-clamp-2 italic">"{(item.data as Maintenance).occurrence}"</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-red-50 p-5 rounded-2xl border border-red-100 shadow-inner">
                      <div className="flex items-center gap-2 mb-2 text-red-600">
                        <AlertCircle size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Motivo da Exclusão</span>
                      </div>
                      <p className="text-sm text-red-900 font-medium leading-relaxed italic">
                        "{item.reason}"
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
};
