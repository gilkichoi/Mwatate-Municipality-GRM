import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  FileText, 
  MapPin, 
  Phone, 
  Search, 
  Send, 
  ShieldCheck, 
  LayoutDashboard,
  ArrowRight,
  Menu,
  X,
  ChevronRight,
  BarChart3,
  MessageSquare,
  User,
  UserPlus,
  Download,
  ArrowUp,
  ArrowDown,
  Tag,
  Edit2,
  Trash2,
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Activity,
  Globe
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { Grievance, GrievanceCategory } from './types';

// Auth Helper
const getAuthToken = () => localStorage.getItem('mwatate_token');

const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  console.log('fetchWithAuth: token=', token);
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  } else {
    console.warn('fetchWithAuth: No token found');
  }
  
  return fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  });
};

interface User {
  id: string;
  username: string;
  role: string;
}

const OFFICIALS = [
  'Eng. James Mwangi (Water)',
  'Sarah Taita (Infrastructure)',
  'David Mbololo (Environment)',
  'Alice Wanjiku (Planning)',
  'John Doe (Trade)',
  'Admin (General)'
];

export default function App() {
  const [view, setView] = useState<'home' | 'submit' | 'track' | 'admin'>('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetchWithAuth('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        console.log('Authenticated as:', data.user.username, 'Role:', data.user.role);
        setUser(data.user);
      } else {
        console.log('Not authenticated (Status:', res.status, ')');
        localStorage.removeItem('mwatate_token');
      }
    } catch (err) {
      console.error('Auth check failed', err);
    } finally {
      setIsAuthChecking(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetchWithAuth('/api/auth/logout', { 
        method: 'POST'
      });
      localStorage.removeItem('mwatate_token');
      setUser(null);
      setView('home');
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('home')}>
              <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 leading-tight">Mwatate Municipality</h1>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">GRM System</p>
              </div>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => setView('home')} className={`text-sm font-medium ${view === 'home' ? 'text-emerald-600' : 'text-slate-600 hover:text-emerald-600'}`}>Home</button>
              <button onClick={() => setView('submit')} className={`text-sm font-medium ${view === 'submit' ? 'text-emerald-600' : 'text-slate-600 hover:text-emerald-600'}`}>Report Issue</button>
              <button onClick={() => setView('track')} className={`text-sm font-medium ${view === 'track' ? 'text-emerald-600' : 'text-slate-600 hover:text-emerald-600'}`}>Track Status</button>
              <button onClick={() => setView('admin')} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">
                <LayoutDashboard size={16} />
                Admin Portal
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-slate-600">
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t border-slate-100 overflow-hidden"
            >
              <div className="px-4 pt-2 pb-6 space-y-1">
                <button onClick={() => { setView('home'); setIsMenuOpen(false); }} className="block w-full text-left px-3 py-4 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-lg">Home</button>
                <button onClick={() => { setView('submit'); setIsMenuOpen(false); }} className="block w-full text-left px-3 py-4 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-lg">Report Issue</button>
                <button onClick={() => { setView('track'); setIsMenuOpen(false); }} className="block w-full text-left px-3 py-4 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-lg">Track Status</button>
                <button onClick={() => { setView('admin'); setIsMenuOpen(false); }} className="block w-full text-left px-3 py-4 text-base font-medium text-emerald-600 font-bold">Admin Portal</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main Content */}
      <main className="flex-grow">
        {view === 'home' && <HomeView onNavigate={setView} />}
        {view === 'submit' && <SubmitView onBack={() => setView('home')} />}
        {view === 'track' && <TrackView />}
        {view === 'admin' && (
          isAuthChecking ? (
            <div className="p-24 text-center">Checking authentication...</div>
          ) : !user ? (
            <LoginView onLogin={setUser} />
          ) : (
            <AdminView user={user} onLogout={handleLogout} />
          )
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-emerald-600 rounded flex items-center justify-center text-white">
                  <ShieldCheck size={20} />
                </div>
                <span className="text-white font-bold">Mwatate Municipality</span>
              </div>
              <p className="text-sm leading-relaxed">
                Dedicated to transparent governance and efficient service delivery to the residents of Mwatate, Taita Taveta County.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-6">Quick Links</h3>
              <ul className="space-y-4 text-sm">
                <li><button onClick={() => setView('submit')} className="hover:text-white transition-colors">Report a Grievance</button></li>
                <li><button onClick={() => setView('track')} className="hover:text-white transition-colors">Check Status</button></li>
                <li><a href="https://taitataveta.go.ke/mwatate-municipality/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Municipality Website</a></li>
                <li><a href="#" className="hover:text-white transition-colors">County Government</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-6">Contact Us</h3>
              <ul className="space-y-4 text-sm">
                <li className="flex items-center gap-3"><MapPin size={16} /> Mwatate Town, Taita Taveta</li>
                <li className="flex items-center gap-3"><Phone size={16} /> 0116198683</li>
                <li className="flex items-center gap-3"><Globe size={16} /> <a href="https://taitataveta.go.ke/mwatate-municipality/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Municipality Website</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-slate-800 text-center text-xs">
            © 2026 Mwatate Municipality Grievance Redress Mechanism. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

function HomeView({ onNavigate }: { onNavigate: (view: 'submit' | 'track') => void }) {
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    fetchWithAuth('/api/categories')
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(err => console.error('Failed to fetch categories:', err));
  }, []);

  return (
    <div className="animate-in fade-in duration-500">
      {/* Hero Section */}
      <section className="relative bg-emerald-900 py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight"
            >
              Your Voice Matters for a Better Mwatate
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-emerald-100 mb-10 leading-relaxed"
            >
              The Mwatate Municipality Grievance Redress Mechanism ensures your concerns are heard, tracked, and resolved efficiently.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <button 
                onClick={() => onNavigate('submit')}
                className="px-8 py-4 bg-white text-emerald-900 rounded-xl font-bold text-lg hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/20"
              >
                <MessageSquare size={20} />
                Report an Issue
              </button>
              <button 
                onClick={() => onNavigate('track')}
                className="px-8 py-4 bg-emerald-800 text-white border border-emerald-700 rounded-xl font-bold text-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
              >
                <Search size={20} />
                Track Grievance
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">How it Works</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">A simple 3-step process to ensure your grievances are addressed by the municipality officials.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <FileText className="text-emerald-600" size={32} />, title: 'Submit Grievance', desc: 'Fill out the simple form with details about the issue and its location.' },
              { icon: <Clock className="text-blue-600" size={32} />, title: 'Track Progress', desc: 'Use your unique tracking number to see real-time updates on your report.' },
              { icon: <CheckCircle2 className="text-emerald-600" size={32} />, title: 'Resolution', desc: 'Receive feedback and confirmation once the issue has been addressed.' }
            ].map((step, i) => (
              <div key={i} className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-lg transition-shadow">
                <div className="mb-6">{step.icon}</div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-slate-600 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Reportable Categories</h2>
              <p className="text-slate-600">We handle a wide range of municipal service issues.</p>
            </div>
            <button onClick={() => onNavigate('submit')} className="text-emerald-600 font-bold flex items-center gap-2 hover:underline">
              View all categories <ArrowRight size={18} />
            </button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.slice(0, 4).map((cat, i) => (
              <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col items-center text-center hover:border-emerald-200 hover:bg-emerald-50/30 transition-all cursor-pointer group">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                  <BarChart3 size={24} />
                </div>
                <span className="font-semibold text-slate-800">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function SubmitView({ onBack }: { onBack: () => void }) {
  const [categories, setCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    location: '',
    first_name: '',
    last_name: '',
    phone_number: '+254',
    email: '',
    gender: '',
    ward: '',
    priority: 'Medium'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<string | null>(null);

  useEffect(() => {
    fetchWithAuth('/api/categories')
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(err => console.error('Failed to fetch categories:', err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetchWithAuth('/api/grievances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Submission failed: ${res.status}`);
      }
      const data = await res.json();
      if (data.success) {
        setSubmitted(data.tracking_number);
      }
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-12 rounded-3xl shadow-xl border border-slate-100"
        >
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-3xl font-bold mb-4">Report Submitted Successfully</h2>
          <p className="text-slate-600 mb-8">Thank you for your feedback. Our team will review your grievance and take necessary action.</p>
          
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-10">
            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-2">Your Tracking Number</p>
            <p className="text-4xl font-mono font-bold text-emerald-700">{submitted}</p>
          </div>

          <div className="flex flex-col gap-3">
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
            >
              Back to Home
            </button>
            <p className="text-sm text-slate-500">Please save this tracking number to check your status later.</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <div className="mb-10">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-900 flex items-center gap-2 mb-6 transition-colors">
          <ArrowRight className="rotate-180" size={18} /> Back to Home
        </button>
        <h2 className="text-3xl font-bold text-slate-900">Submit a Grievance</h2>
        <p className="text-slate-600 mt-2">Provide as much detail as possible to help us address the issue quickly.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">First Name</label>
              <input 
                required
                type="text"
                placeholder="Enter your first name"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                value={formData.first_name}
                onChange={e => setFormData({ ...formData, first_name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Last Name</label>
              <input 
                required
                type="text"
                placeholder="Enter your last name"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                value={formData.last_name}
                onChange={e => setFormData({ ...formData, last_name: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Gender</label>
              <select 
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                value={formData.gender}
                onChange={e => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Ward (Mwatate)</label>
              <select 
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                value={formData.ward}
                onChange={e => setFormData({ ...formData, ward: e.target.value })}
              >
                <option value="">Select Ward</option>
                <option value="Ronge">Ronge</option>
                <option value="Mwatate">Mwatate</option>
                <option value="Bura">Bura</option>
                <option value="Chawia">Chawia</option>
                <option value="Wusi/Kishamba">Wusi/Kishamba</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  required
                  type="tel"
                  placeholder="+254..."
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  value={formData.phone_number}
                  onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
              <input 
                required
                type="email"
                placeholder="yourname@example.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Grievance Title</label>
            <input 
              required
              type="text"
              placeholder="Briefly state the issue (e.g., Broken water pipe in Mwatate East)"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
              <select 
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="">Select a category</option>
                {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Priority Level</label>
              <select 
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
            <textarea 
              required
              rows={5}
              placeholder="Describe the issue in detail..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Specific Location</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                required
                type="text"
                placeholder="e.g., Near Mwatate Post Office, Village name"
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
          </div>
        </div>

        <button 
          disabled={isSubmitting}
          type="submit"
          className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold text-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : <><Send size={20} /> Submit Report</>}
        </button>
      </form>
    </div>
  );
}

function TrackView() {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [grievance, setGrievance] = useState<Grievance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithAuth(`/api/grievances/${trackingNumber}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Search failed: ${res.status}`);
      }
      const data = await res.json();
      setGrievance(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Grievance not found or an error occurred.');
      setGrievance(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-slate-900">Track Your Grievance</h2>
        <p className="text-slate-600 mt-2">Enter your tracking number to see the current status of your report.</p>
      </div>

      <form onSubmit={handleTrack} className="mb-12">
        <div className="flex gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text"
              placeholder="Enter Tracking Number (e.g., MWT-123456)"
              className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-slate-200 focus:border-emerald-500 outline-none transition-all text-lg font-mono"
              value={trackingNumber}
              onChange={e => setTrackingNumber(e.target.value.toUpperCase())}
            />
          </div>
          <button 
            disabled={loading}
            className="px-8 py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Track'}
          </button>
        </div>
        {error && <p className="text-red-500 text-sm mt-3 flex items-center gap-2"><AlertCircle size={16} /> {error}</p>}
      </form>

      <AnimatePresence mode="wait">
        {grievance && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden"
          >
            <div className="bg-slate-50 px-8 py-6 border-b border-slate-200 flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Tracking Number</p>
                <p className="text-xl font-mono font-bold text-slate-900">{grievance.tracking_number}</p>
              </div>
              <div className={`px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 ${
                grievance.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' :
                grievance.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                grievance.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                'bg-amber-100 text-amber-700'
              }`}>
                {grievance.status === 'Resolved' && <CheckCircle2 size={16} />}
                {grievance.status === 'In Progress' && <Clock size={16} />}
                {grievance.status === 'Pending' && <Clock size={16} />}
                {grievance.status}
              </div>
            </div>
            <div className="p-8 space-y-8">
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{grievance.title}</h3>
                <div className="flex flex-wrap gap-3">
                  <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold uppercase tracking-wider">{grievance.category}</span>
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                    grievance.priority === 'Urgent' ? 'bg-red-100 text-red-600' :
                    grievance.priority === 'High' ? 'bg-orange-100 text-orange-600' :
                    grievance.priority === 'Medium' ? 'bg-blue-100 text-blue-600' :
                    'bg-slate-100 text-slate-600'
                  }`}>Priority: {grievance.priority}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <p className="text-xs text-slate-400 uppercase font-bold mb-1">Reporter</p>
                  <p className="font-bold text-slate-800">{grievance.first_name} {grievance.last_name}</p>
                  <p className="text-xs text-slate-500">{grievance.gender} • {grievance.ward} Ward</p>
                </div>
                <div>
                  <h4 className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2">Submitted On</h4>
                  <p className="font-semibold text-slate-800">{new Date(grievance.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div>
                <h4 className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2">Location</h4>
                <p className="text-slate-700 flex items-center gap-2"><MapPin size={16} className="text-slate-400" /> {grievance.location}</p>
              </div>
              <div>
                <h4 className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2">Description</h4>
                <p className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">{grievance.description}</p>
              </div>
              <div className="pt-6 border-t border-slate-100">
                <h4 className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-4">Timeline</h4>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                      <div className="w-0.5 h-full bg-slate-200"></div>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">Grievance Received</p>
                      <p className="text-xs text-slate-500">{new Date(grievance.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  {grievance.status !== 'Pending' && (
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${grievance.status === 'Resolved' ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">Status Updated to {grievance.status}</p>
                        <p className="text-xs text-slate-500 mb-2">{new Date(grievance.updated_at).toLocaleString()}</p>
                        
                        {(grievance.resolution_comment || grievance.resolution_report_url) && (
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mt-2 space-y-3">
                            {grievance.resolution_comment && (
                              <div>
                                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Resolution Note</p>
                                <p className="text-sm text-slate-700">{grievance.resolution_comment}</p>
                              </div>
                            )}
                            {grievance.resolution_report_url && (
                              <div>
                                <a href={grievance.resolution_report_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs text-emerald-600 hover:text-emerald-700 font-bold bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm transition-colors">
                                  <Download size={14} />
                                  Download Resolution Report
                                </a>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProfileView({ user, onSuccess }: { user: User, onSuccess: (msg: string) => void }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetchWithAuth('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      if (res.ok) {
        onSuccess('Password changed successfully');
        setOldPassword('');
        setNewPassword('');
      } else {
        const data = await res.json();
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to change password');
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900 mb-6">Change Password</h3>
      <form onSubmit={handleChangePassword} className="space-y-4">
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Current Password</label>
          <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg" required />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">New Password</label>
          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg" required />
        </div>
        <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-all">Change Password</button>
      </form>
    </div>
  );
}

function AdminView({ user, onLogout }: { user: User, onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<'grievances' | 'users' | 'categories' | 'dashboard' | 'profile'>('dashboard');
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrievance, setSelectedGrievance] = useState<Grievance | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [statusUpdateModal, setStatusUpdateModal] = useState<{ grievanceId: string, newStatus: string } | null>(null);
  const [resolutionComment, setResolutionComment] = useState('');
  const [resolutionReportUrl, setResolutionReportUrl] = useState('');
  const [uploadingReport, setUploadingReport] = useState(false);

  const triggerSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const roleFilteredGrievances = (Array.isArray(grievances) ? grievances : []).filter(g => {
    return user.role === 'GRM Officer' ? g.assigned_to === user.username : true;
  });

  const filteredGrievances = roleFilteredGrievances.filter(g => {
    const matchesSearch = g.tracking_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.title && g.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      g.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPriority = priorityFilter ? g.priority === priorityFilter : true;
    const matchesStatus = statusFilter ? g.status === statusFilter : true;
    const matchesAssignee = assigneeFilter ? (assigneeFilter === 'unassigned' ? !g.assigned_to : g.assigned_to === assigneeFilter) : true;
    
    return matchesSearch && matchesPriority && matchesStatus && matchesAssignee;
  });

  const sortedGrievances = [...filteredGrievances].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchGrievances();
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetchWithAuth('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const fetchGrievances = async () => {
    setError(null);
    try {
      const res = await fetchWithAuth('/api/admin/grievances');
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch grievances: ${res.status}`);
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setGrievances(data);
      } else {
        console.error('Expected array of grievances, received:', data);
        setGrievances([]);
      }
    } catch (err) {
      console.error('Failed to fetch grievances:', err);
      setGrievances([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChangeClick = (id: string, newStatus: string) => {
    if (newStatus === 'Resolved' || newStatus === 'Rejected') {
      setStatusUpdateModal({ grievanceId: id, newStatus });
      setResolutionComment('');
      setResolutionReportUrl('');
    } else {
      updateStatus(id, newStatus);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingReport(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetchWithAuth('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setResolutionReportUrl(data.url);
        triggerSuccess('Report uploaded successfully');
      } else {
        alert('Failed to upload report');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload report');
    } finally {
      setUploadingReport(false);
    }
  };

  const updateStatus = async (id: string, status: string, comment?: string, reportUrl?: string) => {
    try {
      await fetchWithAuth(`/api/admin/grievances/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, resolution_comment: comment, resolution_report_url: reportUrl })
      });
      fetchGrievances();
      if (selectedGrievance?.id === id) {
        setSelectedGrievance({ ...selectedGrievance, status: status as any, resolution_comment: comment, resolution_report_url: reportUrl });
      }
      triggerSuccess('Status updated successfully');
      setStatusUpdateModal(null);
    } catch (err) {
      console.error(err);
    }
  };

  const assignOfficial = async (id: string, assigned_to: string) => {
    try {
      await fetchWithAuth(`/api/admin/grievances/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_to })
      });
      fetchGrievances();
      if (selectedGrievance?.id === id) {
        setSelectedGrievance({ ...selectedGrievance, assigned_to });
      }
      triggerSuccess('Official assigned successfully');
    } catch (err) {
      console.error(err);
    }
  };

  const exportToCSV = () => {
    const headers = ['Tracking Number', 'Title', 'Category', 'Description', 'First Name', 'Last Name', 'Gender', 'Ward', 'Location', 'Phone', 'Email', 'Priority', 'Status', 'Assigned To', 'Created At'];
    const dataToExport = roleFilteredGrievances;
    const rows = dataToExport.map(g => [
      g.tracking_number,
      `"${(g.title || '').replace(/"/g, '""')}"`,
      g.category,
      `"${g.description.replace(/"/g, '""')}"`,
      `"${(g.first_name || '').replace(/"/g, '""')}"`,
      `"${(g.last_name || '').replace(/"/g, '""')}"`,
      g.gender || '',
      g.ward || '',
      `"${g.location.replace(/"/g, '""')}"`,
      g.phone_number || '',
      g.email || '',
      g.priority,
      g.status,
      g.assigned_to || 'Unassigned',
      new Date(g.created_at).toLocaleString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `mwatate_grievances_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="p-24 text-center">Loading grievances...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
      {/* Global Toast */}
      <div className="fixed top-8 right-8 z-50 pointer-events-none">
        <AnimatePresence>
          {successMessage && (
            <motion.div 
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              className="bg-slate-900 text-white px-6 py-3 rounded-xl flex items-center gap-3 shadow-2xl pointer-events-auto border border-white/10"
            >
              <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                <CheckCircle2 size={14} className="text-white" />
              </div>
              <p className="font-bold text-sm tracking-tight">{successMessage}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex justify-between items-start mb-10">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Admin Dashboard</h2>
          <p className="text-slate-600">Manage and resolve citizen grievances.</p>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'dashboard' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Dashboard
              </button>
              <button 
                onClick={() => setActiveTab('grievances')}
                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'grievances' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Grievances
              </button>
              {(user.role === 'Super Admin' || user.role === 'admin') && (
                <>
                  <button 
                    onClick={() => setActiveTab('users')}
                    className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    User Management
                  </button>
                  <button 
                    onClick={() => setActiveTab('categories')}
                    className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'categories' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Categories
                  </button>
                </>
              )}
              {user.role === 'Super Admin' && (
                <button 
                  onClick={() => setActiveTab('logs')}
                  className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'logs' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  System Logs
                </button>
              )}
              <button 
                onClick={() => setActiveTab('profile')}
                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'profile' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Profile
              </button>
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <button 
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-sm font-bold hover:bg-emerald-100 transition-all"
            >
              <Download size={16} />
              Export Grievances (CSV)
            </button>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                <User size={16} />
              </div>
              <div className="text-sm">
                <p className="font-bold text-slate-900 leading-none">{user.username}</p>
                <p className="text-xs text-slate-500 capitalize">{user.role}</p>
              </div>
              <button 
                onClick={onLogout}
                className="ml-2 text-xs font-bold text-red-600 hover:text-red-700 hover:underline"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="bg-white px-6 py-3 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500 uppercase font-bold">Total Reports</p>
            <p className="text-2xl font-bold">{roleFilteredGrievances.length}</p>
          </div>
          <div className="bg-white px-6 py-3 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500 uppercase font-bold">Pending</p>
            <p className="text-2xl font-bold text-amber-600">{roleFilteredGrievances.filter(g => g.status === 'Pending').length}</p>
          </div>
        </div>
      </div>

      {activeTab === 'grievances' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* List */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-[700px] flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Recent Grievances</h3>
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
                <button 
                  onClick={() => setSortOrder('desc')}
                  title="Newest first"
                  className={`p-1 rounded ${sortOrder === 'desc' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <ArrowDown size={14} />
                </button>
                <button 
                  onClick={() => setSortOrder('asc')}
                  title="Oldest first"
                  className={`p-1 rounded ${sortOrder === 'asc' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <ArrowUp size={14} />
                </button>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text"
                placeholder="Search tracking #, title..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button 
                onClick={() => setPriorityFilter(null)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${!priorityFilter ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
              >
                All Priorities
              </button>
              {['Low', 'Medium', 'High', 'Urgent'].map(p => (
                <button 
                  key={p}
                  onClick={() => setPriorityFilter(p)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                    priorityFilter === p 
                      ? (p === 'Urgent' ? 'bg-red-600 text-white shadow-sm' : p === 'High' ? 'bg-orange-500 text-white shadow-sm' : p === 'Medium' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-600 text-white shadow-sm')
                      : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100">
              <button 
                onClick={() => setStatusFilter(null)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${!statusFilter ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
              >
                All Status ({Array.isArray(grievances) ? grievances.length : 0})
              </button>
              {['Pending', 'In Progress', 'Resolved', 'Rejected'].map(s => {
                const count = (Array.isArray(grievances) ? grievances : []).filter(g => g.status === s).length;
                return (
                  <button 
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                      statusFilter === s 
                        ? (s === 'Resolved' ? 'bg-emerald-600 text-white shadow-sm' : s === 'In Progress' ? 'bg-blue-600 text-white shadow-sm' : s === 'Rejected' ? 'bg-red-600 text-white shadow-sm' : 'bg-amber-600 text-white shadow-sm')
                        : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {s} ({count})
                  </button>
                );
              })}
            </div>
            
            {(user.role === 'Super Admin' || user.role === 'admin') && (
              <div className="pt-1 border-t border-slate-100">
                <select 
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium outline-none bg-white text-slate-700 focus:ring-2 focus:ring-emerald-500"
                  value={assigneeFilter || ''}
                  onChange={(e) => setAssigneeFilter(e.target.value || null)}
                >
                  <option value="">All Assignees</option>
                  <option value="unassigned">Unassigned Only</option>
                  {users.map(u => (
                    <option key={u.id} value={u.username}>{u.username}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="overflow-y-auto flex-grow">
            {sortedGrievances.map(g => (
              <button 
                key={g.id}
                onClick={() => setSelectedGrievance(g)}
                className={`w-full text-left p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors flex flex-col gap-2 ${selectedGrievance?.id === g.id ? 'bg-emerald-50 border-l-4 border-l-emerald-500' : ''}`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-xs font-mono font-bold text-slate-500">{g.tracking_number}</span>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      g.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' :
                      g.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                      g.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>{g.status}</span>
                    <span className={`text-[9px] font-bold uppercase ${
                      g.priority === 'Urgent' ? 'text-red-500' :
                      g.priority === 'High' ? 'text-orange-500' :
                      'text-slate-400'
                    }`}>{g.priority}</span>
                  </div>
                </div>
                <p className="font-semibold text-sm text-slate-800 truncate">{g.title || g.category}</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500 truncate flex-grow">{g.description}</p>
                  {g.assigned_to && (
                    <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded">
                      <User size={10} />
                      <span>Assigned</span>
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-slate-400">{new Date(g.created_at).toLocaleDateString()}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-[700px] flex flex-col">
          {selectedGrievance ? (
            <>
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <div className="flex-grow">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-slate-900">{selectedGrievance.title || selectedGrievance.tracking_number}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      selectedGrievance.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' :
                      selectedGrievance.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                      selectedGrievance.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>{selectedGrievance.status}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-sm text-slate-500 font-mono">{selectedGrievance.tracking_number}</p>
                    <span className="text-slate-300">•</span>
                    <p className="text-sm text-slate-500">{new Date(selectedGrievance.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex gap-4 items-end">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</label>
                    <select 
                      disabled={user.role === 'Viewer'}
                      className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium outline-none bg-white disabled:bg-slate-50 disabled:text-slate-400"
                      value={selectedGrievance.status}
                      onChange={(e) => handleStatusChangeClick(selectedGrievance.id, e.target.value)}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1 px-4 border-l border-slate-100">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Assignee</label>
                    <div className="flex items-center gap-2 h-[38px]">
                      <User size={14} className={selectedGrievance.assigned_to ? "text-emerald-500" : "text-slate-300"} />
                      <p className={`text-sm font-bold ${selectedGrievance.assigned_to ? "text-slate-700" : "text-slate-400"}`}>
                        {selectedGrievance.assigned_to || 'Unassigned'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assign To</label>
                    <select 
                      disabled={user.role !== 'Super Admin' && user.role !== 'admin'}
                      className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium outline-none bg-white disabled:bg-slate-50 disabled:text-slate-400"
                      value={selectedGrievance.assigned_to || ''}
                      onChange={(e) => assignOfficial(selectedGrievance.id, e.target.value)}
                    >
                      <option value="">Unassigned</option>
                      {users.map(u => (
                        <option key={u.id} value={u.username}>{u.username}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-8 overflow-y-auto space-y-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  <div>
                    <h4 className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2">Reporter</h4>
                    <p className="font-semibold text-slate-800">{selectedGrievance.first_name} {selectedGrievance.last_name}</p>
                    <p className="text-xs text-slate-500">{selectedGrievance.gender}</p>
                  </div>
                  <div>
                    <h4 className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2">Category</h4>
                    <p className="font-semibold text-slate-800">{selectedGrievance.category}</p>
                  </div>
                  <div>
                    <h4 className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2">Priority</h4>
                    <p className={`font-bold ${
                      selectedGrievance.priority === 'Urgent' ? 'text-red-600' :
                      selectedGrievance.priority === 'High' ? 'text-orange-600' :
                      'text-slate-800'
                    }`}>{selectedGrievance.priority}</p>
                  </div>
                  <div>
                    <h4 className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2">Ward</h4>
                    <p className="font-semibold text-slate-800">{selectedGrievance.ward}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2">Contact Details</h4>
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-800 flex items-center gap-2"><Phone size={14} /> {selectedGrievance.phone_number}</p>
                      <p className="font-semibold text-slate-800 flex items-center gap-2"><Send size={14} /> {selectedGrievance.email}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2">Specific Location</h4>
                    <p className="font-semibold text-slate-800 flex items-center gap-2"><MapPin size={14} /> {selectedGrievance.location}</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2">Assigned Official</h4>
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-slate-200 text-slate-400">
                      <User size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{selectedGrievance.assigned_to || 'Not Assigned'}</p>
                      <p className="text-xs text-slate-500">{selectedGrievance.assigned_to ? 'Official in charge of resolution' : 'Awaiting assignment to an official'}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2">Description</h4>
                  <p className="text-slate-700 leading-relaxed bg-slate-50 p-6 rounded-xl border border-slate-100 whitespace-pre-wrap">{selectedGrievance.description}</p>
                </div>
                
                {(selectedGrievance.resolution_comment || selectedGrievance.resolution_report_url) && (
                  <div>
                    <h4 className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2">Resolution Details</h4>
                    <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100 space-y-4">
                      {selectedGrievance.resolution_comment && (
                        <div>
                          <p className="text-sm font-bold text-emerald-800 mb-1">Comment</p>
                          <p className="text-emerald-700 text-sm whitespace-pre-wrap">{selectedGrievance.resolution_comment}</p>
                        </div>
                      )}
                      {selectedGrievance.resolution_report_url && (
                        <div>
                          <p className="text-sm font-bold text-emerald-800 mb-1">Attached Report</p>
                          <a href={selectedGrievance.resolution_report_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium bg-white px-3 py-2 rounded-lg border border-emerald-200 shadow-sm transition-colors">
                            <Download size={16} />
                            Download Report
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center text-slate-400 p-12 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <FileText size={32} />
              </div>
              <p className="font-medium">Select a grievance from the list to view details and update status.</p>
            </div>
          )}
        </div>
      </div>
    ) : activeTab === 'dashboard' ? (
      <DashboardView grievances={roleFilteredGrievances} />
    ) : activeTab === 'users' ? (
      <UserManagementView user={user} onSuccess={triggerSuccess} />
    ) : activeTab === 'categories' ? (
      <CategoryManagementView user={user} onSuccess={triggerSuccess} />
    ) : activeTab === 'logs' && user.role === 'Super Admin' ? (
      <SystemLogsView />
    ) : activeTab === 'profile' ? (
      <ProfileView user={user} onSuccess={triggerSuccess} />
    ) : null}

      <AnimatePresence>
        {statusUpdateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="p-8">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${statusUpdateModal.newStatus === 'Resolved' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                  {statusUpdateModal.newStatus === 'Resolved' ? <CheckCircle2 size={32} /> : <AlertCircle size={32} />}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2 text-center">Mark as {statusUpdateModal.newStatus}?</h3>
                <p className="text-slate-600 mb-6 text-center text-sm">
                  Please provide a resolution comment {statusUpdateModal.newStatus === 'Resolved' && 'and optionally upload a report'} before updating the status.
                </p>
                
                <div className="space-y-4 mb-8">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Resolution Comment *</label>
                    <textarea 
                      required
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm resize-none"
                      value={resolutionComment}
                      onChange={e => setResolutionComment(e.target.value)}
                      placeholder="Explain how this grievance was handled..."
                    />
                  </div>
                  
                  {statusUpdateModal.newStatus === 'Resolved' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Resolution Report (Optional)</label>
                      <div className="flex items-center gap-3">
                        <label className="flex-1 cursor-pointer bg-slate-50 border border-slate-200 border-dashed rounded-xl p-4 text-center hover:bg-slate-100 transition-colors">
                          <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.doc,.docx,.jpg,.png" />
                          <div className="flex flex-col items-center gap-2">
                            <Download size={20} className="text-slate-400" />
                            <span className="text-sm font-medium text-slate-600">
                              {uploadingReport ? 'Uploading...' : resolutionReportUrl ? 'Report Uploaded' : 'Click to upload file'}
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setStatusUpdateModal(null)}
                    className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    disabled={!resolutionComment.trim() || uploadingReport}
                    onClick={() => updateStatus(statusUpdateModal.grievanceId, statusUpdateModal.newStatus, resolutionComment, resolutionReportUrl)}
                    className={`flex-1 py-3 text-white rounded-xl font-bold transition-all shadow-lg disabled:opacity-50 ${statusUpdateModal.newStatus === 'Resolved' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' : 'bg-red-600 hover:bg-red-700 shadow-red-600/20'}`}
                  >
                    Confirm Update
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DashboardView({ grievances }: { grievances: Grievance[] }) {
  const statusData = [
    { name: 'Pending', value: grievances.filter(g => g.status === 'Pending').length, color: '#94a3b8' },
    { name: 'In Progress', value: grievances.filter(g => g.status === 'In Progress').length, color: '#3b82f6' },
    { name: 'Resolved', value: grievances.filter(g => g.status === 'Resolved').length, color: '#10b981' },
    { name: 'Rejected', value: grievances.filter(g => g.status === 'Rejected').length, color: '#ef4444' },
  ].filter(d => d.value > 0);

  const priorityData = [
    { name: 'Low', value: grievances.filter(g => g.priority === 'Low').length, color: '#94a3b8' },
    { name: 'Medium', value: grievances.filter(g => g.priority === 'Medium').length, color: '#3b82f6' },
    { name: 'High', value: grievances.filter(g => g.priority === 'High').length, color: '#f59e0b' },
    { name: 'Urgent', value: grievances.filter(g => g.priority === 'Urgent').length, color: '#ef4444' },
  ];

  const categoryCounts: Record<string, number> = {};
  grievances.forEach(g => {
    categoryCounts[g.category] = (categoryCounts[g.category] || 0) + 1;
  });
  const categoryData = Object.entries(categoryCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Group by date for line chart
  const dateCounts: Record<string, number> = {};
  grievances.forEach(g => {
    const date = new Date(g.created_at).toLocaleDateString();
    dateCounts[date] = (dateCounts[date] || 0) + 1;
  });
  const timeData = Object.entries(dateCounts)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-7); // Last 7 days with data

  const stats = [
    { label: 'Total Grievances', value: grievances.length, icon: <FileText size={20} />, color: 'bg-slate-100 text-slate-600' },
    { label: 'Pending', value: grievances.filter(g => g.status === 'Pending').length, icon: <Clock size={20} />, color: 'bg-amber-50 text-amber-600' },
    { label: 'Resolved', value: grievances.filter(g => g.status === 'Resolved').length, icon: <CheckCircle2 size={20} />, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Resolution Rate', value: grievances.length ? Math.round((grievances.filter(g => g.status === 'Resolved').length / grievances.length) * 100) + '%' : '0%', icon: <TrendingUp size={20} />, color: 'bg-blue-50 text-blue-600' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Status Distribution */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <PieChartIcon size={20} className="text-emerald-600" />
              Status Distribution
            </h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BarChartIcon size={20} className="text-emerald-600" />
              Priority Levels
            </h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Activity size={20} className="text-emerald-600" />
              Grievances by Category
            </h3>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} width={150} />
                <Tooltip cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trends over time */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp size={20} className="text-emerald-600" />
              Submission Trends (Last 7 Days with Activity)
            </h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoryManagementView({ user, onSuccess }: { user: User, onSuccess: (msg: string) => void }) {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<any | null>(null);

  const isSuperAdmin = user.role === 'Super Admin' || user.role === 'admin';

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetchWithAuth('/api/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetchWithAuth('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName })
      });
      if (res.ok) {
        setNewCategoryName('');
        fetchCategories();
        onSuccess('Category created successfully');
      } else {
        const data = await res.json();
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to create category');
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    try {
      const res = await fetchWithAuth(`/api/admin/categories/${editingCategory.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingCategory.name })
      });
      if (res.ok) {
        setEditingCategory(null);
        fetchCategories();
        onSuccess('Category updated successfully');
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      const res = await fetchWithAuth(`/api/admin/categories/${id}`, { 
        method: 'DELETE'
      });
      if (res.ok) {
        fetchCategories();
        onSuccess('Category deleted successfully');
        setCategoryToDelete(null);
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-12 text-center">Loading categories...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {isSuperAdmin && (
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Tag size={20} className="text-emerald-600" />
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </h3>
            <form onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Category Name</label>
                <input 
                  required
                  type="text"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm"
                  value={editingCategory ? editingCategory.name : newCategoryName}
                  onChange={e => editingCategory ? setEditingCategory({...editingCategory, name: e.target.value}) : setNewCategoryName(e.target.value)}
                  placeholder="e.g., Waste Management"
                />
              </div>
              <div className="flex gap-2">
                {editingCategory && (
                  <button 
                    type="button"
                    onClick={() => setEditingCategory(null)}
                    className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                )}
                <button 
                  type="submit"
                  className="flex-[2] py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                >
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className={isSuperAdmin ? "lg:col-span-2" : "lg:col-span-3"}>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category Name</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Created</th>
                {isSuperAdmin && <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {categories.map(cat => (
                <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-semibold text-slate-800">{cat.name}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(cat.created_at).toLocaleDateString()}
                  </td>
                  {isSuperAdmin && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => setEditingCategory(cat)}
                          className="text-slate-400 hover:text-emerald-600 p-2 hover:bg-emerald-50 rounded-lg transition-all"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => setCategoryToDelete(cat)}
                          className="text-slate-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {categoryToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Category?</h3>
                <p className="text-slate-600 mb-8">
                  Are you sure you want to delete <span className="font-bold text-slate-900">{categoryToDelete.name}</span>? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setCategoryToDelete(null)}
                    className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => handleDeleteCategory(categoryToDelete.id)}
                    className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
                  >
                    Delete Category
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function UserManagementView({ user, onSuccess }: { user: User, onSuccess: (msg: string) => void }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('GRM Officer');
  const [error, setError] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<any | null>(null);

  const isSuperAdmin = user.role === 'Super Admin' || user.role === 'admin';

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetchWithAuth('/api/admin/users');
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch users: ${res.status}`);
      }
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetchWithAuth('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername, password: newPassword, role: newRole })
      });
      if (res.ok) {
        setNewUsername('');
        setNewPassword('');
        fetchUsers();
        onSuccess('User created successfully');
      } else {
        const data = await res.json();
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to create user');
    }
  };

  const handleDeleteUser = (u: any) => {
    setUserToDelete(u);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      const res = await fetchWithAuth(`/api/admin/users/${userToDelete.id}`, { 
        method: 'DELETE'
      });
      if (res.ok) {
        fetchUsers();
        setUserToDelete(null);
        onSuccess('User deleted successfully');
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateUser = async (id: string, updates: any) => {
    try {
      const res = await fetchWithAuth(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        fetchUsers();
        onSuccess('User updated successfully');
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-12 text-center">Loading users...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {isSuperAdmin && (
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <UserPlus size={20} className="text-emerald-600" />
              Add New Staff Member
            </h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Username</label>
                <input 
                  required
                  type="text"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm"
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Password</label>
                <input 
                  required
                  type="password"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Role</label>
                <select 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm bg-white"
                  value={newRole}
                  onChange={e => setNewRole(e.target.value)}
                >
                  <option value="Super Admin">Super Admin</option>
                  <option value="GRM Officer">GRM Officer</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>
              <button 
                type="submit"
                className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
              >
                Create Account
              </button>
            </form>
          </div>
        </div>
      )}

      <div className={isSuperAdmin ? "lg:col-span-2" : "lg:col-span-3"}>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Created</th>
                {isSuperAdmin && <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                        <User size={14} />
                      </div>
                      <span className="font-semibold text-slate-800">{u.username}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {isSuperAdmin ? (
                      <select 
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase outline-none cursor-pointer transition-all ${
                          u.role === 'Super Admin' || u.role === 'admin' ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' :
                          u.role === 'GRM Officer' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' :
                          'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                        value={u.role}
                        onChange={(e) => handleUpdateUser(u.id, { role: e.target.value })}
                      >
                        <option value="Super Admin">Super Admin</option>
                        <option value="GRM Officer">GRM Officer</option>
                        <option value="Viewer">Viewer</option>
                      </select>
                    ) : (
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        u.role === 'Super Admin' || u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                        u.role === 'GRM Officer' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {u.role}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      disabled={!isSuperAdmin}
                      onClick={() => handleUpdateUser(u.id, { is_active: !u.is_active })}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${
                        u.is_active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-red-100 text-red-700 hover:bg-red-200'
                      } disabled:cursor-default`}
                    >
                      {u.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  {isSuperAdmin && (
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDeleteUser(u)}
                        className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <X size={16} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {userToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Delete User Account?</h3>
                <p className="text-slate-600 mb-8">
                  Are you sure you want to delete <span className="font-bold text-slate-900">@{userToDelete.username}</span>? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setUserToDelete(null)}
                    className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={confirmDelete}
                    className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
                  >
                    Delete User
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SystemLogsView() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetchWithAuth('/api/admin/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-12 text-center">Loading logs...</div>;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck size={20} className="text-emerald-600" />
          System Activity Logs
        </h3>
        <button onClick={fetchLogs} className="text-sm text-emerald-600 font-bold hover:text-emerald-700 flex items-center gap-1">
          <ArrowUp size={14} className="rotate-45" /> Refresh
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Timestamp</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider ${
                    log.action.includes('DELETE') ? 'bg-red-100 text-red-700' :
                    log.action.includes('CREATE') ? 'bg-emerald-100 text-emerald-700' :
                    log.action.includes('UPDATE') ? 'bg-blue-100 text-blue-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {log.action}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-slate-700">
                  {log.username || 'System'}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {log.details}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                  No system logs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LoginView({ onLogin }: { onLogin: (user: User) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('mwatate_token', data.token);
        onLogin(data.user);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-24">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Staff Login</h2>
          <p className="text-slate-500 mt-1">Access the Mwatate GRM Admin Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Username</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                required
                type="text"
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
            <div className="relative">
              <X className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                required
                type="password"
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>
          <button 
            disabled={isLoading}
            type="submit"
            className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50"
          >
            {isLoading ? 'Logging in...' : 'Login to Dashboard'}
          </button>
        </form>
        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400">
            Authorized personnel only. All access is logged.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
