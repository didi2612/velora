'use client';
import { useState } from 'react';
import { Plus, Search, Pencil, Trash2, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { itemsApi } from '@/lib/api';
import type { Item } from '@/types';
import Modal from '@/components/Modal';
import ItemForm from '@/components/ItemForm';

const CATEGORY_COLORS: Record<string, string> = {
  Coffee: 'bg-amber-500/20 text-amber-400', Tea: 'bg-green-500/20 text-green-400',
  Pastry: 'bg-pink-500/20 text-pink-400',   Food: 'bg-orange-500/20 text-orange-400',
  Beverage: 'bg-blue-500/20 text-blue-400', Dessert: 'bg-purple-500/20 text-purple-400',
  General: 'bg-slate-500/20 text-slate-400',
};

export default function ItemsClient({ initialItems }: { initialItems: Item[] }) {
  const [items, setItems]         = useState<Item[]>(initialItems);
  const [search, setSearch]       = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [saving, setSaving]       = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem]   = useState<Item | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const categories = ['All', ...Array.from(new Set(items.map(i => i.category))).sort()];
  const filtered   = items.filter(i =>
    (i.name.toLowerCase().includes(search.toLowerCase()) || i.category.toLowerCase().includes(search.toLowerCase())) &&
    (catFilter === 'All' || i.category === catFilter)
  );

  async function handleSubmit(data: Omit<Item, 'id' | 'created_at' | 'updated_at'>) {
    setSaving(true);
    try {
      if (editItem) {
        const updated = await itemsApi.update(editItem.id, data);
        setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
        toast.success('Item updated');
      } else {
        const created = await itemsApi.create(data);
        setItems(prev => [created, ...prev]);
        toast.success('Item added');
      }
      setModalOpen(false); setEditItem(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally { setSaving(false); }
  }

  async function handleDelete(id: number) {
    try {
      await itemsApi.delete(id);
      setItems(prev => prev.filter(i => i.id !== id));
      toast.success('Item deleted');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    } finally { setConfirmId(null); }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search items…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button onClick={() => { setEditItem(null); setModalOpen(true); }} className="btn-primary flex items-center gap-2 whitespace-nowrap">
          <Plus size={16} /> Add Item
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {categories.map(c => (
          <button key={c} onClick={() => setCatFilter(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${catFilter === c ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-white hover:bg-slate-600'}`}>
            {c}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Package size={40} className="mb-3 opacity-40" />
            <p className="text-sm">No items found</p>
            {search === '' && catFilter === 'All' && (
              <button onClick={() => setModalOpen(true)} className="mt-3 text-indigo-400 hover:text-indigo-300 text-sm">Add your first item</button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800/50">
                  {['Name','Category','Price','Stock','Description','Actions'].map((h, i) => (
                    <th key={h} className={`px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider ${i >= 2 && i <= 3 ? 'text-right' : i === 5 ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {filtered.map(item => (
                  <tr key={item.id} className="hover:bg-slate-700/20 transition-colors group">
                    <td className="px-5 py-3.5"><p className="text-sm font-medium text-white">{item.name}</p></td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[item.category] ?? CATEGORY_COLORS.General}`}>{item.category}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right"><span className="text-sm font-semibold text-emerald-400">RM {Number(item.price).toFixed(2)}</span></td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={`text-sm font-medium ${item.stock <= 5 ? 'text-red-400' : item.stock <= 20 ? 'text-amber-400' : 'text-slate-300'}`}>{item.stock}</span>
                    </td>
                    <td className="px-5 py-3.5 max-w-xs"><p className="text-sm text-slate-400 truncate">{item.description ?? '—'}</p></td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditItem(item); setModalOpen(true); }} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"><Pencil size={14} /></button>
                        <button onClick={() => setConfirmId(item.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <p className="text-xs text-slate-500 text-right">Showing {filtered.length} of {items.length} items</p>
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditItem(null); }} title={editItem ? 'Edit Item' : 'Add New Item'}>
        <ItemForm initial={editItem} onSubmit={handleSubmit} onCancel={() => { setModalOpen(false); setEditItem(null); }} loading={saving} />
      </Modal>

      <Modal open={confirmId !== null} onClose={() => setConfirmId(null)} title="Delete Item" maxWidth="max-w-sm">
        <p className="text-sm text-slate-300 mb-5">Are you sure you want to delete this item? This action cannot be undone.</p>
        <div className="flex gap-3">
          <button className="btn-secondary flex-1" onClick={() => setConfirmId(null)}>Cancel</button>
          <button className="flex-1 bg-red-600 hover:bg-red-500 text-white font-medium px-4 py-2 rounded-lg transition-colors" onClick={() => confirmId && handleDelete(confirmId)}>Delete</button>
        </div>
      </Modal>
    </div>
  );
}
