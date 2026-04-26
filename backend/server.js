const express = require("express");
const cors = require("cors");
const fs = require("fs"); // modul pentru operații cu fișiere
const path = require("path"); // modul pentru construirea căilor
const Joi = require("joi");
require("dotenv").config();

const app = express(); // creează instanța aplicației Express
app.use(cors()); // activează CORS - orice client poate face cereri
app.use(express.json()); // middleware care parsează automat corpul cererilor HTTP cu Content-Type: application/json
const OpenAI = require("openai");
const openai = new OpenAI({
  baseURL: "https://models.inference.ai.azure.com",
  apiKey:  process.env.GITHUB_TOKEN,
});

// Directorul unde salvăm imaginile descărcate.
// path.join asigură compatibilitate cross-platform.
const IMAGES_DIR = path.join(__dirname, "images");
// Rută statică catre imagini

app.use("/images", express.static(path.join(__dirname, "images")));

// Creăm directorul /images dacă nu există deja
// { recursive: true } previne eroarea dacă directorul există
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// ─────────────────────────────────────────────────────────────
// POST /api/quotes/fetch-image
// Primește { author } din body, caută pe Wikipedia,
// descarcă imaginea și o salvează în /images/.
// Returnează URL-ul local al imaginii.

app.post("/api/quotes/fetch-image", async (req, res) => {
  const { author } = req.body;

  if (!author || !author.trim()) {
    return res.status(400).json({ error: "Numele autorului este obligatoriu." });
  }

  try {
    // Formatăm numele autorului pentru URL Wikipedia:
    // "Albert Einstein" → "Albert_Einstein"
    const wikiName = author.trim().replace(/\s+/g, "_");
    const wikiUrl  = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiName)}`;

    // Cerere către Wikipedia REST API
    // User-Agent este recomandat de Wikipedia pentru identificarea aplicației
    const wikiResponse = await fetch(wikiUrl, {
      headers: {
        "User-Agent": "PrintingQuotesApp/1.0"
      }
    });

    if (!wikiResponse.ok) {
      return res.status(404).json({
        error: `Autorul "${author}" nu a fost găsit pe Wikipedia.`
      });
    }

    const wikiData = await wikiResponse.json();

    // Verificăm dacă pagina Wikipedia are o imagine thumbnail
    if (!wikiData.thumbnail?.source) {
      return res.status(404).json({
        error: `Nu există imagine disponibilă pentru "${author}" pe Wikipedia.`
      });
    }

    const imageUrl = wikiData.thumbnail.source;

    // Determinăm extensia fișierului din URL (jpg, png, jpeg etc.)
    const ext = imageUrl.split(".").pop().split("?")[0].toLowerCase();

    // Numele fișierului local: "albert_einstein.jpg"
    // toLowerCase + replace spații = nume de fișier valid
    const fileName  = `${author.trim().toLowerCase().replace(/\s+/g, "_")}.${ext}`;
    const filePath  = path.join(IMAGES_DIR, fileName);

    // Dacă imaginea a fost descărcată anterior, o returnăm direct
    // fără a face o nouă cerere la Wikipedia
    if (fs.existsSync(filePath)) {
      console.log(`Imagine existentă returnată: ${fileName}`);
      return res.status(200).json({ imageUrl: `/images/${fileName}` });
    }

    // Descărcăm imaginea de la Wikipedia
    const imgResponse = await fetch(imageUrl);
    if (!imgResponse.ok) {
      return res.status(500).json({ error: "Nu s-a putut descărca imaginea." });
    }

    // Convertim răspunsul într-un Buffer (date binare)
    const buffer = Buffer.from(await imgResponse.arrayBuffer());

    // Scriem fișierul pe disc în directorul /images
    fs.writeFileSync(filePath, buffer);
    console.log(`Imagine salvată: ${fileName}`);

    // Returnăm URL-ul local — Express servește /images/* ca static
    res.status(200).json({ imageUrl: `/images/${fileName}` });

  } catch (error) {
    console.error("Eroare la fetch-image:", error.message);
    res.status(500).json({ error: "Eroare internă la preluarea imaginii." });
  }
});

app.post("/api/quotes/generate-quote", async (req, res) => {
  const { author } = req.body;

  if (!author || !author.trim()) {
    return res.status(400).json({ error: "Numele autorului este obligatoriu." });
  }

  try {
    // Apelăm OpenAI cu un prompt structurat.
    // gpt-4o-mini — model rapid și economic, ideal pentru generare de text scurt.
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", 
      messages: [
        {
          // Mesajul de sistem definește rolul și comportamentul AI-ului.
          // Este trimis o singură dată și stabilește contextul conversației.
          role: "system",
          content: `Ești un expert în literatură și filosofie.
                    Generezi citate scurte, inspiraționale și autentice.
                    Răspunzi DOAR cu citatul, fără ghilimele, fără numele autorului,
                    fără explicații suplimentare. Maxim 2 propoziții.`,
        },
        {
          // Mesajul utilizatorului — cererea efectivă
          role: "user",
          content: `Scrie un citat autentic sau în stilul lui ${author.trim()}.
                    Dacă autorul are citate celebre cunoscute, folosește unul dintre ele.
                    Dacă nu, generează unul în stilul și filosofia sa.`,
        },
      ],
      // Limităm lungimea răspunsului — un citat scurt nu necesită mai mult
      max_tokens: 150,
      // temperature controlează creativitatea: 0 = determinist, 1 = creativ
      // 0.7 = echilibru bun între autenticitate și variație
      temperature: 0.7,
    });

    // Extragem textul din răspunsul OpenAI și eliminăm spațiile extra
    const generatedQuote = completion.choices[0].message.content.trim();

    res.status(200).json({ quote: generatedQuote });

  } catch (error) {
    console.error("Eroare OpenAI:", error.message);

    // Tratăm separat eroarea de autentificare (cheie invalidă)
    if (error.status === 401) {
      return res.status(500).json({ error: "Cheie API OpenAI invalidă." });
    }

    res.status(500).json({ error: "Nu s-a putut genera citatul." });
  }
});

app.post("/api/quotes/author-info", async (req, res) => {
  const { author } = req.body;

  if (!author || !author.trim()) {
    return res.status(400).json({ error: "Numele autorului este obligatoriu." });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          // Sistemul definește formatul răspunsului
          role: "system",
          content: `Ești un asistent concis care descrie personalități istorice.
                    Răspunzi doar în limba română.
                    Răspunsul conține EXACT doua propoziții scurte.
                    Menționezi: domeniul, perioada și contribuția principală.
                    Fără introduceri, fără "Sigur!", fără explicații extra.`,
        },
        {
          role: "user",
          content: `Descrie pe ${author.trim()} în exact 2 propoziții.`,
        },
      ],
      // 120 tokens sunt suficienți pentru doua propoziții scurte
      max_tokens: 120,
      // răspuns mai concis și factual
      temperature: 0.5,
    });

    const info = completion.choices[0].message.content.trim();
    res.status(200).json({ info });

  } catch (error) {
    console.error("Eroare author-info:", error.message);
    res.status(500).json({ error: "Nu s-au putut prelua informațiile." });
  }
});

const JSON_SERVER_URL = "http://localhost:3000/quotes";

// verificam dacă id-ul din PUT și DELETE este un număr valid
const validateId = (req, res, next) => {
  if (isNaN(req.params.id)) {
    return res.status(400).json({ error: "Invalid ID format" });
  }
  next();
};

// Schema Joi pentru validarea citatelor
const quoteSchema = Joi.object({
  id: Joi.string().optional(),
  author: Joi.string().min(2).required(),
  quote: Joi.string().min(5).required(),
  // imageUrl este opțional — poate fi string gol sau un path valid
  imageUrl: Joi.string().allow("").optional(),
  category: Joi.string()
    .valid("intelepciune", "motivatie", "umor", "filosofie", "stiinta")
    .allow("")
    .optional(),
});

// Ruta de test
app.get("/", (req, res) => {
  res.json({ 
    message: "Citate Autori API functioneaza...",
    endpoints: {
      quotes: "/api/quotes",
      health: "/api/health"
    }
  });
});

// Ruta pentru verificarea stării serverului
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development"
  });
});

// GET /api/quotes?search=termen
// Dacă parametrul `search` există în query string, filtrăm rezultatele.
// Căutarea este case-insensitive și caută atât în author cât și în quote.
app.get("/api/quotes", async (req, res) => {
  try {
    const response = await fetch(JSON_SERVER_URL);
    const data     = await response.json();

    // Extragem ambii parametri din query string
    const { search, category } = req.query;

    let result = data;

    // Aplicăm filtrul de căutare text (dacă există)
    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      result = result.filter(q =>
        q.author.toLowerCase().includes(term) ||
        q.quote.toLowerCase().includes(term)
      );
    }

    // Aplicăm filtrul de categorie (dacă există și nu este "all")
    // Citatele fără categorie setată sunt excluse din filtrele specifice
    if (category && category !== "all") {
      result = result.filter(q => q.category === category);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Eroare la preluarea citatelor:", error.message);
    res.status(500).json({ error: "Nu s-au putut prelua citatele." });
  }
});


// ruta GET pentru a prelua un singur citat după ID
app.get("/api/quotes/:id", validateId, async (req, res) => {
  try {
    const quoteId = req.params.id;
    const response = await fetch(`${JSON_SERVER_URL}/${quoteId}`);
    const quote = await response.json();

    if (!quote) {
      return res.status(404).json({ error: "Quote not found" });
    }

    res.json(quote);
  } catch (error) {
    console.error("Error fetching quote:", error);
    res.status(500).json({ error: "Failed to fetch quote" });
  }
});

// Adauga un nou citat
app.post("/api/quotes", async (req, res) => {
  const { error } = quoteSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    const response = await fetch(JSON_SERVER_URL);
    const quotes = await response.json();

    // generam un ID numeric (urmatorul numar disponibil)
    const newId = quotes.length > 0 ? Math.max(...quotes.map(q => Number(q.id))) + 1 : 1;

    const newQuote = { id: newId.toString(), ...req.body }; // convertim ID-ul in sir pentru a se potrivi cu formatul db.json

    // trimite la json-server
    const postResponse = await fetch(JSON_SERVER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newQuote),
    });

    const data = await postResponse.json();
    res.status(postResponse.status).json(data);
  } catch (error) {
    console.error("Error adding quote:", error);
    res.status(500).json({ error: "Failed to add quote" });
  }
});

// Actualizam un citat
app.put("/api/quotes/:id", validateId, async (req, res) => {
  
  const { error } = quoteSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    const quoteId = req.params.id;
    
    // construiti obiectul actualizat, asigurandu-va ca `id` este prima cheie
    const updatedQuote = { id: quoteId, ...req.body };

    const response = await fetch(`${JSON_SERVER_URL}/${quoteId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedQuote),
    });

    // verificam dacă există citatul
    if (!response.ok) {
      return res.status(404).json({ error: "Quote not found" });
    }

    const data = await response.json();

    // creati un nou obiect cu `id` ca prima cheie
    const reorderedData = { id: data.id, author: data.author, quote: data.quote };

    res.status(response.status).json(reorderedData);
  } catch (error) {
    console.error("Error updating quote:", error);
    res.status(500).json({ error: "Failed to update quote" });
  }
});


