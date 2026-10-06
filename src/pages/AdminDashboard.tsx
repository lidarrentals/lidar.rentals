import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Shield, Truck, FileText, CheckCircle2, Loader2, Save, Upload } from 'lucide-react';
import { formatCurrency } from '@/lib/pricing';

export default function AdminDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [editForms, setEditForms] = useState<{ [key: string]: any }>({});

  useEffect(() => {
    fetchAllOrders();
  }, []);

  const fetchAllOrders = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    
    setOrders(data || []);
    
    const forms: any = {};
    (data || []).forEach(order => {
      forms[order.id] = {
        tracking_number: order.tracking_number || '',
        tracking_carrier: order.tracking_carrier || 'UPS',
        invoice_url: order.invoice_url || '',
        status: order.status || 'pending'
      };
    });
    setEditForms(forms);
    setLoading(false);
  };

  const handleInputChange = (orderId: string, field: string, value: string) => {
    setEditForms(prev => ({
      ...prev,
      [orderId]: { ...prev[orderId], [field]: value }
    }));
  };

  const handleInvoiceUpload = async (e: React.ChangeEvent<HTMLInputElement>, orderId: string) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files;

    if (file.type !== 'application/pdf') {
      alert('File block: You can only upload invoices in .pdf format!');
      return;
    }

    setUploadingId(orderId);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `invoice-${orderId}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('insurance-certificates')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('insurance-certificates')
        .getPublicUrl(filePath);

      await supabase
        .from('orders')
        .update({ invoice_url: publicUrl })
        .eq('id', orderId);

      handleInputChange(orderId, 'invoice_url', publicUrl);
      alert('Invoice PDF uploaded and linked to customer account successfully!');
      fetchAllOrders();
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploadingId(null);
    }
  };

  const handleUpdateOrder = async (orderId: string) => {
    setSavingId(orderId);
    const formUpdates = editForms[orderId];
    const orderData = orders.find(o => o.id === orderId);

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          tracking_number: formUpdates.tracking_number,
          tracking_carrier: formUpdates.tracking_carrier,
          invoice_url: formUpdates.invoice_url,
          status: formUpdates.status
        })
        .eq('id', orderId);

      if (error) throw error;

      if (orderData) {
        // This is perfectly configured with the new underscore file path name mapping link!
        fetch('/.netlify/functions/send_order_email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerEmail: orderData.customer_email,
            customerName: orderData.customer_name,
            orderId: orderId,
            status: formUpdates.status,
            trackingNumber: formUpdates.tracking_number,
            trackingCarrier: formUpdates.tracking_carrier
          })
        }).catch(err => console.error("Email log trace error:", err));
      }

      alert('Order status saved! Notification email dispatched seamlessly.');
      fetchAllOrders();
    } catch (err: any) {
      alert('Failed to save administration metadata: ' + err.message);
    } finally {
      setSavingId(null);
    }
  };
  if (loading) {
    return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-3 border-b border-slate-200 pb-5 mb-8">
        <div className="p-2.5 bg-slate-900 text-white rounded-xl"><Shield size={24} /></div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">RentPro Admin Operations Command Center</h1>
          <p className="text-sm text-slate-500">Manage user shipping codes, logistics links, and digital store invoicing systems.</p>
        </div>
      </div>

      <div className="space-y-6">
        {orders.length === 0 ? (
          <p className="text-center text-slate-400 py-10">No customer orders captured inside the database rows grid.</p>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col xl:flex-row justify-between gap-6">
              <div className="space-y-2 flex-1 min-w-[280px]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">ID: {order.id.slice(0, 8)}</span>
                  <span className="text-xs text-slate-400">{new Date(order.created_at).toLocaleDateString()}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900">{order.customer_name}</h3>
                <p className="text-sm text-slate-500 font-medium">{order.customer_email} • {order.customer_phone || 'No Phone'}</p>
                <div className="text-lg font-black text-blue-600 pt-1">{formatCurrency(order.total)}</div>
                
                {order.coi_url && (
                  <a href={order.coi_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-green-700 bg-green-50 px-2.5 py-1 rounded-md font-semibold border border-green-100 hover:underline">
                    <CheckCircle2 size={12} /> Customer COI PDF Document Attached
                  </a>
                )}
              </div>

              <div className="grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 flex-[2.5] items-end">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Logistics Carrier</label>
                  <select value={editForms[order.id]?.tracking_carrier} onChange={e => handleInputChange(order.id, 'tracking_carrier', e.target.value)} className="w-full text-xs p-2 border bg-white rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="UPS">UPS Logistics</option>
                    <option value="Canada Post">Canada Post</option>
                    <option value="FedEx">FedEx Express</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Tracking Number (#)</label>
                  <input type="text" placeholder="e.g. 1Z999AA10123" value={editForms[order.id]?.tracking_number} onChange={e => handleInputChange(order.id, 'tracking_number', e.target.value)} className="w-full text-xs p-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Portal Invoice (.PDF)</label>
                  {editForms[order.id]?.invoice_url ? (
                    <div className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 p-2 rounded-lg border border-blue-100 truncate max-w-[200px]">
                      <FileText size={12} />
                      <a href={editForms[order.id].invoice_url} target="_blank" rel="noreferrer" className="underline font-medium truncate">Invoice Linked</a>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-2 bg-slate-50 border border-slate-300 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors shadow-sm w-full">
                      {uploadingId === order.id ? <Loader2 className="animate-spin w-3.5 h-3.5" /> : <Upload size={13} />}
                      <span>{uploadingId === order.id ? 'Uploading...' : 'Upload Invoice'}</span>
                      <input type="file" accept=".pdf" onChange={(e) => handleInvoiceUpload(e, order.id)} className="hidden" disabled={uploadingId === order.id} />
                    </label>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Workflow Status</label>
                  <select value={editForms[order.id]?.status} onChange={e => handleInputChange(order.id, 'status', e.target.value)} className="w-full text-xs p-2 border bg-white rounded-lg focus:ring-2 focus:ring-blue-500 font-bold">
                    <option value="pending">Pending Review</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="shipped">Shipped Out</option>
                    <option value="returned">Returned Safe</option>
                  </select>
                </div>
              </div>

              <div className="flex items-end justify-end">
                <button type="button" onClick={() => handleUpdateOrder(order.id)} disabled={savingId === order.id} className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50">
                  {savingId === order.id ? <Loader2 className="animate-spin w-3.5 h-3.5" /> : <Save size={14} />}
                  <span>Save Record Updates</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
