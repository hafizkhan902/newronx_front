import React from 'react';

function ApproachModal({ open, post, mockApproaches, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 shadow-xl w-full max-w-md relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-black text-xl font-bold"
          onClick={onClose}
        >
          ×
        </button>
        <h3 className="text-lg font-bold mb-4 text-black">Approaches for this Idea</h3>
        <div className="space-y-2">
          {mockApproaches && mockApproaches.length > 0 ? (
            mockApproaches.map((a, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-black">{a.name || a.from}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${a.type === 'Propose' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{a.type || a.message}</span>
              </div>
            ))
          ) : (
            <div className="text-xs text-gray-400">No approaches yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ApproachModal; 