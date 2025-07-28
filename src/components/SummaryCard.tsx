export default function SummaryCard({
  title,
  value,
  color,
  textColor = "text-gray-800",
}: {
  title: string;
  value: number;
  color: string;
  textColor?: string;
}) {
  return (
    <div className={`rounded-lg shadow-sm p-4 ${color}`}>
      <p
        className={`text-md sm:text-lg text-center font-semibold ${textColor} truncate`}
      >
        {title}
      </p>
      <h2 className={`text-xl text-center font-medium ${textColor}`}>
        {value}
      </h2>
    </div>
  );
}