// Stergem un citat
app.delete("/api/quotes/:id", validateId, async (req, res) => {
  try {
    const quoteId = req.params.id;
    const response = await fetch(`${JSON_SERVER_URL}/${quoteId}`);
   
    // verificam dacă există citatul
    if (!response.ok) {
      return res.status(404).json({ error: "Quote not found" });
    }

    await fetch(`${JSON_SERVER_URL}/${quoteId}`, { method: "DELETE" });
    res.status(200).json({ message: "Quote deleted successfully" });
  } catch (error) {
    next(error);
  }
});

// Pornim serverul pe portul 5000
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serverul ruleaza la http://localhost:${PORT}`);
  console.log(`Ruta statica catre imagini din: ${path.join(__dirname, "images")}`);
});

// Verificam repornirea automata a serverului
console.log("Server restarted!");


// // Serve images statically
// app.use("/images", express.static(path.join(__dirname, "images")));

// // in-memory quotes data
// let quotes = [
//   { id: 1, author: "Socrates", quote: "The only true wisdom is in knowing you know nothing." },
//   { id: 2, author: "Albert Einstein", quote: "Life is like riding a bicycle. To keep your balance you must keep moving." }
// ];



// // Routes for CRUD operations

// // GET: Fetch all quotes
// app.get("/api/quotes", (req, res) => {
//   res.status(200).json(quotes);
// });

