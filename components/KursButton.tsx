import Link from "next/link";
import { Kurs } from "@/data/types";

interface KursButtonProps {
  kurs: Kurs;
}

export default function KursButton({ kurs }: KursButtonProps) {
  return (
    <Link href={`/kurs/${kurs.id}`}>
      <div className="rounded-xl bg-white border-2 border-gray-300 hover:border-gray-400 cursor-pointer">
        {/* Farbiger Header */}
        <div className={`bg-gradient-to-r ${kurs.farbe} p-4 rounded-t-lg`}>
          <h2 className="text-xl font-bold" style={{ color: 'black' }}>{kurs.titel}</h2>
        </div>

        {/* Inhalt */}
        <div className="p-4">
          <p style={{ color: 'black' }}>{kurs.beschreibung}</p>
          <p style={{ color: 'black' }} className="mt-4 font-medium">Kurs starten →</p>
        </div>
      </div>
    </Link>
  );
}
