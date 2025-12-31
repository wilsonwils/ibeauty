import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import TrialPopup from "../components/TrialPopup";
import { useTrial } from "../context/TrialContext";

const Layout = ({ children, hideHeader = false }) => {
  const { trialExpired, setShowPopup } = useTrial();

  const handleClick = (e) => {
    if (!trialExpired) return; // Only block if trial ended

    const target = e.target.closest("button, input, select, textarea, label");
    if (target) {
      e.preventDefault();
      e.stopPropagation();
      setShowPopup(true);
    }
  };

  return (
    <div
      className="flex bg-[#f7f8fa] min-h-screen"
      onClick={handleClick} // intercept in-page actions
    >
      <Sidebar />
      <div className="flex flex-col w-full ml-[200px]">
        <div className="max-w-[1400px] w-full mx-auto px-6">
          {!hideHeader && <Header />}
          <div className="pt-6">{children}</div>
        </div>
      </div>

      <TrialPopup />
    </div>
  );
};

export default Layout;
