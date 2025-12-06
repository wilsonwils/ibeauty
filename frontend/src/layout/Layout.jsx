import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

const Layout = ({ children, hideHeader = false }) => {
  return (
    <div className="flex bg-[#f7f8fa] min-h-screen">

      {/* Sidebar */}
      <Sidebar />

      {/* Main Area */}
      <div className="flex flex-col w-full ml-[200px]">

        {/* Shared Width Container */}
        <div className="max-w-[1400px] w-full mx-auto px-6">

          {/* Header (only hide when hideHeader=true) */}
          {!hideHeader && <Header />}

          {/* Page Content */}
          <div className="pt-6">
            {children}
          </div>

        </div>

      </div>
    </div>
  );
};

export default Layout;
