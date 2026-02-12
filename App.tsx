
import React, { useState, useEffect } from 'react';
import { collection, doc, setDoc, onSnapshot, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { AdmSelectionView } from './components/AdmSelectionView';
import { AdmDashboardView } from './components/AdmDashboardView';
import { LocationDetailView } from './components/LocationDetailView';
import { OrganForm } from './components/OrganForm';
import { MaintenanceForm } from './components/MaintenanceForm';
import { ReportView } from './components/ReportView';
import { AppState, Organ, Maintenance, Location, Administration, DeletedItem } from './types';
import { INITIAL_LOCATIONS } from './constants';
import { Home, ChevronRight, Lock, X, ArrowRight, Trash2, HelpCircle } from 'lucide-react';
import { db, auth } from './services/firebase';

type ViewType = 'home' | 'adm-detail' | 'location-detail' | 'register-organ' | 'edit-organ' | 'register-maintenance' | 'edit-maintenance' | 'reports';

const App: React.FC = () => {
  const [view, setView] = useState<ViewType>('home');
  const [selectedAdm, setSelectedAdm] = useState<Administration | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [selectedOrganId, setSelectedOrganId] = useState<string | null>(null);
  const [selectedMaintenanceId, setSelectedMaintenanceId] = useState<string | null>(null);
  
  // Action protection state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordHint, setPasswordHint] = useState('');
  const [reasonInput, setReasonInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: 'organ' | 'maintenance' | 'history', id?: string, mode: 'edit' | 'delete' | 'view' } | null>(null);
  const [isHistoryAuthorized, setIsHistoryAuthorized] = useState(false);

  const [state, setState] = useState<AppState>({
    organs: [],
    maintenances: [],
    locations: INITIAL_LOCATIONS,
    deletedItems: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthReady(true);
        return;
      }
      signInAnonymously(auth).catch((err) => {
        console.error('Erro ao autenticar anonimamente:', err);
      });
    });

    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!isAuthReady) return;

    let remaining = 3;
    const markLoaded = () => {
      remaining -= 1;
      if (remaining <= 0) setIsLoading(false);
    };

    const unsubOrgans = onSnapshot(
      collection(db, 'organs'),
      (snap) => {
        const organs = snap.docs.map((d) => {
          const data = d.data() as Organ;
          return { ...data, id: data.id || d.id };
        });
        setState((prev) => ({ ...prev, organs }));
        markLoaded();
      },
      (err) => {
        console.error('Erro ao carregar orgaos:', err);
        markLoaded();
      }
    );

    const unsubMaintenances = onSnapshot(
      collection(db, 'maintenances'),
      (snap) => {
        const maintenances = snap.docs.map((d) => {
          const data = d.data() as Maintenance;
          return { ...data, id: data.id || d.id };
        });
        setState((prev) => ({ ...prev, maintenances }));
        markLoaded();
      },
      (err) => {
        console.error('Erro ao carregar manutencoes:', err);
        markLoaded();
      }
    );

    const unsubDeleted = onSnapshot(
      collection(db, 'deletedItems'),
      (snap) => {
        const deletedItems = snap.docs.map((d) => {
          const data = d.data() as DeletedItem;
          return { ...data, id: data.id || d.id };
        });
        setState((prev) => ({ ...prev, deletedItems }));
        markLoaded();
      },
      (err) => {
        console.error('Erro ao carregar historico:', err);
        markLoaded();
      }
    );

    return () => {
      unsubOrgans();
      unsubMaintenances();
      unsubDeleted();
    };
  }, [isAuthReady]);

  const generateHint = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const calculateExpectedPassword = (hint: string) => {
    return hint.split('').map((char, index) => {
      const digit = parseInt(char);
      const factor = index + 1;
      // Regra: (Dígito da dica + 1) * (Sua posição 1-4)
      const res = (digit + 1) * factor;
      // Caso res > 9, pega o número da segunda casa (unidade)
      return res % 10;
    }).join('');
  };

  const isMaintenancePending = (organId: string) => {
    const organMaintenances = state.maintenances.filter(m => m.organId === organId);
    if (organMaintenances.length === 0) return true;
    
    const lastDateString = organMaintenances.reduce((prev, curr) => 
      new Date(curr.date) > new Date(prev) ? curr.date : prev, 
      organMaintenances[0].date
    );
    
    const lastDate = new Date(lastDateString + 'T00:00:00');
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    return lastDate < oneYearAgo;
  };

  const isLocationPending = (locationId: string) => {
    const locationOrgans = state.organs.filter(o => o.locationId === locationId);
    if (locationOrgans.length === 0) return false;
    return locationOrgans.some(o => isMaintenancePending(o.id));
  };

  const isAdmPending = (adm: Administration) => {
    const admLocations = state.locations.filter(l => l.adm === adm);
    return admLocations.some(l => isLocationPending(l.id));
  };

  const handleAddOrgan = async (organ: Organ) => {
    try {
      await setDoc(doc(db, 'organs', organ.id), organ);
      setView('location-detail');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar o orgao.');
    }
  };

  const handleUpdateOrgan = async (updatedOrgan: Organ) => {
    try {
      await setDoc(doc(db, 'organs', updatedOrgan.id), updatedOrgan);
      setView('location-detail');
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar o orgao.');
    }
  };

  const handleDeleteOrgan = async (id: string, reason: string) => {
    const organToDelete = state.organs.find(o => o.id === id);
    if (!organToDelete) return;

    const location = state.locations.find(l => l.id === organToDelete.locationId);
    
    const deletedItem: DeletedItem = {
      id: crypto.randomUUID(),
      type: 'organ',
      data: organToDelete,
      reason,
      deletedAt: new Date().toISOString(),
      metadata: {
        locationName: location?.name,
        adm: location?.adm
      }
    };
    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'deletedItems', deletedItem.id), deletedItem);
      batch.delete(doc(db, 'organs', id));

      const maintQuery = query(
        collection(db, 'maintenances'),
        where('organId', '==', id)
      );
      const maintSnap = await getDocs(maintQuery);
      maintSnap.forEach((m) => batch.delete(doc(db, 'maintenances', m.id)));

      await batch.commit();
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir o orgao.');
    }
  };

  const handleAddMaintenance = async (maintenance: Maintenance) => {
    try {
      await setDoc(doc(db, 'maintenances', maintenance.id), maintenance);
      setView('location-detail');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar a manutencao.');
    }
  };

  const handleUpdateMaintenance = async (updatedMaintenance: Maintenance) => {
    try {
      await setDoc(doc(db, 'maintenances', updatedMaintenance.id), updatedMaintenance);
      if (view === 'edit-maintenance') setView('reports');
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar a manutencao.');
    }
  };

  const handleDeleteMaintenance = async (id: string, reason: string) => {
    const maintenanceToDelete = state.maintenances.find(m => m.id === id);
    if (!maintenanceToDelete) return;

    const organ = state.organs.find(o => o.id === maintenanceToDelete.organId);
    const location = organ ? state.locations.find(l => l.id === organ.locationId) : null;

    const deletedItem: DeletedItem = {
      id: crypto.randomUUID(),
      type: 'maintenance',
      data: maintenanceToDelete,
      reason,
      deletedAt: new Date().toISOString(),
      metadata: {
        locationName: location?.name,
        adm: location?.adm
      }
    };
    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'deletedItems', deletedItem.id), deletedItem);
      batch.delete(doc(db, 'maintenances', id));
      await batch.commit();
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir a manutencao.');
    }
  };

  const requestAction = (type: 'organ' | 'maintenance' | 'history', id: string | undefined, mode: 'edit' | 'delete' | 'view') => {
    setPendingAction({ type, id, mode });
    setReasonInput('');
    setPasswordInput('');
    setPasswordHint(generateHint());
    setShowPasswordModal(true);
  };

  const handleActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const expected = calculateExpectedPassword(passwordHint);
    
    if (passwordInput === expected) {
      if (!pendingAction) return;

      if (pendingAction.mode === 'edit') {
        if (pendingAction.type === 'organ' && pendingAction.id) {
          setSelectedOrganId(pendingAction.id);
          setView('edit-organ');
        } else if (pendingAction.type === 'maintenance' && pendingAction.id) {
          setSelectedMaintenanceId(pendingAction.id);
          setView('edit-maintenance');
        }
      } else if (pendingAction.mode === 'delete') {
        if (!reasonInput.trim()) {
          alert('Por favor, informe o motivo da exclusão.');
          return;
        }
        if (pendingAction.type === 'organ' && pendingAction.id) {
          handleDeleteOrgan(pendingAction.id, reasonInput);
        } else if (pendingAction.type === 'maintenance' && pendingAction.id) {
          handleDeleteMaintenance(pendingAction.id, reasonInput);
        }
      } else if (pendingAction.mode === 'view' && pendingAction.type === 'history') {
        setIsHistoryAuthorized(true);
      }

      setShowPasswordModal(false);
      setPasswordInput('');
      setReasonInput('');
      setPasswordError(false);
      setPendingAction(null);
    } else {
      setPasswordError(true);
      // Atualiza a dica imediatamente após o erro
      setPasswordHint(generateHint());
      setPasswordInput(''); // Limpa o campo para nova tentativa
      setTimeout(() => setPasswordError(false), 2000);
    }
  };

  const currentLevelLocation = state.locations.find(l => l.id === selectedLocationId);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 text-sm text-slate-500 overflow-hidden">
            <button 
              onClick={() => { setView('home'); setSelectedAdm(null); setSelectedLocationId(null); setSelectedOrganId(null); }}
              className="hover:text-blue-600 flex items-center gap-1 font-medium transition-colors border border-slate-100 px-2 py-1 rounded-md"
            >
              <Home size={16} className="text-sky-300" />
              Início
            </button>
            
            {selectedAdm && (
              <>
                <ChevronRight size={14} className="text-slate-300" />
                <button 
                  onClick={() => { setView('adm-detail'); setSelectedLocationId(null); setSelectedOrganId(null); }}
                  className={`hover:text-blue-600 transition-colors border border-slate-100 px-2 py-1 rounded-md ${view === 'adm-detail' ? 'text-blue-600 font-bold' : 'font-medium'}`}
                >
                  {selectedAdm}
                </button>
              </>
            )}

            {currentLevelLocation && (
              <>
                <ChevronRight size={14} className="text-slate-300" />
                <button 
                  onClick={() => { setView('location-detail'); setSelectedOrganId(null); }}
                  className={`hover:text-blue-600 transition-colors border border-slate-100 px-2 py-1 rounded-md ${view === 'location-detail' ? 'text-blue-600 font-bold' : 'font-medium'}`}
                >
                  {currentLevelLocation.name}
                </button>
              </>
            )}

            {(view === 'register-organ' || view === 'edit-organ' || view === 'register-maintenance' || view === 'edit-maintenance' || view === 'reports') && (
              <>
                <ChevronRight size={14} className="text-slate-300" />
                <span className="text-blue-600 font-bold whitespace-nowrap border border-blue-50 px-2 py-1 rounded-md bg-blue-50/30">
                  {view === 'register-organ' ? 'Novo Órgão' : 
                   view === 'edit-organ' ? 'Editar Órgão' :
                   view === 'register-maintenance' ? 'Manutenção' : 
                   view === 'edit-maintenance' ? 'Editar Manutenção' :
                   'Relatórios'}
                </span>
              </>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {isLoading && (
              <div className="py-16 text-center text-slate-400 font-bold tracking-widest uppercase text-sm">
                Carregando dados...
              </div>
            )}

            {!isLoading && view === 'home' && (
              <AdmSelectionView 
                isAdmPending={isAdmPending} 
                onSelectAdm={(adm) => { setSelectedAdm(adm); setView('adm-detail'); }}
                onOpenReports={() => setView('reports')}
              />
            )}

            {!isLoading && view === 'adm-detail' && selectedAdm && (
              <AdmDashboardView 
                adm={selectedAdm}
                state={state}
                isLocationPending={isLocationPending}
                onSelectLocation={(locId) => {
                  setSelectedLocationId(locId);
                  setView('location-detail');
                }}
              />
            )}

            {!isLoading && view === 'location-detail' && selectedLocationId && (
              <LocationDetailView 
                locationId={selectedLocationId}
                state={state}
                isMaintenancePending={isMaintenancePending}
                onRegisterOrgan={() => setView('register-organ')}
                onEditOrgan={(id) => requestAction('organ', id, 'edit')}
                onDeleteOrgan={(id) => requestAction('organ', id, 'delete')}
                onEditMaintenance={(id) => requestAction('maintenance', id, 'edit')}
                onDeleteMaintenance={(id) => requestAction('maintenance', id, 'delete')}
                onRegisterMaintenance={(organId) => {
                  setSelectedOrganId(organId);
                  setView('register-maintenance');
                }}
              />
            )}

            {!isLoading && (view === 'register-organ' || view === 'edit-organ') && selectedLocationId && (
              <OrganForm 
                locationId={selectedLocationId}
                locations={state.locations}
                initialData={view === 'edit-organ' ? state.organs.find(o => o.id === selectedOrganId) : undefined}
                onSubmit={view === 'edit-organ' ? handleUpdateOrgan : handleAddOrgan}
                onCancel={() => setView('location-detail')}
              />
            )}

            {!isLoading && (view === 'register-maintenance' || view === 'edit-maintenance') && (
              <MaintenanceForm 
                organs={state.organs}
                locations={state.locations}
                initialOrganId={selectedOrganId}
                initialData={view === 'edit-maintenance' ? state.maintenances.find(m => m.id === selectedMaintenanceId) : undefined}
                onSubmit={view === 'edit-maintenance' ? handleUpdateMaintenance : handleAddMaintenance}
                onCancel={() => view === 'edit-maintenance' ? setView('reports') : setView('location-detail')}
              />
            )}

            {!isLoading && view === 'reports' && (
              <ReportView 
                state={state}
                isMaintenancePending={isMaintenancePending}
                onEditMaintenance={(id) => requestAction('maintenance', id, 'edit')}
                onDeleteMaintenance={(id) => requestAction('maintenance', id, 'delete')}
                isHistoryAuthorized={isHistoryAuthorized}
                onRequestHistoryAccess={() => requestAction('history', undefined, 'view')}
              />
            )}
          </div>
        </main>
      </div>

      {/* Action Verification Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 text-center space-y-6">
              <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center border shadow-inner ${
                pendingAction?.mode === 'delete' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-amber-50 text-amber-600 border-amber-100'
              }`}>
                {pendingAction?.mode === 'delete' ? <Trash2 size={28} /> : <Lock size={28} />}
              </div>
              
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">
                  {pendingAction?.mode === 'delete' ? 'Confirmar Exclusão' : pendingAction?.mode === 'view' ? 'Acesso ao Histórico' : 'Acesso Restrito'}
                </h3>
                {pendingAction?.mode === 'delete' && (
                  <p className="text-slate-500 text-sm font-medium">
                    Informe o motivo para prosseguir.
                  </p>
                )}
              </div>

              {/* Dica de Senha Dinâmica */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-center gap-2 text-slate-400">
                  <HelpCircle size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Dica de Acesso</span>
                </div>
                <div className="flex justify-center gap-3">
                  {passwordHint.split('').map((digit, i) => (
                    <div key={i} className="w-10 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-xl font-black text-blue-600 shadow-sm">
                      {digit}
                    </div>
                  ))}
                </div>
              </div>

              <form onSubmit={handleActionSubmit} className="space-y-4">
                {pendingAction?.mode === 'delete' && (
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Motivo da Exclusão</label>
                    <textarea 
                      autoFocus
                      required
                      value={reasonInput}
                      onChange={(e) => setReasonInput(e.target.value)}
                      placeholder="Ex: Erro de cadastro..."
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-red-500 focus:bg-white transition-all text-sm font-medium min-h-[80px]"
                    />
                  </div>
                )}
                
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Senha</label>
                  <input 
                    type="password"
                    inputMode="numeric"
                    autoFocus={pendingAction?.mode !== 'delete'}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="••••"
                    className={`w-full p-4 bg-slate-50 border rounded-2xl outline-none transition-all text-center text-lg font-bold tracking-widest focus:bg-white ${
                      passwordError ? 'border-red-500 bg-red-50 text-red-600 animate-shake' : 'border-slate-200 focus:border-blue-500'
                    }`}
                  />
                </div>
                
                {passwordError && (
                  <p className="text-red-500 text-xs font-bold uppercase tracking-widest animate-in slide-in-from-top-1">Senha Incorreta</p>
                )}

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => { setShowPasswordModal(false); setPasswordInput(''); setReasonInput(''); setPasswordError(false); setPendingAction(null); }}
                    className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
                  >
                    <X className="mx-auto" size={20} />
                  </button>
                  <button 
                    type="submit"
                    className={`flex-[2] py-4 text-white rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${
                      pendingAction?.mode === 'delete' 
                        ? 'bg-red-600 hover:bg-red-700 shadow-red-200' 
                        : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                    }`}
                  >
                    Validar
                    <ArrowRight size={18} />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 2;
        }
      `}</style>
    </div>
  );
};

export default App;
