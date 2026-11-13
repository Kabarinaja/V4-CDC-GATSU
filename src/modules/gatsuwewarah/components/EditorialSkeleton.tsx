import React from 'react';

export const EditorialHomeSkeleton: React.FC = () => {
  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-4">
          <div className="w-full aspect-[16/9] bg-stone-200" />
          <div className="h-4 w-32 bg-stone-200" />
          <div className="h-9 w-4/5 bg-stone-200" />
          <div className="h-4 w-full bg-stone-200" />
          <div className="h-4 w-2/3 bg-stone-200" />
        </div>
        <div className="lg:col-span-4 space-y-6">
          <div className="space-y-2">
            <div className="w-full aspect-[16/10] bg-stone-200" />
            <div className="h-5 w-5/6 bg-stone-200" />
          </div>
          <div className="space-y-2">
            <div className="w-full aspect-[16/10] bg-stone-200" />
            <div className="h-5 w-4/5 bg-stone-200" />
          </div>
        </div>
      </div>
    </div>
  );
};

export const ArticleDetailSkeleton: React.FC = () => {
  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-8 animate-pulse space-y-6">
      <div className="h-4 w-48 bg-stone-200" />
      <div className="h-10 w-5/6 bg-stone-200" />
      <div className="h-5 w-3/4 bg-stone-200" />
      <div className="flex items-center gap-3 py-3 border-y border-stone-200">
        <div className="w-11 h-11 rounded-full bg-stone-200" />
        <div className="space-y-2">
          <div className="h-4 w-32 bg-stone-200" />
          <div className="h-3 w-24 bg-stone-200" />
        </div>
      </div>
      <div className="w-full aspect-[16/9] bg-stone-200" />
      <div className="space-y-3 max-w-2xl">
        <div className="h-4 w-full bg-stone-200" />
        <div className="h-4 w-full bg-stone-200" />
        <div className="h-4 w-4/5 bg-stone-200" />
      </div>
    </div>
  );
};
