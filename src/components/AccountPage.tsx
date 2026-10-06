import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { FileText, Upload, CheckCircle, Loader2, Lock } from 'lucide-react';
import { formatCurrency } from '@/lib/pricing';

export default function AccountPage() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchUserOrders(session.user.email);
      setLoading(false);
    });
  }, []);

  const fetchUserOrders = async (userEmail: string) => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_email', userEmail)
      .order('created_at', { ascending: false });
    setOrders(data || []);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    else {
      setUser(data.user);
      if (data.user?.email) fetchUserOrders(data.user.email);
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
    else alert('Registration successful! Check your email for verification.');
    setLoading(false);
  };

  const handleCoiUpload = async (e: React.ChangeEvent<HTMLInputElement>, orderId: string) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    if (file.type !== 'application/pdf') {
      alert('Strict file layout check: You can only upload files in .pdf format!');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${orderId}-${Math.random()}.${fileExt}`;
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
        .update({ coi_url: publicUrl })
        .eq('id', orderId);

      if (user?.email) fetchUserOrders(user.email);
      alert('Certificate uploaded successfully!');
    } catch (err: any) {
      alert('Upload stall: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {!user ? (
        <div className="max-w-md mx-auto bg-white border border-slate-200 p-8 rounded-2xl shadow-sm">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-6"><Lock className="text-blue-600" /> Secure Portal Gateway</h2>
          <form className="space-y-4">
            <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2 border rounded-xl" required />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2 border rounded-xl" required />
            <div className="flex gap-3 pt-2">
              <button onClick={handleLogin} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-semibold">Sign In</button>
              <button onClick={handleSignUp} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-semibold border border-slate-200">Register</button>
            </div>
          </form>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Welcome Back</h1>
              <p className="text-sm text-slate-500">{user.email}</p>
            </div>
            <button onClick={() => { supabase.auth.signOut(); setUser(null); }} className="px-4 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50">Log Out</button>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><FileText /> Rental Orders & Invoices</h2>
            {orders.length === 0 ? (
              <p className="text-slate-500 text-sm bg-slate-50 p-6 rounded-xl border border-dashed border-slate-200 text-center">No orders tracked inside this email portal yet.</p>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <span className="text-xs font-mono font-bold uppercase text-slate-400">Order ID: {order.id.slice(0,8)}</span>
                      <div className="text-lg font-bold text-slate-900 mt-1">{formatCurrency(order.total)}</div>
                      <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-semibold ${order.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{order.status}</span>
                    </div>

                    <div className="w-full md:w-auto bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col gap-2">
                      {order.coi_url ? (
                        <a href={order.coi_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-green-700 font-semibold hover:underline"><CheckCircle size={16} /> View Certificate (.PDF)</a>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-slate-600 block">Requires Certificate of Insurance (COI) *</label>
                          <label className="flex items-center gap-2 bg-white border px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 border-blue-200 cursor-pointer shadow-sm hover:bg-blue-50/50">
                            <Upload size={14} /> {uploading ? 'Uploading...' : 'Upload PDF'}
                            <input type="file" accept=".pdf" onChange={(e) => handleCoiUpload(e, order.id)} className="hidden" disabled={uploading} />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
