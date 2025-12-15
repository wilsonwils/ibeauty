// LoginSign.jsx
import { auth, googleProvider, appleProvider } from "../firebase";
import { signInWithPopup } from "firebase/auth";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import heroImage from "../assets/login.png";
import { FcGoogle } from "react-icons/fc";
import { FaApple, FaPhone } from "react-icons/fa";
import { FiUser, FiMail, FiEye, FiEyeOff } from "react-icons/fi";
import { api } from "../utils/api";
import { getTokenPayload, isTokenValid } from "../utils/auth";

/* ----------------------------------
   Reusable Input Field
---------------------------------- */
const InputField = ({ label, placeholder, type = "text", icon, error, ...rest }) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = type === "password" ? (showPassword ? "text" : "password") : type;

  return (
    <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
      <span>{label}</span>

      <div className="relative">
        <input
          type={inputType}
          placeholder={placeholder}
          className={`w-full rounded-2xl border px-4 py-3.5 pr-12 text-sm font-medium outline-none transition focus:ring-2 
            ${error ? "border-red-500 focus:border-red-500 focus:ring-red-100" : "border-transparent focus:border-teal-300 focus:ring-teal-100"}`}
          {...rest}
        />

        {type === "password" ? (
          <span
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400"
          >
            {showPassword ? <FiEyeOff size={22} /> : <FiEye size={22} />}
          </span>
        ) : (
          icon && (
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
              {icon}
            </span>
          )
        )}
      </div>

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </label>
  );
};

/* ----------------------------------
   Icons
---------------------------------- */
const MailIcon = <FiMail size={22} />;
const PhoneIcon = <FaPhone size={22} />;
const UserIcon = <FiUser size={24} />;

/* ----------------------------------
   Social Button
---------------------------------- */
const SocialButton = ({ type = "button", icon, children, onClick }) => (
  <button
    type={type}
    onClick={onClick}
    className="flex flex-1 items-center justify-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
  >
    {icon}
    {children}
  </button>
);


/* ----------------------------------
   Login Form
---------------------------------- */
const LoginForm = ({
  onToggle,
  loginData,
  handleChange,
  handleLogin,
  handleSocialLogin,
  errorMessage,
  errors,
}) => (
  <form onSubmit={handleLogin} className="flex flex-col gap-4">
    <div className="space-y-2">
      <h2 className="text-4xl font-semibold text-slate-900 text-center">Welcome Back!</h2>
      <p className="text-base text-slate-500 text-center">Login into your account</p>
    </div>

    <div className="space-y-4">
      <InputField
        label="Email"
        placeholder="Enter your e-mail"
        type="email"
        icon={MailIcon}
        name="email"
        value={loginData.email}
        onChange={handleChange}
        error={errors.email}
      />

      <InputField
        label="Password"
        placeholder="Enter your password"
        type="password"
        name="password"
        value={loginData.password}
        onChange={handleChange}
        error={errors.password}
      />
    </div>

    {errorMessage && (
      <p className="text-red-500 text-sm text-center">{errorMessage}</p>
    )}

    <button
      type="submit"
      className="w-full rounded-full bg-[#040b18] py-4 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-[#0b1426]"
    >
      Login
    </button>

    <div className="flex items-center gap-4 text-xs text-slate-400">
      <span className="h-px flex-1 bg-slate-200" />
      OR
      <span className="h-px flex-1 bg-slate-200" />
    </div>

    <div className="flex flex-col gap-3 sm:flex-row">
      {/* GOOGLE BUTTON FIXED */}
      <SocialButton
        type="button"
        icon={<FcGoogle size={22} />}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleSocialLogin(googleProvider);
        }}
      >
        Continue with Google
      </SocialButton>

      {/* APPLE BUTTON FIXED */}
      <SocialButton
        type="button"
        icon={<FaApple size={22} />}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleSocialLogin(appleProvider);
        }}
      >
        Continue with Apple ID
      </SocialButton>
    </div>

    <button
      type="button"
      onClick={() => onToggle("signup")}
      className="w-full py-3 border border-black rounded-full text-slate-900 font-semibold hover:bg-slate-50 transition"
    >
      Sign Up
    </button>
  </form>
);



