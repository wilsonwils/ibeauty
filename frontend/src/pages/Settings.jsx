import React, { useEffect, useState } from "react";
import { API_BASE } from "../utils/api";
import { MODULES, PLAN_SIGNATURES } from "../config/module";

/* ================= PLAN ID MAP ================= */
const PLAN_ID_MAP = {
  0: "trial",
  1: "standard",
  2: "growth",
  3: "pro",
};

/* ================= PLANS ================= */
const PLANS = [
  { id: 0, name: "trial", modules: PLAN_SIGNATURES.trial },
  { id: 1, name: "standard", modules: PLAN_SIGNATURES.standard },
  { id: 2, name: "growth", modules: PLAN_SIGNATURES.growth },
  { id: 3, name: "pro", modules: PLAN_SIGNATURES.pro },
];

const Settings = () => {
  const [currentPlanId, setCurrentPlanId] = useState(null);
  const [trialUsed, setTrialUsed] = useState(false);
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
          /**
           * ✅ FIX:
           * If trial is expired, DO NOT treat it as current plan
           */
          if (data.plan_id === 0 && data.trial_expired) {
            setCurrentPlanId(null); // ❌ no active plan
            setTrialUsed(true);     // 🚫 trial cannot be reused
          } else {
            setCurrentPlanId(data.plan_id); // active plan
            setTrialUsed(data.plan_id !== 0); // paid plan means trial used
          }
        } else {
          setCurrentPlanId(null);
          setTrialUsed(true);
        }
      } catch (err) {
        console.error("Failed to load plan", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, []);

  /* ================= BUY / ACTIVATE PLAN ================= */
  const handleBuy = (plan) => {
    if (plan.id === currentPlanId) return;

    if (plan.id === 0 && trialUsed) {
      alert("Free Trial already used or expired.");
      return;
    }

    alert(`Proceed to buy ${plan.name} plan`);
   
  };

  if (loading) {
    return <div className="p-6">Loading settings...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4">Plan Details</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlanId;
          const isTrial = plan.id === 0;
          const isTrialDisabled = isTrial && trialUsed;

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
              <h3 className="font-semibold text-lg capitalize mb-3">
                {plan.name}
              </h3>

              {/* Modules */}
              <ul className="space-y-1 mb-4 text-sm">
                {MODULES.map((moduleName, index) => {
                  const moduleId = index + 1;
                  const included = plan.modules.includes(moduleId);

                  return (
                    <li
                      key={moduleId}
                      className="flex justify-between border-b py-1"
                    >
                      <span
                        className={
                          included ? "text-black" : "text-gray-500"
                        }
                      >
                        {moduleName}
                      </span>
                      <span
                        className={
                          included ? "text-green-500" : "text-red-500"
                        }
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
                  className="w-full bg-green-500 text-white py-2 rounded-lg font-semibold cursor-not-allowed"
                >
                  Current Plan
                </button>
              ) : (
                <button
                  onClick={() => handleBuy(plan)}
                  disabled={isTrialDisabled}
                  className={`w-full py-2 rounded-lg font-semibold text-white
                    ${
                      isTrial
                        ? "bg-gray-600 hover:bg-gray-700"
                        : "bg-[#00bcd4] hover:bg-[#00acc1]"
                    }
                    ${isTrialDisabled ? "opacity-50 cursor-not-allowed" : ""}
                  `}
                >
                  {isTrialDisabled
                    ? "Trial Used"
                    : isTrial
                    ? "Free Trial"
                    : "Buy Plan"}
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
