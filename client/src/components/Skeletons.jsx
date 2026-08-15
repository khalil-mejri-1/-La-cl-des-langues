import React from 'react';

/**
 * Friendly, creative skeleton loader for student session cards on DashboardPage
 */
export function SessionCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-purple-100 shadow-sm relative overflow-hidden flex flex-col gap-4">
      {/* Top shimmer gradient bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-2.5 w-full sm:w-2/3">
          {/* Badges row */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="h-6 w-20 rounded-full skeleton-shimmer"></div>
            <div className="h-6 w-24 rounded-full skeleton-shimmer-subtle"></div>
            <div className="h-6 w-28 rounded-full skeleton-shimmer-subtle"></div>
          </div>

          {/* Time text placeholder */}
          <div className="h-8 w-28 rounded-xl skeleton-shimmer mt-1"></div>

          {/* Subject placeholder */}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md skeleton-shimmer"></div>
            <div className="h-4 w-44 rounded-lg skeleton-shimmer-subtle"></div>
          </div>

          {/* Teacher placeholder */}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full skeleton-shimmer-emerald"></div>
            <div className="h-4 w-36 rounded-lg skeleton-shimmer-subtle"></div>
          </div>
        </div>

        {/* Right Date Card placeholder */}
        <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-100 min-w-[140px] w-full sm:w-auto shrink-0 gap-2">
          <div className="h-4 w-16 rounded-md skeleton-shimmer-emerald"></div>
          <div className="h-7 w-20 rounded-lg skeleton-shimmer"></div>
          <div className="h-3 w-24 rounded-md skeleton-shimmer-subtle"></div>
        </div>
      </div>

      {/* Button placeholder */}
      <div className="h-12 w-full rounded-2xl skeleton-shimmer-subtle mt-1"></div>
    </div>
  );
}

/**
 * Creative skeleton loader for the Admin / Teacher Session Pack cards
 */
export function AdminSessionPackSkeleton() {
  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 border-2 border-purple-100 shadow-sm relative overflow-hidden space-y-5">
      {/* Header bar placeholder */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl skeleton-shimmer shrink-0"></div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-5 w-32 rounded-lg skeleton-shimmer"></div>
              <div className="h-5 w-24 rounded-full skeleton-shimmer-subtle"></div>
            </div>
            <div className="h-3.5 w-48 rounded-md skeleton-shimmer-subtle"></div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-8 w-32 rounded-xl skeleton-shimmer-emerald"></div>
          <div className="h-8 w-28 rounded-xl skeleton-shimmer-subtle"></div>
        </div>
      </div>

      {/* Table rows placeholder */}
      <div className="space-y-2.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100 gap-3"
          >
            <div className="h-5 w-20 rounded-full skeleton-shimmer shrink-0"></div>
            <div className="h-4 w-28 rounded-lg skeleton-shimmer-subtle"></div>
            <div className="h-6 w-36 rounded-lg skeleton-shimmer-emerald"></div>
            <div className="h-6 w-24 rounded-full skeleton-shimmer-subtle"></div>
            <div className="h-9 w-32 rounded-full skeleton-shimmer shrink-0"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Friendly skeleton for the Parent Page next appointment & history table
 */
export function ParentHeroSkeleton() {
  return (
    <div className="bg-white rounded-3xl p-6 border-2 border-purple-100 shadow-sm relative overflow-hidden space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-6 w-36 rounded-full skeleton-shimmer"></div>
        <div className="h-5 w-24 rounded-lg skeleton-shimmer-subtle"></div>
      </div>
      <div className="h-6 w-56 rounded-xl skeleton-shimmer"></div>
      <div className="h-4 w-40 rounded-md skeleton-shimmer-emerald"></div>
      <div className="h-12 w-full rounded-full skeleton-shimmer-subtle mt-2"></div>
    </div>
  );
}

/**
 * Table rows skeleton for Client / Sessions tables
 */
export function TableRowsSkeleton({ rows = 4, cols = 5 }) {
  return (
    <div className="divide-y divide-slate-100">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-1/4">
            <div className="w-9 h-9 rounded-full skeleton-shimmer shrink-0"></div>
            <div className="space-y-1.5 w-full">
              <div className="h-4 w-24 rounded-md skeleton-shimmer"></div>
              <div className="h-3 w-16 rounded-md skeleton-shimmer-subtle"></div>
            </div>
          </div>
          <div className="h-4 w-20 rounded-md skeleton-shimmer-subtle hidden sm:block"></div>
          <div className="h-4 w-12 rounded-md skeleton-shimmer-subtle hidden sm:block"></div>
          <div className="h-4 w-32 rounded-md skeleton-shimmer-subtle"></div>
          <div className="h-7 w-20 rounded-full skeleton-shimmer-emerald"></div>
          <div className="h-8 w-16 rounded-full skeleton-shimmer-subtle shrink-0"></div>
        </div>
      ))}
    </div>
  );
}

/**
 * Friendly teacher selector cards skeleton
 */
export function TeacherCardsSkeleton({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white p-4 rounded-2xl border-2 border-purple-100 shadow-sm flex items-center gap-3.5"
        >
          <div className="w-12 h-12 rounded-full skeleton-shimmer shrink-0"></div>
          <div className="space-y-2 flex-1">
            <div className="h-4 w-24 rounded-md skeleton-shimmer"></div>
            <div className="h-3 w-32 rounded-md skeleton-shimmer-subtle"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
