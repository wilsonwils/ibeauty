import React from "react";
import { useParams } from "react-router-dom";

const Product = () => {
  const { name } = useParams();

  return (
    <div className="p-6 left-0 max-w-[1400px] w-full bg-white rounded-lg mx-auto px-6">
      <h1 className="text-4xl font-bold mb-6">Welcome to: {name}</h1>

      
        <p className="text-lg text-gray-700">
          This is your product page for: <strong>{name}</strong>
        </p>
      </div>

  );
};

export default Product;
