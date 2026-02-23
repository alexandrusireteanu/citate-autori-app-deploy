import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchAuthorImage } from "../utils/fetchAuthorImage"; // Helper function
import { getShareUrls } from "../utils/shareQuote";

const QuotesList = ({ quotes }) => { // primim citatele ca props; quotes prop este trimis din componenta parinte (App.jsx) si conține o serie de obiecte citate, fiecare cu id, citat și autor.
  const [authorImages, setAuthorImages] = useState({});

  useEffect(() => {
    const loadImages = async () => {
      const images = {};
      for (const quote of quotes) {
        if (!authorImages[quote.author]) {
          const img = await fetchAuthorImage(quote.author);
          images[quote.author] = img;
        }
      }
      setAuthorImages(images);
    };

    loadImages();
  }, [quotes]);

  return (
    <div className="w-full p-4">
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {quotes.map((quote) => ( // map() parcurge matricea de citate și creează elemente <li>. key={quote.id} ne asigură că React actualizează eficient lista.
          <li key={quote.id} className="p-4 border rounded-lg shadow bg-white dark:bg-gray-800 dark:border-gray-700 flex flex-col justify-between">
            {authorImages[quote.author] ? (
              <img
                src={authorImages[quote.author]}
                alt={quote.author}
                className="w-24 h-24 rounded-full object-cover mx-auto mb-4"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200 mx-auto mb-4"></div> // Placeholder if no image
            )}
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{quote.quote}</p>
              <span className="text-gray-600 dark:text-gray-400">- {quote.author}</span>
            </div>
            <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
            <Link
              to={`/edit/${quote.id}`}
              className="transition-transform duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg"
            >
              ✏️ Edit
            </Link>

            <Link
              to={`/delete/${quote.id}`}
              className="transition-transform duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg"
            >
              🗑️ Delete
            </Link>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`"${quote.quote}" — ${quote.author}`);
                if (typeof showNotification === "function") {
                  showNotification("Quote copied to clipboard!", "info");
                }
              }}
              className="hover:underline text-blue-500"
            >
              📋 Copy
            </button>
          </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default QuotesList;

