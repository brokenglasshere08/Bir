import React, { useState } from 'react';
import { X, Star, CheckCircle, MessageSquare, Send } from 'lucide-react';
import { PatientReview } from '../lib/types.js';

interface ReviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviews: PatientReview[];
  onAddReview: (review: { patientName: string; rating: number; treatment: string; comment: string }) => Promise<void>;
}

export const ReviewsModal: React.FC<ReviewsModalProps> = ({
  isOpen,
  onClose,
  reviews,
  onAddReview
}) => {
  const [isWriting, setIsWriting] = useState(false);
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [treatment, setTreatment] = useState('Root Canal Treatment');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !comment.trim()) {
      setError('Please provide your name and review comments.');
      return;
    }

    try {
      setSubmitting(true);
      await onAddReview({
        patientName: name.trim(),
        rating,
        treatment,
        comment: comment.trim()
      });
      setName('');
      setComment('');
      setIsWriting(false);
      setSuccessMsg('Thank you! Your verified patient review has been posted.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Patient Reviews"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg max-h-[90vh] rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Patient Reviews & Ratings</h3>
            <p className="text-xs text-slate-500 font-medium">Verified clinical care experiences</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close reviews"
            className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5">
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-medium">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Rating Summary Card */}
          <div className="bg-gradient-to-br from-amber-50/80 via-orange-50/40 to-white border border-amber-200/70 rounded-2xl p-4 flex gap-4 items-center">
            <div className="text-center px-3 border-r border-amber-200 shrink-0">
              <span className="text-4xl font-black text-slate-900 block tracking-tight">4.9</span>
              <div className="flex text-amber-500 text-xs justify-center my-1 gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                ))}
              </div>
              <span className="text-[11px] text-slate-500 font-semibold block">
                {reviews.length} Verified Reviews
              </span>
            </div>
            <div className="flex-1 space-y-1.5 text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-4 text-right text-[11px]">5★</span>
                <div className="flex-1 h-2 bg-amber-200/60 rounded-full overflow-hidden">
                  <div className="w-[92%] h-full bg-amber-500 rounded-full"></div>
                </div>
                <span className="w-8 text-right text-slate-400 text-[11px]">92%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 text-right text-[11px]">4★</span>
                <div className="flex-1 h-2 bg-amber-200/60 rounded-full overflow-hidden">
                  <div className="w-[6%] h-full bg-amber-500 rounded-full"></div>
                </div>
                <span className="w-8 text-right text-slate-400 text-[11px]">6%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 text-right text-[11px]">3★</span>
                <div className="flex-1 h-2 bg-amber-200/60 rounded-full overflow-hidden">
                  <div className="w-[2%] h-full bg-amber-500 rounded-full"></div>
                </div>
                <span className="w-8 text-right text-slate-400 text-[11px]">2%</span>
              </div>
            </div>
          </div>

          {/* Write a Review Section */}
          {isWriting ? (
            <form onSubmit={handleSubmit} className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-900">Share Your Experience</span>
                <button
                  type="button"
                  onClick={() => setIsWriting(false)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>

              {error && (
                <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Your Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Rajesh Mehta"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-9 px-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Treatment Received</label>
                  <select
                    value={treatment}
                    onChange={(e) => setTreatment(e.target.value)}
                    className="w-full h-9 px-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Root Canal Treatment">Root Canal Treatment</option>
                    <option value="Deep Cleaning & Scaling">Deep Cleaning & Scaling</option>
                    <option value="Orthodontic Braces">Orthodontic Braces</option>
                    <option value="Cardiac Consultation">Cardiac Consultation</option>
                    <option value="Laser Teeth Whitening">Laser Teeth Whitening</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Rating</label>
                  <div className="flex items-center h-9 gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setRating(s)}
                        className="p-1 text-slate-300 hover:text-amber-500 transition"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            s <= rating ? 'fill-amber-500 text-amber-500' : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-slate-700 ml-1">{rating} / 5</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Review Comments</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe doctor consultation, treatment comfort, clinic hygiene..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
              >
                {submitting ? (
                  <span>Posting review...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Verified Review</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsWriting(true)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Write a Patient Review</span>
            </button>
          )}

          {/* Reviews List */}
          <div className="space-y-3.5">
            {reviews.map((rev) => (
              <div key={rev.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-full ${
                        rev.avatarColor || 'bg-blue-600'
                      } text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs`}
                    >
                      {rev.initials || rev.patientName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-extrabold text-slate-900">{rev.patientName}</h4>
                        {rev.verified && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded">
                            <CheckCircle className="w-2.5 h-2.5" /> Verified
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {rev.treatment} · {rev.date}
                      </p>
                    </div>
                  </div>
                  <div className="flex text-amber-500 text-xs gap-0.5">
                    {[...Array(rev.rating)].map((_, idx) => (
                      <Star key={idx} className="w-3 h-3 fill-amber-500 text-amber-500" />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {rev.comment}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
