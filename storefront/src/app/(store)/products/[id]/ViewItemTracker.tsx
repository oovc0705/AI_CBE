'use client';

import { useEffect, useRef } from 'react';
import { trackEvent } from '@/lib/analytics';

/**
 * view_item 事件追踪组件 - 商品详情页加载时触发一次
 */
interface ViewItemTrackerProps {
  itemId: string;
  itemName: string;
  price: number;
}

export default function ViewItemTracker({ itemId, itemName, price }: ViewItemTrackerProps) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    trackEvent('view_item', {
      items: [{ item_id: itemId, item_name: itemName, price, currency: 'CNY' }],
      value: price,
    });
  }, [itemId, itemName, price]);

  return null;
}
