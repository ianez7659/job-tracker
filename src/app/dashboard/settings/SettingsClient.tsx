"use client";

import { Session } from "next-auth";
import { useState } from "react";

interface Props {
  session: Session | null;
}

export default function SettingsClient({ session }: Props) {
  const [name, setName] = useState(session?.user?.name ?? "");

  return (
    <form className="space-y-4 max-w-md">
      <div>
        <label htmlFor="name" className="block font-medium">
          Display Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
        />
      </div>

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded-md"
        disabled
      >
        Save (미구현)
      </button>
    </form>
  );
}