// // POST: Add a new quote
// app.post("/api/quotes", (req, res) => {
//   const { author, quote } = req.body;
//   const newQuote = {
//     id: quotes.length + 1,
//     author,
//     quote
//   };
//   quotes.push(newQuote);
//   res.status(201).json(newQuote);
// });

// // PUT: Update an existing quote by ID
// app.put("/api/quotes/:id", (req, res) => {
//   const { id } = req.params;
//   const { author, quote } = req.body;
  
//   const quoteIndex = quotes.findIndex(q => q.id == id);
//   if (quoteIndex !== -1) {
//     quotes[quoteIndex] = { id: parseInt(id), author, quote };
//     res.status(200).json(quotes[quoteIndex]);
//   } else {
//     res.status(404).json({ message: "Quote not found" });
//   }
// });

// // DELETE: Delete a quote by ID
// app.delete("/api/quotes/:id", (req, res) => {
//   const { id } = req.params;
//   const quoteIndex = quotes.findIndex(q => q.id == id);
//   if (quoteIndex !== -1) {
//     quotes.splice(quoteIndex, 1);
//     res.status(200).json({ message: "Quote deleted" });
//   } else {
//     res.status(404).json({ message: "Quote not found" });
//   }
// });



// DATE INIȚIALE (stocate în memorie). În producție, acestea vor fi stocate într-o bază de date

