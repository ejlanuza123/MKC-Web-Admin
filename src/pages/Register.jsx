// src/pages/Register.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lock, Mail, User, Phone, Loader2, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import mkcLogo from '../assets/images/mkc-logo.png';
import bgImage from '../assets/images/background-image.jpg';

export default function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      setError('Full name is required');
      return false;
    }
    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone_number: formData.phone,
            role: 'admin'
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        setSuccess(true);
        
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-mkc-red flex items-center justify-center p-4">
        <div className="bg-mkc-blue w-full max-w-md rounded-2xl shadow-2xl p-8 text-center border border-white/20">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-white rounded-xl overflow-hidden shadow-lg flex items-center justify-center mx-auto">
              <img src={mkcLogo} alt="MKC Logo" className="w-full h-full object-contain p-2 rounded-xl" />
            </div>
          </div>
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-green-600" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Admin Account Created!</h2>
          <p className="text-white/80 mb-6">
            Your admin account has been successfully created. Proceed to login with your credentials.
          </p>
          <Link 
            to="/login"
            className="inline-block bg-mkc-red text-[#1A1A1A] px-6 py-3 rounded-lg hover:bg-mkc-red-dark"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.28,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.55)',
          pointerEvents: 'none',
          zIndex: 5,
        }}
      />
      <div className="relative z-10 bg-mkc-blue w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-white/20">
        <div className="bg-mkc-blue-dark p-8 text-center relative">
          <Link to="/login" className="absolute top-6 left-6 text-white/80 hover:text-white transition">
            <ArrowLeft size={24} />
          </Link>
          <div className="flex justify-center mb-4">
            <div className="w-24 h-24 bg-white rounded-xl overflow-hidden shadow-lg flex items-center justify-center">
              <img 
                src={mkcLogo} 
                alt="MKC Logo" 
                className="w-full h-full object-contain p-2 rounded-xl"
              />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white">Create Admin Account</h2>
          <p className="text-white/80 mt-2">Admin Dashboard - Admins Only</p>
        </div>

        <form onSubmit={handleRegister} className="p-8 space-y-5">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <div className="flex items-center">
                <AlertCircle className="text-red-500 mr-2" size={20} />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-white/90 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                name="fullName"
                type="text"
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0033A0] outline-none"
                placeholder="Juan Dela Cruz"
                value={formData.fullName}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/90 mb-1">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                name="phone"
                type="tel"
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0033A0] outline-none"
                placeholder="0912 345 6789"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/90 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                name="email"
                type="email"
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0033A0] outline-none"
                placeholder="admin@mkcfoods.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  name="password"
                  type="password"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0033A0] outline-none"
                  placeholder="••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/90 mb-1">
                Confirm <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  name="confirmPassword"
                  type="password"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0033A0] outline-none"
                  placeholder="••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-xs text-[#0033A0]">
              <span className="font-bold">Note:</span> By creating an admin account, you'll have full access to manage orders, products, and view all system data.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-mkc-red hover:bg-mkc-red-dark text-[#1A1A1A] font-bold py-3 rounded-lg transition duration-200 flex items-center justify-center shadow-lg"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin mr-2" size={20} />
                Creating Account...
              </>
            ) : (
              'Register Admin'
            )}
          </button>
          
          <div className="text-center mt-4">
            <p className="text-sm text-white/80">
              Already have an account?{' '}
              <Link to="/login" className="text-mkc-red font-bold hover:text-white hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}