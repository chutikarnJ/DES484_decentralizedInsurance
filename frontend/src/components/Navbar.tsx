import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import logoImage from "../picture/carcare.png";


const Navbar: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const connectedAccount = localStorage.getItem("connectedAccount");
    if (connectedAccount) {
      setIsLoggedIn(true);
      setAccount(connectedAccount);
    }
  }, []);

  const handleLogout = async () => {
    localStorage.clear();
    setIsLoggedIn(false);
    setAccount(null);
    navigate("/login");
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  return (
    <header className="w-full flex justify-between items-center bg-gradient-to-r from-white to-gray-100 bg-opacity-90 py-4 px-10 shadow-lg">
      <div className="flex items-center space-x-4">
        <img src={logoImage} alt="DriveGuard Logo" className="h-12" />
        <h1 className="text-lg font-bold text-black-700">DRIVEGUARD</h1>
      </div>
      <nav className="flex space-x-6 items-center">
        <Link to="/" className="text-gray-700 font-medium hover:text-blue-700">
          Home
        </Link>
        <Link
          to="/buy-insurance"
          className="text-gray-700 font-medium hover:text-blue-700"
        >
          Buy Insurance
        </Link>
        <Link
          to="/claim"
          className="text-gray-700 font-medium hover:text-blue-700"
        >
          Claim
        </Link>
        {isLoggedIn ? (
          <div className="relative">
            <button
              onClick={toggleDropdown}
              className="flex items-center space-x-2 bg-blue-700 text-white font-medium py-2 px-4 rounded-full focus:outline-none"
            >
              <span>User</span>
              <span>{account ? account.slice(0, 6) + "..." : "User"}</span>
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 bg-white shadow-lg rounded-lg py-2 w-48">
                <Link
                  to="/view-policy"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  My Policy
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-red-500 hover:bg-gray-100"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            to="/login"
            className="text-gray-700 font-medium hover:text-blue-700"
          >
            Login
          </Link>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
