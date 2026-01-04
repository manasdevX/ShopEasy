import React from "react";
import { Gavel, Scale, AlertCircle } from "lucide-react";
import Navbar from "../components/PaymentHeader";

export default function Terms() {

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#030712]">
      <Navbar />
      <main className="flex-grow max-w-4xl w-full mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <div className="inline-flex p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-6 text-slate-600 dark:text-slate-400">
            <Gavel size={32} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4">
            Terms of Service
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
            Effective Date: Jan 1, 2026
          </p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-10">
          <div className="bg-orange-50 dark:bg-orange-900/10 p-6 rounded-3xl border border-orange-100 dark:border-orange-900/30 flex gap-4">
            <AlertCircle className="text-orange-500 shrink-0" />
            <p className="text-sm text-orange-800 dark:text-orange-200 font-medium">
              Please read these terms carefully. By creating a seller account,
              you agree to be bound by these conditions and our seller fee
              schedule.
            </p>
          </div>

          <section>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              <Scale size={24} className="text-slate-400" />
              1. Seller Obligations
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-4 leading-relaxed">
              As a seller on ShopEasy, you are responsible for the accuracy of
              your product listings, maintaining inventory levels, and ensuring
              that all items sold comply with local laws and safety regulations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              <Scale size={24} className="text-slate-400" />
              2. Fees and Payments
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-4 leading-relaxed">
              ShopEasy deducts a percentage-based commission on every successful
              sale. Payouts are processed on a weekly basis to your verified
              bank account, minus any returns or disputes.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
