import React, { useState } from "react";
import { Star, Camera, ShieldCheck, Loader2, Send, X } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { toast } from "react-hot-toast";

export default function ReviewSubmissionForm() {
  const { id } = useParams(); // Product ID from URL
  const navigate = useNavigate();

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    comment: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please select a star rating");
      return;
    }

    setIsSubmitting(true);
    // Logic for API call would go here
    try {
      // simulate delay
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Review submitted successfully!");
      navigate(-1);
    } catch (error) {
      toast.error("Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#030712] transition-colors duration-300 font-sans">
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 py-16">
        {/* HEADER SECTION */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            Share Your <span className="text-orange-500">Experience</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 font-medium">
            Your feedback helps other shoppers make better choices.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden">
          {/* VERIFIED BADGE BAR */}
          <div className="bg-green-500/10 py-3 px-8 flex items-center justify-center gap-2 border-b border-green-500/10">
            <ShieldCheck size={14} className="text-green-500" />
            <span className="text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-[0.2em]">
              Verified Purchase Review
            </span>
          </div>

          <form onSubmit={handleSubmit} className="p-8 lg:p-12 space-y-10">
            {/* 1. STAR RATING PICKER */}
            <div className="flex flex-col items-center gap-4">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                Tap to Rate
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                    className="transition-transform active:scale-90 focus:outline-none"
                  >
                    <Star
                      size={42}
                      className={`transition-all duration-200 ${
                        (hover || rating) >= star
                          ? "text-yellow-400 fill-yellow-400 scale-110"
                          : "text-slate-200 dark:text-slate-800"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs font-black text-orange-500 uppercase tracking-widest h-4">
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Very Good"}
                {rating === 5 && "Excellent"}
              </span>
            </div>

            {/* 3. REVIEW BODY */}
            <div className="space-y-2">
              <label className="text-[12px] ml-4 font-black text-slate-400 uppercase tracking-widest ml-1">
                Detailed Review
              </label>
              <textarea
                required
                rows="6"
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                placeholder="What did you like or dislike? How is the quality?"
                className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-300 outline-none focus:border-orange-500 transition-all resize-none"
              ></textarea>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 px-8 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-[2] bg-slate-900 dark:bg-orange-500 hover:bg-black dark:hover:bg-orange-600 text-white px-8 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    <Send size={16} /> Submit Review
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}