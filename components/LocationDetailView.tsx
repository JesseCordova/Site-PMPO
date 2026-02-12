
import React, { useState } from 'react';
import { AppState, Organ, Maintenance } from '../types';
import { Plus, AlertTriangle, CheckCircle2, Music4, Wrench, Pencil, Search, X, History, Calendar, User, FileText, Trash2 } from 'lucide-react';

interface LocationDetailViewProps {
  locationId: string;
  state: AppState;
  isMaintenancePending: (id: string) => boolean;
  onRegisterOrgan: () => void;
  onEditOrgan: (id: string) => void;
  onDeleteOrgan: (id: string) => void;
  onEditMaintenance: (id: string) => void;
  onDeleteMaintenance: (id: string) => void;
  onRegisterMaintenance: (organId: string) => void;
}

export const LocationDetailView: React.FC<LocationDetailViewProps> = ({ 
  locationId, state, isMaintenancePending, onRegisterOrgan, onEditOrgan, onDeleteOrgan, onEditMaintenance, onDeleteMaintenance, onRegisterMaintenance 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showHistoryForOrganId, setShowHistoryForOrganId] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const location = state.locations.find(l => l.id === locationId);
  const locationOrgans = state.organs.filter(o => o.locationId === locationId);

  const filteredOrgans = locationOrgans.filter(organ => 
    organ.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    organ.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    organ.patrimonyNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!location) return null;

  const pendingCount = locationOrgans.filter(o => isMaintenancePending(o.id)).length;
  const hasOrgans = locationOrgans.length > 0;

  // Find history for modal
  const historyOrgan = state.organs.find(o => o.id === showHistoryForOrganId);
  const organMaintenances = state.maintenances
    .filter(m => m.organId === showHistoryForOrganId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">{location.name}</h2>
          <p className="text-slate-500 mt-1">Órgãos cadastrados nesta localidade</p>
        </div>
        
        <button 
          onClick={onRegisterOrgan}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 border border-blue-500"
        >
          <Plus size={20} className="text-sky-100" />
          Cadastrar Novo Órgão
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <span className="text-slate-400 text-xs font-black uppercase tracking-widest">Órgãos Locais</span>
          <div className="text-5xl font-black text-slate-800 mt-1">{locationOrgans.length}</div>
        </div>
        
        <div className={`p-6 rounded-3xl border shadow-sm transition-colors duration-300 ${
          !hasOrgans 
            ? 'bg-slate-50 border-slate-200' 
            : pendingCount > 0 
              ? 'bg-red-50 border-red-200' 
              : 'bg-green-50 border-green-200'
        }`}>
          <span className={`${
            !hasOrgans 
              ? 'text-slate-400' 
              : pendingCount > 0 
                ? 'text-red-400' 
                : 'text-green-400'
          } text-xs font-black uppercase tracking-widest`}>
            Status Manutenção
          </span>
          <div className={`mt-1 font-black leading-tight ${
            !hasOrgans 
              ? 'text-xl text-slate-400 py-2' 
              : 'text-5xl ' + (pendingCount > 0 ? 'text-red-600' : 'text-green-600')
          }`}>
            {!hasOrgans 
              ? 'Nenhum órgão cadastrado' 
              : (pendingCount === 0 ? 'Ok' : pendingCount)
            }
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <span className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Busca Rápida</span>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Modelo, Nº Série ou Nº Patrimônio..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-sm text-slate-700"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {!hasOrgans ? (
          <div className="bg-slate-100 rounded-3xl p-12 text-center border border-dashed border-slate-300">
            <div className="bg-white w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 shadow-sm border border-slate-200">
              <Music4 size={48} className="text-sky-300" />
            </div>
            <h4 className="text-xl font-bold text-slate-400">Nenhum instrumento aqui</h4>
            <p className="text-slate-400 mt-1">Utilize o botão acima para cadastrar o primeiro órgão desta localidade.</p>
          </div>
        ) : filteredOrgans.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-[32px] border border-dashed border-slate-200">
            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={32} className="text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Nenhum órgão corresponde à busca</h3>
            <p className="text-slate-500">Tente buscar por modelo, número de série ou patrimônio.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrgans.map(organ => {
              const pending = isMaintenancePending(organ.id);
              return (
                <div 
                  key={organ.id} 
                  className={`relative group bg-white p-6 rounded-3xl border transition-all hover:shadow-md flex flex-col ${
                    pending ? 'border-red-200 bg-red-50/20' : 'border-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{organ.churchLocation}</span>
                      <h5 className={`text-xl font-bold leading-tight ${pending ? 'text-red-700' : 'text-slate-800'}`}>{organ.model}</h5>
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => setShowHistoryForOrganId(organ.id)}
                        className="p-2 bg-slate-50 text-slate-400 rounded-xl border border-slate-100 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                        title="Ver Histórico"
                      >
                        <History size={14} />
                      </button>
                      <button 
                        onClick={() => onEditOrgan(organ.id)}
                        className="p-2 bg-slate-50 text-slate-400 rounded-xl border border-slate-100 hover:bg-blue-50 hover:text-blue-600 transition-all opacity-0 group-hover:opacity-100"
                        title="Editar Cadastro"
                      >
                        <Pencil size={14} />
                      </button>
                      <button 
                        onClick={() => onDeleteOrgan(organ.id)}
                        className="p-2 bg-slate-50 text-slate-400 rounded-xl border border-slate-100 hover:bg-red-50 hover:text-red-600 transition-all opacity-0 group-hover:opacity-100"
                        title="Excluir Órgão"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="mb-4 text-xs space-y-0.5">
                    <p className="text-slate-500 font-medium">Nº Série: <span className="text-slate-700">{organ.serialNumber}</span></p>
                    <p className="text-slate-500 font-medium">Nº Patrimônio: <span className="text-slate-700">{organ.patrimonyNumber}</span></p>
                  </div>

                  <div className="mb-6 flex items-center gap-2">
                    {pending ? (
                      <span className="px-3 py-1 bg-red-500 text-white rounded-full text-[10px] font-black uppercase flex items-center gap-1 shadow-sm border border-red-600">
                        <AlertTriangle size={10} className="text-white" />
                        Pendente
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase flex items-center gap-1 border border-green-200">
                        <CheckCircle2 size={10} className="text-green-500" />
                        Ok
                      </span>
                    )}
                  </div>

                  <div className="mt-auto">
                    <button 
                      onClick={() => onRegisterMaintenance(organ.id)}
                      className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all border ${
                        pending 
                        ? 'bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-100 border-red-500' 
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                      }`}
                    >
                      <Wrench size={16} className={pending ? "text-white" : "text-sky-300"} />
                      Registrar Manutenção
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>


      {/* Photo Viewer Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-lg animate-in fade-in duration-300"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <button 
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-4 -right-4 z-10 w-12 h-12 bg-white/20 text-white rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
              title="Fechar"
            >
              <X size={24} />
            </button>
            <img 
              src={selectedPhoto} 
              alt="Visualização Ampliada" 
              className="object-contain max-w-full max-h-full rounded-2xl shadow-2xl animate-in zoom-in-90 duration-300"
              onClick={(e) => e.stopPropagation()} // Evita que o clique na imagem feche o modal
            />
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryForOrganId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-[40px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                  <History size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 leading-tight">Histórico de Manutenção</h3>
                  <p className="text-slate-500 text-sm font-medium">{historyOrgan?.model} • Nº Patrimônio: {historyOrgan?.patrimonyNumber}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowHistoryForOrganId(null)}
                className="w-10 h-10 bg-white border border-slate-200 text-slate-400 rounded-full flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {organMaintenances.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-slate-200">
                    <Calendar size={32} className="text-slate-300" />
                  </div>
                  <p className="text-slate-400 font-bold">Nenhum registro encontrado</p>
                  <p className="text-slate-400 text-sm">Este instrumento ainda não possui histórico de serviços.</p>
                </div>
              ) : (
                organMaintenances.map((m) => (
                  <div key={m.id} className="relative p-6 bg-white border border-slate-200 rounded-3xl shadow-sm hover:shadow-md transition-shadow group/item">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-indigo-400 uppercase tracking-widest leading-none">Data</span>
                          <span className="text-lg font-bold text-slate-800">{new Date(m.date).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => {
                            setShowHistoryForOrganId(null);
                            onEditMaintenance(m.id);
                          }}
                          className="p-2.5 bg-slate-50 text-slate-400 rounded-xl border border-slate-100 hover:bg-blue-50 hover:text-blue-600 transition-all opacity-0 group-hover/item:opacity-100 flex items-center gap-2 text-xs font-bold"
                        >
                          <Pencil size={14} />
                          Editar
                        </button>
                        <button 
                          onClick={() => {
                            setShowHistoryForOrganId(null);
                            onDeleteMaintenance(m.id);
                          }}
                          className="p-2.5 bg-slate-50 text-slate-400 rounded-xl border border-slate-100 hover:bg-red-50 hover:text-red-600 transition-all opacity-0 group-hover/item:opacity-100 flex items-center gap-2 text-xs font-bold"
                        >
                          <Trash2 size={14} />
                          Excluir
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <User size={14} className="text-sky-300" />
                        <span className="text-slate-500 font-medium">Técnicos:</span>
                        <span className="text-slate-800 font-bold">{m.technicians.join(' & ')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Wrench size={14} className="text-sky-300" />
                        <span className="text-slate-500 font-medium">Peças Trocadas:</span>
                        <span className={`font-bold ${m.hasPartExchange ? 'text-amber-600' : 'text-slate-800'}`}>
                          {m.hasPartExchange ? 'Sim' : 'Não'}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText size={14} className="text-slate-400" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ocorrência</span>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed italic">"{m.occurrence}"</p>
                    </div>

                    {m.photos.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {m.photos.map((photo, i) => (
                          <img 
                            key={i} 
                            src={photo} 
                            onClick={() => setSelectedPhoto(photo)} 
                            className="w-16 h-16 object-cover rounded-xl border-2 border-white shadow-lg cursor-pointer transition-transform hover:scale-110 hover:shadow-md" 
                            alt={`Thumbnail ${i+1}`} 
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-center">
              <button 
                onClick={() => {
                  setShowHistoryForOrganId(null);
                  onRegisterMaintenance(showHistoryForOrganId);
                }}
                className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
                <Plus size={18} />
                Novo Registro Agora
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Photo Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <img src={selectedPhoto} alt="Visualização Ampliada" className="w-full h-full object-contain" />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Photo Zoom Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full" onClick={(e) => e.stopPropagation()}>
            <img 
              src={selectedPhoto} 
              alt="Visualização Ampliada"
              className="object-contain w-full h-full"
            />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
