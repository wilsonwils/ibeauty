import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api, API_BASE } from "../utils/api";

/* ================= MULTI SELECT DROPDOWN ================= */
const MultiSelectDropdown = ({ options, selectedOptions, setSelectedOptions, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (option) => {
    setSelectedOptions(
      selectedOptions.includes(option)
        ? selectedOptions.filter((o) => o !== option)
        : [...selectedOptions, option]
    );
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <div
        className="border border-gray-300 rounded px-3 py-2 min-h-[42px] cursor-pointer flex justify-between items-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-sm truncate">
          {selectedOptions.length ? selectedOptions.join(", ") : "Select"}
        </span>
        <svg
          className={`w-4 h-4 transition ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {isOpen && (
        <div className="absolute z-20 w-full bg-white border rounded mt-1 max-h-56 overflow-auto shadow">
          {options.map((option) => (
            <label
              key={option}
              className="flex items-center px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
            >
              <input
                type="checkbox"
                className="mr-2"
                checked={selectedOptions.includes(option)}
                onChange={() => toggleOption(option)}
              />
              {option}
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

/* ================= ADD PRODUCT ================= */
const AddProduct = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const product = location.state?.product;

  const token = localStorage.getItem("AUTH_TOKEN");

  const [sku, setSku] = useState("");
  const [variantId, setVariantId] = useState("");
  const [brand, setBrand] = useState("");
  const [productName, setProductName] = useState("");

  const [amount, setAmount] = useState("");
  const [stock, setStock] = useState("");

  const [majorUsp, setMajorUsp] = useState("");
  const [description, setDescription] = useState("");
  const [concerns, setConcerns] = useState("");

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);

  const [productTypes, setProductTypes] = useState([]);
  const [skinTypes, setSkinTypes] = useState([]);

  const [selectedProductTypes, setSelectedProductTypes] = useState([]);
  const [selectedSkinTypes, setSelectedSkinTypes] = useState([]);
  const [selectedGender, setSelectedGender] = useState([]);
  const [selectedAge, setSelectedAge] = useState("");
  const [selectedTime, setSelectedTime] = useState([]);

  const genderOptions = ["Male", "Female", "Transgender"];
  const timeOptions = ["AM", "PM"];

  /* ===== PREFILL EDIT ===== */
  useEffect(() => {
    if (product) {
      setSku(product.sku || "");
      setVariantId(product.variant_id || "");
      setBrand(product.brand || "");
      setProductName(product.name || "");
      setAmount(product.amount || "");
      setStock(product.stock || "");
      setMajorUsp(product.major_usp || "");
      setDescription(product.description || "");
      setConcerns(product.concerns || "");
      setPreview(product.image_url ? `${API_BASE}${product.image_url}` : null);

      setSelectedProductTypes(product.product_types || []);
      setSelectedSkinTypes(product.skin_types || []);
      setSelectedGender(product.gender || []);
      setSelectedAge(product.age || "");
      setSelectedTime(product.time_session || []);
    }
  }, [product]);

  /* ===== FETCH DROPDOWNS ===== */
  useEffect(() => {
    const fetchOptions = async () => {
      if (!token) return alert("Authorization token missing!");
      try {
        const ptRes = await fetch(`${API_BASE}/product_types`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const stRes = await fetch(`${API_BASE}/skin_types`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (ptRes.ok) setProductTypes(await ptRes.json());
        if (stRes.ok) setSkinTypes(await stRes.json());
      } catch (err) {
        console.error(err);
        alert("Failed to fetch dropdown options");
      }
    };
    fetchOptions();
  }, [token]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    if (file) setPreview(URL.createObjectURL(file));
  };

  const uploadImage = async () => {
    if (!image) return product?.image_url || null;
    const formData = new FormData();
    formData.append("image", image);
    const res = await fetch(`${API_BASE}/upload_image`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json();
    return data.imageUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return alert("Authorization token missing!");

    const imageUrl = await uploadImage();

    const body = {
      sku,
      variant_id: variantId,
      brand,
      name: productName,
      amount,
      stock,
      major_usp: majorUsp,
      description,
      concerns,
      image_url: imageUrl,
      product_types: selectedProductTypes,
      skin_types: selectedSkinTypes,
      gender: selectedGender,
      age: selectedAge,
      time_session: selectedTime,
      user_id: localStorage.getItem("userId"),
    };

    const endpoint = product
      ? `${API_BASE}/update_product/${product.id}`
      : `${API_BASE}/add_product`;

    const method = product ? "PUT" : "POST";

    try {
      const res = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit product");

      alert("Product saved successfully!");
      navigate("/i-beauty/productlist");
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  return (
    <div className="bg-white p-6 rounded shadow max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">
        {product ? "Edit Product" : "Add Product"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ROW 1 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">SKU</label>
            <input className="border p-2 rounded w-full" value={sku} onChange={(e) => setSku(e.target.value)} />
          </div>
          <div>
            <label className="block font-medium text-sm mb-1">Variant ID</label>
            <input className="border p-2 rounded w-full" value={variantId} onChange={(e) => setVariantId(e.target.value)} />
          </div>
          <div>
            <label className="block font-medium text-sm mb-1">Brand</label>
            <input className="border p-2 rounded w-full" value={brand} onChange={(e) => setBrand(e.target.value)} />
          </div>
          <div>
            <label className="block font-medium text-sm mb-1">Product Name</label>
            <input className="border p-2 rounded w-full" value={productName} onChange={(e) => setProductName(e.target.value)} />
          </div>
        </div>

        {/* ROW 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium text-sm mb-1">Amount</label>
            <input className="border p-2 rounded w-full" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <label className="block font-medium text-sm mb-1">Stock</label>
            <input className="border p-2 rounded w-full" value={stock} onChange={(e) => setStock(e.target.value)} />
          </div>
        </div>

        {/* ROW 3 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium text-sm mb-1">Major USP</label>
            <textarea className="border p-2 rounded w-full min-h-[120px]" value={majorUsp} onChange={(e) => setMajorUsp(e.target.value)} />
          </div>
          <div>
            <label className="block font-medium text-sm mb-1">Description</label>
            <textarea className="border p-2 rounded w-full min-h-[120px]" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>

        {/* ROW 4 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block font-medium text-sm mb-1">Upload Image</label>
            <div className="border border-dashed rounded p-3">
              <input type="file" onChange={handleImageChange} />
              {preview && <img src={preview} alt="preview" className="mt-2 h-24 rounded object-cover" />}
            </div>
          </div>

          <MultiSelectDropdown
            label="Product Types"
            options={productTypes}
            selectedOptions={selectedProductTypes}
            setSelectedOptions={setSelectedProductTypes}
          />
          <MultiSelectDropdown
            label="Skin Types"
            options={skinTypes}
            selectedOptions={selectedSkinTypes}
            setSelectedOptions={setSelectedSkinTypes}
          />
        </div>

        {/* ROW 5 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MultiSelectDropdown
            label="Gender"
            options={genderOptions}
            selectedOptions={selectedGender}
            setSelectedOptions={setSelectedGender}
          />
          <div>
            <label className="block font-medium text-sm mb-1">Age</label>
            <input className="border p-2 rounded w-full" value={selectedAge} onChange={(e) => setSelectedAge(e.target.value)} />
          </div>
        </div>

        {/* ROW 6 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium text-sm mb-1">Concerns</label>
            <textarea className="border p-4 rounded w-full min-h-[120px]" value={concerns} onChange={(e) => setConcerns(e.target.value)} />
          </div>

          <MultiSelectDropdown
            label="Time / Session"
            options={timeOptions}
            selectedOptions={selectedTime}
            setSelectedOptions={setSelectedTime}
          />
        </div>

        <div className="flex justify-end">
          <button className="bg-[#00bcd4] text-white px-6 py-2 rounded">
            {product ? "Update Product" : "Add Product"}
          </button>
        </div>

      </form>
    </div>
  );
};

export default AddProduct;
