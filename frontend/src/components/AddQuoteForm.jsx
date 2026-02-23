import { useState } from "react";

const AddQuoteForm = ({ onAddQuote }) => {
  const [quote, setQuote] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("wisdom");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!quote.trim() || !author.trim()) return;

    const newQuote = { quote, author, category };

    try {
      const response = await fetch("http://localhost:5000/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newQuote),
      });

      if (response.ok) {
        const savedQuote = await response.json();
        onAddQuote(savedQuote);
        setQuote("");
        setAuthor("");
        setCategory("wisdom");
      }
    } catch (error) {
      console.error("Error adding quote:", error);
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-gray-100 p-6 rounded-xl shadow-md transition-all duration-300 hover:shadow-lg">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">Add a New Quote</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Quote Input */}
        <textarea
          className="w-full p-3 rounded-md border border-gray-300 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all duration-200"
          rows="4"
          placeholder="Enter quote..."
          value={quote}
          onChange={(e) => setQuote(e.target.value)}
        ></textarea>

        {/* Author Input */}
        <input
          type="text"
          className="w-full p-3 rounded-md border border-gray-300 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all duration-200"
          placeholder="Author name..."
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        />

        {/* Category Selector */}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full p-3 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all duration-200"
        >
          <option value="wisdom">Wisdom</option>
          <option value="humor">Humor</option>
          <option value="motivation">Motivation</option>
        </select>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-gray-600 text-white py-3 rounded-md shadow-md hover:bg-gray-700 transition-all duration-200"
        >
          Add Quote
        </button>
      </form>
    </div>
  );
};

export default AddQuoteForm;
