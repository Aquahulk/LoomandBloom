"use client";
export default function PrintButton() {
  return (
    <button onClick={() => window.print()} className="px-3 py-1.5 rounded border text-sm hover:bg-gray-50">Print / Save as PDF</button>
  );
}