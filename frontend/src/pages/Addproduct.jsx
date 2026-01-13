import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api, API_BASE } from "../utils/api";
import MultiSelectDropdown from "../components/MultiSelectDropdown";

/* ================= ADD PRODUCT ================= */
const AddProduct = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const product = location.state?.product;
  
  const mode = location.state?.mode || "edit";
  const isViewMode = mode === "view";

  const token = localStorage.getItem("AUTH_TOKEN");

  const [sku, setSku] = useState("");
  const [variantId, setVariantId] = useState("");
  const [brand, setBrand] = useState("");
  const [productName, setProductName] = useState("");

  const [amount, setAmount] = useState("");
  const [stock, setStock] = useState("");

  const [majorUsp, setMajorUsp] = useState("");
  const [description, setDescription] = useState("");
  

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [checkoutUrl, setCheckoutUrl] = useState("");

  const [productTypes, setProductTypes] = useState([]);
  const [skinTypes, setSkinTypes] = useState([]);
  const [conditions, setConditions] = useState([]);

  const [ageFrom, setAgeFrom] = useState("");
  const [ageTo, setAgeTo] = useState("");

  const [selectedProductTypes, setSelectedProductTypes] = useState([]);
  const [selectedSkinTypes, setSelectedSkinTypes] = useState([]);
  const [selectedConditions, setSelectedConditions] = useState([]);
  const [selectedGender, setSelectedGender] = useState([]);
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
      if (product.image_url?.startsWith("http")) {
        setImageUrlInput(product.image_url);
        setPreview(product.image_url);
    } else {
        const fullUrl = `${API_BASE}${product.image_url}`;
        setImageUrlInput(fullUrl);
        setPreview(fullUrl);
    }
 
      setSelectedProductTypes(product.product_types || []);
      setSelectedSkinTypes(product.skin_types || []);
      setSelectedGender(product.gender || []);
      setSelectedConditions(product.conditions || []);
      setAgeFrom(product.age_from || "");
      setAgeTo(product.age_to || "");
      setCheckoutUrl(product.checkout_url || "");
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
        const cRes = await fetch(`${API_BASE}/skin-conditions`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (ptRes.ok) setProductTypes(await ptRes.json());
        if (stRes.ok) setSkinTypes(await stRes.json());
        if (cRes.ok) setConditions(await cRes.json());
      } catch (err) {
        console.error(err);
        alert("Failed to fetch dropdown options");
      }
    };
    fetchOptions();
  }, [token]);

const handleImageChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  setImage(file);
  setImageUrlInput("");
  setPreview(URL.createObjectURL(file)); 
};


const handleImageUrlChange = (e) => {
  const url = e.target.value;
  setImageUrlInput(url);
  setImage(null);    
  setPreview(null); 
};

const handleCheckoutUrlChange = (e) => {
  const url = e.target.value;
  setCheckoutUrl(url);
}



