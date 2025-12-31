import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../utils/api";

const EditProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = location.state?.user;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState(""); 
  const [logo, setLogo] = useState("");
  const [logoPreview, setLogoPreview] = useState("");

  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userId = localStorage.getItem("userId");
        if (!userId) return;

        const res = await api(`/get-profile/${userId}`);
        const data = await res.json();

        if (res.ok && data.status === "success") {
          const u = data.user;
          setFirstName(u.firstName || "");
          setLastName(u.lastName || "");
          setEmail(u.email || "");
          setOrganization(u.organization || "");
          setPhone(u.phone || "");
          setWhatsapp(u.whatsapp || ""); 

          if (u.logo) {
            setLogo(u.logo);
            setLogoPreview(u.logo);
          }
        } else {
          alert(data.message || "Failed to fetch user data");
        }
      } catch (err) {
        console.error(err);
        alert("Something went wrong fetching user data");
      }
    };

    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setEmail(user.email || "");
      setOrganization(user.organization || "");
      setPhone(user.phone || "");
      setWhatsapp(user.whatsapp || ""); 

      if (user.logo) {
        setLogo(user.logo);
        setLogoPreview(user.logo);
      }
    } else {
      fetchUser();
    }
  }, [user]);

  const handleLogoClick = () => {
    fileInputRef.current.click();
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result);
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const body = {
        user_id: localStorage.getItem("userId"),
        firstName,
        lastName,
        organization,
        phone,
        whatsapp,
        logo,
      };

      const res = await api("/update-profile", {
        method: "PUT",
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (res.ok) {
        alert("Profile updated successfully");
        navigate(-1);
      } else {
        alert(data.message || "Failed to update profile");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

  return (
    <div className="bg-white p-6 rounded shadow-md max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Edit Profile</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* First Row */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-gray-700 mb-1">First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full border p-2 rounded"
              required
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-gray-700 mb-1">Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full border p-2 rounded"
              required
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full border p-2 rounded cursor-not-allowed"
            />
          </div>
        </div>

        {/* Second Row */}
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-gray-700 mb-1">
              Organization Name
            </label>
            <input
              type="text"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              className="w-full border p-2 rounded"
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-gray-700 mb-1">Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border p-2 rounded"
            />
          </div>

         
          <div className="flex-1 min-w-[200px]">
            <label className="block text-gray-700 mb-1">
              Organization WhatsApp
            </label>
            <input
              type="text"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="w-full border p-2 rounded"
            />
          </div>
        </div>

        {/* Logo */}
        <div className="flex flex-wrap gap-4 items-center mt-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-gray-700 mb-1">
              Organization Logo
            </label>

            <div className="flex flex-col items-start gap-2">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Organization Logo"
                  className="h-20 w-20 object-contain border rounded"
                />
              ) : (
                <div className="h-20 w-20 border rounded flex items-center justify-center text-gray-400">
                  No Logo
                </div>
              )}

              <button
                type="button"
                onClick={handleLogoClick}
                className="bg-yellow-400 text-white px-3 py-1 rounded hover:bg-[#00a2b2]"
              >
                Change Logo
              </button>

              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleLogoChange}
                className="hidden"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button
            type="submit"
            className="bg-[#00bcd4] text-white px-4 py-2 rounded hover:bg-[#00a2b2]"
          >
            Update Profile
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProfile;
