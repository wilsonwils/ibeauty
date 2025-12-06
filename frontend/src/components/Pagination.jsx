import React from "react";

const Pagination = ({ currentPage, totalPages, onPageChange, itemsPerPage, onItemsPerPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-between items-center mt-4 px-3 py-2">
      <select
        className="p-2 rounded-md bg-gray-100"
        value={itemsPerPage}
        onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
      >
        {[10, 20, 30].map((num) => (
          <option key={num} value={num}>
            {num} per page
          </option>
        ))}
      </select>

      <div className="flex gap-2">
        <button
          className="px-3 py-1 text-white bg-[#00bcd4] rounded transition disabled:opacity-50"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
          <button
            key={num}
            className={`px-3 py-1 rounded transition ${
              num === currentPage
                ? "bg-[#00bcd4] text-white"
                : "border hover:bg-gray-100"
            }`}
            onClick={() => onPageChange(num)}
          >
            {num}
          </button>
        ))}

        <button
          className="px-3 py-1 text-white bg-[#00bcd4] rounded transition disabled:opacity-50"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;
