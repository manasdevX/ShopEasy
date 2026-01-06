import { React , useEffect } from "react";
import { ShieldCheck, Eye, Lock, Globe, ArrowLeft, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/PaymentHeader";

export default function Privacy() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant", // Use "smooth" if you want a sliding effect
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#030712] font-sans transition-colors">
      <Navbar />

      <main className="flex-grow max-w-4xl w-full mx-auto px-6 py-16">
        {/* HEADER SECTION - Matches Terms format */}
        <div className="text-center mb-16">
          <div className="inline-flex p-4 bg-orange-50 dark:bg-orange-900/20 rounded-full mb-6 text-orange-600">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4">Privacy Policy</h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Last Updated: December 2025</p>
        </div>

        {/* CONTENT SECTION */}
        <div className="prose prose-slate dark:prose-invert max-w-none space-y-12">
          
          {/* Introductory Note */}
          <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-3xl border border-blue-100 dark:border-blue-900/30 flex gap-4">
            <Globe className="text-blue-500 shrink-0" size={24} />
            <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
              Your privacy is our priority. This document outlines how ShopEasy handles your seller data and the measures we take to keep your business information secure.
            </p>
          </div>

          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              <Eye size={24} className="text-slate-400" />
              1. Information We Collect
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-4 leading-relaxed">
              We collect personal and business information when you register as a seller. This includes your full name, email address, business registration details, and tax identification numbers necessary for legal compliance.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              <Lock size={24} className="text-slate-400" />
              2. Data Security
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-4 leading-relaxed">
              We implement industry-standard encryption to protect your sensitive data. All financial transactions and banking details are processed through secure, encrypted channels and are never stored in plain text on our servers.
            </p>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              <Bell size={24} className="text-slate-400" />
              3. Communications
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-4 leading-relaxed">
              By using the Seller Central platform, you agree to receive service-related notifications, security alerts, and administrative messages. You can manage your marketing preferences in your Account Settings.
            </p>
          </section>

        </div>
      </main>
    </div>
  );
}