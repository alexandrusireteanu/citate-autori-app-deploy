import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import QuoteCard from "../components/QuoteCard";
import { getAllQuotes, addQuote, updateQuote, deleteQuote, fetchAuthorImage, generateQuote } from "../api/quotesApi";
import { useFormValidation } from "../hooks/useFormValidation";
import { CATEGORIES } from "../constants/categories";


// Regulile de validare definite o singură dată, în afara componentei.
// Astfel nu se recreează la fiecare render.
const VALIDATION_RULES = {
  author: {
    required: true,
    requiredMsg: "Autorul este obligatoriu.",
    minLength: 2,
    minLengthMsg: "Autorul trebuie să aibă cel puțin 2 caractere.",
    maxLength: 100,
    maxLengthMsg: "Autorul poate avea maxim 100 de caractere.",
  },
  quote: {
    required: true,
    requiredMsg: "Citatul este obligatoriu.",
    minLength: 5,
    minLengthMsg: "Citatul trebuie să aibă cel puțin 5 caractere.",
    maxLength: 500,
    maxLengthMsg: "Citatul poate avea maxim 500 de caractere.",
  },
};

export default function ManagePage() {
  // Lista de citate afișată în secțiunea de jos a paginii
  const [quotes, setQuotes] = useState([]);

  // Dacă editingQuote !== null, formularul este în modul EDITARE.
  // Conține obiectul complet { id, author, quote } al citatului editat.
  const [editingQuote, setEditingQuote] = useState(null);

  // Datele controlate ale formularului — sincronizate cu input-urile
  const [formData, setFormData] = useState({ author: "", quote: "" });

  // Mesaj de feedback după operații (succes sau eroare)
  const [feedback, setFeedback] = useState({ message: "", type: "" });

  const [loading, setLoading] = useState(true);

  // hook-ul de validare — destructurăm errors, validate, clearErrors
  const { errors, validate, clearErrors } = useFormValidation(VALIDATION_RULES);

  const [imageUrl, setImageUrl] = useState("");
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState("");
  const [aiLoading, setAiLoading]     = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);
  const [category, setCategory] = useState("");

  // La montarea componentei, preluăm citatele existente
  useEffect(() => {
    fetchQuotes();
  }, []);

  useEffect(() => {
  // Nu generăm dacă:
  // - autorul are sub 3 caractere (evităm cereri pentru input parțial)
  // - formularul este în modul editare (nu suprascriem citatele existente)
  // - câmpul quote este deja completat manual de utilizator
  if (
    formData.author.trim().length < 3 ||
    editingQuote ||
    formData.quote.trim().length > 0
  ) return;

  // Setăm timer-ul de 5 secunde
  const timer = setTimeout(async () => {
    setAiLoading(true);
    try {
      const result = await generateQuote(formData.author);

      // Populăm automat câmpul quote cu citatul generat de AI
      setFormData(prev => ({ ...prev, quote: result.quote }));
      setAiGenerated(true); // marcăm că citatul vine din AI
    } catch (err) {
      // Eroarea la AI nu blochează utilizatorul — afișăm doar în consolă
      console.warn("Generare AI eșuată:", err.message);
    } finally {
      setAiLoading(false);
    }
  }, 5000); // ← 5000ms = 5 secunde

  // Cleanup: dacă utilizatorul continuă să tasteze, anulăm timer-ul anterior
  return () => clearTimeout(timer);

  // Dependențele: re-rulăm efectul când autorul sau modul editare se schimbă
}, [formData.author, editingQuote]);

  // ── Funcții de comunicare cu backend-ul ─────────────────────

  // Reîncarcă lista de citate — apelată după orice operație CRUD
  async function fetchQuotes() {
    try {
      const data = await getAllQuotes();
      setQuotes(data);
    } catch (err) {
      showFeedback(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  // ── Handlers formular ────────────────────────────────────────

  // Handler generic pentru toate câmpurile formularului.
  // [e.target.name] folosește computed property pentru a actualiza
  // câmpul corespunzător (author sau quote) fără un handler per câmp.
  function handleChange(e) {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (e.target.name === "quote") {
    setAiGenerated(false);
  }
  }

  // Submiterea formularului — comportament diferit în funcție de mod
  async function handleSubmit(e) {
    // Prevenim comportamentul implicit al formularului (reload pagină)
    e.preventDefault();

    // validăm local înainte de orice apel la backend.
    // Dacă validarea eșuează, oprim execuția aici.
    if (!validate(formData)) return;

    // Includem imageUrl în datele trimise la backend
    const payload = { ...formData, imageUrl, category };

    try {
      if (editingQuote) {
        // ── MOD EDITARE: trimitem PUT cu ID-ul citatului editat ──
        await updateQuote(editingQuote.id, payload);
        showFeedback("Citatul a fost actualizat cu succes.", "success");
      } else {
        // ── MOD ADĂUGARE: trimitem POST fără ID ──
        await addQuote(payload);
        showFeedback("Citatul a fost adăugat cu succes.", "success");
      }
      // Indiferent de operație: resetăm formularul și reîncărcăm lista
      resetForm();
      fetchQuotes();
    } catch (err) {
      // Erorile de validare (400) sau rețea (500) ajung aici
      showFeedback(err.message, "error");
    }
  }

  async function handleFetchImage() {
    if (!formData.author.trim()) {
      setImageError("Introduceți mai întâi numele autorului.");
      return;
    }

    setImageLoading(true);
    setImageError("");

    try {
      const result = await fetchAuthorImage(formData.author);
      setImageUrl(result.imageUrl);
    } catch (err) {
      setImageError(err.message);
      setImageUrl("");
    } finally {
      setImageLoading(false);
    }
  }

  // Populează formularul cu datele citatului selectat pentru editare.
  // Apelat din QuoteCard via prop-ul onEdit.
  function handleEdit(quote) {
    setEditingQuote(quote);
    setFormData({ author: quote.author, quote: quote.quote });
    setImageUrl(quote.imageUrl || "");
    setCategory(quote.category || "");
    setImageError("");
    clearErrors(); // ștergem erorile anterioare la intrarea în editare
    // Derulăm pagina sus — formularul se află în header
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Șterge citatul cu `id` după confirmare utilizator.
  // Apelat din QuoteCard via prop-ul onDelete.
  async function handleDelete(id) {
    if (!window.confirm("Ești sigur că vrei să ștergi acest citat?")) return;
    try {
      await deleteQuote(id);
      showFeedback("Citatul a fost șters.", "success");
      fetchQuotes();
    } catch (err) {
      showFeedback(err.message, "error");
    }
  }

  // ── Utilitare ────────────────────────────────────────────────

  // Resetează formularul și iese din modul editare
  function resetForm() {
    setEditingQuote(null);
    setFormData({ author: "", quote: "" });
    setImageUrl("");
    setImageError("");
    setCategory("");
    setAiGenerated(false);
    clearErrors(); // curățăm erorile la resetarea formularului
  }

  // Afișează mesajul de feedback și îl ascunde automat după 3 secunde
  function showFeedback(message, type) {
    setFeedback({ message, type });
    setTimeout(() => setFeedback({ message: "", type: "" }), 3000);
  }

  // Clasă de bază pentru input — reutilizată pentru toate câmpurile
  const inputBase = `w-full px-4 py-2 border rounded-lg text-sm
                     focus:outline-none focus:ring-2 transition`;

  // funcție care returnează clasa corectă în funcție de starea câmpului
  // Câmpurile cu eroare primesc border roșu, cele normale border gri
  const inputClass = (field) =>
    `${inputBase} ${errors[field]
      ? "border-red-400 focus:ring-red-300 bg-red-50"
      : "border-gray-300 focus:ring-indigo-300 bg-white"
    }`;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ── */}
      <header className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-brand">⚙️ Administrare citate</h1>
          {/* Link întoarce utilizatorul la pagina de afișare */}
          <Link
            to="/"
            className="px-4 py-2 text-sm font-medium text-brand border border-brand
                       rounded-lg hover:bg-brand hover:text-white transition-colors duration-200"
          >
            ← Înapoi la citate
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-10">

        {/* ── Banner feedback (succes / eroare) ── */}
        {/* Tranziție de opacitate: apare și dispare fluid */}
        {feedback.message && (
          <div
            className={`px-4 py-3 rounded-lg text-sm font-medium transition-opacity duration-300
              ${feedback.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
              }`}
          >
            {feedback.type === "success" ? "✅" : "⚠️"} {feedback.message}
          </div>
        )}

        {/* ── Formular adăugare / editare ── */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {/* Titlul și culoarea se schimbă dinamic în funcție de modul activ */}
          <h2 className={`text-lg font-semibold mb-6
            ${editingQuote ? "text-amber-600" : "text-brand"}`}>
            {editingQuote ? "✏️ Editează citatul" : "➕ Adaugă citat nou"}
          </h2>

          {/* onSubmit pe <form> — capturat de handleSubmit */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Câmp autor */}
            <div>
              <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-1">
                Autor
              </label>
              <input
                id="author"
                name="author"           // ← folosit de handleChange cu [e.target.name]
                type="text"
                value={formData.author} // ← input controlat: valoarea vine din state
                onChange={handleChange}
                placeholder="ex. Marcus Aurelius"
                required
                className={inputClass("author")}
              />
              {/* mesajul de eroare apare doar dacă există eroare pentru câmpul autor */}
              {errors.author && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <span>⚠</span> {errors.author}
                </p>
              )}
            </div>

            {/* ── Secțiunea imagine autor ── */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Imagine autor
              </label>

              <div className="flex gap-2">
                {/* Butonul caută imaginea pe Wikipedia prin Express */}
                <button
                  type="button"     // ← nu trimite formularul
                  onClick={handleFetchImage}
                  disabled={imageLoading || !formData.author.trim()}
                  className="flex-1 py-2 px-4 text-sm font-medium rounded-lg border
                 border-indigo-300 text-indigo-600 bg-indigo-50
                 hover:bg-indigo-100 disabled:opacity-50
                 disabled:cursor-not-allowed transition-colors"
                >
                  {imageLoading ? "⏳ Se caută..." : "🔍 Caută imagine pe Wikipedia"}
                </button>

                {/* Dacă există imagine, afișăm buton de ștergere */}
                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => { setImageUrl(""); setImageError(""); }}
                    className="px-3 py-2 text-sm text-red-500 border border-red-200
                   rounded-lg hover:bg-red-50 transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Mesaj de eroare dacă Wikipedia nu găsește autorul */}
              {imageError && (
                <p className="mt-1 text-xs text-red-500">⚠ {imageError}</p>
              )}

              {/* Previzualizare imagine — apare după ce s-a găsit cu succes */}
              {imageUrl && !imageError && (
                <div className="mt-3 flex items-center gap-3 p-3 bg-gray-50
                    rounded-lg border border-gray-100">
                  <img
                    src={`http://localhost:5000${imageUrl}`}
                    alt={formData.author}
                    className="w-16 h-16 rounded-full object-cover border-2 border-indigo-200"
                    // Fallback dacă imaginea nu se încarcă
                    onError={e => { e.target.style.display = "none"; }}
                  />
                  <div>
                    <p className="text-xs font-medium text-gray-700">{formData.author}</p>
                    <p className="text-xs text-gray-400 truncate max-w-xs">{imageUrl}</p>
                  </div>
                </div>
              )}
            </div>


            {/* Câmp citat */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="quote"
                  className="block text-sm font-medium text-gray-700">
                  Citat
                </label>

                {/* Indicator de stare AI — vizibil în timp ce OpenAI generează */}
                {aiLoading && (
                  <span className="text-xs text-indigo-500 flex items-center gap-1 animate-pulse">
                    <span>⚡</span> AI generează citat...
                  </span>
                )}

                {/* Badge „Generat de AI" — apare după generare, dispare la editare manuală */}
                {aiGenerated && !aiLoading && (
                  <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5
                       rounded-full border border-indigo-200">
                    ✨ Generat de AI
                  </span>
                )}
              </div>

              <textarea
                id="quote"
                name="quote"
                value={formData.quote}
                onChange={handleChange}
                placeholder={aiLoading
                  ? "Se generează citatul..."
                  : "Introduceți citatul sau așteptați generarea automată..."}
                rows={4}
                className={`${inputClass("quote")} resize-none transition-all
                ${aiLoading ? "bg-indigo-50 border-indigo-200" : ""}`}
              />

              <div className="flex justify-between mt-1 items-start">
                <div className="flex flex-col gap-1">
                  {errors.quote && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <span>⚠</span> {errors.quote}
                    </p>
                  )}
                  {/* Notă de transparență — citatul AI poate fi editat sau înlocuit */}
                  {aiGenerated && !aiLoading && (
                    <p className="text-xs text-gray-400 italic">
                      ⚠ Citat sugerat de AI — verificați autenticitatea înainte de salvare.
                    </p>
                  )}
                </div>
                <span className={`text-xs ml-auto flex-shrink-0
      ${formData.quote.length > 450 ? "text-red-400" : "text-gray-400"}`}>
                  {formData.quote.length}/500
                </span>
              </div>
            </div>

            {/* ── Dropdown categorie ── */}
            <div>
              <label htmlFor="category"
                className="block text-sm font-medium text-gray-700 mb-1">
                Categorie
                <span className="ml-1 text-gray-400 font-normal">(opțional)</span>
              </label>

              <select
                id="category"
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm
               bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300
               text-gray-700 transition"
              >
                <option value="">— Fără categorie —</option>
                {CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.emoji} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Butoane formular — se schimbă în funcție de mod */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className={`flex-1 py-2.5 text-sm font-semibold text-white rounded-lg
                            transition-colors duration-200
                            ${editingQuote
                    ? "bg-amber-500 hover:bg-amber-600"
                    : "bg-brand hover:bg-brand-dark"}`}
              >
                {editingQuote ? "💾 Salvează modificările" : "➕ Adaugă citat"}
              </button>

              {/* Butonul „Anulează" apare doar în modul editare */}
              {editingQuote && (
                <button
                  type="button"  // ← important: nu submitează formularul
                  onClick={resetForm}
                  className="flex-1 py-2.5 text-sm font-semibold text-gray-600
                             bg-gray-100 rounded-lg hover:bg-gray-200
                             transition-colors duration-200"
                >
                  ✕ Anulează
                </button>
              )}
            </div>
          </form>
        </section>

        {/* ── Lista de citate existente ── */}
        <section>
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Citate existente
            <span className="ml-2 text-sm font-normal text-gray-400">
              ({quotes.length})
            </span>
          </h2>

          {loading ? (
            <p className="text-center text-brand animate-pulse py-10">
              Se încarcă...
            </p>
          ) : quotes.length === 0 ? (
            <p className="text-center text-gray-400 py-10">
              Nu există citate. Adaugă primul folosind formularul de mai sus.
            </p>
          ) : (
            // Același grid responsiv ca în QuotesPage
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {quotes.map(q => (
                <QuoteCard
                  key={q.id}
                  quote={q}
                  onEdit={handleEdit}     // ← furnizăm callbacks → butoanele apar
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}