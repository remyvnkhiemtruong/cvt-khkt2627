import React, { useEffect, useState } from 'react';

export const SaveStatus: React.FC<{
  status: 'saved' | 'saving' | 'dirty';
  lastSavedTime?: string | null;
}> = ({ status, lastSavedTime }) => {
  const [online, setOnline] = useState(() => typeof navigator === 'undefined' ? true : navigator.onLine);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  if (!online) return <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">Ngoại tuyến · chưa đồng bộ</span>;
  if (status === 'saving') return <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">Đang lưu...</span>;
  if (status === 'dirty') return <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">Có thay đổi chưa lưu</span>;
  return <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">Đã lưu{lastSavedTime ? ` · ${lastSavedTime}` : ''}</span>;
};
