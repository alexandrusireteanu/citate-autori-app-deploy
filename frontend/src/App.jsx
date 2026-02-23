import { useState, useEffect } from "react";
import { Routes, Route, Link } from "react-router-dom";
import QuotesList from "./components/QuotesList";
import AddQuotePage from "./pages/AddQuotePage";
import EditQuotePage from "./pages/EditQuotePage";
import DeleteQuotePage from "./pages/DeleteQuotePage";
import Notification from "./components/Notification";

function App() {
  const [quotes, setQuotes] = useState([]);
  const [notification, setNotification] = useState({ message: "", type: "info" });
  const [darkMode, setDarkMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortOption, setSortOption] = useState("");

  useEffect(() => {
    fetch("http://localhost:5000/api/quotes")
      .then((res) => res.json())
      .then((data) => setQuotes(data))
      .catch((err) => console.error("Error fetching quotes:", err));
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    darkMode ? root.classList.add("dark") : root.classList.remove("dark");
  }, [darkMode]);

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: "", type: "" }), 3000);
  };

  const handleAddQuote = (newQuote) => {
    setQuotes((prevQuotes) => [newQuote, ...prevQuotes]);
  };

  useEffect(() => {
    const url =
      selectedCategory === "all"
        ? "http://localhost:5000/api/quotes"
        : `http://localhost:5000/api/quotes?category=${selectedCategory}`;
  
    fetch(url)
      .then((res) => res.json())
      .then((data) => setQuotes(data))
      .catch((err) => console.error("Error fetching quotes:", err));
  }, [selectedCategory]);
  
  let displayedQuotes = [...quotes];

// Filter
if (selectedCategory !== "all") {
  displayedQuotes = displayedQuotes.filter(
    (q) => q.category === selectedCategory
  );
}

// Sort
if (sortOption === "author") {
  displayedQuotes.sort((a, b) => a.author.localeCompare(b.author));
} else if (sortOption === "category") {
  displayedQuotes.sort((a, b) => a.category.localeCompare(b.category));
}

const getSortedQuotes = () => {
  let filteredQuotes = [...quotes];

  if (sortOption === "author") {
    filteredQuotes.sort((a, b) => a.author.localeCompare(b.author));
  } else if (sortOption === "category") {
    filteredQuotes.sort((a, b) => a.category?.localeCompare(b.category || ""));
  }

  return filteredQuotes;
};


  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <nav className="text-center mb-6">
        <Link to="/" className="text-blue-500 hover:underline mx-4">Home</Link>
        <Link to="/AddQuote" className="text-blue-500 hover:underline mx-4">Add Quote</Link>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="ml-4 px-2 py-1 text-sm rounded bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
        >
          {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="ml-4 px-4 py-2 rounded shadow"
        >
          <option value="all">All Categories</option>
          <option value="wisdom">Wisdom</option>
          <option value="humor">Humor</option>
          <option value="motivation">Motivation</option>
        </select>
        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          className="mb-6 ml-4 px-4 py-2 rounded shadow"
        >
          <option value="">Sort By</option>
          <option value="author">Author Name (A–Z)</option>
          <option value="category">Category (A–Z)</option>
        </select>
      </nav>

      <Notification message={notification.message} type={notification.type} />

      <Routes>
        <Route path="/" element={<QuotesList quotes={getSortedQuotes()} />} />
        <Route path="/AddQuote" element={<AddQuotePage onAddQuote={handleAddQuote} />} />
        <Route path="/edit/:id" element={<EditQuotePage showNotification={showNotification} />} />
        <Route path="/delete/:id" element={<DeleteQuotePage showNotification={showNotification} />} />
      </Routes>
    </div>
  );
}

export default App;





// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import './App.css'

// function App() {
//   const [count, setCount] = useState(0)

//   return (
//     <>
//       <div>
//         <a href="https://vite.dev" target="_blank">
//           <img src={viteLogo} className="logo" alt="Vite logo" />
//         </a>
//         <a href="https://react.dev" target="_blank">
//           <img src={reactLogo} className="logo react" alt="React logo" />
//         </a>
//       </div>
//       <h1>Vite + React</h1>
//       <div className="card">
//         <button onClick={() => setCount((count) => count + 1)}>
//           count is {count}
//         </button>
//         <p>
//           Edit <code>src/App.jsx</code> and save to test HMR
//         </p>
//       </div>
//       <p className="read-the-docs">
//         Click on the Vite and React logos to learn more
//       </p>
//     </>
//   )
// }

// export default App
