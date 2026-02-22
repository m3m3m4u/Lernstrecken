"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const GEHEIM_CODE = "872020";

export default function AdminLogin() {
  const [code, setCode] = useState("");
  const [fehler, setFehler] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code === GEHEIM_CODE) {
      sessionStorage.setItem("admin-auth", "true");
      router.push("/admin/dashboard");
    } else {
      setFehler(true);
      setCode("");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white p-8 rounded-xl border-2 border-gray-300 w-full max-w-md">
        <h1 style={{ color: "black" }} className="text-2xl font-bold mb-6 text-center">
          Admin-Bereich
        </h1>
        
        <form onSubmit={handleSubmit}>
          <label style={{ color: "black" }} className="block mb-2 font-medium">
            Geheimzahl eingeben:
          </label>
          <input
            type="password"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setFehler(false);
            }}
            className="w-full p-3 border-2 border-gray-300 rounded-lg mb-4"
            style={{ color: "black" }}
            placeholder="Geheimzahl"
            autoFocus
          />
          
          {fehler && (
            <p style={{ color: "red" }} className="mb-4">
              Falsche Geheimzahl!
            </p>
          )}
          
          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg"
          >
            Anmelden
          </button>
        </form>
        
        <a
          href="/"
          style={{ color: "black" }}
          className="block text-center mt-4 hover:underline"
        >
          Zurück zur Startseite
        </a>
      </div>
    </main>
  );
}
