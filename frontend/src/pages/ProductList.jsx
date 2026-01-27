import React, { useEffect, useState, useRef } from "react";
import { FiEdit, FiTrash2, FiPlus, FiFilter, FiEye } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { api, API_BASE } from "../utils/api";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import Pagination from "../components/Pagination";
import { useTrial } from "../context/TrialContext";
import TrialPopup from "../components/TrialPopup";

const ProductList = () => {
  const navigate = useNavigate();
  const { trialExpired } = useTrial();
  const [showPopup, setShowPopup] = useState(false);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [primaryProductId, setPrimaryProductId] = useState(null);
  const [showPrimaryModal, setShowPrimaryModal] = useState(false);
  const [pendingPrimaryId, setPendingPrimaryId] = useState(null);



  // Checkbox
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Delete popup
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);

  // Bulk delete flag
  const [isBulkDelete, setIsBulkDelete] = useState(false);

  // Soft warning
  const [warning, setWarning] = useState("");

  const fileInputRef = useRef(null);

const confirmPrimaryChange = async () => {
  if (!pendingPrimaryId) return;

  await setPrimaryProduct(pendingPrimaryId);

  setPendingPrimaryId(null);
  setShowPrimaryModal(false);
};
const cancelPrimaryChange = () => {
  setPendingPrimaryId(null);
  setShowPrimaryModal(false);
};



const getPrimaryPopupMessage = () => {
  if (!primaryProductId) {
    return "Are you sure you want to make this the primary product?";
  }

  if (primaryProductId === pendingPrimaryId) {
    return "Are you sure you want to remove the primary product?";
  }

  return "Are you sure you want to change the primary product?";
};

const setPrimaryProduct = async (productId) => {
  try {
    const res = await api("/set_primary", {
      method: "POST",
      body: JSON.stringify({ product_id: productId }),
    });

    if (res.ok) {
      alert(res.message || "Primary product updated");
      fetchProducts(); // reload product list
    } else {
      alert(res.error || "Failed to set primary product");
    }
  } catch (err) {
    console.error("Failed to set primary product", err);
    alert("primary product set failed.");
  }
};


const trialGuard = (action) => {
  if (trialExpired) {
    setShowPopup(true);
    return;
  }
  action();
};


  // Fetch products
const fetchProducts = async () => {
  try {
    const userId = localStorage.getItem("userId");
    console.log("userId", userId);

    if (!userId) throw new Error("User ID not found");

    // Call the API
    const res = await api(`/get_products?user_id=${userId}`);

    // Parse the response JSON
    const data = await res.json();

    if (res.ok) {
      setProducts(data.products || []);
    } else {
      console.error("API error:", data.error || data.message);
      setProducts([]);
    }
  } catch (err) {
    console.error("Failed to fetch products:", err);
    setProducts([]);
  } finally {
    setLoading(false);
  }
};



  useEffect(() => {
    fetchProducts();
  }, []);
  
    const handleUploadClick = () => {
    fileInputRef.current.click(); // trigger hidden file input
  };
  

  const handleAddProduct = () => {
    navigate("/i-beauty/add-product");
  };

  const handleEdit = (product) => {
    navigate("/i-beauty/add-product", { state: { product, mode: "edit" } });
  };

  const handleView = (product) => {
    navigate("/i-beauty/add-product", { state: { product, mode: "view" } });
  };

  // OPEN DELETE SINGLE
const openDeletePopup = (productId) => {
  setIsBulkDelete(false);
  setSelectedProductId(productId);
  setShowDeleteModal(true);
};


  // CONFIRM DELETE (single + bulk)