// let quotes = [
//   { id: 1, author: "Socrates", quote: "The only true wisdom is in knowing you know nothing." },
//   { id: 2, author: "Albert Einstein", quote: "Life is like riding a bicycle. To keep your balance you must keep moving." }
// ];

// // GET /api/quotes - Returnează lista completă a citatelor. Statusul 200 (OK) este implicit, dar îl adaugam ca bune practici

// app.get("/api/quotes", (req, res) => {
//   res.status(200).json(quotes);
// });

// // POST /api/quotes - Adaugă un citat nou trimis în corpul cererii (req.body). Clientul trebuie să trimită: { "author": "...", "quote": "..." }. Răspundem cu statusul 201 (Created) și obiectul nou creat.

// app.post("/api/quotes", (req, res) => {
//   const { author, quote } = req.body;
//   const newQuote = {
//     id: quotes.length + 1, // Generăm un ID unic 
//     author,
//     quote
//   };
//   quotes.push(newQuote);
//   res.status(201).json(newQuote);
// });

// // PUT /api/quotes/:id - Actualizează citatul cu ID-ul specificat în URL. `:id` este un parametru dinamic, accesibil prin req.params.id.

// app.put("/api/quotes/:id", (req, res) => {
//   const id = parseInt(req.params.id);
//   const { author, quote } = req.body;
  
//   const index = quotes.findIndex(q => q.id === id);

//   if (index === -1) {
//     // 404 Not Found – citatul cu ID-ul respectiv nu există
//     return res.status(404).json({ message: "Citatul nu a fost găsit." });
//   }

//   // Actualizăm intrarea păstrând ID-ul neschimbat
//   quotes[index] = { id, author, quote };
//   res.status(200).json(quotes[index]);
// });

// // DELETE /api/quotes/:id - Șterge citatul cu ID-ul specificat din array; splice() elimină elementul direct din memorie.

// app.delete("/api/quotes/:id", (req, res) => {
//   const id = parseInt(req.params.id);
//   const index = quotes.findIndex(q => q.id === id);

//   if (index === -1) {
//     return res.status(404).json({ message: "Citatul nu a fost găsit." });
//   }

//   quotes.splice(index, 1);
//   res.status(200).json({ message: "Citatul a fost șters cu succes." });
// });

