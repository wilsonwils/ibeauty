import React, { useEffect, useState } from "react";
import { API_BASE } from "../utils/api";
import { MODULES, PLAN_SIGNATURES } from "../config/module";

/* ================= PLAN ID MAP (BACKEND → FRONTEND) ================= */
const PLAN_ID_MAP = {
  1: "standard",
  2: "Pro",
  3: "Premium",
};

/* ================= PLANS ================= */
const PLANS = [

  { id: 1, name: "standard", modules: PLAN_SIGNATURES.standard },
  { id: 2, name: "Pro", modules: PLAN_SIGNATURES.Pro },
  { id: 3, name: "Premium", modules: PLAN_SIGNATURES.Premium },
];

const Settings = () => {
  const [currentPlan, setCurrentPlan] = useState("");
  const [loading, setLoading] = useState(true);

  /* ================= FETCH USER PLAN ================= */
  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const token = localStorage.getItem("AUTH_TOKEN");

        const res = await fetch(`${API_BASE}/my-modules`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (data.status === "success") {
          const planName = PLAN_ID_MAP[data.plan_id] || "Custom";
          setCurrentPlan(planName);

          localStorage.setItem("plan_id", data.plan_id);
        }
      } catch (err) {
        console.error("Failed to load plan", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, []);

  /* ================= BUY PLAN ================= */
  const handleBuy = (planName) => {
    alert(`Proceed to buy: ${planName}`);
    // 🔐 Integrate Razorpay / Stripe here
  };

  if (loading) {
    return <div className="p-6">Loading settings...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4">Plan Details</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const isCurrent = plan.name === currentPlan;

          return (
            <div
              key={plan.id}
              className={`border rounded-lg p-4 shadow-sm transition
                ${
                  isCurrent
                    ? "border-green-500 bg-green-50"
                    : "border-gray-300 bg-white"
                }
              `}
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg">{plan.name}</h3>
              </div>

              {/* Modules */}
              <ul className="pl-2 space-y-1 mb-4 text-sm">
                {MODULES.map((moduleName, index) => {
                  const id = index + 1;
                  const included = plan.modules.includes(id);

                  return (
                    <li
                      key={id}
                      className="flex justify-between items-center border-b border-gray-200 py-1"
                    >
                      <span className="flex items-center">
                        <span className="mr-2 text-gray-700 text-xs">✲</span>
                        <span
                          className={
                            included ? "text-black" : "text-gray-500"
                          }
                        >
                          {moduleName}
                        </span>
                      </span>

                      <span
                        className={`font-bold ${
                          included ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {included ? "✔" : "✖"}
                      </span>
                    </li>
                  );
                })}
              </ul>

              {/* Action Button */}
              {isCurrent ? (
                <button
                  disabled
                  className="w-full bg-green-400 text-white py-2 rounded-lg font-semibold cursor-not-allowed"
                >
                  Current Plan
                </button>
              ) : (
                <button
                  onClick={() => handleBuy(plan.name)}
                  className="w-full bg-[#00bcd4] text-white py-2 rounded-lg font-semibold hover:bg-[#00acc1]"
                >
                  Buy Plan
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Settings;