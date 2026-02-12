export function Card({ children, onClick }) {
  return (
    <div
      class="bg-gray-900 text-gray-300 rounded-sm mx-3 mt-3 last:mb-3 shadow-md p-2 "
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      {children}
    </div>
  );
}
