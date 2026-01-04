import { Link } from "react-router-dom";

export default function PaymentFooter({ origin }) {
  return (
    <div className="...">
      <Link to="/Privacy" state={{ origin }}>Privacy</Link>
      <Link to="/Terms" state={{ origin }}>Terms</Link>
      <Link to="/Help" state={{ origin }}>Help</Link>
    </div>
  );
}