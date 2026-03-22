import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** If the model wraps the whole reply in a single markdown code fence, parse the inner text. */
function unwrapMarkdownFence(text: string): string {
  const t = text.trim();
  const m = t.match(
    /^```(?:markdown|mdx?)?\s*\r?\n([\s\S]*?)\r?\n```\s*$/i,
  );
  return m ? m[1].trim() : text;
}

const components: Components = {
  h1: ({ children }) => (
    <h1 className="text-base font-bold text-gray-900 dark:text-gray-100 mt-3 mb-2 first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-3 mb-1.5 first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-medium text-indigo-900 dark:text-yellow-100/90 mt-2 mb-1 first:mt-0">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="mb-2 last:mb-0 leading-relaxed text-gray-700 dark:text-gray-200">
      {children}
    </p>
  ),
  ul: ({ className, children }) => (
    <ul
      className={`mb-2 space-y-1 text-gray-700 dark:text-gray-200 pl-5 ${
        className?.includes("contains-task-list")
          ? "list-none pl-1 [&_li]:flex [&_li]:items-start [&_li]:gap-2"
          : "list-disc"
      }`}
    >
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-5 mb-2 space-y-1 text-gray-700 dark:text-gray-200">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => (
    <strong className="font-semibold text-gray-900 dark:text-gray-50">
      {children}
    </strong>
  ),
  em: ({ children }) => (
    <em className="italic text-gray-800 dark:text-gray-200">{children}</em>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-indigo-300 dark:border-yellow-600/60 pl-3 my-2 text-gray-600 dark:text-gray-300 italic">
      {children}
    </blockquote>
  ),
  code: ({ className, children, ...props }) => {
    const isBlock = /\blanguage-/.test(className || "");
    if (isBlock) {
      return (
        <code
          className={`${className ?? ""} text-xs font-mono block whitespace-pre`}
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <code
        className="text-[0.9em] bg-indigo-50 dark:bg-slate-900/90 px-1 py-0.5 rounded font-mono text-indigo-900 dark:text-yellow-100/90"
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="my-2 overflow-x-auto rounded-md bg-slate-100 dark:bg-slate-900/80 p-3 text-xs text-gray-800 dark:text-gray-200">
      {children}
    </pre>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-indigo-600 dark:text-yellow-400 underline underline-offset-2 hover:opacity-90"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  hr: () => (
    <hr className="my-3 border-gray-200 dark:border-slate-600" />
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto my-2">
      <table className="min-w-full text-xs border border-gray-200 dark:border-slate-600 rounded-md">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-slate-100 dark:bg-slate-800">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="border border-gray-200 dark:border-slate-600 px-2 py-1.5 text-left font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-gray-200 dark:border-slate-600 px-2 py-1.5 align-top">
      {children}
    </td>
  ),
};

type Props = {
  children: string;
  className?: string;
};

/** Renders markdown / MDX-like AI output (headings, lists, code, tables via GFM). */
export function MarkdownContent({ children, className = "" }: Props) {
  const source = unwrapMarkdownFence(children);
  return (
    <div className={`text-sm ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {source}
      </ReactMarkdown>
    </div>
  );
}
