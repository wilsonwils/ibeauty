import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const UserContext = createContext();
export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null); 
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    const storedToken = localStorage.getItem("AUTH_TOKEN");

    if (!userId || !storedToken) {
      navigate("/i-beauty");
      return;
    }

    setToken(storedToken);

    fetch(`${import.meta.env.VITE_API_URL}/user/${userId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch user");
        return res.json();
      })
      .then((data) => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => navigate("/i-beauty"));
  }, [navigate]);

  return (
    <UserContext.Provider value={{ user, token, loading }}>
      {children}
    </UserContext.Provider>
  );
};
