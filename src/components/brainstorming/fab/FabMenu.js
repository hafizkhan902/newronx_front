import React, { useRef } from 'react';

function FabMenu({
  fabOpen,
  setFabOpen,
  onShowNotifications,
  onShowApproaches,
  inboxBtnRef
}) {
  return (
    <div className="fixed bottom-6 z-50 flex flex-col items-center" style={{ left: 'calc(50% - 16rem)' }}>
      {/* Menu options, animated */}
      <div className={`flex flex-col items-center gap-3 mb-2 transition-all duration-300 ${fabOpen ? 'opacity-100 translate-y-0' : 'opacity-0 pointer-events-none translate-y-4'}`}>
        {/* Notifications Button */}
        <button
          className="w-12 h-12 rounded-full bg-white border border-gray-300 shadow flex items-center justify-center text-black hover:bg-gray-100 transition"
          title="Notifications"
          onClick={onShowNotifications}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6.002 6.002 0 0 0-4-5.659V5a2 2 0 1 0-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9"/></svg>
        </button>
        {/* Approaches Button (Inbox) */}
        <button
          ref={inboxBtnRef}
          className="w-12 h-12 rounded-full bg-white border border-gray-300 shadow flex items-center justify-center text-black hover:bg-gray-100 transition"
          title="Approaches (Inbox)"
          onClick={onShowApproaches}
        >
          {/* Envelope/mail icon */}
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M3 7l9 6 9-6" />
          </svg>
        </button>
      </div>
      {/* FAB button with creative lightbulb icon */}
      <button
        className="w-14 h-14 rounded-full bg-black text-white shadow-lg flex items-center justify-center text-3xl hover:bg-gray-900 transition focus:outline-none"
        onClick={() => {
          setFabOpen((open) => !open);
          onShowNotifications(false);
          onShowApproaches(false);
        }}
        aria-label="Open menu"
      >
        <svg className={`w-8 h-8 transition-transform duration-300 ${fabOpen ? 'rotate-12' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M12 2a7 7 0 0 0-7 7c0 2.5 1.5 4.5 3.5 5.5V17a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-2.5C17.5 13.5 19 11.5 19 9a7 7 0 0 0-7-7z" />
          <path d="M9 21h6" />
        </svg>
      </button>
    </div>
  );
}

export default FabMenu; 