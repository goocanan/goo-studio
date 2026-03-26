import React, { useState } from 'react';
import { LogIn, UserPlus } from 'lucide-react';
import { signIn, signUp } from '../lib/auth-client';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signIn.email({ email, password }, {
          onError: (ctx) => setError(ctx.error.message || 'Error signing in')
        });
      } else {
        await signUp.email({ name, email, password }, {
          onError: (ctx) => setError(ctx.error.message || 'Error signing up')
        });
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="glass-card p-8 w-full max-w-md animate-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/30 shadow-[0_0_15px_rgba(var(--color-primary),0.3)]">
            <span className="text-3xl font-bold text-primary">G</span>
          </div>
          <h1 className="heading-lg mb-2">{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
          <p className="text-dim text-sm">Sign in to GOO-Studio to manage your 3D projects</p>
        </div>

        {error && (
          <div className="bg-error/10 border border-error/30 text-error p-3 rounded-lg text-sm mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <div className="form-group">
              <label className="form-label">Name</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin}
              />
            </div>
          )}
          
          <div className="form-group">
            <label className="form-label">Email</label>
            <input 
              type="email" 
              className="form-input" 
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-full justify-center py-3 mt-4"
            disabled={loading}
          >
            {loading ? (
              <span className="opacity-70">Processing...</span>
            ) : (
              <>
                {isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
                {isLogin ? 'Sign In' : 'Sign Up'}
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            className="text-xs text-muted hover:text-white transition-colors"
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
