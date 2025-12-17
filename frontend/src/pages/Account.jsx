import Navbar from "../components/Navbar";
import AuthFooter from "../components/AuthFooter";
import { useEffect, useState } from "react";

export default function Account() {
  const [countries, setCountries] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  const [profile, setProfile] = useState({
    name: "Shourya Sharma",
    email: "shourya@gmail.com",
    phone: "9876543210",
    gender: "",
    dob: "",
    age: "",
    height: "",
    weight: "",
    nationality: "India",
    photo: null,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfile((prev) => ({
        ...prev,
        photo: URL.createObjectURL(file),
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Updated Profile:", profile);
    alert("Profile updated (frontend only)");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Navbar />

      <div className="flex-grow px-4 py-12">
        <div className="max-w-5xl mx-auto bg-white shadow-md rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-8">Personal Information</h2>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-4 gap-10"
          >
            {/* 🔹 LEFT SIDE */}
            <div className="md:col-span-1 flex flex-col items-center">
              <div className="relative group w-36 h-36 mb-6">
                {/* Avatar */}
                <div className="w-full h-full rounded-full border-2 border-gray-300 overflow-hidden bg-gray-100">
                  {profile.photo ? (
                    <img
                      src={profile.photo}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                      Upload Photo
                    </div>
                  )}
                </div>

                {/* Hover Overlay */}
                <label
                  className="absolute inset-0 bg-black/50 text-white text-sm
                    flex items-center justify-center
                    rounded-full opacity-0 group-hover:opacity-100
                    cursor-pointer transition"
                >
                  Change
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Nationality */}
              <div className="relative mt-8 w-full">
                <label className="block text-sm font-medium mb-1">
                  Nationality
                </label>

                <button
                  type="button"
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="w-full border px-3 py-2 rounded-lg flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    {profile.flag && (
                      <img src={profile.flag} className="w-5 h-4" />
                    )}
                    {profile.nationality}
                  </span>
                  ▼
                </button>

                {showDropdown && (
                  <div
                    className="absolute z-50 bg-white border rounded-lg mt-1
                    max-h-60 overflow-y-auto w-full shadow-lg"
                  >
                    {countries.map((c) => (
                      <div
                        key={c.code}
                        className="flex items-center gap-2 px-3 py-2
                     hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setProfile((prev) => ({
                            ...prev,
                            nationality: c.name,
                            flag: c.flag,
                          }));
                          setShowDropdown(false);
                        }}
                      >
                        <img src={c.flag} className="w-5 h-4" />
                        <span>{c.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 🔹 RIGHT SIDE */}
            <div className="md:col-span-3 space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={profile.name}
                  onChange={handleChange}
                  className="w-full border px-4 py-2 rounded-lg"
                />
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full border px-4 py-2 rounded-lg bg-gray-100 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={profile.phone}
                    disabled
                    className="w-full border px-4 py-2 rounded-lg bg-gray-100 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium mb-2">Gender</label>
                <div className="flex gap-6">
                  {["Male", "Female", "Other"].map((g) => (
                    <label key={g} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="gender"
                        value={g}
                        checked={profile.gender === g}
                        onChange={handleChange}
                      />
                      {g}
                    </label>
                  ))}
                </div>
              </div>

              {/* DOB & Age */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dob"
                    value={profile.dob}
                    onChange={handleChange}
                    className="w-full border px-4 py-2 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Age</label>
                  <input
                    type="number"
                    name="age"
                    value={profile.age}
                    onChange={handleChange}
                    className="w-full border px-4 py-2 rounded-lg"
                  />
                </div>
              </div>

              {/* Height & Weight */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    name="height"
                    value={profile.height}
                    onChange={handleChange}
                    className="w-full border px-4 py-2 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    name="weight"
                    value={profile.weight}
                    onChange={handleChange}
                    className="w-full border px-4 py-2 rounded-lg"
                  />
                </div>
              </div>

              {/* Save */}
              <div className="pt-6">
                <button
                  type="submit"
                  className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <AuthFooter />
    </div>
  );
}
