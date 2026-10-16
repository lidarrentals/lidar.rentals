import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { navigate } from '@/lib/router';
import ShippingCalculator from '@/components/ShippingCalculator';
import CheckoutSummary from '@/components/CheckoutSummary';

export default function CheckoutPage() {
    const { items: cartItems, total: cartTotal, clearCart } = useCart();
    const [success, setSuccess] = useState(false);
    const [orderId, setOrderId] = useState<string>('');
    const [shippingCost, setShippingCost] = useState<number>(0);

    const [form, setForm] = useState({
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        customer_phone: '(555) 123-4567',
        company: 'LiDAR Testing Co',
        shipping_address: '123 Test Site Lane, Austin TX',
        notes: '',
    });

    // Force a test item if the cart is empty so the page loads for testing
    const items = cartItems.length > 0 ? cartItems : [
        {
            id: "prod_test_123",
            name: "Velodyne Puck VLP-16 (Mock Test Item)",
            quantity: 1,
            rentalPeriod: 5,
            startDate: "2026-10-31",
            endDate: "2026-11-05",
            lineTotal: 750.00
        }
    ];

    const total = cartItems.length > 0 ? cartTotal : 750.00;

    // Catch returning users from Stripe and display the Order Received screen
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search || window.location.hash.split('?')[1]);
            const isSuccess = window.location.href.includes('success=true') || urlParams.get('success') === 'true';

            if (isSuccess) {
                const sessionOrderId = urlParams.get('order_id') || 'ORD-' + Math.floor(100000 + Math.random() * 900000);
                setOrderId(sessionOrderId);
                setSuccess(true);
                clearCart();
                window.history.replaceState({}, document.title, window.location.pathname + window.location.hash.split('?')[0]);
            }
        }
    }, []);

    if (success) {
        return (
            <div className= "max-w-2xl mx-auto px-4 py-16 text-center" >
            <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-6" />
                <h2 className="text-3xl font-bold text-slate-900" > Order Received! </h2>
                    < p className = "text-xl text-slate-600 mt-3" > Order Reference: <strong className="text-blue-600 font-mono" > { orderId } < /strong></p >
                        <div className="my-6 p-4 bg-slate-50 rounded-xl border border-slate-200 text-left max-w-md mx-auto text-sm text-slate-600 space-y-1" >
                            <p><strong>Customer: </strong> {form.customer_name}</p >
                                <p><strong>Email: </strong> {form.customer_email}</p >
                                    <p><strong>Delivery Site: </strong> {form.shipping_address}</p >
                                        </div>
                                        < p className = "text-sm text-slate-500 mt-2" > A confirmation email and rental equipment dispatch checklist have been prepared.</p>
                                            < button onClick = {() => navigate('/')
    } className = "mt-8 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition" > Back to Home </button>
        </div>
    );
}

return (
    <div className= "max-w-7xl mx-auto px-4 py-8" >
    <button onClick={ () => navigate('/equipment') } className = "flex items-center gap-1 text-sm text-slate-500 mb-6" >
        <ArrowLeft className="w-4 h-4" /> Continue shopping
            </button>
            < h1 className = "text-3xl font-bold text-slate-900 mb-8" > Checkout </h1>
                < div className = "grid lg:grid-cols-2 gap-8" >

                {/* Left Side: Contact Information and Shipping Calculator */ }
                    < div className = "space-y-5" >
                        <div className="bg-white rounded-2xl border border-slate-200 p-6" >
                            <h2 className="text-lg font-bold text-slate-900 mb-4" > Contact Information </h2>
                                < div className = "grid sm:grid-cols-2 gap-4" >
                                    <div className="sm:col-span-2" >
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5" > Full Name * </label>
                                            < input required type = "text" value = { form.customer_name } onChange = { e => setForm({ ...form, customer_name: e.target.value })} className = "w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm" placeholder = "John Smith" />
                                                </div>
                                                < div >
                                                <label className="block text-sm font-medium text-slate-700 mb-1.5" > Email * </label>
                                                    < input required type = "email" value = { form.customer_email } onChange = { e => setForm({ ...form, customer_email: e.target.value })} className = "w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm" placeholder = "john@company.com" />
                                                        </div>
                                                        < div >
                                                        <label className="block text-sm font-medium text-slate-700 mb-1.5" > Phone </label>
                                                            < input type = "tel" value = { form.customer_phone } onChange = { e => setForm({ ...form, customer_phone: e.target.value })} className = "w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm" placeholder = "(555) 123-4567" />
                                                                </div>
                                                                </div>
                                                                </div>

                                                                < div className = "bg-white rounded-2xl border border-slate-200 p-6" >
                                                                    <h2 className="text-lg font-bold text-slate-900 mb-4" > Delivery / Site Address </h2>
                                                                        < textarea rows = { 3} value = { form.shipping_address } onChange = { e => setForm({ ...form, shipping_address: e.target.value })} className = "w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm resize-none" placeholder = "1234 Job Site Rd" />
                                                                            </div>

{/* Restored Shipping Calculator Panel */ }
<div className="bg-white rounded-2xl border border-slate-200 overflow-hidden" >
    <ShippingCalculator onRateSelect={ (amount) => setShippingCost(amount) } />
        </div>
        </div>

{/* Right Side: Order Summary with nested Stripe Payment Button inside */ }
<div>
    <CheckoutSummary items={ items } total = { total } shippingCost = { shippingCost } />
        </div>

        </div>
        </div>
  );
}
