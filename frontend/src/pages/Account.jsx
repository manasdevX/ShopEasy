import Navbar from "../components/Navbar";
import AuthFooter from "../components/AuthFooter";
import { useState } from "react";

export default function Account() {
  const [profile, setProfile] = useState({
    name: "Shourya Shivhare",
    email: "shourya@gmail.com",
    phone: "9876543210",
    gender: "",
    dob: "",
    height: "",
    weight: "",
    nationality: "India",
    avatar: null,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfile((prev) => ({
        ...prev,
        avatar: URL.createObjectURL(file),
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Updated profile:", profile);
    alert("Profile updated (frontend only)");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />

      <div className="flex-grow px-4 py-12">
        <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-md p-8">

          <h2 className="text-2xl font-bold mb-8">Account Settings</h2>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-3 gap-10"
          >
            {/* LEFT PROFILE CARD */}
            <div className="md:col-span-1 flex flex-col items-center text-center">
              <div className="relative w-36 h-36 mb-4 group">
                <div className="w-full h-full rounded-full overflow-hidden border bg-gray-100">
                  {profile.avatar ? (
                    <img
                      src={profile.avatar}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      Upload Photo
                    </div>
                  )}
                </div>

                <label
                  className="absolute inset-0 bg-black/50 text-white text-sm
                             flex items-center justify-center rounded-full
                             opacity-0 group-hover:opacity-100 cursor-pointer transition"
                >
                  Change
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </label>
              </div>

              <h3 className="font-semibold text-lg">{profile.name}</h3>
              <p className="text-sm text-gray-500">{profile.email}</p>

              <span className="mt-2 inline-block text-xs px-3 py-1 rounded-full
                               bg-orange-100 text-orange-600">
                User Account
              </span>
            </div>

            {/* RIGHT FORM */}
            <div className="md:col-span-2 space-y-6">
              {/* NAME */}
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

              {/* EMAIL & PHONE */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full border px-4 py-2 rounded-lg bg-gray-100"
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
                    className="w-full border px-4 py-2 rounded-lg bg-gray-100"
                  />
                </div>
              </div>

              {/* GENDER */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Gender
                </label>
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

              {/* DOB */}
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

              {/* HEIGHT & WEIGHT */}
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

              {/* NATIONALITY */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Nationality
                </label>
                <input
                  type="text"
                  name="nationality"
                  value={profile.nationality}
                  onChange={handleChange}
                  className="w-full border px-4 py-2 rounded-lg"
                />
              </div>

              {/* SAVE */}
              <div className="pt-6">
                <button
                  type="submit"
                  className="bg-orange-500 text-white px-8 py-3 rounded-lg
                             hover:bg-orange-600 transition"
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
