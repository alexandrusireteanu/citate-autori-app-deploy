// useEffect — execută cod la montarea componentei (echivalent componentDidMount)
// useState  — gestionează starea locală a componentei
import { useEffect, useState } from "react";

// Link — element de navigare React Router (similar cu <a> fără reload de pagină)
import { Link } from "react-router-dom";

import QuoteCard from "../components/QuoteCard";
import { getAllQuotes } from "../api/quotesApi";
import { CATEGORIES, CATEGORY_ALL } from "../constants/categories"; 

export default function QuotesPage() {
  // `quotes`  — lista de citate primită de la backend
  // `loading` — true cât timp cererea fetch este în desfășurare
  // `error`   — mesajul de eroare dacă fetch eșuează
  const [quotes, setQuotes]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // valoarea din input (actualizată la fiecare tastă)
  const [inputValue, setInputValue]   = useState("");

  // termenul de căutare trimis efectiv la backend (după debounce)
  const [searchTerm, setSearchTerm]   = useState("");

  // categoria activă — "all" înseamnă fără filtrare
  const [activeCategory, setActiveCategory] = useState(CATEGORY_ALL);

  // NOU: Debounce — amânăm cererea la backend cu 400ms după ultima tastă.
  // Prevenim o cerere HTTP la fiecare caracter tastat.
  // Re-executăm fetch-ul ori de câte ori `searchTerm` se schimbă
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(inputValue);
    }, 400);

    // Cleanup: anulăm timer-ul anterior dacă utilizatorul continuă să tasteze
    return () => clearTimeout(timer);
  }, [inputValue]);

  // Re-executăm fetch când search sau category se schimbă
  useEffect(() => {
    setLoading(true);
    setError(null);
    getAllQuotes(searchTerm, activeCategory) //transmitem și categoria
      .then(setQuotes)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [searchTerm, activeCategory]); // ← dependență: se re-rulează când searchTerm si activeCategory se schimbă

  // Schimbarea categoriei resetează și căutarea text
  // pentru a evita filtre combinate confuze
  function handleCategoryChange(categoryId) {
    setActiveCategory(categoryId);
    setInputValue("");
  }

  // useEffect cu array gol [] = rulează O SINGURĂ DATĂ după primul render.
  // Realizeaza apeluri API la încărcarea paginii.
  // useEffect(() => {
  //   getAllQuotes()
  //     .then(data => setQuotes(data))
  //     .catch(err => setError(err.message))
  //     .finally(() => setLoading(false)); // se execută indiferent de succes/eroare
  // }, []); // ← dependențe goale = efectul nu se re-rulează

  // Stări UI intermediare — afișăm feedback vizual
  // if (loading) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center bg-brand-light">
  //       <p className="text-brand text-lg font-medium animate-pulse">
  //         Se încarcă citatele...
  //       </p>
  //     </div>
  //   );
  // }

  // if (error) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center bg-brand-light">
  //       <p className="text-red-500 text-lg font-medium">⚠️ {error}</p>
  //     </div>
  //   );
  // }

  return (
    // min-h-screen = pagina ocupă cel puțin toată înălțimea ecranului
    // bg-brand-light = fundal ușor colorat din tema custom
    <div className="min-h-screen bg-brand-light">

      {/* ── Header ── */}
      {/* sticky top-0 z-10 = rămâne vizibil la scroll */}
      <header className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-brand text-indigo-600">Citate Autori Celebri</h1>
            <p className="text-sm text-gray-500">
              {quotes.length} {quotes.length === 1 ? "citat" : "citate"}
            </p>
          </div>
          {/* Link către ruta /manage — fără reload */}
          <Link
            to="/manage"
            className="px-4 py-2 bg-brand text-white text-sm font-medium
                       rounded-lg hover:bg-brand-dark transition-colors duration-200"
          >
            ⚙️ Administrează
          </Link>
        </div>

         {/* ── Bara de căutare — în header, sub titlu ── */}
        <div className="max-w-6xl mx-auto px-4 pb-4">
          <div className="relative">
            {/* Iconița de căutare — poziționată absolut în stânga input-ului */}
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
              🔍
            </span>
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="Caută după autor sau citat..."
              className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl
                         text-sm bg-gray-50 focus:outline-none focus:ring-2
                         focus:ring-indigo-300 focus:bg-white transition"
            />
            {/* Buton X — apare doar dacă există text în input */}
            {inputValue && (
              <button
                onClick={() => setInputValue("")}
                className="absolute right-3 top-1/2 -translate-y-1/2
                           text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ×
              </button>
            )}
          </div>
          {/* indicator că filtrarea e activă */}
          {searchTerm && (
            <p className="text-xs text-indigo-500 mt-1 pl-1">
              Rezultate pentru: <strong>"{searchTerm}"</strong>
            </p>
          )}
        </div>
        {/* ── Butoane categorii ── */}
        <div className="max-w-6xl mx-auto px-4 pb-4">
          <div className="flex gap-2 flex-wrap">

            {/* Butonul "Toate" */}
            <button
              onClick={() => handleCategoryChange(CATEGORY_ALL)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border
                          transition-colors duration-200
                          ${activeCategory === CATEGORY_ALL
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
                          }`}
            >
              🗂️ Toate
            </button>

            {/* Butoanele pentru fiecare categorie */}
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border
                            transition-colors duration-200
                            ${activeCategory === cat.id
                              ? cat.activeColor
                              : `bg-white text-gray-600 border-gray-200
                                 hover:${cat.color}`
                            }`}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>
        </div>


      </header>
      

      {/* ── Grid de citate ── */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <p className="text-center text-red-500 py-10">⚠️ {error}</p>
        )}

        {!error && !loading && quotes.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400 text-xl mb-2">
             {searchTerm
                ? `Niciun citat găsit pentru "${searchTerm}".`
                : activeCategory !== CATEGORY_ALL
                  ? `Niciun citat în categoria selectată.`
                  : "Nu există citate."}
            </p>
            {searchTerm
              ? <button onClick={() => setInputValue("")}
                  className="text-indigo-500 underline hover:text-indigo-700 text-sm">
                  Șterge filtrele
                </button>
              : <Link to="/manage"
                  className="text-indigo-500 underline hover:text-indigo-700 text-sm">
                  Adaugă primul citat →
                </Link>
            }
          </div>
        )}

        {/* Skeleton loading — 6 carduri placeholder în timp ce se încarcă */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100
                                      animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-5/6" />
                <div className="h-3 bg-gray-100 rounded w-1/3 ml-auto mt-4" />
              </div>
            ))}
          </div>
        )}

        {!loading && quotes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {quotes.map(q => <QuoteCard key={q.id} quote={q} />)}
          </div>
        )}
      </main>
    </div>
  );
}