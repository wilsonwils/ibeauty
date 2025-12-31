import React, { useEffect, useState } from "react";
import { FiEdit, FiTrash2, FiLink2, FiPlus, FiFilter } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { api, API_BASE } from "../utils/api";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import Pagination from "../components/Pagination";
import { useTrial } from "../context/TrialContext";

const ProductList = () => {
  const navigate = useNavigate();
  const { trialExpired, setShowPopup } = useTrial();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const handleAddProduct = () => {
    navigate("/i-beauty/add-product");
  };

  const handleEdit = (product) => {
    navigate("/i-beauty/add-product", { state: { product } });
  };

  // OPEN DELETE SINGLE
const openDeletePopup = (productId) => {
  if (trialExpired) {
    setShowPopup(true);
    return;
  }

  setIsBulkDelete(false);
  setSelectedProductId(productId);
  setShowDeleteModal(true);
};


  // CONFIRM DELETE (single + bulk)
const confirmDelete = async () => {
  if (trialExpired) {
    setShowPopup(true);
    setShowDeleteModal(false);
    return;
  }

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

  // Export Excel
  const exportToExcel = () => {
  if (trialExpired) {
    setShowPopup(true);
    return;
  }
    const excelData = products.map((p, index) => ({
      "S.No": index + 1,
      SKU: p.sku,
      "Product Name": p.productName || p.name,
      Amount: p.amount,
      GST: p.gst + "%",
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
  // ✅ First, check trial expired
  if (trialExpired) {
    setShowPopup(true);
    return;
  }

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

      {/* WARNING MESSAGE */}
      {warning && (
        <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 border border-yellow-300 rounded">
          {warning}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Product List</h2>

        <div className="flex items-center gap-3">
          
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
              <th className="p-3 text-left">GST</th>
              <th className="p-3 text-left">Stock</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-center">Embedded URL</th>
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
                        src={`${API_BASE}${p.image_url}`}
                        className="w-12 h-12 rounded object-cover"
                        alt={p.name || p.productName}
                      />
                    )}
                    <span>{p.productName || p.name}</span>
                  </td>

                  <td className="p-3">{p.amount}</td>
                  <td className="p-3">{p.gst}%</td>
                  <td className="p-3">{p.available_stock || p.stock}</td>

                  <td className="p-3 text-green-600">
                    {p.is_active ? "Active" : "Inactive"}
                  </td>

                  <td className="p-3 text-center">
                    <button className="text-[#00bcd4]">
                      <FiLink2 size={18} />
                    </button>
                  </td>

                  <td className="p-3 text-center flex justify-center gap-2">
                    <button
                      className="text-[#00bcd4] hover:text-[#008b9c]"
                      onClick={() => trialGuard(() => handleEdit(p))}
                    >
                      <FiEdit size={18} />
                    </button>
                    <button
                      className="text-red-500 hover:text-red-700"
                      onClick={() => openDeletePopup(p.id)} // NO trialGuard wrapper
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
