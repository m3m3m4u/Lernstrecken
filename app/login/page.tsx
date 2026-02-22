"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [benutzername, setBenutzername] = useState("");
  const [passwort, setPasswort] = useState("");
  const [fehler, setFehler] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFehler("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ benutzername, passwort }),
      });

      const data = await res.json();

      if (data.success) {
        // Benutzer in sessionStorage speichern
        sessionStorage.setItem("benutzer", JSON.stringify(data.benutzer));
        router.push("/lernen");
      } else {
        setFehler(data.error || "Anmeldung fehlgeschlagen");
      }
    } catch (err) {
      setFehler("Verbindungsfehler. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white p-8 rounded-xl border-2 border-gray-300 w-full max-w-md">
        <h1 style={{ color: "black" }} className="text-2xl font-bold mb-2 text-center">
          FutureLab
        </h1>
        <p style={{ color: "gray" }} className="text-center mb-6">
          Melde dich an, um mit dem Lernen zu beginnen
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label style={{ color: "black" }} className="block mb-1 font-medium">
              Benutzername
            </label>
            <input
              type="text"
              value={benutzername}
              onChange={(e) => setBenutzername(e.target.value)}
              className="w-full p-3 border-2 border-gray-300 rounded-lg"
              style={{ color: "black" }}
              placeholder="Dein Benutzername"
              autoFocus
              required
            />
          </div>

          <div className="mb-4">
            <label style={{ color: "black" }} className="block mb-1 font-medium">
              Passwort
            </label>
            <input
              type="password"
              value={passwort}
              onChange={(e) => setPasswort(e.target.value)}
              className="w-full p-3 border-2 border-gray-300 rounded-lg"
              style={{ color: "black" }}
              placeholder="Dein Passwort"
              required
            />
          </div>

          {fehler && (
            <p style={{ color: "red" }} className="mb-4 text-center">
              {fehler}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg"
          >
            {loading ? "Anmelden..." : "Anmelden"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a
            href="/"
            style={{ color: "gray" }}
            className="text-sm hover:underline"
          >
            Zur Startseite
          </a>
        </div>
      </div>
    </main>
  );
}
