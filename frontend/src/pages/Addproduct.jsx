import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api, API_BASE } from "../utils/api";

const Addproduct = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const product = location.state?.product; // product data if editing

  const [productName, setProductName] = useState("");
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [stock, setStock] = useState("");
  const [gst, setGst] = useState("");
  const [routines, setRoutines] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);

  // Pre-fill form when editing
  useEffect(() => {
    if (product) {
      setProductName(product.name || ""); 
      setSku(product.sku || "");
      setDescription(product.description || "");
      setAmount(product.amount || "");
      setStock(product.available_stock || product.stock || "");
      setGst(product.gst || "");
      setRoutines(product.routines || "");
      setPreview(product.image_url ? `${API_BASE}${product.image_url}` : null);
    }
  }, [product]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    if (file) setPreview(URL.createObjectURL(file));
  };

  const uploadImage = async () => {
    if (!image) return product?.image_url || null; // keep old image if editing

    try {
      const formData = new FormData();
      formData.append("image", image);

      const res = await fetch(`${API_BASE}/upload_image`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("Image upload error:", err);
        return null;
      }

      const data = await res.json();
      return data.imageUrl;
    } catch (err) {
      console.error("Image upload failed:", err);
      return null;
    }
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const imageUrl = await uploadImage(); // <-- define it first

    const body = product
      ? {
          // Update product
          name: productName,
          sku,
          description,
          amount,
          available_stock: stock,
          gst,
          routines,
          image_url: imageUrl,
        }
      : {
          // Add product
          user_id: localStorage.getItem("userId"),
          productName: productName,
          sku,
          description,
          amount,
          stock,
          gst,
          routines,
          image_url: imageUrl,
        };

    const endpoint = product ? `/update_product/${product.id}` : "/add_product";
    const method = product ? "PUT" : "POST";

    const res = await api(endpoint, {
      method,
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (res.ok) {

      navigate("/i-beauty/productlist"); 
    } else {
      alert(data.error || "Failed to submit product");
    }
  } catch (err) {
    console.error(err);
    alert("Something went wrong!");
  }
};



  return (
    <div className="bg-white p-6 rounded shadow-md max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">
        {product ? "Edit Product" : "Add Product"}
      </h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* First row */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-gray-700 mb-1">Product Name</label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="w-full border p-2 rounded"
              required
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-gray-700 mb-1">SKU</label>
            <input
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="w-full border p-2 rounded"
              required
            />
          </div>

<div className="flex-1 min-w-[200px]">
  <label className="block text-gray-700 mb-1">Description</label>
  <textarea
    value={description}
    onChange={(e) => setDescription(e.target.value)}
    className="w-full border p-2 rounded"
    rows={4} // you can adjust the number of visible rows
    placeholder="Enter description here"
  />
</div>

        </div>

        {/* Second row */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-gray-700 mb-1">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border p-2 rounded"
              required
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-gray-700 mb-1">Stock</label>
            <input
              type="number"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="w-full border p-2 rounded"
              required
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-gray-700 mb-1">GST (%)</label>
            <input
              type="number"
              value={gst}
              onChange={(e) => setGst(e.target.value)}
              className="w-full border p-2 rounded"
            />
          </div>
        </div>

        {/* Routines */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-gray-700 mb-1">Routines</label>
            <select
              value={routines}
              onChange={(e) => setRoutines(e.target.value)}
              className="w-full border p-2 rounded"
            >
              <option value="">Select Routine</option>
              <option value="Morning">Morning</option>
              <option value="Evening">Evening</option>
            </select>
          </div>
        </div>

        {/* Image Upload */}
        <div className="flex flex-col gap-2">
          <label className="block text-gray-700 mb-1">Upload Product Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="border p-2 rounded w-full max-w-sm"
          />
          {preview && (
            <div className="mt-3">
              <img
                src={preview}
                alt="Preview"
                className="w-32 h-32 object-cover rounded border"
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          className="bg-[#00bcd4] text-white px-4 py-2 rounded hover:bg-[#00a2b2] w-fit"
        >
          {product ? "Update Product" : "Add Product"}
        </button>
      </form>
    </div>
  );
};

export default Addproduct;
