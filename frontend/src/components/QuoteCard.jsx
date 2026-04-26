import { useState } from "react";
import { fetchAuthorInfo } from "../api/quotesApi";
import { CATEGORIES } from "../constants/categories";

// QuoteCard primește trei props:
//   quote   — obiectul { id, author, quote, imageUrl }
//   onEdit  — callback apelat la click pe "Editează" (absent în QuotesPage)
//   onDelete— callback apelat la click pe "Șterge"   (absent în QuotesPage)
export default function QuoteCard({ quote, onEdit, onDelete }) {

  // ── Stări tooltip ────────────────────────────────────────────
  const [tooltipInfo, setTooltipInfo]       = useState("");
  const [tooltipLoading, setTooltipLoading] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipError, setTooltipError]     = useState("");

  // ── Handler hover pe numele autorului ────────────────────────
  // Cache simplu: dacă tooltipInfo e deja populat, nu mai cerem AI
  async function handleAuthorHover() {
    setTooltipVisible(true);
    if (tooltipInfo || tooltipError) return;

    setTooltipLoading(true);
    try {
      const data = await fetchAuthorInfo(quote.author);
      setTooltipInfo(data.info);
    } catch (err) {
      setTooltipError("Informații indisponibile momentan.");
    } finally {
      setTooltipLoading(false);
    }
  }

  // ── Date calculate ───────────────────────────────────────────
  const imgSrc = quote.imageUrl
    ? `${import.meta.env.VITE_API_URL}${quote.imageUrl}`
    : null;

  const initials = quote.author
    .split(" ")
    .map(w => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // găsim obiectul categoriei pentru a afișa emoji și culoare
  const categoryObj = CATEGORIES.find(c => c.id === quote.category);

  return (
    <div className="flex flex-col justify-between bg-white rounded-2xl shadow-md
                    hover:shadow-lg transition-shadow duration-300 p-6
                    border border-gray-100">

      {/* ── Header: imagine + autor cu tooltip ── */}
      <div className="flex items-center gap-3 mb-4">

        {/* Fotografie autor */}
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={quote.author}
            className="w-12 h-12 rounded-full object-cover
                       border-2 border-indigo-100 flex-shrink-0"
            onError={e => {
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "flex";
            }}
          />
        ) : null}

        {/* Placeholder cu inițiale */}
        <div
          className="w-12 h-12 rounded-full bg-indigo-100 flex items-center
                     justify-center text-indigo-600 font-bold text-sm flex-shrink-0"
          style={{ display: imgSrc ? "none" : "flex" }}
        >
          {initials}
        </div>

        {/* Numele autorului cu tooltip AI */}
        <div
          className="relative"
          onMouseEnter={handleAuthorHover}
          onMouseLeave={() => setTooltipVisible(false)}
        >
          {/* cursor-help + border-dashed = indiciu vizual că există info extra */}
          <p className="text-sm font-semibold text-indigo-700 cursor-help
                        hover:text-indigo-900 transition-colors
                        border-b border-dashed border-indigo-300">
            {quote.author}
          </p>

          {/* Tooltip — apare la hover */}
          {tooltipVisible && (
            <div className="absolute bottom-full left-0 mb-2 w-64 z-50
                            bg-gray-900 text-white text-xs rounded-xl p-3
                            shadow-2xl pointer-events-none">

              {/* Triunghi decorativ */}
              <div className="absolute top-full left-4 w-0 h-0
                              border-l-4 border-r-4 border-t-4
                              border-l-transparent border-r-transparent
                              border-t-gray-900" />

              {tooltipLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-white border-t-transparent
                                  rounded-full animate-spin flex-shrink-0" />
                  <span className="text-gray-300">Se încarcă informații...</span>
                </div>
              ) : tooltipError ? (
                <p className="text-red-300">{tooltipError}</p>
              ) : (
                <div>
                  <span className="inline-block bg-indigo-500 text-white
                                   px-1.5 py-0.5 rounded mb-1.5 font-medium">
                    ✨ AI
                  </span>
                  <p className="text-gray-100 leading-relaxed">{tooltipInfo}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Textul citatului ── */}
      <div className="flex-1">
        <span className="text-4xl text-indigo-300 leading-none select-none">"</span>
        <p className="text-gray-600 text-sm italic leading-relaxed mt-1">
          {quote.quote}
        </p>
      </div>

      {/* ── Badge categorie ── */}
      {categoryObj && (
        <div className="mt-3">
          <span className={`inline-flex items-center gap-1 text-xs font-medium
                      px-2 py-0.5 rounded-full border ${categoryObj.color}`}>
            {categoryObj.emoji} {categoryObj.label}
          </span>
        </div>
      )}

      {/* ── Butoane acțiuni — doar în ManagePage ── */}
      {(onEdit || onDelete) && (
        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
          {onEdit && (
            <button
              onClick={() => onEdit(quote)}
              className="flex-1 py-1.5 text-xs font-medium rounded-lg
                         bg-indigo-50 text-indigo-700 hover:bg-indigo-100
                         transition-colors duration-200"
            >
              ✏️ Editează
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(quote.id)}
              className="flex-1 py-1.5 text-xs font-medium rounded-lg
                         bg-red-50 text-red-600 hover:bg-red-100
                         transition-colors duration-200"
            >
              🗑️ Șterge
            </button>
          )}
        </div>
      )}
    </div>
  );
}