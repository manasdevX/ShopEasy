export default function CategoryCard({ title, image }) {
  return (
    <div className="bg-white rounded-xl shadow hover:shadow-xl transition duration-300 p-4 cursor-pointer flex flex-col">
      {/* Image */}
      <div className="h-40 flex items-center justify-center">
        <img
          src={image}
          alt={title}
          className="max-h-full object-contain"
        />
      </div>

      {/* Text */}
      <div className="mt-4 flex flex-col flex-grow">
        <h3 className="font-semibold text-lg">{title}</h3>

        <button className="mt-auto text-orange-500 font-medium hover:underline">
          Shop now →
        </button>
      </div>
    </div>
  );
}
