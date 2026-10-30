// Voice-only pronunciation fixes for Deepgram Aura-2. All picked by ear on 30 Oct with pron_lab.py.
// Keys are case-sensitive and match whole words. The on-screen transcript always keeps the real spelling.
// Words not listed here (e.g. Marathi, Supabase, Deepgram, Ollama) already sounded right as written.

// IPA overrides. Aura-2 rule: the stress mark ˈ goes directly BEFORE THE STRESSED VOWEL.
export const PRONUNCIATIONS: Record<string, string> = {
  Rounak: "rˈoʊnək",
  Sonavane: "soʊnˈɑːvəneɪ",
  Kolhapur: "kˈoʊlhɑːpʊr",
  Ghodawat: "ɡoʊdˈɑːwət",
  Ramkrishna: "rɑːmkrˈɪʃnə",
  Goa: "ɡˈoʊə",
  ClauseGuard: "klˈɔːzɡɑːrd",
  MindDesk: "mˈaɪnddɛsk",
  ReForge: "riːfˈɔːrdʒ",
  Reforge: "riːfˈɔːrdʒ",
  slimproof: "slˈɪmpruːf",
  LangGraph: "lˈæŋɡræf",
  Groq: "ɡrˈɑːk",
  Valorant: "vˈælərænt",
};

// Plain respellings, swapped into the voice text only.
export const RESPELLINGS: Record<string, string> = {
  Maharashtra: "Maha-rashtra",
  Sanjay: "Sunjay",
  Hindi: "Hin-dee",
  Madgaon: "Mud-gaon",
  Margao: "Mud-gaon", // same town; the bot says Madgaon, this is just a safety net
  FAISS: "face",
  n8n: "n-eight-n",
  "NAT-TEST": "nat test",
  "Legal-BERT": "Legal Bert",
};