export default function UserAvatar({ name, email }: { name: string | null; email: string }) {
  const initial = (name ?? email).charAt(0).toUpperCase();
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
      {initial}
    </div>
  );
}
