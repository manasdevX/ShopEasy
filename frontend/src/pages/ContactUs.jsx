import React from "react";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageCircle,
  ArrowRight,
} from "lucide-react";
import PaymentHeader from "../components/PaymentHeader"; 
import PaymentFooter from "../components/PaymentFooter";
import { useLocation } from "react-router-dom";


export default function ContactPage() {
    const location = useLocation();
    const comeFrom = location.state?.fromContact;

  const team = [
    { name: "Manas Agnihotri", phone: "+91 9690886564" },
    { name: "Shourya Shivhare", phone: "+91 9201630063" },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#030712] flex flex-col">
      <PaymentHeader backTo={comeFrom ? "/" : null} />

      <main className="flex-grow">
        <div className="max-w-6xl mx-auto px-6 py-20">
          {/* SECTION 1: SYSTEMATIC HEADER */}
          <div className="border-b border-slate-100 dark:border-slate-800 pb-12 mb-16">
            <h1 className="text-4xl font-light tracking-tight text-slate-900 dark:text-white sm:text-5xl">
              Contact{" "}
              <span className="font-semibold text-orange-500">Support</span>
            </h1>
            <p className="mt-4 text-slate-500 dark:text-slate-400 max-w-xl text-lg leading-relaxed">
              For inquiries regarding seller accounts, technical integration, or
              platform partnerships, please utilize the direct channels below.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* LEFT: DIRECT CONTACTS */}
            <div className="lg:col-span-8">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-8">
                Executive Team
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-100 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-lg overflow-hidden">
                {team.map((person, idx) => (
                  <div
                    key={idx}
                    className="bg-white dark:bg-[#030712] p-8 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                  >
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      {person.name}
                    </h3>
                    <p
                      className="inline-flex items-center gap-2 mt-4 text-orange-600 dark:text-orange-500 font-semibold group"
                    >
                      {person.phone}
                    </p>
                  </div>
                ))}
              </div>

              {/* OPERATIONAL HOURS — UPDATED SECTION */}
              <div className="mt-12 p-8 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400">
                      <Clock size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                        Availability
                      </p>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                        Operational Hours
                      </h4>
                    </div>
                  </div>

                  <div className="flex flex-col md:items-end">
                    <p className="text-xl font-bold text-slate-900 dark:text-white leading-none">
                      10:00 AM — 05:00 PM
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-orange-500 mt-2">
                      Monday — Friday
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: CORPORATE ADDRESS */}
            <div className="lg:col-span-4">
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-8 h-full border border-slate-100 dark:border-slate-800">
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">
                  Registered Office
                </h2>

                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-bold dark:text-white mb-2">
                      MNNIT Allahabad
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                      F-108, Tilak Hostel,
                      <br />
                      Motilal Nehru National Institute of Technology,
                      <br />
                      Prayagraj, Uttar Pradesh 211004
                    </p>
                  </div>

                  <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                      <Mail size={16} className="text-slate-400" />
                      <span>hello@shopeasy.com</span>
                    </div>
                  </div>
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
