import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FileText, User, Mail, Lock } from "lucide-react";
import api from "../services/api";

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
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

    if (form.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/register", form);

      alert("Account created successfully! Please login.");

      navigate("/login");
    } catch (err) {
      setError(
        err.response?.data?.detail || "Registration failed."
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
          Create Account
        </h1>

        <p className="text-gray-500 text-center mt-2 mb-8">
          Join DocSpace and start creating documents.
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-5 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label className="block text-sm font-medium mb-2">
              Full Name
            </label>

            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-400" size={19} />

              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter your name"
                required
                className="w-full border rounded-xl py-3 pl-11 pr-4 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

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
                placeholder="Minimum 8 characters"
                minLength={8}
                required
                className="w-full border rounded-xl py-3 pl-11 pr-4 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white py-3 rounded-xl font-semibold"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

        </form>

        <p className="text-center text-gray-500 mt-7 text-sm">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-600 font-semibold">
            Login
          </Link>
        </p>

      </div>
    </div>
  );
}

export default Register;