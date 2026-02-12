export function Button({ children, onClick, disabled, variant = "default" }) {
  return (
    <button
      class="rounded-md bg-gray-900 text-gray-500 shadow-md px-4 py-2 text-center"
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
