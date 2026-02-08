
import React, { useState, useEffect } from 'react';
import { Organ, Maintenance, Location, MaintenancePart } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { Camera, Trash2, Plus, Image as ImageIcon, Save, X } from 'lucide-react';

interface MaintenanceFormProps {
  organs: Organ[];
  locations: Location[];
  initialOrganId: string | null;
  initialData?: Maintenance;
  onSubmit: (maintenance: Maintenance) => void;
  onCancel: () => void;
}

export const MaintenanceForm: React.FC<MaintenanceFormProps> = ({ organs, locations, initialOrganId, initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    organId: initialOrganId || '',
    date: new Date().toISOString().split('T')[0],
    technician1: '',
    technician2: '',
    occurrence: '',
    hasPartExchange: false,
  });

  const [partDetails, setPartDetails] = useState<MaintenancePart>({
    description: '',
    reason: '',
    observation: '',
  });

  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        organId: initialData.organId,
        date: initialData.date,
        technician1: initialData.technicians[0] || '',
        technician2: initialData.technicians[1] || '',
        occurrence: initialData.occurrence,
        hasPartExchange: initialData.hasPartExchange,
      });
      if (initialData.partExchangeDetails) {
        setPartDetails(initialData.partExchangeDetails);
      }
      setPhotos(initialData.photos || []);
    } else if (initialOrganId) {
      setFormData(prev => ({ ...prev, organId: initialOrganId }));
    }
  }, [initialOrganId, initialData]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const remainingSlots = 10 - photos.length;
      
      if (remainingSlots <= 0) {
        alert('Limite máximo de 10 fotos atingido.');
        return;
      }

      const filesToProcess = Array.from(files).slice(0, remainingSlots);
      
      if (files.length > remainingSlots) {
        alert(`Apenas as primeiras ${remainingSlots} fotos serão adicionadas para respeitar o limite de 10.`);
      }

      filesToProcess.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotos(prev => {
            if (prev.length >= 10) return prev;
            return [...prev, reader.result as string];
          });
        };
        reader.readAsDataURL(file as File);
      });
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.organId) return alert('Selecione um órgão');

    const technicians = [formData.technician1, formData.technician2].filter(t => t !== '');
    
    const maintenance: Maintenance = {
      id: initialData?.id || uuidv4(),
      organId: formData.organId,
      date: formData.date,
      technicians,
      occurrence: formData.occurrence,
      hasPartExchange: formData.hasPartExchange,
      partExchangeDetails: formData.hasPartExchange ? partDetails : undefined,
      photos,
    };

    onSubmit(maintenance);
  };

  return (
    <div className="bg-white p-8 rounded-[40px] shadow-xl border border-slate-200 animate-in zoom-in-95 duration-300">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
          {initialData ? 'Editar Manutenção' : 'Registrar Manutenção'}
        </h2>
        <p className="text-slate-500 font-medium">Preencha os dados técnicos do atendimento</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Órgão Alvo</label>
            <select 
              value={formData.organId}
              onChange={(e) => setFormData({ ...formData, organId: e.target.value })}
              required
              disabled={!!initialData}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-medium text-slate-700 shadow-inner disabled:opacity-50"
            >
              <option value="">Selecione o órgão...</option>
              {organs.map(organ => {
                const loc = locations.find(l => l.id === organ.locationId);
                return (
                  <option key={organ.id} value={organ.id}>
                    {organ.model} - {loc?.adm} ({loc?.name}) - Nº Patrimônio: {organ.patrimonyNumber}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Data do Serviço</label>
            <input 
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-medium text-slate-700 shadow-inner"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Técnico 1</label>
              <input 
                type="text"
                value={formData.technician1}
                onChange={(e) => setFormData({ ...formData, technician1: e.target.value })}
                required
                placeholder="Nome completo"
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-medium text-slate-700 shadow-inner"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Técnico 2</label>
              <input 
                type="text"
                value={formData.technician2}
                onChange={(e) => setFormData({ ...formData, technician2: e.target.value })}
                placeholder="Opcional"
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-medium text-slate-700 shadow-inner"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Ocorrência Detalhada</label>
            <textarea 
              value={formData.occurrence}
              onChange={(e) => setFormData({ ...formData, occurrence: e.target.value })}
              required
              rows={4}
              placeholder="Descreva o serviço executado..."
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-medium text-slate-700 shadow-inner"
            />
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center gap-3 cursor-pointer select-none bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner hover:bg-slate-100 transition-colors">
              <input 
                type="checkbox"
                checked={formData.hasPartExchange}
                onChange={(e) => setFormData({ ...formData, hasPartExchange: e.target.checked })}
                className="w-6 h-6 rounded-lg text-blue-600 focus:ring-blue-500 border border-slate-300"
              />
              <span className="text-sm font-bold text-slate-700">Houve troca de peças ou componentes?</span>
            </label>
          </div>

          {formData.hasPartExchange && (
            <div className="md:col-span-2 p-8 bg-blue-50/50 rounded-3xl border border-blue-100 space-y-5 animate-in slide-in-from-top-4 duration-300">
              <h4 className="font-black text-blue-800 uppercase tracking-widest text-xs">Especificação da Troca</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Peça(s) Substituída(s)</label>
                  <input 
                    type="text"
                    value={partDetails.description}
                    onChange={(e) => setPartDetails({ ...partDetails, description: e.target.value })}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Motivo</label>
                  <input 
                    type="text"
                    value={partDetails.reason}
                    onChange={(e) => setPartDetails({ ...partDetails, reason: e.target.value })}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Observações Extras</label>
                  <input 
                    type="text"
                    value={partDetails.observation}
                    onChange={(e) => setPartDetails({ ...partDetails, observation: e.target.value })}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Evidências Fotográficas</label>
              <span className={`text-[10px] font-black uppercase tracking-widest ${photos.length === 10 ? 'text-red-500' : 'text-slate-400'}`}>
                {photos.length} / 10 fotos
              </span>
            </div>
            
            <div className="flex flex-wrap gap-4">
              {photos.map((photo, idx) => (
                <div key={idx} className="relative group">
                  <img src={photo} alt={`Upload ${idx}`} className="w-24 h-24 object-cover rounded-2xl border-2 border-white shadow-md transition-transform hover:scale-105" />
                  <button 
                    type="button"
                    onClick={() => removePhoto(idx)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg border border-red-600"
                  >
                    <Trash2 size={12} className="text-white" />
                  </button>
                </div>
              ))}
              
              {photos.length < 10 && (
                <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all text-slate-400 bg-slate-50 shadow-inner">
                  <Plus size={24} className="text-sky-300" />
                  <span className="text-[10px] font-black uppercase mt-1">Add Foto</span>
                  <input type="file" multiple accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
              )}
            </div>
            
            <p className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
              Máximo 10 fotos por atendimento
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 pt-8 border-t border-slate-100">
          <button 
            type="submit"
            className="flex-1 bg-green-600 text-white py-5 rounded-[24px] font-black uppercase tracking-widest hover:bg-green-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-green-100 border border-green-500"
          >
            <Save size={20} className="text-white" />
            {initialData ? 'Atualizar Registro' : 'Gravar Manutenção'}
          </button>
          <button 
            type="button"
            onClick={onCancel}
            className="px-10 py-5 bg-slate-100 text-slate-500 rounded-[24px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-3 border border-slate-200"
          >
            <X size={20} className="text-sky-300" />
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};