const uploadImage = async () => {
  // Paste URL
  if (imageUrlInput?.trim()) {
    return imageUrlInput.trim();
  }

  // Upload file
  if (image) {
    const formData = new FormData();
    formData.append("image", image);

    const res = await fetch(`${API_BASE}/upload_image`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const data = await res.json();
    return data.imageUrl;
  }

  return product?.image_url || null;
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
      conditions: selectedConditions,
      image_url: imageUrl,
      product_types: selectedProductTypes,
      skin_types: selectedSkinTypes,
      gender: selectedGender,
      age_from: ageFrom,
      age_to: ageTo,
      checkout_url: checkoutUrl, 
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
            <input className="border p-2 rounded w-full" value={sku} onChange={(e) => setSku(e.target.value)} readOnly={isViewMode} />
          </div>
          <div>
            <label className="block font-medium text-sm mb-1">Variant ID</label>
            <input className="border p-2 rounded w-full" value={variantId} onChange={(e) => setVariantId(e.target.value)} readOnly={isViewMode} />
          </div>
          <div>
            <label className="block font-medium text-sm mb-1">Brand</label>
            <input className="border p-2 rounded w-full" value={brand} onChange={(e) => setBrand(e.target.value)} readOnly={isViewMode} />
          </div>
          <div>
            <label className="block font-medium text-sm mb-1">Product Name</label>
            <input className="border p-2 rounded w-full" value={productName} onChange={(e) => setProductName(e.target.value)} readOnly={isViewMode} />
          </div>
        </div>

        {/* ROW 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium text-sm mb-1">Amount</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className="border p-2 rounded w-full"
              value={amount}
              readOnly={isViewMode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                setAmount(value);
              }}
            />
          </div>

          <div>
            <label className="block font-medium text-sm mb-1">Stock</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className="border p-2 rounded w-full"
              value={stock}
              readOnly={isViewMode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                setStock(value);
              }}
            />
          </div>
        </div>


        {/* ROW 3 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium text-sm mb-1">Major USP</label>
            <textarea className="border p-2 rounded w-full min-h-[120px]" value={majorUsp} onChange={(e) => setMajorUsp(e.target.value)} readOnly={isViewMode} />
          </div>
          <div>
            <label className="block font-medium text-sm mb-1">Description</label>
            <textarea className="border p-2 rounded w-full min-h-[120px]" value={description} onChange={(e) => setDescription(e.target.value)} readOnly={isViewMode} />
          </div>
        </div>

        {/* ROW 4 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block font-medium text-sm mb-1">
              Upload Image or Paste URL
            </label>

            <div className="border border-dashed rounded p-3 space-y-2">

              {/* File Upload */}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={isViewMode}
              />

              <div className="text-center text-xs text-gray-400">OR</div>

              {/* Image URL */}
              <input
                type="text"
                placeholder="Paste image URL"
                value={imageUrlInput}
                onChange={handleImageUrlChange}
                className="w-full border rounded px-2 py-1 text-sm"
                readOnly={isViewMode}
              />

              {/* Preview */}
              {preview && (
                <img
                  src={preview}
                  alt="preview"
                  className="mt-2 h-24 rounded object-cover"
                  onError={() => setPreview(null)}
                />
              )}
            </div>

          </div>

          <MultiSelectDropdown
            label="Product Types"
            options={productTypes}
            selectedOptions={selectedProductTypes}
            setSelectedOptions={setSelectedProductTypes}
            disabled={isViewMode}
          />
          <MultiSelectDropdown
            label="Skin Types"
            options={skinTypes}
            selectedOptions={selectedSkinTypes}
            setSelectedOptions={setSelectedSkinTypes}
            disabled={isViewMode}
          />
        </div>

        {/* ROW 5 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MultiSelectDropdown
            label="Gender"
            options={genderOptions}
            selectedOptions={selectedGender}
            setSelectedOptions={setSelectedGender}
            disabled={isViewMode}
          />

<div>
  <label className="block font-medium text-sm mb-1">Age</label>
  <div className="flex gap-2">
    {/* From Input */}
    <div className="flex flex-col w-1/2">
      <label className="text-xs font-medium mb-1">From</label>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        className="border p-2 rounded w-full"
        value={ageFrom}
        readOnly={isViewMode}
        onChange={(e) => {
          const value = e.target.value.replace(/\D/g, "");
          setAgeFrom(value);
        }}
        onBlur={() => {
          if (ageTo && Number(ageFrom) > Number(ageTo)) {
            alert("Age From cannot be greater than Age To");
            setAgeFrom("");
          }
        }}
      />
    </div>

    {/* To Input */}
    <div className="flex flex-col w-1/2">
      <label className="text-xs font-medium mb-1">To</label>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        className="border p-2 rounded w-full"
        value={ageTo}
        readOnly={isViewMode}
        onChange={(e) => {
          const value = e.target.value.replace(/\D/g, "");
          setAgeTo(value);
        }}
        onBlur={() => {
          if (ageFrom && Number(ageTo) < Number(ageFrom)) {
            alert("Age To cannot be less than Age From");
            setAgeTo("");
          }
        }}
      />
    </div>
  </div>
</div>


         <div>
          <label className="block font-medium text-sm mb-1">Checkout Url</label>
              <input
                type="text"
                placeholder="checkout url"
                value={checkoutUrl}
                onChange={handleCheckoutUrlChange}
                className="w-full border rounded px-2 py-1 text-sm"
                readOnly={isViewMode}
              />
         </div>

        </div>

        {/* ROW 6 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MultiSelectDropdown 
            label="Conditions"
            options={conditions}
            selectedOptions={selectedConditions}
            setSelectedOptions={setSelectedConditions}
            disabled={isViewMode}
          />


          <MultiSelectDropdown
            label="Time / Session"
            options={timeOptions}
            selectedOptions={selectedTime}
            setSelectedOptions={setSelectedTime}
            disabled={isViewMode}
          />
        </div>

        <div className="flex justify-end">
          {isViewMode ? (
            <button
              type="button"
              className="bg-[#00bcd4] text-white px-6 py-2 rounded"
              onClick={() => window.print()}
            >
              Print
            </button>
          ) : (
            <button className="bg-[#00bcd4] text-white px-6 py-2 rounded">
              {product ? "Update Product" : "Add Product"}
            </button>
          )}
        </div>

      </form>
    </div>
  );
};

export default AddProduct;
