import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Check, ShoppingBag, X } from 'lucide-react';
import { formatCurrency } from '@/lib/pricing';
import type { Equipment } from '@/types';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  primaryItem: Equipment | null;
  onConfirm: (selectedAccessories: Equipment[]) => void;
}

export default function AccessoryModal({ isOpen, onClose, primaryItem, onConfirm }: ModalProps) {
  const [accessories, setAccessories] = useState<Equipment[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && primaryItem) {
      fetchLinkedAccessories(primaryItem.id);
      setSelectedIds([]); // Reset selections on fresh open
    }
  }, [isOpen, primaryItem]);

  const fetchLinkedAccessories = async (parentId: string) => {
    setLoading(true);
    // Query items flagged as accessories that match the parent primary unit ID
    const { data } = await supabase
      .from('equipment')
      .select('*')
      .eq('is_accessory', true)
      .eq('parent_id', parentId)
      .eq('is_active', true);
    
    setAccessories(data || []);
    setLoading(false);
  };

  const toggleAccessory = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleProceed = () => {
    const chosenItems = accessories.filter(acc => selectedIds.includes(acc.id));
    onConfirm(chosenItems);
  };

  if (!isOpen || !primaryItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Layout */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Configure Your Rental Bundle</h3>
            <p className="text-xs text-slate-500 mt-0.5">Enhance your {primaryItem.name} setup with matching accessories.</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-xl transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content Body Grid List */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {loading ? (
            <div className="text-center py-10 text-sm text-slate-400">Loading accessory configurations...</div>
          ) : accessories.length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-500 bg-slate-50 border border-dashed rounded-2xl p-4">
              💡 No specialized accessory options required for this unit. Click proceed below to add to your cart.
            </div>
          ) : (
            accessories.map((acc) => {
              const isChecked = selectedIds.includes(acc.id);
              return (
                <div 
                  key={acc.id} 
                  onClick={() => toggleAccessory(acc.id)}
                  className={`p-4 border rounded-2xl flex justify-between items-center gap-4 cursor-pointer transition-all duration-200 select-none ${
                    isChecked ? 'border-blue-600 bg-blue-50/40 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 text-sm">{acc.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{acc.description}</p>
                    <div className="text-xs font-extrabold text-blue-600 mt-1">{formatCurrency(acc.price_1day || 0)} / day</div>
                  </div>
                  
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                    isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white text-transparent'
                  }`}>
                    {isChecked ? <Check size={14} strokeWidth={3} /> : <Plus size={14} className="text-slate-400" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Navigation CTA */}
        <div className="p-5 border-t border-slate-100 bg-slate-50 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 bg-white border border-slate-300 text-slate-700 font-semibold rounded-xl text-sm hover:bg-slate-100 transition-colors">
            Cancel
          </button>
          <button onClick={handleProceed} className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-xl text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5 shadow-sm">
            <ShoppingBag size={16} />
            <span>Add Bundle to Cart</span>
          </button>
        </div>
      </div>
    </div>
  );
}
