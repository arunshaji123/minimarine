import React from 'react';

/**
 * Reusable user profile modal/sidebar
 *
 * Props:
 * - open: boolean — controls visibility
 * - onClose: () => void — called when backdrop/close pressed
 * - user: { name, email, role, status } — user details to display
 * - variant: 'sidebar' | 'modal' — layout style (default: 'sidebar')
 * - title: string — optional custom title
 */
export default function UserProfileModal({ open, onClose, user = {}, variant = 'sidebar', title = 'My Profile' }) {
  if (!open) return null;

  const { name = '', email = '', role = '', status = '' } = user;
  const initial = (name || email || 'U').charAt(0).toUpperCase();

  const DialogContent = () => (
    <div className="p-6" role="document">
      <div className="flex items-center justify-between mb-4">
        <h3 id="user-profile-title" className="text-lg font-medium text-gray-900">{title}</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
          aria-label="Close profile"
        >
          ✕
        </button>
      </div>

      <div className="flex items-center mb-6">
        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-marine-blue to-marine-light flex items-center justify-center text-white font-semibold mr-3">
          {initial}
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-900">{name || '—'}</div>
          <div className="text-xs text-gray-500">{email || '—'}</div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-xs text-gray-500">Role</p>
          <p className="text-sm font-medium text-gray-900 capitalize">{role || '—'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Status</p>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
            {status || '—'}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[10000]" role="dialog" aria-modal="true" aria-labelledby="user-profile-title">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-40" onClick={onClose} aria-hidden="true" />

      {variant === 'modal' ? (
        // Centered modal
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-gray-200 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <DialogContent />
          </div>
        </div>
      ) : (
        // Right sidebar drawer
        <aside className="absolute top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl border-l border-gray-200 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <DialogContent />
        </aside>
      )}
    </div>
  );
}