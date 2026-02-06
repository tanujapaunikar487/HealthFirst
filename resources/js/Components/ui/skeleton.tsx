import * as React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { AlertCircle, RefreshCw } from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';

/* ─── Pulse ─── */

export function Pulse({ className, style, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`bg-muted animate-pulse rounded ${className ?? ''}`} style={style} {...rest} />;
}

/* ─── ErrorState ─── */

export function ErrorState({ onRetry, label = 'Unable to load page' }: { onRetry: () => void; label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-32">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <AlertCircle className="h-7 w-7 text-muted-foreground" />
      </div>
      <p className="text-label text-muted-foreground">{label}</p>
      <p className="text-body text-muted-foreground">Please check your connection and try again.</p>
      <Button variant="secondary" className="mt-2" onClick={onRetry}>
        <RefreshCw className="h-4 w-4" />
        Try Again
      </Button>
    </div>
  );
}

/* ─── useSkeletonLoading ─── */

export function useSkeletonLoading(data: unknown) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const mountTime = useRef(Date.now());

  useEffect(() => {
    const MIN_SKELETON_MS = 300;
    const elapsed = Date.now() - mountTime.current;
    const remaining = Math.max(0, MIN_SKELETON_MS - elapsed);

    const revealTimer = setTimeout(() => {
      setIsLoading(false);
    }, remaining);

    const errorTimer = setTimeout(() => {
      setIsLoading((current) => {
        if (current) setHasError(true);
        return current;
      });
    }, 10000);

    return () => {
      clearTimeout(revealTimer);
      clearTimeout(errorTimer);
    };
  }, []);

  const retry = useCallback(() => {
    setHasError(false);
    setIsLoading(true);
    mountTime.current = Date.now();
    router.reload();
  }, []);

  return { isLoading, hasError, retry };
}

/* ─── Common Skeleton Blocks ─── */

export function TableRowSkeleton({ cols }: { cols: number }) {
  return (
    <div className="flex items-center gap-4 px-6 py-4 border-b border-border last:border-0">
      {Array.from({ length: cols }).map((_, i) => (
        <Pulse key={i} className={`h-4 ${i === 0 ? 'w-20' : i === 1 ? 'w-40' : 'w-24'}`} />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-3xl border border-border overflow-hidden">
      <div className="flex items-center gap-4 px-4 py-3 bg-muted/50 border-b border-border">
        {Array.from({ length: cols }).map((_, i) => (
          <Pulse key={i} className={`h-3 ${i === 0 ? 'w-16' : i === 1 ? 'w-32' : 'w-20'}`} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-border last:border-0">
          {Array.from({ length: cols }).map((_, j) => (
            <Pulse key={j} className={`h-4 ${j === 0 ? 'w-20' : j === 1 ? 'w-40' : 'w-24'}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SheetSkeleton({ lines = 6 }: { lines?: number }) {
  return (
    <div className="space-y-6 p-1">
      <div className="space-y-2">
        <Pulse className="h-6 w-48" />
        <Pulse className="h-4 w-32" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="flex justify-between">
            <Pulse className="h-4 w-28" />
            <Pulse className="h-4 w-36" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-3xl border border-border p-5 space-y-4">
      <Pulse className="h-5 w-32" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="flex justify-between">
          <Pulse className="h-4 w-28" />
          <Pulse className="h-4 w-36" />
        </div>
      ))}
    </div>
  );
}
