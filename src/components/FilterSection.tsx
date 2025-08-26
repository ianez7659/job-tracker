"use client";

import { useState } from "react";
import { Search, ChevronDown, ChevronUp, NotebookPen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filterStatus: string;
  setFilterStatus: (value: string) => void;
};

export default function FilterSection({
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
}: Props) {
  const [showFilters, setShowFilters] = useState(false);

  const [showDropdown, setShowDropdown] = useState(false);

  const [showDropdownDesktop, setShowDropdownDesktop] = useState(false);

  const statuses = [
    { value: "all", label: "All Status" },
    { value: "resume", label: "Resume" },
    { value: "interview1", label: "Interview1" },
    { value: "interview2", label: "Interview2" },
    { value: "interview3", label: "Interview3" },
    // { value: "offer", label: "Offer" },
    // { value: "rejected", label: "Rejected" },
  ];

  return (
    <>
      {/* Toggles for the mobile view */}
      <button
        className="md:hidden p-4 text-sm text-blue-600 mb-2 flex items-center gap-1 justify-end"
        onClick={() => setShowFilters(!showFilters)}
      >
        {showFilters ? (
          <>
            Close Search Filters <ChevronUp size={16} />
          </>
        ) : (
          <>
            Open Search Filters <ChevronDown size={16} />
          </>
        )}
      </button>

      {/* Mobile filter: showFilters === true */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            key="mobile-filters"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mb-2 px-4 md:hidden"
          >
            <div className="flex items-center border rounded w-full mb-1 px-2">
              <Search className="text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search company or title..."
                className="p-2 pl-2 w-full outline-none text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="relative w-full z-10">
              <button
                onClick={() => setShowDropdown((prev) => !prev)}
                className="p-2 border rounded text-sm w-full flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <NotebookPen className="text-gray-400" size={20} />
                  {statuses.find((s) => s.value === filterStatus)?.label ||
                    "Select Status"}
                </span>
                <ChevronDown size={16} />
              </button>

              {/* Mobile: Status dropdown */}
              <AnimatePresence>
                {showDropdown && (
                  <motion.ul
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.1 }}
                    className="absolute left-0 right-0 mt-1 bg-white border rounded shadow z-50"
                  >
                    {statuses.map((status) => (
                      <li
                        key={status.value}
                        onClick={() => {
                          setFilterStatus(status.value);
                          setShowDropdown(false);
                        }}
                        className={`px-3 py-2 cursor-pointer hover:bg-indigo-100 ${
                          filterStatus === status.value ? "bg-indigo-200" : ""
                        }`}
                      >
                        {status.label}
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Filter */}
      <div className="hidden md:flex p-4 gap-2 w-full justify-start mb-2">
        {/* Search Input */}
        <div className="flex items-center border rounded w-full md:w-64 px-2">
          <Search className="text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search company or title..."
            className="p-2 pl-2 w-full outline-none text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Status dropdown */}
        <div className="relative md:w-40 w-full">
          <button
            onClick={() => setShowDropdownDesktop((prev) => !prev)}
            className="p-2 border rounded text-sm w-full flex justify-between items-center"
          >
            <span className="flex items-center gap-2">
              <NotebookPen className="text-gray-400" size={20} />
              {statuses.find((s) => s.value === filterStatus)?.label ||
                "Select Status"}
            </span>
            <ChevronDown size={16} />
          </button>

          <AnimatePresence>
            {showDropdownDesktop && (
              <motion.ul
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute left-0 right-0 mt-1 bg-white border rounded shadow z-10"
              >
                {statuses.map((status) => (
                  <li
                    key={status.value}
                    onClick={() => {
                      setFilterStatus(status.value);
                      setShowDropdownDesktop(false);
                    }}
                    className={`px-3 py-2 cursor-pointer hover:bg-indigo-100 ${
                      filterStatus === status.value ? "bg-indigo-200" : ""
                    }`}
                  >
                    {status.label}
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
