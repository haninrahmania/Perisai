'use client';

import type { ReportRecord } from '@/lib/case-store';
import { Button } from '@/components/ui';

export function PostReportAssistant({ reports }: { reports: ReportRecord[] }) {
  const submittedCount = reports.filter((report) => report.status !== 'draft').length;
  if (submittedCount === 0) return null;

  return (
    <section className="mt-10 rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] p-5">
      <h2 className="text-[16px] font-medium text-[color:var(--heading)]">Tanya Pendamping Perisai</h2>
      <p className="mt-2 text-[13px] leading-relaxed text-[color:var(--muted)]">
        Kamu dapat mengirim pertanyaan ke Google Gemini setelah melapor. Hanya pesan yang kamu
        tulis yang dikirim. Bukti dan isi laporan tetap di perangkat ini.
      </p>
      <div className="mt-4">
        <Button href="/pendamping/">Tanya pendamping</Button>
      </div>
    </section>
  );
}
