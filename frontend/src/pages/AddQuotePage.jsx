import AddQuoteForm from "../components/AddQuoteForm";
import { Link } from "react-router-dom";

const AddQuotePage = ({ onAddQuote }) => {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-center text-blue-600 mb-6">
        Add a New Quote
      </h1>
      <AddQuoteForm onAddQuote={onAddQuote} />
      <div className="text-center mt-4">
        <Link to="/" className="text-blue-500 hover:underline">← Back to Quotes</Link>
      </div>
    </div>
  );
};

export default AddQuotePage;
