"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Leaf, UserCircle, Stethoscope, ArrowRight, BrainCircuit } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans selection:bg-[var(--color-primary)] selection:text-white">
      
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[var(--color-primary)] rounded-xl flex items-center justify-center">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">Otri</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <a href="#projeto" className="hover:text-[var(--color-primary)] transition-colors">O Projeto</a>
            <a href="#tecnologia" className="hover:text-[var(--color-primary)] transition-colors">Tecnologia</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-30 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-200 blur-[100px] rounded-full mix-blend-multiply"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold mb-6">
              <BrainCircuit className="w-4 h-4" /> Projeto de TCC 2026
            </span>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-gray-900 mb-6 leading-tight">
              Nutrição aliada à <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] to-teal-500">
                Inteligência Artificial Híbrida
              </span>
            </h1>
            <p className="mt-4 text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-10">
              O Otri revoluciona o acompanhamento nutricional unindo a precisão dos cálculos matemáticos (RAG) à empatia dos modelos de linguagem LLM (Gemini).
            </p>
          </motion.div>

          {/* Action Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            {/* Card Nutricionista */}
            <Link href="/login/nutri" className="group w-full sm:w-72 bg-white border border-gray-200 rounded-3xl p-6 text-left shadow-lg hover:shadow-xl hover:border-blue-200 transition-all transform hover:-translate-y-1">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Stethoscope className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Sou Nutricionista</h3>
              <p className="text-sm text-gray-500 mt-2 mb-4">Acesse o painel para gerenciar pacientes e a IA.</p>
              <div className="flex items-center text-blue-600 font-medium text-sm group-hover:translate-x-1 transition-transform">
                Acessar Painel <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </Link>

            {/* Card Cliente */}
            <Link href="/login/cliente" className="group w-full sm:w-72 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] rounded-3xl p-6 text-left shadow-lg hover:shadow-xl shadow-emerald-500/30 transition-all transform hover:-translate-y-1">
              <div className="w-12 h-12 bg-white/20 text-white rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <UserCircle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Sou Cliente</h3>
              <p className="text-sm text-emerald-50 mt-2 mb-4">Converse com seu assistente nutricional via Chat.</p>
              <div className="flex items-center text-white font-medium text-sm group-hover:translate-x-1 transition-transform">
                Acessar Chat <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Details Section */}
      <section id="projeto" className="bg-white py-24 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Arquitetura do Microsserviço</h2>
            <p className="text-gray-500 mt-4 max-w-2xl mx-auto">Feito com as melhores tecnologias em nuvem para zero custo e alta escalabilidade.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-3">⚡ FastAPI Assíncrono</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Backend de altíssima performance estruturado como um microsserviço puro, focado apenas em rotas JSON e IO non-blocking.
              </p>
            </div>
            <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-3">🧠 RAG + LLM (Gemini)</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                As calorias e dados são calculados localmente com exatidão matemática, enquanto a IA do Google Gemini apenas atua como a "voz" empática.
              </p>
            </div>
            <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-3">☁️ Supabase Cloud</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Banco de dados migrado de SQLite para PostgreSQL na nuvem via Supabase, pronto para salvar vetores (JSONB) nativamente.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
