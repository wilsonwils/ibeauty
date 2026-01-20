import React, { useEffect, useState } from "react";
import { API_BASE } from "../utils/api";

const Settings = () => {
  const [modules, setModules] = useState([]);
  const [plans, setPlans] = useState([]);
  const [currentPlanId, setCurrentPlanId] = useState(null);
  const [trialUsed, setTrialUsed] = useState(false);
  const [loading, setLoading] = useState(true);

  /* ================= FETCH ALL MODULES ================= */
  const fetchModules = async () => {
    const token = localStorage.getItem("AUTH_TOKEN");
    const res = await fetch(`${API_BASE}/all-modules`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    setModules(data.modules || []); // [{id,name}]
  };

  /* ================= FETCH PLAN SIGNATURES ================= */
  const fetchPlans = async () => {
    const token = localStorage.getItem("AUTH_TOKEN");
    const res = await fetch(`${API_BASE}/plan-signatures`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    setPlans(data.plans || []); // [{id, plan_name, module_ids}]
  };

  /* ================= FETCH USER CURRENT PLAN ================= */
  const fetchUserPlan = async () => {
    try {
      const token = localStorage.getItem("AUTH_TOKEN");

      const res = await fetch(`${API_BASE}/my-modules`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (data.status === "success") {
        if (data.plan_id === 0 && data.trial_expired) {
          setCurrentPlanId(null);
          setTrialUsed(true);
        } else {
          setCurrentPlanId(data.plan_id);
          setTrialUsed(data.plan_id !== 0);
        }
      } else {
        setCurrentPlanId(null);
        setTrialUsed(true);
      }
    } catch (err) {
      console.error("Failed to load plan", err);
    }
  };

  /* ================= LOAD DATA ONCE ================= */
  useEffect(() => {
    async function load() {
      await fetchModules();
      await fetchPlans();
      await fetchUserPlan();
      setLoading(false);
    }
    load();
  }, []);

  /* ================= PLAN BUTTON ACTION ================= */
  const handleBuy = (plan) => {
    if (plan.id === currentPlanId) return;

    if (plan.id === 0 && trialUsed) {
      alert("Free Trial already used or expired.");
      return;
    }

    alert("contact this number 9897876578");
  };

  if (loading) return <div className="p-6">Loading settings...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4">Plan Details</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlanId;
          const isTrial = plan.id === 0;

          const isTrialDisabled = isTrial && trialUsed;
          const isPreviousPlan =
            currentPlanId !== null && plan.id < currentPlanId;

          const disabled = isCurrent || isTrialDisabled || isPreviousPlan;

          return (
            <div
              key={plan.id}
              className={`border rounded-lg p-4 shadow-sm transition
                ${isCurrent ? "border-green-500 bg-green-50" : "bg-white"}`}
            >
              <h3 className="font-semibold text-lg capitalize mb-3">
                {plan.plan_name}
              </h3>

              {/* MODULE LIST */}
              <ul className="space-y-1 mb-4 text-sm">
                {modules.map((mod) => {
                  const included = plan.module_ids.includes(mod.id);
                  return (
                    <li
                      key={mod.id}
                      className="flex justify-between border-b py-1"
                    >
                      <span
                        className={included ? "text-black" : "text-gray-500"}
                      >
                        {mod.name}
                      </span>
                      <span
                        className={included ? "text-green-500" : "text-red-500"}
                      >
                        {included ? "✔" : "✖"}
                      </span>
                    </li>
                  );
                })}
              </ul>

              <button
                onClick={() => !disabled && handleBuy(plan)}
                disabled={disabled}
                className={`w-full py-2 rounded-lg font-semibold text-white
                  ${isCurrent ? "bg-green-500" : "bg-[#00bcd4] hover:bg-[#00acc1]"}
                  ${disabled && !isCurrent ? "opacity-50 cursor-not-allowed" : ""}
                `}
              >
                {isCurrent
                  ? "Current Plan"
                  : isTrialDisabled
                  ? "Trial Used"
                  : isPreviousPlan
                  ? "Buy Plan"
                  : isTrial
                  ? "Free Trial"
                  : "Buy Plan"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Settings;