/* ----------------------------------
   Signup Form
---------------------------------- */
const SignupForm = ({
  onToggle,
  signupData,
  handleChange,
  handleSignup,
  showPopup,
  setShowPopup,
  errorMessage,
  errors,
  setSignupData,
  setSignupErrors,
  setErrorMessage
}) => (
  <>
    {showPopup && (
      <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-xl z-50">
        <div className="bg-white p-6 rounded-xl shadow-xl w-[90%] max-w-md text-center relative">
<button
  onClick={() => {
    setShowPopup(false);
    setSignupData({
      firstName: "",
      lastName: "",
      email: "",
      organization: "",
      phone: "",
      password: "",
      confirmPassword: "",
    });
    setSignupErrors({});
    setErrorMessage("");
  }}
  className="absolute top-3 right-3 text-gray-500"
>
  ✕
</button>

          <h2 className="text-xl font-semibold text-[#08A882] mb-2">Account created successfully</h2>
          <p className="text-slate-600 text-sm">
            Verify your email address by clicking the link sent to your inbox.
          </p>
        </div>
      </div>
    )}

    <form onSubmit={handleSignup} className="flex flex-col gap-4">
      <div className="space-y-2">
        <h2 className="text-4xl font-semibold text-slate-900">Welcome!</h2>
        <p className="text-base text-slate-500">Create your account</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <InputField
          label="First name"
          placeholder="Enter first name"
          icon={UserIcon}
          name="firstName"
          value={signupData.firstName}
          onChange={handleChange}
          error={errors.firstName}
        />

        <InputField
          label="Last name"
          placeholder="Enter last name"
          icon={UserIcon}
          name="lastName"
          value={signupData.lastName}
          onChange={handleChange}
          error={errors.lastName}
        />
      </div>

      <InputField
        label="Email"
        placeholder="Enter your e-mail"
        type="email"
        icon={MailIcon}
        name="email"
        value={signupData.email}
        onChange={handleChange}
        error={errors.email}
      />

      <InputField
        label="Organization Name"
        placeholder="Enter organization name"
        name="organization"
        value={signupData.organization}
        onChange={handleChange}
      />

      <InputField
        label="Phone number"
        placeholder="Enter your number"
        type="tel"
        icon={PhoneIcon}
        name="phone"
        value={signupData.phone}
        onChange={handleChange}
        error={errors.phone}
      />

      <InputField
        label="Password"
        placeholder="Enter new password"
        type="password"
        name="password"
        value={signupData.password}
        onChange={handleChange}
        error={errors.password}
      />

      <InputField
        label="Confirm Password"
        placeholder="Re-enter password"
        type="password"
        name="confirmPassword"
        value={signupData.confirmPassword}
        onChange={handleChange}
        error={errors.confirmPassword}
      />

      {errorMessage && <p className="text-red-500 text-sm text-center">{errorMessage}</p>}

      <button
        type="submit"
        className="w-full rounded-full bg-[#040b18] py-4 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-[#0b1426]"
      >
        Create Account
      </button>

      <button
        type="button"
        onClick={() => onToggle("login")}
        className="w-full py-3 border border-black rounded-full text-slate-900 font-semibold hover:bg-slate-50 transition"
      >
        Login
      </button>
    </form>
  </>
);

