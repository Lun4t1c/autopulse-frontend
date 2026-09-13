"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

const OffersMap = dynamic(() => import("@/components/OffersMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[500px] items-center justify-center border border-[#d8d1c4] bg-white text-sm text-[#65716c]">
      Loading map...
    </div>
  ),
});

function MapContent() {
  const searchParams = useSearchParams();
  const mapParams = Object.fromEntries([...searchParams.entries()]);

  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-6 sm:px-8 lg:px-10">
      <OffersMap searchParams={mapParams} />
    </section>
  );
}

export default function MapPage() {
  return (
    <main className="min-h-screen bg-[#f5f3ee]">
      <section className="border-b border-[#d8d1c4] bg-[#fdfbf7]">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-10">
          <div>
            <h1 className="text-2xl font-semibold text-[#1c2421]">Offers Map</h1>
            <p className="mt-1 text-sm text-[#65716c]">
              Showing locations of active offers matching your filters.
            </p>
          </div>
        </div>
      </section>

      <Suspense fallback={
        <div className="flex h-[500px] items-center justify-center text-sm text-[#65716c]">
          Loading map...
        </div>
      }>
        <MapContent />
      </Suspense>
    </main>
  );
}