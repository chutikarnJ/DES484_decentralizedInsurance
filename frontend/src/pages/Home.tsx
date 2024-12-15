import React from "react";
import { Link } from "react-router-dom";
import bgImage from "../picture/cardrive.jpg"; // Background image
import Navbar from "../components/Navbar"

const Home: React.FC = () => {
  return (
    <div
      className="relative w-full h-screen bg-cover bg-center overflow-hidden"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
     {/* Navbar */}
     <Navbar />
      {/* Hero Section */}
      <div className="flex flex-col justify-center items-center h-full text-center text-white bg-black bg-opacity-50">
        <h1 className="text-6xl font-bold mb-4">DriveGuard Group</h1>
        <p className="text-xl font-medium mb-8">Decentralized Car Insurance</p>
        <Link
          to="/buy-insurance"
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transform hover:scale-105 transition duration-300"
        >
          Buy Insurance
        </Link>
      </div>
    </div>
  );
};

export default Home;