const confirmDelete = async () => {


  // BULK DELETE
  if (isBulkDelete) {
    try {
      for (const id of selectedIds) {
        await api(`/delete_product/${id}`, { method: "DELETE" });
      }
      setProducts(products.filter((p) => !selectedIds.includes(p.id)));
      setSelectedIds([]);
      setSelectAll(false);
    } catch (err) {
      console.error(err);
      setWarning("Bulk delete failed!");
      setTimeout(() => setWarning(""), 3000);
    }
    setIsBulkDelete(false);
    setShowDeleteModal(false);
    return;
  }

  // SINGLE DELETE
  if (!selectedProductId) return;

  try {
    const res = await api(`/delete_product/${selectedProductId}`, {
      method: "DELETE",
    });
    const data = await res.json();

    if (res.ok) {
      setProducts(products.filter((p) => p.id !== selectedProductId));
    } else {
      setWarning(data.error || "Delete failed!");
      setTimeout(() => setWarning(""), 3000);
    }
  } catch (err) {
    console.error(err);
    setWarning("Something went wrong!");
    setTimeout(() => setWarning(""), 3000);
  }

  setSelectedProductId(null);
  setShowDeleteModal(false);
};

  // FILTER PRODUCTS
  const filteredProducts = products.filter((p) =>
    (p.productName || p.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);


const downloadTemplate = async () => {


  try {
    //  Fetch DB values
    const [ptRes, stRes, scRes] = await Promise.all([
      api("/product_types"),
      api("/skin_types"),
      api("/skin-conditions"),
    ]);

    const productTypes = await ptRes.json(); 
    const skinTypes = await stRes.json();
    const skinConditions = await scRes.json();     

    // ================= INSTRUCTION ROW =================
    const instructionRow = [
      {
        sku: "",
        product_name: "",
        variant_id: "",
        brand: "",
        amount: "",
        stock: "",
        major_usp: "",
        description: "",
        image_url: "",
        conditions: `(${skinConditions.join(",")})`,
        product_types: `(${productTypes.join(",")})`,
        skin_types: `(${skinTypes.join(",")})`,
        gender: "(Male,Female,Transgender)",
        age: "",
        checkout_url: "",
        time_session: "(AM,PM)",
      },
    ];

    // ================= PRODUCT ROWS =================
    // const productRows = products.map((p) => ({
    //   sku: p.sku || "",
    //   product_name: p.productName || p.name || "",
    //   variant_id: "",
    //   brand: "",
    //   amount: "",
    //   stock: "",
    //   major_usp: "",
    //   description: "",
    //   conditions: "",
    //   product_types: "",
    //   skin_types: "",
    //   image_url: "",
    //   gender: "",
    //   age: "",
    //   time_session: "",
    // }));

    const sheetData = [...instructionRow];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(sheetData),
      "Bulk Template"
    );

    const excelBuffer = XLSX.write(wb, {
      bookType: "xlsx",
      type: "array",
    });

    saveAs(
      new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      "product_bulk_template.xlsx"
    );
  } catch (err) {
    console.error("Template download failed", err);
  }
};


