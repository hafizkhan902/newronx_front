import React from 'react';
import '../../genie.css';

function InboxModal({
  show,
  genieClosing,
  showGenie,
  mockApproaches,
  onClose
}) {
  if (!show && !genieClosing) return null;
  return (
    <>
      {/* Backdrop for smooth fade and blur, behind the modal */}
      <div className="fixed inset-0 z-40 bg-black bg-opacity-30 backdrop-blur-sm transition-opacity duration-500" onClick={onClose} />
      {/* Modal content, above the blur, genie effect */}
      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center pointer-events-none">
        <div
          className={`bg-white border border-gray-200 shadow-2xl p-6 w-full sm:w-[70vw] max-w-2xl genie-animate ${showGenie && !genieClosing ? 'genie-in' : ''}`}
          style={{ minHeight: '60vh', maxHeight: '80vh', pointerEvents: 'auto', zIndex: 60, position: 'relative' }}
        >
          <div className="flex justify-between items-center mb-4">
            <span className="font-semibold text-black text-lg">Inbox</span>
            <button className="text-gray-400 hover:text-black text-2xl" onClick={onClose}>&times;</button>
          </div>
          <ul className="space-y-4 overflow-y-auto" style={{ maxHeight: '60vh' }}>
            {mockApproaches.length === 0 ? (
              <li className="text-xs text-gray-400">No approaches yet.</li>
            ) : (
              mockApproaches.map(a => (
                <li key={a.id} className="text-base text-gray-700 bg-gray-50 rounded p-3 shadow-sm">
                  <span className="font-semibold">{a.from}:</span> {a.message}
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </>
  );
}

export default InboxModal; 