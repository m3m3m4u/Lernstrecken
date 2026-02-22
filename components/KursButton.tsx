"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Kurs } from "@/data/types";

interface KursButtonProps {
  kurs: Kurs;
}

export default function KursButton({ kurs }: KursButtonProps) {
  const router = useRouter();
  const [zeigeAuswahl, setZeigeAuswahl] = useState(false);

  const handleKlick = () => {
    // Prüfe ob bereits eingeloggt
    const benutzer = sessionStorage.getItem("benutzer");
    if (benutzer) {
      router.push(`/lernen/kurs/${kurs.id}`);
    } else {
      setZeigeAuswahl(true);
    }
  };

  return (
    <>
      <div
        onClick={handleKlick}
        className="rounded-xl bg-white border-2 border-gray-200 hover:border-gray-400 hover:shadow-lg cursor-pointer transition-all"
      >
        {/* Farbiger Header */}
        <div className={`bg-gradient-to-r ${kurs.farbe} p-6 rounded-t-lg`}>
          <h2 className="text-xl font-bold text-white">{kurs.titel}</h2>
        </div>

        {/* Inhalt */}
        <div className="p-4">
          <p style={{ color: 'black' }}>{kurs.beschreibung}</p>
          <p className="mt-4 font-medium text-blue-600">Kurs starten →</p>
        </div>
      </div>

      {/* Auswahl-Modal */}
      {zeigeAuswahl && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setZeigeAuswahl(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`bg-gradient-to-r ${kurs.farbe} p-6`}>
              <h2 className="text-2xl font-bold text-white">{kurs.titel}</h2>
              <p className="text-white/80 mt-1">{kurs.beschreibung}</p>
            </div>

            {/* Optionen */}
            <div className="p-6 space-y-4">
              <button
                onClick={() => router.push("/login")}
                className="w-full p-4 rounded-xl border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">Anmelden</p>
                    <p className="text-sm text-slate-500">Fortschritt wird gespeichert</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => router.push(`/lernen/kurs/${kurs.id}?vorschau=true`)}
                className="w-full p-4 rounded-xl border-2 border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-400 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">Als Gast starten</p>
                    <p className="text-sm text-slate-500">Ergebnisse werden nicht gespeichert</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setZeigeAuswahl(false)}
                className="w-full text-center text-sm text-slate-400 hover:text-slate-600 transition-colors py-2"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
