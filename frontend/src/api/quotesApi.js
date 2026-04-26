// URL-ul de bază al backend-ului Express.
// Toate cererile trec prin Express → proxy → json-server.
// React nu comunică niciodată direct cu json-server (:3000).
// const BASE_URL = "http://localhost:5000/api/quotes";
const BASE_URL = `${import.meta.env.VITE_API_URL}/api/quotes`;

// ─────────────────────────────────────────────────────────────
// GET /api/quotes — preia toate citatele
// Folosit în QuotesPage și ManagePage la montarea componentei.
// ─────────────────────────────────────────────────────────────
// GET /api/quotes?search=termen&category=motivatie
// Ambii parametri sunt opționali și pot fi combinați.
export async function getAllQuotes(search = "", category = "") {
  // Construim query string-ul dinamic
  const params = new URLSearchParams();

  if (search.trim())                        params.append("search", search.trim());
  if (category && category !== "all")       params.append("category", category);

  // URLSearchParams.toString() generează "search=x&category=y"
  const queryString = params.toString();
  const url = queryString ? `${BASE_URL}?${queryString}` : BASE_URL;

  const response = await fetch(url);
  if (!response.ok) throw new Error("Nu s-au putut prelua citatele.");
  return response.json();
}

// ─────────────────────────────────────────────────────────────
// POST /api/quotes — adaugă un citat nou
// Trimitem { author, quote } — ID-ul este generat de json-server.
// Validarea se face pe backend (Joi) — tratăm erorile de validare.
// ─────────────────────────────────────────────────────────────
export async function addQuote(quoteData) {
  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(quoteData),
  });
  if (!response.ok) {
    const err = await response.json();
    // Erorile de validare Joi vin ca array în `errors`
    throw new Error(err.errors?.join(", ") || "Nu s-a putut adăuga citatul.");
  }
  return response.json();
}

// POST /api/quotes/fetch-image
// Trimite numele autorului la Express, care îl caută pe Wikipedia.
// Returnează { imageUrl: "/images/albert_einstein.jpg" }
export async function fetchAuthorImage(author) {
  const response = await fetch(`${BASE_URL.replace("/quotes", "")}/quotes/fetch-image`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ author }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Nu s-a putut prelua imaginea.");
  }
  return response.json(); // { imageUrl: "/images/..." }
}


// ─────────────────────────────────────────────────────────────
// PUT /api/quotes/:id — actualizează un citat existent
// ─────────────────────────────────────────────────────────────
export async function updateQuote(id, quoteData) {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(quoteData),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.errors?.join(", ") || "Nu s-a putut actualiza citatul.");
  }
  return response.json();
}

// ─────────────────────────────────────────────────────────────
// DELETE /api/quotes/:id — șterge un citat
// Nu returnăm JSON util — verificăm doar că cererea a reușit.
// ─────────────────────────────────────────────────────────────
export async function deleteQuote(id) {
  const response = await fetch(`${BASE_URL}/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Nu s-a putut șterge citatul.");
}


export async function generateQuote(author) {
  const response = await fetch(
    // Construim URL-ul corect față de BASE_URL = /api/quotes
    `${BASE_URL.replace("/quotes", "")}/quotes/generate-quote`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ author }),
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Nu s-a putut genera citatul.");
  }

  return response.json(); // { quote: "textul generat" }
}

export async function fetchAuthorInfo(author) {
  const response = await fetch(
    `${BASE_URL.replace("/quotes", "")}/quotes/author-info`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ author }),
    }
  );

  if (!response.ok) {
    throw new Error("Nu s-au putut prelua informațiile despre autor.");
  }

  return response.json(); // { info: "text generat de AI" }
}