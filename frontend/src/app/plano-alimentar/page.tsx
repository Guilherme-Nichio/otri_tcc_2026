"use client";

import React from "react";
import PlanoAlimentarForm from "../dashboard/PlanoAlimentarForm";
import Link from "next/link";
import { ArrowLeft, Stethoscope } from "lucide-react";

export default function PlanoAlimentarPage() {
  return (
    <div className="min-h-screen bg-[#EEF1F4] py-8 px-4">
      <div className="max-w-[880px] mx-auto mb-4 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-600 transition-colors bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao Dashboard
        </Link>
        <div className="flex items-center gap-2 text-emerald-600 font-bold text-lg">
          <Stethoscope className="w-5 h-5" /> Otri Nutrição
        </div>
      </div>
      
      <PlanoAlimentarForm />
    </div>
  );
}
