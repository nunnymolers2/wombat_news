export function ErrorMessage({ message }) {
  if (!message) return null;
  return <p>Error: {message}</p>;
}
