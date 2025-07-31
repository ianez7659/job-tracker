"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface User {
  id: string;
  name: string | null;
  image: string | null;
}

export default function UsersClient({ users }: { users: User[] }) {
  const [query, setQuery] = useState("");

  const filtered = users.filter((user) =>
    user.name?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      <input
        type="text"
        placeholder="Search by name..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full px-4 py-2 border rounded mb-4"
      />

      {filtered.length === 0 ? (
        <p className="text-gray-500">No users found.</p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((user) => (
            <li key={user.id}>
              <Link
                href={`/dashboard/user/${user.id}`}
                className="flex items-center gap-4 hover:bg-gray-50 p-3 rounded border"
              >
                {user.image && (
                  <Image
                    src={user.image}
                    alt={user.name ?? "avatar"}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                )}
                <span className="font-medium">{user.name ?? "(No Name)"}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
