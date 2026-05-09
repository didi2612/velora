import { useState, useEffect } from 'react';
import type { Item } from '../types';

const CATEGORIES = ['Coffee', 'Tea', 'Pastry', 'Food', 'Beverage', 'Dessert', 'General'];

interface Props {
  initial?: Item | null;
  onSubmit: (data: Omit<Item, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export default function ItemForm({ initial, onSubmit, onCancel, loading }: Props) {
  const [form, setForm] = useState({
    name: '',
    price: '',
    category: 'General',
    description: '',
    stock: '0',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name,
        price: String(initial.price),
        category: initial.category,
        description: initial.description ?? '',
        stock: String(initial.stock),
      });
    }
  }, [initial]);

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }));
    setErrors(e => ({ ...e, [key]: '' }));
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.price || isNaN(+form.price) || +form.price < 0)
      errs.price = 'Enter a valid price';
    if (!form.stock || isNaN(+form.stock) || +form.stock < 0)
      errs.stock = 'Enter a valid stock number';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({
      name: form.name.trim(),
      price: parseFloat(form.price),
      category: form.category || 'General',
      description: form.description.trim() || undefined,
      stock: parseInt(form.stock),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Item Name *</label>
        <input
          className={`input ${errors.name ? 'border-red-500 focus:ring-red-500' : ''}`}
          placeholder="e.g. Caramel Latte"
          value={form.name}
          onChange={e => set('name', e.target.value)}
        />
        {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Price (RM) *</label>
          <input
            className={`input ${errors.price ? 'border-red-500 focus:ring-red-500' : ''}`}
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={form.price}
            onChange={e => set('price', e.target.value)}
          />
          {errors.price && <p className="mt-1 text-xs text-red-400">{errors.price}</p>}
        </div>
        <div>
          <label className="label">Stock</label>
          <input
            className={`input ${errors.stock ? 'border-red-500 focus:ring-red-500' : ''}`}
            type="number"
            min="0"
            placeholder="0"
            value={form.stock}
            onChange={e => set('stock', e.target.value)}
          />
          {errors.stock && <p className="mt-1 text-xs text-red-400">{errors.stock}</p>}
        </div>
      </div>

      <div>
        <label className="label">Category</label>
        <select
          className="input"
          value={form.category}
          onChange={e => set('category', e.target.value)}
        >
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div>
        <label className="label">Description</label>
        <textarea
          className="input resize-none"
          rows={3}
          placeholder="Optional description..."
          value={form.description}
          onChange={e => set('description', e.target.value)}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" className="btn-secondary flex-1" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn-primary flex-1" disabled={loading}>
          {loading ? 'Saving…' : initial ? 'Save Changes' : 'Add Item'}
        </button>
      </div>
    </form>
  );
}
