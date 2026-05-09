'use client';
import { useEffect, useState, useCallback } from 'react';
import {
  Plus, Search, Trash2, CheckCircle, XCircle,
  ShoppingCart, Minus, ChevronDown, ChevronUp,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import { ordersApi, itemsApi } from '@/lib/api';
import type { Item, Order, OrderItem } from '@/types';
import Modal from '@/components/Modal';
import PaymentModal from '@/components/PaymentModal';

const CATEGORY_COLORS: Record<string, string> = {
  Coffee:   'bg-amber-500/20 text-amber-400',
  Tea:      'bg-green-500/20 text-green-400',
  Pastry:   'bg-pink-500/20 text-pink-400',
  Food:     'bg-orange-500/20 text-orange-400',
  Beverage: 'bg-blue-500/20 text-blue-400',
  Dessert:  'bg-purple-500/20 text-purple-400',
  General:  'bg-slate-500/20 text-slate-400',
};

type StatusFilter = 'all' | 'pending' | 'completed' | 'cancelled';

export default function Orders() {
  const [items, setItems]               = useState<Item[]>([]);
  const [orders, setOrders]             = useState<Order[]>([]);
  const [activeOrder, setActiveOrder]   = useState<Order | null>(null);
  const [search, setSearch]             = useState('');
  const [catFilter, setCatFilter]       = useState('All');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [loading, setLoading]           = useState(true);
  const [creating, setCreating]         = useState(false);
  const [actionId, setActionId]         = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Order | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());
  const [payingOrder, setPayingOrder]     = useState<Order | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [itemsData, ordersData] = await Promise.all([
        itemsApi.getAll(),
        ordersApi.getAll(),
      ]);
      setItems(itemsData);
      setOrders(ordersData);
      setActiveOrder(prev =>
        prev ? (ordersData.find(o => o.id === prev.id) ?? null) : null
      );
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const categories = ['All', ...Array.from(new Set(items.map(i => i.category))).sort()];

  const filteredItems = items.filter(i => {
    const ms = i.name.toLowerCase().includes(search.toLowerCase());
    const mc = catFilter === 'All' || i.category === catFilter;
    return ms && mc;
  });

  const filteredOrders = orders.filter(o =>
    statusFilter === 'all' || o.status === statusFilter
  );

  async function handleNewOrder() {
    setCreating(true);
    try {
      const order = await ordersApi.create();
      setOrders(prev => [order, ...prev]);
      setActiveOrder(order);
      toast.success(`Order ${order.order_number} created`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create order');
    } finally {
      setCreating(false);
    }
  }

  async function handleAddItem(item: Item) {
    if (!activeOrder) {
      toast.error('Create an order first');
      return;
    }
    setActionId(item.id);
    try {
      await ordersApi.addItem(activeOrder.id, item.id, 1);
      const updated = await ordersApi.getAll();
      setOrders(updated);
      setActiveOrder(updated.find(o => o.id === activeOrder.id) ?? null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to add item');
    } finally {
      setActionId(null);
    }
  }

  async function handleQtyChange(oi: OrderItem, delta: number) {
    if (!activeOrder) return;
    const newQty = oi.quantity + delta;
    if (newQty <= 0) {
      await handleRemoveItem(oi);
      return;
    }
    try {
      await ordersApi.updateItemQty(activeOrder.id, oi.id, newQty);
      const updated = await ordersApi.getAll();
      setOrders(updated);
      setActiveOrder(updated.find(o => o.id === activeOrder.id) ?? null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update quantity');
    }
  }

  async function handleRemoveItem(oi: OrderItem) {
    if (!activeOrder) return;
    try {
      await ordersApi.removeItem(activeOrder.id, oi.id);
      const updated = await ordersApi.getAll();
      setOrders(updated);
      setActiveOrder(updated.find(o => o.id === activeOrder.id) ?? null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove item');
    }
  }

  async function handleStatus(order: Order, status: Order['status']) {
    try {
      const updated = await ordersApi.updateStatus(order.id, status);
      setOrders(prev => prev.map(o => o.id === updated.id ? { ...o, ...updated } : o));
      if (activeOrder?.id === order.id) setActiveOrder(null);
      toast.success(`Order ${status}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    }
  }

  async function handlePaid(order: Order) {
    setPayingOrder(null);
    await handleStatus(order, 'completed');
  }

  async function handleDeleteOrder(order: Order) {
    try {
      await ordersApi.delete(order.id);
      setOrders(prev => prev.filter(o => o.id !== order.id));
      if (activeOrder?.id === order.id) setActiveOrder(null);
      toast.success('Order deleted');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete order');
    } finally {
      setConfirmDelete(null);
    }
  }

  function toggleExpand(id: number) {
    setExpandedOrders(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="flex flex-col lg:flex-row gap-5 h-full">
      {/* LEFT: Items catalog */}
      <div className="flex-1 flex flex-col min-w-0 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Search menu items…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={handleNewOrder}
            disabled={creating}
            className="btn-primary flex items-center gap-2 whitespace-nowrap"
          >
            <Plus size={16} />
            {creating ? 'Creating…' : 'New Order'}
          </button>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 flex-wrap">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setCatFilter(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                catFilter === c
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-700 text-slate-400 hover:text-white hover:bg-slate-600'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Items grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredItems.map(item => {
              const inOrder = activeOrder?.items.find(oi => oi.item_id === item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => handleAddItem(item)}
                  disabled={actionId === item.id || !activeOrder}
                  className={`card p-4 text-left group hover:border-indigo-500/50 hover:bg-slate-700/50 transition-all duration-150 relative ${
                    !activeOrder ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  } ${inOrder ? 'border-indigo-500/30 bg-indigo-500/5' : ''}`}
                >
                  {inOrder && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{inOrder.quantity}</span>
                    </div>
                  )}
                  <div className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium mb-2 ${CATEGORY_COLORS[item.category] ?? CATEGORY_COLORS.General}`}>
                    {item.category}
                  </div>
                  <p className="text-sm font-semibold text-white leading-tight mb-1">{item.name}</p>
                  <p className="text-base font-bold text-emerald-400">RM {Number(item.price).toFixed(2)}</p>
                  {item.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                  )}
                </button>
              );
            })}
            {filteredItems.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-500 text-sm">
                No items found
              </div>
            )}
          </div>
        )}

        {/* No active order hint */}
        {!activeOrder && !loading && (
          <div className="card p-4 border-dashed border-amber-500/30 bg-amber-500/5">
            <p className="text-sm text-amber-400 flex items-center gap-2">
              <ShoppingCart size={16} />
              Click <strong>New Order</strong> to start adding items
            </p>
          </div>
        )}
      </div>

      {/* RIGHT: Active order + Orders list */}
      <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 space-y-4">
        {/* Active order panel */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <ShoppingCart size={16} className="text-indigo-400" />
              {activeOrder ? activeOrder.order_number : 'No Active Order'}
            </h2>
            {activeOrder && (
              <span className="badge-pending">pending</span>
            )}
          </div>

          {!activeOrder ? (
            <div className="py-10 text-center text-slate-500">
              <ShoppingCart size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Start a new order to add items</p>
            </div>
          ) : (
            <>
              {/* Order items */}
              <div className="divide-y divide-slate-700/60 max-h-64 overflow-y-auto">
                {activeOrder.items.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-500">
                    Click items from the catalog to add
                  </p>
                ) : (
                  activeOrder.items.map(oi => (
                    <div key={oi.id} className="px-4 py-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{oi.item_name}</p>
                        <p className="text-xs text-slate-400">RM {Number(oi.unit_price).toFixed(2)} each</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleQtyChange(oi, -1)}
                          className="w-6 h-6 rounded bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300 transition-colors"
                        >
                          <Minus size={11} />
                        </button>
                        <span className="w-7 text-center text-sm font-bold text-white">{oi.quantity}</span>
                        <button
                          onClick={() => handleQtyChange(oi, 1)}
                          className="w-6 h-6 rounded bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300 transition-colors"
                        >
                          <Plus size={11} />
                        </button>
                      </div>
                      <div className="text-right w-16">
                        <p className="text-sm font-semibold text-white">RM {Number(oi.subtotal).toFixed(2)}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(oi)}
                        className="p-1 text-slate-500 hover:text-red-400 transition-colors flex-shrink-0"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Total & actions */}
              <div className="px-5 py-4 bg-slate-800/50 border-t border-slate-700 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Total</span>
                  <span className="text-xl font-bold text-white">RM {Number(activeOrder.total).toFixed(2)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleStatus(activeOrder, 'cancelled')}
                    className="btn-danger flex items-center justify-center gap-1.5 py-2"
                  >
                    <XCircle size={14} /> Cancel
                  </button>
                  <button
                    onClick={() => setPayingOrder(activeOrder)}
                    disabled={activeOrder.items.length === 0}
                    className="btn-success flex items-center justify-center gap-1.5 py-2"
                  >
                    <CheckCircle size={14} /> Pay
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Orders list */}
        <div className="card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-700 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">All Orders</h2>
            <select
              className="bg-slate-700 border border-slate-600 text-slate-300 text-xs rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as StatusFilter)}
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="divide-y divide-slate-700/60 max-h-[480px] overflow-y-auto">
            {filteredOrders.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-500">No orders</p>
            ) : (
              filteredOrders.map(order => {
                const isExpanded = expandedOrders.has(order.id);
                const isActive = activeOrder?.id === order.id;
                return (
                  <div key={order.id} className={`${isActive ? 'bg-indigo-500/5' : ''}`}>
                    <div
                      className="px-4 py-3 flex items-center gap-2 cursor-pointer hover:bg-slate-700/20 transition-colors"
                      onClick={() => toggleExpand(order.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-white truncate">{order.order_number}</p>
                          {isActive && <span className="text-xs text-indigo-400">(active)</span>}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {format(parseISO(order.created_at), 'MMM d, h:mm a')}
                        </p>
                      </div>
                      <span className={`badge-${order.status} flex-shrink-0`}>{order.status}</span>
                      <span className="text-sm font-bold text-white flex-shrink-0">
                        RM {Number(order.total).toFixed(2)}
                      </span>
                      {isExpanded ? <ChevronUp size={14} className="text-slate-400 flex-shrink-0" /> : <ChevronDown size={14} className="text-slate-400 flex-shrink-0" />}
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-3 bg-slate-800/30 border-t border-slate-700/40">
                        <div className="pt-2 space-y-1 mb-3">
                          {order.items.map(oi => (
                            <div key={oi.id} className="flex justify-between text-xs text-slate-400">
                              <span>{oi.item_name} × {oi.quantity}</span>
                              <span>RM {Number(oi.subtotal).toFixed(2)}</span>
                            </div>
                          ))}
                          {order.items.length === 0 && (
                            <p className="text-xs text-slate-500">No items</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {order.status === 'pending' && (
                            <>
                              <button
                                onClick={() => setActiveOrder(orders.find(o => o.id === order.id) ?? null)}
                                className="flex-1 text-xs py-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 transition-colors font-medium"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => setPayingOrder(order)}
                                className="flex-1 text-xs py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 transition-colors font-medium"
                              >
                                Pay
                              </button>
                              <button
                                onClick={() => handleStatus(order, 'cancelled')}
                                className="flex-1 text-xs py-1.5 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors font-medium"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setConfirmDelete(order)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* BillPlz Payment Modal */}
      <PaymentModal
        order={payingOrder}
        onPaid={handlePaid}
        onClose={() => setPayingOrder(null)}
      />

      {/* Delete confirmation */}
      <Modal
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title="Delete Order"
        maxWidth="max-w-sm"
      >
        <p className="text-sm text-slate-300 mb-5">
          Delete order <strong className="text-white">{confirmDelete?.order_number}</strong>? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button className="btn-secondary flex-1" onClick={() => setConfirmDelete(null)}>Cancel</button>
          <button
            className="flex-1 bg-red-600 hover:bg-red-500 text-white font-medium px-4 py-2 rounded-lg transition-colors"
            onClick={() => confirmDelete && handleDeleteOrder(confirmDelete)}
          >
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}
