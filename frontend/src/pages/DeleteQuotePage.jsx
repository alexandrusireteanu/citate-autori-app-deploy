import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

const DeleteQuotePage = ({ showNotification }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quote, setQuote] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:5000/api/quotes/${id}`)
      .then((res) => res.json())
      .then((data) => setQuote(data))
      .catch((err) => console.error("Error loading quote:", err));
  }, [id]);

  const handleDelete = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/quotes/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        showNotification("Quote deleyed successfully!", "success");
        navigate("/"); // Go back to home after delete
      } else {
        console.error("Delete failed");
      }
    } catch (err) {
      showNotification("Failed to delete quote.", "error");
      console.error("Error:", err);
    }
  };

  if (!quote) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-lg mx-auto bg-white p-6 rounded-xl shadow-md text-center">
        <h2 className="text-xl font-semibold text-red-600 mb-4">Delete Quote</h2>
        <p className="text-gray-800 mb-2">"{quote.quote}"</p>
        <p className="text-gray-600 mb-4">— {quote.author}</p>

        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={handleDelete}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
          >
            Delete
          </button>
          <Link
            to="/"
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DeleteQuotePage;
