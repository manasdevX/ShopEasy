export default function ProductCard({ product }) {
  return (
    <div className="bg-white rounded-xl shadow hover:shadow-lg transition p-4">
      <img
        src={product.image}
        alt={product.title}
        className="h-40 mx-auto object-contain"
      />

      <h3 className="mt-4 font-semibold text-sm line-clamp-2">
        {product.title}
      </h3>

      <p className="mt-2 text-lg font-bold">₹{product.price}</p>

      <button className="mt-3 w-full bg-orange-400 text-black py-2 rounded-lg hover:bg-orange-500">
        Add to Cart
      </button>
    </div>
  );
}
