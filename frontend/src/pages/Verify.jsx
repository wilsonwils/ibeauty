import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Verify() {
    const navigate = useNavigate();
  
    useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const status = params.get("status");
  
      if (status === "success") {
        setTimeout(() => {
          navigate("/i-beauty/dashboard"); 
        }, 1500);
      } else {
        setTimeout(() => {
          navigate("/i-beauty");
        }, 1500);
      }
    }, []);
  
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <h2>Verifying your account...</h2>
      </div>
    );
  }
  
  export default Verify;
  