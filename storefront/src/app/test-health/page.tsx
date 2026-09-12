'use client';

import { useEffect, useState } from 'react';
import { fetchRaw } from '@/lib/api';

export default function TestHealthPage() {
  const [data, setData] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    setLoading(true);
    fetchRaw<Record<string, string>>('/api/health')
      .then((res) => {
        setData(res);
        setError('');
      })
      .catch((err) => {
        setError(err.message || '请求失败');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">健康检查测试</h1>
      {loading && <p className="text-gray-500">请求中...</p>}
      {error && <p className="text-red-500">错误：{error}</p>}
      {data && (
        <div className="bg-gray-100 p-4 rounded">
          <p className="font-semibold">响应数据：</p>
          <pre className="mt-2 text-sm">{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </main>
  );
}
