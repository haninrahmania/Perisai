'use client';
import dynamic from 'next/dynamic';

const FaceLab = dynamic(() => import('./FaceLab'), {
  ssr: false,
  loading: () => <p className="p-8 font-mono text-sm">loading facelab…</p>,
});

export default function Page() {
  return <FaceLab />;
}