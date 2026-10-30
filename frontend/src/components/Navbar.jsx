
import {
  Search,
  Plus,
  LogOut,
  FileText,
  X,
} from "lucide-react";
import "./Navbar.css";
function Navbar({
  user,
  search,
  setSearch,
  onCreate,
  onLogout,
  onClearSearch,
}) {
  return (
    <header className="app-navbar">

      <div className="flex items-center justify-between gap-4">

        {/* Brand */}
        <div className="flex shrink-0 items-center gap-3">

          <div className="rounded-xl bg-indigo-600 p-2">
            <FileText className="text-white" size={22} />
          </div>

          <h1 className="text-xl font-bold text-gray-800">
            DocSpace
          </h1>

        </div>

        {/* Search */}
        <div className="relative mx-2 hidden max-w-md flex-1 md:block">

          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={19}
          />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or content..."
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-10 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
          />

          {/* Clear Search */}
          {search && (
            <button
              type="button"
              onClick={onClearSearch}
              title="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-700"
            >
              <X size={18} />
            </button>
          )}

        </div>

        {/* Right Actions */}
        <div className="flex shrink-0 items-center gap-3">

          <button
            onClick={onCreate}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 sm:px-4"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">
              New Document
            </span>
          </button>

          {/* User Information */}
          <div className="hidden text-right sm:block">

            <p className="text-sm font-semibold text-gray-800">
              {user?.name || "User"}
            </p>

            <p className="text-xs text-gray-500">
              {user?.email || ""}
            </p>

          </div>

          {/* Logout */}
          <button
            onClick={onLogout}
            title="Logout"
            className="rounded-xl p-2.5 text-gray-500 transition hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={20} />
          </button>

        </div>

      </div>

      {/* Mobile Search */}
      <div className="relative mt-4 md:hidden">

        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={18}
        />

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search documents..."
          className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-10 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
        />

        {search && (
          <button
            type="button"
            onClick={onClearSearch}
            title="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
          >
            <X size={18} />
          </button>
        )}

      </div>

    </header>
  );
}

export default Navbar;