/* ----------------------------------
   Main Component
---------------------------------- */
function LoginSign() {
  const navigate = useNavigate();

  /* ----- State ----- */
  const [view, setView] = useState("login");
  const [errorMessage, setErrorMessage] = useState("");

  const [signupData, setSignupData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    organization: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [signupErrors, setSignupErrors] = useState({});

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [loginErrors, setLoginErrors] = useState({});

  const [showPopup, setShowPopup] = useState(false);

  /* ----------------------------------
     Toggle Form
  ---------------------------------- */
  const onToggle = (newView) => {
    setView(newView);
    setErrorMessage("");
    setSignupErrors({});
    setLoginErrors({});
  };

  /* ----------------------------------
     Input Validation Handler
  ---------------------------------- */
  const handleChange = (e, formType) => {
    const { name, value } = e.target;

    if (formType === "signup") {
      setSignupData((p) => ({ ...p, [name]: value }));

      const newErrors = { ...signupErrors };

      if (["firstName", "lastName"].includes(name))
        newErrors[name] = /^[A-Za-z\s]+$/.test(value) ? "" : "Only letters allowed";

      if (name === "email")
        newErrors.email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "" : "Invalid email";

      if (name === "phone")
        newErrors.phone = /^[0-9]{10}$/.test(value) ? "" : "Must be 10 digits";

      if (name === "confirmPassword")
        newErrors.confirmPassword = value === signupData.password ? "" : "Passwords do not match";

      setSignupErrors(newErrors);
    }

    if (formType === "login") {
      setLoginData((p) => ({ ...p, [name]: value }));

      const newErrors = { ...loginErrors };

      if (name === "email")
        newErrors.email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "" : "Invalid email";



      setLoginErrors(newErrors);
    }
  };

  /* ----------------------------------
     Signup Submit
  ---------------------------------- */
  const handleSignup = async (e) => {
    e.preventDefault();

    if (signupData.password !== signupData.confirmPassword)
      return setErrorMessage("Passwords do not match");

    try {
      const res = await api("/signup", {
        method: "POST",
        body: JSON.stringify({ ...signupData }),
      });

      const data = await res.json();

      if (res.ok) setShowPopup(true);
         
      else setErrorMessage(data.message || "Signup failed");
    } catch (err) {
      console.error(err);
      setErrorMessage("Something went wrong");
    }
  };

  /* ----------------------------------
     Login Submit
  ---------------------------------- */
 const handleLogin = async (e) => {
  e.preventDefault();

  try {
    const res = await api("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loginData),
    });

    const data = await res.json();
    console.log("Login response:", data);

    if (res.ok && data.token) {
      // Save token
      localStorage.setItem("AUTH_TOKEN", data.token);
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("orgId", data.organizationId);

      // ✅ Optional: check token validity immediately
      if (isTokenValid(data.token)) {
        const payload = getTokenPayload(data.token);
        console.log("Token payload:", payload);
        navigate("/i-beauty/dashboard");
      } else {
        console.warn("Token expired or invalid");
        setErrorMessage("Login failed: token invalid");
      }
    } else {
      setErrorMessage(data.error || data.message || "Invalid login credentials");
    }
  } catch (err) {
    console.error("Login error:", err);
    setErrorMessage("Something went wrong");
  }
};


  /* ----------------------------------
     Social Login
  ---------------------------------- */
  const handleSocialLogin = async (provider) => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    if (!user?.email) return setErrorMessage("Provider did not return an email.");

    const res = await api("/social-login", {
      method: "POST",
      body: JSON.stringify({ email: user.email }),
    });

    const data = await res.json();

    if (data.userExists && data.isVerified && data.token) {
      localStorage.setItem("AUTH_TOKEN", data.token);
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("orgId", data.organizationId);

      if (isTokenValid(data.token)) {
        navigate("/i-beauty/dashboard");
      } else {
        setErrorMessage("Token invalid or expired");
      }
    } else if (data.userExists && !data.isVerified) {
      setErrorMessage("Verify your email before logging in.");
    } else {
      navigate("/i-beauty");
    }
  } catch (err) {
    console.error(err);
    setErrorMessage("Social login failed");
  }
};

  return (
        <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row">
        <div className="relative rounded-r-[48px] overflow-hidden lg:w-1/2 bg-gray-200">
          <div className="absolute inset-0 bg-cover bg-position-[center_top_20%]" style={{ backgroundImage: `url(${heroImage})` }} />
          <div className="absolute bottom-0 left-0 w-full p-8 bg-linear-to-t from-[#2cc3d4] to-transparent ">
            <div className="relative z-20 p-10 text-white">
              <p className="text-4xl font-semibold">iTryOn</p>
              <p className="mt-3 text-2xl font-semibold leading-snug drop-shadow">Reduce returns, increase confidence before purchase.</p>
              <p className="mt-4 max-w-md text-sm">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
            </div>
            <div className="flex gap-2 mt-6">
                <span className="w-6 h-1 rounded-full bg-white"></span>
                <span className="w-6 h-1 rounded-full bg-white/40"></span>
                <span className="w-6 h-1 rounded-full bg-white/40"></span>
                <span className="w-6 h-1 rounded-full bg-white/40"></span>
              </div>
          </div>
        </div>


        {/* Right Form Section */}
        <div className="rounded-[48px] bg-white/95 p-8 shadow-card sm:p-12 lg:flex-1">
          {view === "login" ? (
            <LoginForm
              onToggle={onToggle}
              loginData={loginData}
              handleChange={(e) => handleChange(e, "login")}
              handleLogin={handleLogin}
              handleSocialLogin={handleSocialLogin}
              errorMessage={errorMessage}
              errors={loginErrors}
            />
          ) : (
            <SignupForm
              onToggle={onToggle}
              signupData={signupData}
              handleChange={(e) => handleChange(e, "signup")}
              handleSignup={handleSignup}
              showPopup={showPopup}
              setShowPopup={setShowPopup}
              errorMessage={errorMessage}
              errors={signupErrors}
              setSignupData={setSignupData}  
              setSignupErrors={setSignupErrors} 
              setErrorMessage={setErrorMessage}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginSign;
