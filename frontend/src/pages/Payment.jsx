import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  MapPin,
  CreditCard,
  ChevronLeft,
  Lock,
  CheckCircle2,
  LocateFixed,
  ShoppingBag,
  Loader2,
  Check,
  Plus,
  Home,
  Briefcase,
} from "lucide-react";
import PaymentHeader from "../components/PaymentHeader";
import PaymentFooter from "../components/PaymentFooter";
import { toast } from "react-hot-toast";
import { showSuccess, showError } from "../utils/toast";

const API_URL = import.meta.env.VITE_API_URL;

export default function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const items = location.state?.items || [];
  const token = localStorage.getItem("token");

  const [paymentMode, setPaymentMode] = useState("upi");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // --- ADDRESS STATES ---
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    name: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    type: "Home",
  });

  // --- CALCULATIONS ---
  const totalItemCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalMRP = items.reduce(
    (acc, item) => acc + (item.mrp || item.price) * item.quantity,
    0
  );
  const subtotal = items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  const totalDiscount = totalMRP - subtotal;
  const platformFee = items.length > 0 ? 3 : 0;
  const deliveryFee = subtotal > 500 || items.length === 0 ? 0 : 40;
  const totalPayable = subtotal + platformFee + deliveryFee;

  useEffect(() => {
    const fetchAddresses = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/api/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setSavedAddresses(data.addresses || []);
          const defaultAddr =
            data.addresses?.find((a) => a.isDefault) || data.addresses?.[0];
          if (defaultAddr) setSelectedAddress(defaultAddr);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchAddresses();
  }, [token]);

  // ================= IMPROVED GEOLOCATION =================
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          if (data && data.address) {
            const addr = data.address;
            // Capture full street details for better accuracy
            const fullStreet = [addr.road, addr.suburb, addr.neighbourhood]
              .filter(Boolean)
              .join(", ");
            setNewAddress((prev) => ({
              ...prev,
              street: fullStreet || data.display_name.split(",")[0],
              city: addr.city || addr.town || addr.village || "",
              pincode: addr.postcode || "",
              state: addr.state || "",
            }));
            showSuccess("Location detected!");
          }
        } catch (e) {
          showError("Failed to fetch details");
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setIsLocating(false);
        showError("Access denied");
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSaveNewAddress = async () => {
    if (!newAddress.name || !newAddress.phone || !newAddress.street) {
      toast.error("Please fill required fields");
      return;
    }
    setIsSavingAddress(true);
    try {
      const res = await fetch(`${API_URL}/api/user/address`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newAddress),
      });
      const data = await res.json();
      if (res.ok) {
        setSavedAddresses(data);
        setSelectedAddress(data[data.length - 1]);
        setIsAddingNew(false);
        showSuccess("Address added!");
      }
    } catch (err) {
      showError("Failed to save");
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedAddress)
      return toast.error("Please select a shipping address");
    setIsProcessing(true);
    try {
      if (paymentMode === "cod") {
        const res = await fetch(`${API_URL}/api/orders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            orderItems: items.map((i) => ({
              name: i.name,
              qty: i.quantity,
              image: i.image,
              price: i.price,
              product: i._id,
              seller: i.seller,
            })),
            shippingAddress: {
              address: selectedAddress.addressLine || selectedAddress.street,
              city: selectedAddress.city,
              postalCode: selectedAddress.pincode,
              country: selectedAddress.country,
            },
            paymentMethod: "COD",
            itemsPrice: subtotal,
            taxPrice: platformFee,
            shippingPrice: deliveryFee,
            totalPrice: totalPayable,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          showSuccess("Order Placed!");
          localStorage.removeItem("cart");
          window.dispatchEvent(new Event("cartUpdated"));
          navigate("/OrderSummary", { state: { order: data } });
        } else showError(data.message);
        setIsProcessing(false);
        return;
      }
      // Razorpay logic follows...
    } catch (e) {
      showError("Checkout failed");
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 transition-colors font-sans">
      <PaymentHeader />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex justify-between items-center border-b border-slate-800 pb-6 mb-8">
          <h1 className="text-4xl font-black tracking-tight">Checkout</h1>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-500 hover:text-orange-600 text-sm font-bold uppercase tracking-widest"
          >
            <ChevronLeft size={18} /> Back
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-7 space-y-8">
            {/* SAVED ADDRESSES SECTION - ALWAYS VISIBLE */}
            <div className="bg-slate-900/50 rounded-3xl border border-slate-800 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <MapPin size={18} />
                  </div>
                  <h2 className="font-bold uppercase tracking-widest text-[10px] text-slate-400">
                    Shipping Address
                  </h2>
                </div>
                {!isAddingNew && (
                  <button
                    onClick={() => setIsAddingNew(true)}
                    className="flex items-center gap-1 text-blue-500 text-[10px] font-black uppercase hover:underline"
                  >
                    <Plus size={14} /> Add New Address
                  </button>
                )}
              </div>

              <div className="space-y-3 mb-6">
                {savedAddresses.map((addr) => (
                  <div
                    key={addr._id}
                    onClick={() => setSelectedAddress(addr)}
                    className={`p-5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                      selectedAddress?._id === addr._id
                        ? "border-blue-600 bg-blue-600/5"
                        : "border-slate-800 bg-slate-950/30 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedAddress?._id === addr._id
                            ? "border-blue-600"
                            : "border-slate-700"
                        }`}
                      >
                        {selectedAddress?._id === addr._id && (
                          <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold uppercase tracking-tight">
                          {addr.fullName}{" "}
                          <span className="ml-2 text-[9px] text-slate-500 font-black px-2 py-0.5 rounded-md bg-slate-800 uppercase">
                            {addr.type}
                          </span>
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {addr.addressLine || addr.street}, {addr.city} -{" "}
                          {addr.pincode}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* EXACT MATCH "ADD NEW ADDRESS" UI */}
              {isAddingNew && (
                <div className="mt-8 pt-8 border-t border-slate-800 animate-in slide-in-from-top-4 duration-300">
                  <h4 className="font-black text-slate-400 mb-6 text-[10px] uppercase tracking-[0.2em]">
                    Add New Address
                  </h4>
                  <button
                    onClick={handleUseCurrentLocation}
                    disabled={isLocating}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-bold text-xs mb-8 shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
                  >
                    {isLocating ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <LocateFixed size={16} />
                    )}{" "}
                    Use my current location
                  </button>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input
                      placeholder="Full Name"
                      value={newAddress.name}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, name: e.target.value })
                      }
                      className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:border-blue-600 outline-none transition-all placeholder:text-slate-600 font-medium"
                    />
                    <input
                      placeholder="Phone Number"
                      value={newAddress.phone}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, phone: e.target.value })
                      }
                      className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:border-blue-600 outline-none transition-all placeholder:text-slate-600 font-medium"
                    />
                    <input
                      placeholder="Street Address"
                      value={newAddress.street}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, street: e.target.value })
                      }
                      className="md:col-span-2 p-4 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:border-blue-600 outline-none transition-all placeholder:text-slate-600 font-medium"
                    />
                    <input
                      placeholder="City"
                      value={newAddress.city}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, city: e.target.value })
                      }
                      className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:border-blue-600 outline-none transition-all placeholder:text-slate-600 font-medium"
                    />
                    <input
                      placeholder="Pincode"
                      maxLength="6"
                      value={newAddress.pincode}
                      onChange={(e) =>
                        setNewAddress({
                          ...newAddress,
                          pincode: e.target.value,
                        })
                      }
                      className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:border-blue-600 outline-none transition-all placeholder:text-slate-600 font-medium"
                    />
                    <input
                      placeholder="State"
                      value={newAddress.state}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, state: e.target.value })
                      }
                      className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:border-blue-600 outline-none transition-all placeholder:text-slate-600 font-medium"
                    />
                    <input
                      value="India"
                      readOnly
                      className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-sm text-slate-500 cursor-not-allowed font-medium"
                    />
                  </div>

                  <div className="flex gap-4 mb-8 items-center">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Type
                    </span>
                    <div className="flex gap-3">
                      {["Home", "Work"].map((t) => (
                        <button
                          key={t}
                          onClick={() =>
                            setNewAddress({ ...newAddress, type: t })
                          }
                          className={`px-5 py-2 rounded-full text-xs font-bold border flex items-center gap-2 transition-all ${
                            newAddress.type === t
                              ? "bg-white text-slate-950 border-white"
                              : "border-slate-800 text-slate-500 hover:border-slate-600"
                          }`}
                        >
                          {t === "Home" ? (
                            <Home size={12} />
                          ) : (
                            <Briefcase size={12} />
                          )}{" "}
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={handleSaveNewAddress}
                      disabled={isSavingAddress}
                      className="bg-blue-600 text-white px-10 py-3 rounded-xl font-bold text-xs uppercase shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition-all"
                    >
                      {isSavingAddress ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        "Save & Use"
                      )}
                    </button>
                    <button
                      onClick={() => setIsAddingNew(false)}
                      className="text-slate-500 font-bold text-xs uppercase tracking-widest hover:text-slate-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* PAYMENT METHOD SECTION */}
            <div className="bg-slate-900/50 rounded-3xl border border-slate-800 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
                  <CreditCard size={18} />
                </div>
                <h2 className="font-bold uppercase tracking-widest text-[10px] text-slate-400">
                  Payment Method
                </h2>
              </div>
              <div className="space-y-3">
                {[
                  { id: "upi", label: "Online Payment (Razorpay)" },
                  { id: "cod", label: "Cash on Delivery" },
                ].map((mode) => (
                  <label
                    key={mode.id}
                    className={`flex items-center justify-between p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                      paymentMode === mode.id
                        ? "border-blue-600 bg-blue-600/5"
                        : "border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          paymentMode === mode.id
                            ? "border-blue-600"
                            : "border-slate-700"
                        }`}
                      >
                        {paymentMode === mode.id && (
                          <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />
                        )}
                      </div>
                      <span className="text-sm font-bold uppercase tracking-tight">
                        {mode.label}
                      </span>
                    </div>
                    <input
                      type="radio"
                      className="hidden"
                      checked={paymentMode === mode.id}
                      onChange={() => setPaymentMode(mode.id)}
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: PRICE DETAILS */}
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-slate-800 bg-slate-950/50">
                <h2 className="font-black uppercase tracking-[0.2em] text-[10px] text-slate-500">
                  Price Details
                </h2>
              </div>
              <div className="p-8 space-y-5">
                <div className="flex justify-between text-sm text-slate-400">
                  <span>Price ({totalItemCount} items)</span>
                  <span className="text-slate-100 font-bold">
                    ₹{totalMRP.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-slate-400">
                  <span>Discount</span>
                  <span className="text-green-500 font-bold">
                    - ₹{totalDiscount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-slate-400 border-b border-dashed border-slate-800 pb-5">
                  <span>Delivery</span>
                  <span
                    className={
                      deliveryFee === 0
                        ? "text-green-500 font-bold"
                        : "text-slate-100 font-bold"
                    }
                  >
                    {deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
                  </span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-lg font-bold text-slate-100">
                    Total Payable
                  </span>
                  <span className="text-2xl font-black text-white">
                    ₹{totalPayable.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="px-8 pb-8">
                <button
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 text-white font-black py-5 rounded-[1.5rem] shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-3 uppercase text-xs tracking-widest"
                >
                  {isProcessing ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>
                      <Lock size={18} /> Place Order Now
                    </>
                  )}
                </button>
                <div className="flex items-center justify-center gap-2 text-[9px] text-slate-600 font-bold uppercase mt-6 tracking-tighter">
                  <ShieldCheck size={14} /> 100% Secure Transaction via Razorpay
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <PaymentFooter />
    </div>
  );
}
