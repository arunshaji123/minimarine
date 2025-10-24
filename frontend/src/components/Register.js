import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFirebaseAuth } from '../context/FirebaseAuthContext';
import { useToast } from '../context/ToastContext';
import { Role, getDashboardPathByRole } from '../utils/roles';
import GoogleSignIn from './GoogleSignIn';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: Role.OWNER
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({}); // per-field errors

  const { register } = useAuth();
  const { loginWithGoogle } = useFirebaseAuth();
  const { success } = useToast();
  const navigate = useNavigate();

  // Allowed roles from Role enum
  const allowedRoles = React.useMemo(() => Object.values(Role), []);

  // Helpers
  const normalizeData = (data) => ({
    ...data,
    name: (data.name || '').trim(),
    email: (data.email || '').trim().toLowerCase(),
    role: data.role,
    password: data.password || '',
    confirmPassword: data.confirmPassword || ''
  });

  const validateField = (name, value, allData) => {
    switch (name) {
      case 'name': {
        const v = (value || '').trim();
        if (!v) return 'Full name is required';
        if (v.length < 2) return 'Name must be at least 2 characters';
        if (v.length > 100) return 'Name must be at most 100 characters';
        // Allow letters, spaces, apostrophes, dots and hyphens
        if (!/^[A-Za-z][A-Za-z\s.'-]*$/.test(v)) return 'Name contains invalid characters';
        return '';
      }
      case 'email': {
        const v = (value || '').trim().toLowerCase();
        if (!v) return 'Email is required';
        if (v.length > 254) return 'Email is too long';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
        if (!emailRegex.test(v)) return 'Enter a valid email address';
        return '';
      }
      case 'role': {
        const v = value;
        if (!v) return 'Role is required';
        if (!allowedRoles.includes(v)) return 'Selected role is not allowed';
        return '';
      }
      case 'password': {
        const v = value || '';
        if (!v) return 'Password is required';
        if (v.length < 8) return 'Password must be at least 8 characters';
        if (v.length > 128) return 'Password is too long';
        if (/\s/.test(v)) return 'Password cannot contain spaces';
        if (!/[a-z]/.test(v)) return 'Password must include a lowercase letter';
        if (!/[A-Z]/.test(v)) return 'Password must include an uppercase letter';
        if (!/[0-9]/.test(v)) return 'Password must include a number';
        if (!/[!@#$%^&*(),.?":{}|<>_+=\-\[\]\\/;']/.test(v)) return 'Password must include a special character';
        return '';
      }
      case 'confirmPassword': {
        const v = value || '';
        if (!v) return 'Please confirm your password';
        if (v !== (allData.password || '')) return 'Passwords do not match';
        return '';
      }
      default:
        return '';
    }
  };

  const validateAll = (data) => {
    const d = normalizeData(data);
    return {
      name: validateField('name', d.name, d),
      email: validateField('email', d.email, d),
      role: validateField('role', d.role, d),
      password: validateField('password', d.password, d),
      confirmPassword: validateField('confirmPassword', d.confirmPassword, d)
    };
  };

  // Google handlers mirror Login behavior but redirect to login instead
  const handleGoogleSuccess = (user) => {
    success('Registration with Google successful. Please log in to continue.');
    navigate('/login');
  };

  // After redirect-based Google auth, redirect to login instead of auto-login
  React.useEffect(() => {
    // If token exists, redirect to login page instead of dashboard
    const token = localStorage.getItem('token');
    if (token) {
      // Remove the token to prevent auto-login
      localStorage.removeItem('token');
      const timeout = setTimeout(() => {
        success('Registration successful. Please log in to continue.');
        navigate('/login');
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [navigate, success]);

  const handleGoogleError = (err) => {
    setError(err?.message || 'Google Sign-Up failed. Please try again.');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const next = { ...formData, [name]: value };
    setFormData(next);

    // Re-validate only the changed field (and confirm if password changed)
    const normalized = normalizeData(next);
    const newFieldErrors = { ...fieldErrors };
    newFieldErrors[name] = validateField(name, normalized[name], normalized);
    if (name === 'password' && normalized.confirmPassword) {
      newFieldErrors.confirmPassword = validateField('confirmPassword', normalized.confirmPassword, normalized);
    }
    setFieldErrors(newFieldErrors);

    // Clear global error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Full validation
    const normalized = normalizeData(formData);
    const allErrors = validateAll(normalized);
    setFieldErrors(allErrors);

    const firstError = Object.values(allErrors).find(Boolean);
    if (firstError) {
      setError(firstError);
      setLoading(false);
      return;
    }

    // Submit
    const result = await register(normalized.name, normalized.email, normalized.password, normalized.role);

    if (result.success) {
      success('Registration successful. Please log in to continue.');
      navigate('/login');
    } else {
      setError(result.message || 'Registration failed');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen ocean-bg flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="inline-block">
            <h1 className="text-3xl font-bold text-white mb-2">Marine Survey</h1>
          </Link>
          <h2 className="text-2xl font-semibold text-white">Create your account</h2>
          <p className="mt-2 text-white/80">
            Already have an account?{' '}
            <Link to="/login" className="text-yellow-300 hover:text-yellow-200 font-medium">
              Sign in here
            </Link>
          </p>
        </div>

        {/* Registration Form */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-xl p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-100 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                className="input-field bg-white/20 text-white placeholder-white/60 border-white/30 focus:border-yellow-300"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                aria-invalid={Boolean(fieldErrors.name)}
                aria-describedby={fieldErrors.name ? 'name-error' : undefined}
                maxLength={100}
              />
              {fieldErrors.name && (
                <p id="name-error" className="mt-1 text-red-200 text-sm">{fieldErrors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input-field bg-white/20 text-white placeholder-white/60 border-white/30 focus:border-yellow-300"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                maxLength={254}
                inputMode="email"
              />
              {fieldErrors.email && (
                <p id="email-error" className="mt-1 text-red-200 text-sm">{fieldErrors.email}</p>
              )}
            </div>

            {/* Role Selection */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-white mb-2">
                Role
              </label>
              <select
                id="role"
                name="role"
                className="input-field bg-white/20 text-white border-white/30 focus:border-yellow-300"
                value={formData.role}
                onChange={handleChange}
                aria-invalid={Boolean(fieldErrors.role)}
                aria-describedby={fieldErrors.role ? 'role-error' : undefined}
                required
              >
                <option className="text-black" value={Role.ADMIN}>Admin</option>
                <option className="text-black" value={Role.SHIP_MGMT}>Ship Management Company</option>
                <option className="text-black" value={Role.OWNER}>Owner</option>
                <option className="text-black" value={Role.SURVEYOR}>Surveyor</option>
                <option className="text-black" value={Role.CARGO_MANAGER}>Cargo Manager</option>
              </select>
              {fieldErrors.role && (
                <p id="role-error" className="mt-1 text-red-200 text-sm">{fieldErrors.role}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className="input-field bg-white/20 text-white placeholder-white/60 border-white/30 focus:border-yellow-300 pr-10"
                  placeholder="At least 8 characters with upper, lower, number, special"
                  value={formData.password}
                  onChange={handleChange}
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={fieldErrors.password ? 'password-error' : 'password-help'}
                  minLength={8}
                  maxLength={128}
                />
                <p id="password-help" className="mt-1 text-white/70 text-xs">Use upper & lower case, a number, and a special character.</p>
                {fieldErrors.password && (
                  <p id="password-error" className="mt-1 text-red-200 text-sm">{fieldErrors.password}</p>
                )}
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/80 hover:text-white focus:outline-none"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    // Eye-off icon
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.269-2.943-9.543-7a10.75 10.75 0 012.977-4.78M9.88 4.24A9.956 9.956 0 0112 5c4.478 0 8.269 2.943 9.543 7a10.73 10.73 0 01-4.125 5.071M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
                    </svg>
                  ) : (
                    // Eye icon
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-white mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className="input-field bg-white/20 text-white placeholder-white/60 border-white/30 focus:border-yellow-300 pr-10"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  aria-invalid={Boolean(fieldErrors.confirmPassword)}
                  aria-describedby={fieldErrors.confirmPassword ? 'confirm-error' : undefined}
                />
                {fieldErrors.confirmPassword && (
                  <p id="confirm-error" className="mt-1 text-red-200 text-sm">{fieldErrors.confirmPassword}</p>
                )}
                <button
                  type="button"
                  onClick={() => setShowConfirm((s) => !s)}
                  aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                  aria-pressed={showConfirm}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/80 hover:text-white focus:outline-none"
                  title={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirm ? (
                    // Eye-off icon
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.269-2.943-9.543-7a10.75 10.75 0 012.977-4.78M9.88 4.24A9.956 9.956 0 0112 5c4.478 0 8.269 2.943 9.543 7a10.73 10.73 0 01-4.125 5.071M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
                    </svg>
                  ) : (
                    // Eye icon
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-yellow-400 text-marine-dark font-semibold py-3 px-4 rounded-lg hover:bg-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:ring-offset-2 focus:ring-offset-transparent transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-marine-dark mr-2"></div>
                    Creating account...
                  </div>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/30" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-transparent text-white/80">Or sign up with</span>
              </div>
            </div>
          </div>

          {/* Google Sign-Up */}
          <div className="mt-6">
            <GoogleSignIn 
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              className="w-full"
            >
              Continue with Google
            </GoogleSignIn>
          </div>

          <div className="mt-6 text-center">
            <Link to="/" className="text-white/80 hover:text-white text-sm">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;