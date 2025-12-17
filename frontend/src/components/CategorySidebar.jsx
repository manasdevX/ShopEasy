import {
  Smartphone,
  Laptop,
  Shirt,
  Home,
  Tv,
  ChevronRight
} from "lucide-react";

const categories = [
  {
    name: "Mobiles",
    icon: Smartphone
  },
  {
    name: "Electronics",
    icon: Laptop
  },
  {
    name: "Fashion",
    icon: Shirt
  },
  {
    name: "Home & Kitchen",
    icon: Home
  },
  {
    name: "TV & Appliances",
    icon: Tv
  }
];

export default function CategorySidebar() {
  return (
    <aside className="hidden lg:block w-64 bg-white rounded-xl shadow-sm p-4">
      <h3 className="text-lg font-semibold mb-4">
        Shop by Category
      </h3>

      <ul className="space-y-1">
        {categories.map((category, index) => {
          const Icon = category.icon;

          return (
            <li
              key={index}
              className="group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-100 transition"
            >
              <div className="flex items-center gap-3">
                <Icon
                  size={18}
                  className="text-orange-500"
                />
                <span className="font-medium text-gray-800">
                  {category.name}
                </span>
              </div>

              <ChevronRight
                size={16}
                className="text-gray-400 opacity-0 group-hover:opacity-100 transition"
              />
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
