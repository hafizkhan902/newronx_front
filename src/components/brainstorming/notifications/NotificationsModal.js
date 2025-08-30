import React from 'react';

function NotificationsModal({ show, mockNotifications, onClose }) {
  if (!show) return null;
  return (
    <div className="absolute left-16 bottom-0 mb-2 w-72 bg-white border border-gray-200 rounded shadow-lg z-50 p-4">
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold text-black">Notifications</span>
        <button className="text-gray-400 hover:text-black" onClick={onClose}>&times;</button>
      </div>
      <ul className="space-y-2">
        {mockNotifications.length === 0 ? (
          <li className="text-xs text-gray-400">No notifications yet.</li>
        ) : (
          mockNotifications.map(n => (
            <li key={n.id} className="text-sm text-gray-700 flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
              {n.text}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export default NotificationsModal; 