'use client';
import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';

const FaceLab = dynamic(() => import('./FaceLab'), {
  ssr: false,
  loading: () => <p className="p-8 font-mono text-sm">loading facelab…</p>,
});

export default function Page() {
  if (process.env.NODE_ENV === 'production') notFound();

  return <FaceLab />;
}