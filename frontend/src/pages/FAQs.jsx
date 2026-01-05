import React, { useState, useEffect } from "react";
import { Search, ChevronDown, MessageSquare, HelpCircle, ArrowLeft } from "lucide-react";
import Navbar from "../components/PaymentHeader";
import Footer from "../components/PaymentFooter";
import { useNavigate } from "react-router-dom";

export default function FAQs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState(null);

  const navigate = useNavigate();

  // Auto-scroll to top on load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const faqData = [
    {
      question: "How do I start selling on ShopEasy?",
      answer: "To start selling, create a Seller account, complete your business registration, and verify your bank details. Once approved, you can begin listing products immediately.",
      category: "Getting Started"
    },
    {
      question: "What are the commission fees?",
      answer: "ShopEasy charges a standard commission of 5-15% depending on the product category. There are no hidden monthly subscription fees for basic sellers.",
      category: "Payments"
    },
    {
      question: "When do I get paid for my sales?",
      answer: "Payouts are processed weekly every Monday for all delivered orders that have passed the 7-day return window.",
      category: "Payments"
    },
    {
      question: "How do I handle customer returns?",
      answer: "When a customer initiates a return, you will receive a notification. You can choose to accept the return or dispute it if the item is returned in a damaged condition.",
      category: "Orders"
    },
    {
      question: "Can I sell internationally?",
      answer: "Currently, ShopEasy Seller Central supports domestic shipping. International shipping options are planned for a future update in late 2026.",
      category: "Shipping"
    }
  ];

  const filteredFaqs = faqData.filter(faq => 
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleAccordion = (index) => {
    setActiveTab(activeTab === index ? null : index);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#030712] transition-colors duration-300">
      <Navbar/>

      {/* Hero Header */}
      <div className="bg-white dark:bg-slate-950 py-16 px-6 border-b border-slate-800">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex p-3 bg-orange-500/10 rounded-2xl mb-6">
            <HelpCircle className="text-orange-500" size={32} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4">Frequently Asked Questions</h1>
          <p className="text-slate-400 font-medium mb-8">Everything you need to know about the ShopEasy Seller platform.</p>
          
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            <input 
              type="text" 
              placeholder="Search for answers..."
              className="w-full h-14 bg-white dark:bg-slate-900 rounded-2xl pl-14 pr-6 text-slate-900 dark:text-white font-medium shadow-xl focus:outline-none focus:ring-4 focus:ring-orange-500/20 transition-all border-none"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <main className="flex-grow max-w-3xl w-full mx-auto px-6 py-16">
        <div className="space-y-4">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, index) => (
              <div 
                key={index} 
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all hover:shadow-md"
              >
                <button 
                  onClick={() => toggleAccordion(index)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">
                      {faq.category}
                    </span>
                    <span className="text-lg font-bold text-slate-900 dark:text-white">
                      {faq.question}
                    </span>
                  </div>
                  <div className={`p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 transition-transform duration-300 ${activeTab === index ? "rotate-180" : ""}`}>
                    <ChevronDown size={20} />
                  </div>
                </button>
                
                <div className={`transition-all duration-300 ease-in-out ${activeTab === index ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
                  <div className="p-6 pt-0 text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-50 dark:border-slate-800/50">
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20">
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No answers found for "{searchTerm}"</p>
            </div>
          )}
        </div>

        {/* Bottom CTA */}
        <div className="mt-20 p-8 bg-orange-500 rounded-[3rem] text-center text-white shadow-2xl shadow-orange-500/20">
          <h2 className="text-2xl font-black mb-2">Still have questions?</h2>
          <p className="opacity-90 mb-8 font-medium">Our dedicated seller support team is ready to help you 24/7.</p>
          <button onClick={() => navigate("/ContactUs" , { state: { fromContact: true } })} className="bg-white text-orange-500 px-8 py-4 rounded-2xl font-black text-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-3 mx-auto">
            <MessageSquare size={18} /> Contact Support
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}