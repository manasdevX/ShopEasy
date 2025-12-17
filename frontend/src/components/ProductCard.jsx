import { Star } from "lucide-react";

export default function ProductCard({ product }) {
  const {
    name,
    thumbnail,
    price,
    mrp,
    discountPercentage,
    rating,
    numReviews,
    stock,
    isAvailable,
    isBestSeller
  } = product;

  return (
    <div className="bg-white rounded-xl shadow hover:shadow-lg transition p-4 relative">

      {/* Bestseller Badge - RIGHT */}
      {isBestSeller && (
        <span className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded">
          Best Seller
        </span>
      )}

      {/* Product Image */}
      <img
        src={thumbnail}
        alt={name}
        className="h-40 mx-auto object-contain"
      />

      {/* Product Name */}
      <h3 className="mt-4 text-sm font-medium line-clamp-2">
        {name}
      </h3>

      {/* Rating */}
      <div className="flex items-center gap-1 mt-2">
        <div className="flex items-center text-orange-500">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={14}
              fill={i < Math.round(rating) ? "currentColor" : "none"}
              stroke="currentColor"
            />
          ))}
        </div>
        <span className="text-xs text-gray-600">
          ({numReviews})
        </span>
      </div>

      {/* Price */}
      <div className="mt-2">
        <span className="text-lg font-bold">
          ₹{price}
        </span>

        {discountPercentage > 0 && (
          <>
            <span className="text-sm line-through text-gray-400 ml-2">
              ₹{mrp}
            </span>
            <span className="text-sm text-green-600 ml-2 font-medium">
              {discountPercentage}% off
            </span>
          </>
        )}
      </div>

      {/* Stock Status */}
      <p
        className={`text-xs mt-1 ${
          stock > 0 ? "text-green-600" : "text-red-500"
        }`}
      >
        {stock > 0 ? "In stock" : "Out of stock"}
      </p>

      {/* CTA */}
      <button
        disabled={!isAvailable || stock === 0}
        className={`mt-3 w-full py-2 rounded-lg text-sm font-medium transition
          ${
            isAvailable && stock > 0
              ? "bg-orange-500 text-white hover:bg-orange-600"
              : "bg-gray-300 text-gray-600 cursor-not-allowed"
          }
        `}
      >
        Add to Cart
      </button>
    </div>
  );
}
