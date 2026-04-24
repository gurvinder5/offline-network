import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="bg-gray-900 text-white p-4 flex gap-6">
      <Link to="/">Home</Link>
      <Link to="/create">Create</Link>
      <Link to="/messages">Messages</Link>
      <Link to="/qr">QR</Link>
      <Link to="/connect">Connect</Link>
    </nav>
  );
}

export default Navbar;