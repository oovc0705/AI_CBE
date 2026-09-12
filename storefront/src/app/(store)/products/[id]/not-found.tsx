export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Product Not Found</h2>
      <p className="text-gray-500">
        Sorry, the product you are looking for does not exist or has been removed.
      </p>
    </div>
  );
}
