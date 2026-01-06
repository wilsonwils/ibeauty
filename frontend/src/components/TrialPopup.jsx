import { useEffect } from "react";

const TrialPopup = ({ show, onClose }) => {
  useEffect(() => {
    if (!show) return;

    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-black px-4 py-2 rounded shadow-md z-50">
      Your free trial has ended. Please upgrade to continue.
    </div>
  );
};

export default TrialPopup;
