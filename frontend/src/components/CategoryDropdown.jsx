import { Link } from "react-router-dom";

export default function CategoryDropdown({ category, data, onClose }) {
  return (
    <div
      className="absolute top-full left-0 w-64 bg-white shadow-lg border z-50"
      onMouseLeave={onClose}
    >
      <ul className="py-2">
        {Object.entries(data).map(([section, items]) => (
          <li key={section} className="px-4 py-2">
            
            {/* Section Title */}
            <p className="text-xs font-semibold text-gray-900 mb-1 uppercase">
              {section}
            </p>

            {/* Items */}
            <ul className="space-y-1">
              {items.map((item) => (
                <li key={item}>
                  <Link
                    to={`/products?category=${encodeURIComponent(
                      category
                    )}&subCategory=${encodeURIComponent(item)}`}
                    className="block text-sm text-gray-600 hover:text-orange-500 hover:bg-gray-50 px-2 py-1 rounded transition"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>

          </li>
        ))}
      </ul>
    </div>
  );
}
