'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, Clock, Users } from 'lucide-react';
import toast from 'react-hot-toast';

interface Vendor {
  id: number;
  email: string;
  status: 'pending' | 'active' | 'rejected';
  created_at: string;
  shop_name: string | null;
  phone_number: string | null;
  bank_name: string | null;
  bank_account_no: string | null;
}

type Filter = 'all' | 'pending' | 'active' | 'rejected';

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  pending:  { label: 'Pending',  className: 'bg-amber-500/10  text-amber-400  border-amber-500/20' },
  active:   { label: 'Active',   className: 'bg-green-500/10  text-green-400  border-green-500/20' },
  rejected: { label: 'Rejected', className: 'bg-red-500/10    text-red-400    border-red-500/20'   },
};

export default function VendorsPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [updating, setUpdating] = useState<number | null>(null);

  async function load() {
    try {
      const res = await fetch('/api/admin/vendors');
      if (res.status === 401) { router.push('/login'); return; }
      if (!res.ok) throw new Error('Failed to load vendors');
      setVendors(await res.json());
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error loading vendors');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function updateStatus(id: number, status: 'active' | 'rejected') {
    setUpdating(id);
    try {
      const res = await fetch(`/api/admin/vendors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Update failed');
      toast.success(status === 'active' ? 'Vendor approved' : 'Vendor rejected');
      setVendors(vs => vs.map(v => v.id === id ? { ...v, status } : v));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setUpdating(null);
    }
  }

  const filtered = filter === 'all' ? vendors : vendors.filter(v => v.status === filter);
  const counts = { all: vendors.length, pending: 0, active: 0, rejected: 0 };
  for (const v of vendors) counts[v.status]++;

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all',      label: `All (${counts.all})`           },
    { key: 'pending',  label: `Pending (${counts.pending})`   },
    { key: 'active',   label: `Active (${counts.active})`     },
    { key: 'rejected', label: `Rejected (${counts.rejected})` },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-indigo-600/20 rounded-lg flex items-center justify-center">
          <Users size={18} className="text-indigo-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Vendors</h2>
          <p className="text-sm text-slate-500">Manage vendor accounts and approvals</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-slate-900 border border-slate-700/60 rounded-xl w-fit">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === key
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-700/60 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <span className="w-6 h-6 border-2 border-indigo-600/30 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <Users size={40} className="mb-3 opacity-30" />
            <p className="text-sm">No vendors found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/60">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Shop Name</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Bank</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Account No.</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40">
                {filtered.map(vendor => {
                  const badge = STATUS_BADGE[vendor.status];
                  const isBusy = updating === vendor.id;
                  return (
                    <tr key={vendor.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-4 text-slate-200">{vendor.email}</td>
                      <td className="px-5 py-4 text-slate-300">{vendor.shop_name ?? '—'}</td>
                      <td className="px-5 py-4 text-slate-400">{vendor.phone_number ?? '—'}</td>
                      <td className="px-5 py-4 text-slate-400">{vendor.bank_name ?? '—'}</td>
                      <td className="px-5 py-4 text-slate-400">{vendor.bank_account_no ?? '—'}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${badge.className}`}>
                          {vendor.status === 'pending' && <Clock size={11} />}
                          {vendor.status === 'active' && <CheckCircle2 size={11} />}
                          {vendor.status === 'rejected' && <XCircle size={11} />}
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateStatus(vendor.id, 'active')}
                            disabled={isBusy || vendor.status === 'active'}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600/10 hover:bg-green-600/20 text-green-400 border border-green-600/20 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {isBusy ? <span className="w-3 h-3 border border-green-400/30 border-t-green-400 rounded-full animate-spin" /> : <CheckCircle2 size={12} />}
                            Approve
                          </button>
                          <button
                            onClick={() => updateStatus(vendor.id, 'rejected')}
                            disabled={isBusy || vendor.status === 'rejected'}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-600/20 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {isBusy ? <span className="w-3 h-3 border border-red-400/30 border-t-red-400 rounded-full animate-spin" /> : <XCircle size={12} />}
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