const uploadExcel = async (e) => {


  const file = e.target.files[0];
  if (!file) return;

  try {
    //  Read Excel file
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet);

    //  Map Excel headers to backend keys (matches template)
    const productsPayload = jsonData.map((row) => ({
      name: row["product_name"] || "",
      sku: row["sku"] || "",
      variant_id: row["variant_id"] || "",
      brand: row["brand"] || "",
      description: row["description"] || "",
      image_url: row["image_url"] || "",
      amount: row["amount"] || null,
      stock: row["stock"] || null,
      gst: row["gst"] || null,
      major_usp: row["major_usp"] || "",
      conditions: row["skin-conditions"] ? row["skin-conditions"].split(",") : [],
      product_types: row["product_types"] ? row["product_types"].split(",") : [],
      skin_types: row["skin_types"] ? row["skin_types"].split(",") : [],
      gender: row["gender"] ? row["gender"].split(",") : [],
      age: row["age"] || null,
      time_session: row["time_session"] ? row["time_session"].split(",") : [],
    }));

    const res = await api("/bulk-upload-products", {
      method: "POST",
      body: JSON.stringify({ products: productsPayload }),
    });


    const resultData = await res.json();

    if (res.ok) {
      alert("Bulk upload successfully");
      fetchProducts(); // Refresh product list
    } else {
      alert(resultData.error || "Bulk upload failed");
    }
  } catch (err) {
    console.error("Bulk upload failed:", err);
    alert("Bulk upload failed, check console for details.");
  }
};



  // Export Excel
  const exportToExcel = () => {

    const excelData = products.map((p, index) => ({
      "S.No": index + 1,
      SKU: p.sku,
      "Product Name": p.productName || p.name,
      Amount: p.amount,
      // GST: p.gst + "%",
      Stock: p.available_stock || p.stock,
      Status: p.is_active ? "Active" : "Inactive",
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, "product_list.xlsx");
  };

  // Print
  const handlePrint = () => {
    const printContents = document.getElementById("printable-product-list").innerHTML;
    const newWindow = window.open("", "_blank");
    newWindow.document.write(`
      <html>
        <head>
          <title>Product List</title>
          <style>
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; }
            th { background-color: #f3f3f3; }
            img { width: 50px; height: 50px; object-fit: cover; }
          </style>
        </head>
        <body>${printContents}</body>
      </html>
    `);
    newWindow.document.close();
    newWindow.print();
    newWindow.close();
  };

  // SELECT ALL
  const handleSelectAll = () => {
    const newState = !selectAll;
    setSelectAll(newState);
    setSelectedIds(newState ? currentProducts.map((p) => p.id) : []);
  };

  // SINGLE SELECT
  const toggleSelect = (id) => {
    let updated = [...selectedIds];
    if (updated.includes(id)) {
      updated = updated.filter((x) => x !== id);
    } else {
      updated.push(id);
    }
    setSelectedIds(updated);
    setSelectAll(updated.length === currentProducts.length);
  };

 
const deleteSelected = () => {


  // Only runs if trial is active
  if (selectedIds.length === 0) {
    setWarning("Please select at least one product.");
    setTimeout(() => setWarning(""), 2500);
    return;
  }

  setIsBulkDelete(true);
  setShowDeleteModal(true);
};



  if (loading) return <p className="text-center mt-10">Loading products...</p>;

  return (
    <div className="p-6 max-w-[1400px] w-full bg-white rounded-lg mx-auto">

    {/* Trial popup – mounted once */}
    <TrialPopup
      show={showPopup}
      onClose={() => setShowPopup(false)}
    />
    {/* Warning message */}
    {warning && (
      <div className="mb-4 text-red-600 font-semibold text-center">
        {warning}
      </div>
    )}


      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Product List</h2>

        <div className="flex items-center gap-1">

          <button
            onClick={() => trialGuard(downloadTemplate)}
            className="border px-4 py-2 rounded-md hover:bg-gray-100"
          >
            Download Template
          </button>


              <>
                <button
                  onClick={ () => trialGuard(handleUploadClick)}
                  className="border px-4 py-2 rounded-md hover:bg-gray-100"
                >
                  Upload Excel
                </button>

                <input
                  type="file"
                  accept=".xlsx,.xls"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={uploadExcel}
                />
              </>

          
          {/* DELETE ALL BUTTON */}
          <button
             onClick={() => trialGuard(deleteSelected)}
            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
          >
            Delete All Selected
          </button>

          <button
             onClick={() => trialGuard(handleAddProduct)}
            className="bg-[#00bcd4] text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-[#00a2b2]"
          >
            <FiPlus /> Add product
          </button>

          <button
            className="border px-4 py-2 rounded-md flex items-center gap-2 hover:bg-gray-100"
            onClick={() => trialGuard(() => setShowFilters(!showFilters))}
          >
            <FiFilter /> Filter
          </button>

          <button
            className="border px-4 py-2 rounded-md hover:bg-gray-100"
            onClick={() => trialGuard(exportToExcel)}
          >
            Export Data
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="p-4 mb-4 border rounded-lg shadow bg-gray-50">
          <div className="flex items-center gap-4">
            <input
              type="text"
              className="border p-2 rounded w-64"
              placeholder="Search by product name..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />

            <button
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              onClick={handlePrint}
            >
              Print Data
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div id="printable-product-list" className="shadow overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="text-gray-500 border-b">
              <th className="p-3 text-center">
                <input
                  type="checkbox"
                  className="accent-[#00bcd4]"
                  checked={selectAll}
                  onChange={handleSelectAll}
                />
                Select All
              </th>
              <th className="p-3 text-left">SKU ID</th>
              <th className="p-3 text-left">Thumbnail / Product Name</th>
              <th className="p-3 text-left">Amount</th>
              {/* <th className="p-3 text-left">GST</th> */}
              <th className="p-3 text-left">Stock</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-center">Primary Product</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>
 
          <tbody>
            {currentProducts.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center p-4 text-gray-500">
                  No products found
                </td>
              </tr>
            ) : (
              currentProducts.map((p, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="p-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(p.id)}
                      onChange={() => toggleSelect(p.id)}
                    />
                  </td>

                  <td className="p-3">{p.sku}</td>
                    <td className="p-3 flex items-center gap-3">
                      {p.image_url && (
                        <img
                          src={
                            p.image_url.startsWith("http")
                              ? p.image_url                     // Bulk upload URL
                              : `${API_BASE}${p.image_url}`     // Manual upload
                          }
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded object-cover"
                          alt={p.name || p.productName}
                          onError={(e) => {
                            e.target.src = "/no-image.png";
                          }}
                        />
                      )}
                      <span>{p.productName || p.name}</span>
                    </td>


                  <td className="p-3">{p.amount}</td>
                  {/* <td className="p-3">{p.gst}%</td> */}
                  <td className="p-3">{p.available_stock || p.stock}</td>

                  <td className="p-3 text-green-600">
                    {p.is_active ? "Active" : "Inactive"}
                  </td>

               <td className="p-3 text-center">
                <input
                  type="checkbox"
                  className="h-5 w-5 text-[#00bcd4]"
                  checked={p.is_primary}
                  onChange={() => {
                    if (p.is_primary) return;

                    setPendingPrimaryId(p.id);
                    setShowPrimaryModal(true);
                  }}
                />


              </td>
                  {showPrimaryModal && (
                    <div className="fixed top-10 left-1/2 -translate-x-1/2 z-50">
                      <div className="bg-white border shadow-md rounded-md px-6 py-4 flex items-center gap-4">
                        <span className="text-sm font-medium text-gray-800">
                          {getPrimaryPopupMessage()}
                        </span>

                        <button
                          className="px-3 py-1 text-sm bg-[#00bcd4] text-white rounded hover:bg-[#008b9c]"
                          onClick={confirmPrimaryChange}
                        >
                          Yes
                        </button>

                        <button
                          className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
                          onClick={cancelPrimaryChange}
                        >
                          No
                        </button>
                      </div>
                    </div>
                  )}

                  <td className="p-3 text-center flex justify-center gap-2">
                    <button 
                      className="text-gray-500 hover:text-gray-700"
                      onClick={() => trialGuard(() => handleView(p))}
                    >
                      <FiEye />
                    </button>
                    <button
                      className="text-[#00bcd4] hover:text-[#008b9c]"
                      onClick={() => trialGuard(() => handleEdit(p))}
                    >
                      <FiEdit size={18} />
                    </button>
                    <button
                      className="text-red-500 hover:text-red-700"
                      onClick={() => trialGuard(() => openDeletePopup(p.id))} 
                    >
                      <FiTrash2 size={18} />
                    </button>

                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={(num) => {
            setItemsPerPage(num);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-xl z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-80 text-center">
            <h3 className="text-lg font-semibold mb-4">
              {isBulkDelete
                ? "Are you sure you want to delete all selected products?"
                : "Are you sure you want to delete this?"}
            </h3>

            <div className="flex justify-center gap-4">
              <button
                className="px-4 py-2 bg-[#00bcd4] text-white rounded hover:bg-[#008b9c]"
                onClick={confirmDelete}
              >
                Yes
              </button>

              <button
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                onClick={() => {
                  setIsBulkDelete(false);
                  setShowDeleteModal(false);
                }}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProductList;
