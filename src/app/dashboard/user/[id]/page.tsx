import { prisma } from "@/lib/prisma";
import Image from "next/image";
import { notFound } from "next/navigation";

interface Props {
  params: { id: string };
}

export const dynamic = "force-dynamic";

export default async function PublicUserPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      name: true,
      image: true,
      createdAt: true,
      jobs: {
        where: { deletedAt: null },
        select: {
          id: true,
          title: true,
          company: true,
          status: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) return notFound();

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        {user.image && (
          <Image
            src={user.image}
            alt="Profile Image"
            width={64}
            height={64}
            className="rounded-full"
          />
        )}
        <div>
          <h1 className="text-2xl font-semibold">
            {user.name ?? "Unnamed User"}
          </h1>
          <p className="text-sm text-gray-500">
            Register Date: {new Date(user.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <h2 className="text-lg font-bold mb-2">Records</h2>
      {user.jobs.length === 0 ? (
        <p className="text-gray-500">No applications created yet.</p>
      ) : (
        <ul className="space-y-3">
          {user.jobs.map((job) => (
            <li
              key={job.id}
              className="border p-4 rounded-md shadow-sm bg-white"
            >
              <p className="font-medium">{job.title}</p>
              <p className="text-sm text-gray-600">{job.company}</p>
              <span className="inline-block text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded mt-1">
                {job.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
