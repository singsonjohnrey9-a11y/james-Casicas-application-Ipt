import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShoppingCart, DollarSign, User, Mail, Lock, Eye, EyeOff, MapPin, ArrowRight } from '../components/Icons';

const SELLING_QUOTES = [
    { text: "The best time to sell was yesterday. The second best time is now.", author: "Marketplace Wisdom" },
    { text: "Every sale begins with a connection between two people.", author: "Business Proverb" },
    { text: "Your clutter is someone else's treasure.", author: "CaSiCaS" },
    { text: "Success in selling is the result of discipline, dedication, and respect for others.", author: "Dave Anderson" },
    { text: "The key to success is to start before you are ready.", author: "Marie Forleo" },
    { text: "Don't find customers for your products, find products for your customers.", author: "Seth Godin" },
    { text: "In the middle of every difficulty lies opportunity.", author: "Albert Einstein" },
    { text: "Trade is the natural enemy of all violent passions.", author: "Montesquieu" },
    { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { text: "Make your product easier to buy than your competition.", author: "Mark Cuban" },
];

export default function RegisterPage() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        username: '',
        email: '',
        password: '',
        password_confirm: '',
        first_name: '',
        last_name: '',
        role: 'buyer',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [quote] = useState(() => SELLING_QUOTES[Math.floor(Math.random() * SELLING_QUOTES.length)]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (form.password !== form.password_confirm) {
            setError('Passwords do not match.');
            return;
        }

        if (form.password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        setLoading(true);
        try {
            await register(form);
            navigate('/marketplace');
        } catch (err) {
            const msg = err.message || (typeof err === 'object' ? Object.values(err).flat().find((v) => typeof v === 'string') : null);
            setError(msg || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const updateField = (field) => (e) => setForm({ ...form, [field]: e.target.value });

    return (
        <div className="auth-page">
            <div className="register-split">
                {/* LEFT SIDE — Form */}
                <div className="register-form-side">
                    <div className="auth-brand" style={{ textAlign: 'left' }}>
                        <div className="auth-brand-icon" style={{ margin: '0 0 var(--space-lg) 0' }}>
                            <MapPin size={28} />
                        </div>
                        <h2 className="auth-title">Get Started</h2>
                        <p className="auth-subtitle">Create your CaSiCaS account</p>
                    </div>

                    {error && (
                        <div className="auth-error">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Role Picker */}
                        <div className="form-group">
                            <label className="form-label">I want to</label>
                            <div className="role-picker">
                                <div
                                    className={`role-option ${form.role === 'buyer' ? 'selected' : ''}`}
                                    onClick={() => setForm({ ...form, role: 'buyer' })}
                                >
                                    <div className="role-icon"><ShoppingCart size={20} /></div>
                                    <div className="role-label">Buy</div>
                                </div>
                                <div
                                    className={`role-option ${form.role === 'seller' ? 'selected' : ''}`}
                                    onClick={() => setForm({ ...form, role: 'seller' })}
                                >
                                    <div className="role-icon"><DollarSign size={20} /></div>
                                    <div className="role-label">Sell</div>
                                </div>
                            </div>
                        </div>

                        {/* Name Row */}
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">First Name</label>
                                <div className="input-icon-group">
                                    <span className="input-icon-prefix"><User size={18} /></span>
                                    <input type="text" className="form-input input-with-icon" placeholder="Juan" value={form.first_name} onChange={updateField('first_name')} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Last Name</label>
                                <div className="input-icon-group">
                                    <span className="input-icon-prefix"><User size={18} /></span>
                                    <input type="text" className="form-input input-with-icon" placeholder="Dela Cruz" value={form.last_name} onChange={updateField('last_name')} required />
                                </div>
                            </div>
                        </div>

                        {/* Username + Email Row */}
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Username</label>
                                <div className="input-icon-group">
                                    <span className="input-icon-prefix"><User size={18} /></span>
                                    <input type="text" className="form-input input-with-icon" placeholder="username" value={form.username} onChange={updateField('username')} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <div className="input-icon-group">
                                    <span className="input-icon-prefix"><Mail size={18} /></span>
                                    <input type="email" className="form-input input-with-icon" placeholder="you@email.com" value={form.email} onChange={updateField('email')} required />
                                </div>
                            </div>
                        </div>

                        {/* Password Row */}
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Password</label>
                                <div className="input-icon-group">
                                    <span className="input-icon-prefix"><Lock size={18} /></span>
                                    <input type={showPassword ? 'text' : 'password'} className="form-input input-with-icon input-with-suffix" placeholder="Min 6 chars" value={form.password} onChange={updateField('password')} required minLength={6} />
                                    <button type="button" className="input-icon-suffix" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Confirm</label>
                                <div className="input-icon-group">
                                    <span className="input-icon-prefix"><Lock size={18} /></span>
                                    <input type={showConfirm ? 'text' : 'password'} className="form-input input-with-icon input-with-suffix" placeholder="Re-enter" value={form.password_confirm} onChange={updateField('password_confirm')} required />
                                    <button type="button" className="input-icon-suffix" onClick={() => setShowConfirm(!showConfirm)} tabIndex={-1}>
                                        {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
                            {loading ? (
                                <span className="btn-loading">Creating Account...</span>
                            ) : (
                                <>Create Account <ArrowRight size={18} /></>
                            )}
                        </button>
                    </form>

                    <div className="auth-divider"><span>or</span></div>

                    <div className="auth-footer">
                        Already have an account? <Link to="/login">Sign in</Link>
                    </div>
                </div>

                {/* RIGHT SIDE — Branding + Quotes */}
                <div className="register-quote-side">
                    <div className="register-quote-content">
                        <div className="register-quote-logo">
                            <MapPin size={32} />
                            <span>CaSiCaS</span>
                        </div>

                        <div className="register-quote-tagline">
                            Your local marketplace.<br />Buy and sell within your area.
                        </div>

                        <div className="register-quote-block visible">
                            <svg className="register-quote-mark" width="32" height="32" viewBox="0 0 24 24" fill="currentColor" opacity="0.15">
                                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                            </svg>
                            <p className="register-quote-text">{quote.text}</p>
                            <p className="register-quote-author">— {quote.author}</p>
                        </div>

                        <div className="register-quote-stats">
                            <div className="register-stat">
                                <strong>100%</strong>
                                <span>Free to join</span>
                            </div>
                            <div className="register-stat">
                                <strong>Local</strong>
                                <span>Geo-fenced</span>
                            </div>
                            <div className="register-stat">
                                <strong>Secure</strong>
                                <span>Verified users</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
