"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Note = {
  id: number;
  user_id: string;
  title: string | null;
  content: string | null;
};

export default function Page() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  async function refreshNotes() {
    const { data, error } = await supabase
      .from("notes")
      .select("id,user_id,title,content")
      .order("id", { ascending: false });

    if (error) {
      alert(`Read failed: ${error.message}`);
      return;
    }
    setNotes((data as Note[]) ?? []);
  }

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      setUserId(data.session?.user?.id ?? null);
      if (data.session) refreshNotes();
    };
    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
      if (session) refreshNotes();
      else setNotes([]);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  async function signUp() {
    const { error } = await supabase.auth.signUp({ email, password: pw });
    if (error) return alert(`Sign up failed: ${error.message}`);
    alert("Signed up! If email confirmation is ON, check your email.");
  }

  async function signIn() {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    if (error) return alert(`Sign in failed: ${error.message}`);
    await refreshNotes();
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function addNote() {
    const { error } = await supabase.from("notes").insert([{ title, content }]);
    if (error) return alert(`Insert failed: ${error.message}`);
    setTitle("");
    setContent("");
    await refreshNotes();
  }

  return (
    <main style={{ maxWidth: 760, margin: "0 auto" }}>
      <h1>Supabase Notes Test</h1>

      {!userId ? (
        <section style={{ padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
          <h2>Auth</h2>
          <div style={{ display: "grid", gap: 8 }}>
            <input
              placeholder="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ padding: 10 }}
            />
            <input
              placeholder="password"
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              style={{ padding: 10 }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={signUp} style={{ padding: "10px 14px" }}>Sign up</button>
              <button onClick={signIn} style={{ padding: "10px 14px" }}>Sign in</button>
            </div>
          </div>
          <p style={{ color: "#555" }}>
            After sign-in, we’ll test RLS by creating notes and ensuring only the logged-in user can see theirs.
          </p>
        </section>
      ) : (
        <section style={{ padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2>Logged in</h2>
            <button onClick={signOut} style={{ padding: "10px 14px" }}>Sign out</button>
          </div>

          <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
            <input
              placeholder="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ padding: 10 }}
            />
            <textarea
              placeholder="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{ padding: 10, minHeight: 90 }}
            />
            <button onClick={addNote} style={{ padding: "10px 14px" }}>Add note</button>
            <button onClick={refreshNotes} style={{ padding: "10px 14px" }}>Refresh</button>
          </div>

          <h3 style={{ marginTop: 18 }}>Notes (should be ONLY yours)</h3>
          <ul style={{ paddingLeft: 18 }}>
            {notes.map((n) => (
              <li key={n.id} style={{ marginBottom: 12 }}>
                <div><strong>{n.title ?? "(no title)"}</strong></div>
                <div style={{ color: "#444" }}>{n.content}</div>
                <div style={{ fontSize: 12, color: "#777" }}>id: {n.id} | user_id: {n.user_id}</div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
