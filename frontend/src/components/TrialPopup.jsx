import { useEffect } from "react";
import { useTrial } from "../context/TrialContext";

const TrialPopup = () => {
  const { showPopup, setShowPopup } = useTrial();

  useEffect(() => {
    if (showPopup) {
      const timer = setTimeout(() => {
        setShowPopup(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [showPopup]);

  if (!showPopup) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-black px-4 py-2 rounded shadow-md z-50">
      Your free trial has ended. Please upgrade to continue.
    </div>
  );
};

export default TrialPopup;
