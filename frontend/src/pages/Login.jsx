import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FileText, Mail, Lock, ArrowRight } from "lucide-react";
import api from "../services/api";

function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", form);

      localStorage.setItem("token", response.data.access_token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.detail || "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">

      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border p-8">

        <div className="flex justify-center mb-6">
          <div className="bg-indigo-100 p-4 rounded-2xl">
            <FileText size={35} className="text-indigo-600" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center text-gray-800">
          Welcome Back
        </h1>

        <p className="text-gray-500 text-center mt-2 mb-8">
          Login to continue to DocSpace
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-5 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label className="block text-sm font-medium mb-2">
              Email Address
            </label>

            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400" size={19} />

              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                className="w-full border rounded-xl py-3 pl-11 pr-4 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Password
            </label>

            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={19} />

              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                className="w-full border rounded-xl py-3 pl-11 pr-4 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white py-3 rounded-xl font-semibold flex justify-center items-center gap-2"
          >
            {loading ? "Logging in..." : "Login"}
            {!loading && <ArrowRight size={18} />}
          </button>

        </form>

        <p className="text-center text-gray-500 mt-7 text-sm">
          Don't have an account?{" "}
          <Link to="/register" className="text-indigo-600 font-semibold">
            Create Account
          </Link>
        </p>

      </div>
    </div>
  );
}

export default Login;