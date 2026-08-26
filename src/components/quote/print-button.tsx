"use client";

/** Save-as-PDF for the configured quote. Native print, same as the document engine. */
export function PrintButton({ filename }: { filename: string }) {
  return (
    <button
      onClick={() => {
        const prev = document.title;
        document.title = filename;
        window.print();
        setTimeout(() => (document.title = prev), 500);
      }}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
        aria-hidden
      >
        <path d="M12 3v12m0 0 4-4m-4 4-4-4" />
        <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
      </svg>
      Save as PDF
    </button>
  );
}
