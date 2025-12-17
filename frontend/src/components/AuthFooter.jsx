export default function AuthFooter() {
  return (
    <footer className="mt-auto py-4 text-center text-sm text-gray-500">
      <p>
        © {new Date().getFullYear()} ShopEasy. All rights reserved.
      </p>
      <div className="mt-1 space-x-4">
        <span className="hover:underline cursor-pointer">
          Terms
        </span>
        <span className="hover:underline cursor-pointer">
          Privacy
        </span>
        <span className="hover:underline cursor-pointer">
          Help
        </span>
      </div>
    </footer>
  );
}
