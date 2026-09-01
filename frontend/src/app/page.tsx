"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Leaf, UserCircle, Stethoscope, ArrowRight, BrainCircuit, Activity, HeartPulse, GraduationCap } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-white/85 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">Otri</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#como-funciona" className="hover:text-emerald-600 transition-colors">Como funciona</a>
            <a href="#sobre-tcc" className="hover:text-emerald-600 transition-colors">Sobre o Projeto</a>
            <Link href="/login/nutri" className="text-slate-400 hover:text-slate-700 transition-colors flex items-center gap-1" title="Acesso do Profissional">
              <Stethoscope className="w-4 h-4" /> Admin
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 lg:pt-48 lg:pb-40 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] opacity-40 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-300 via-teal-100 to-transparent blur-[120px] rounded-full mix-blend-multiply"></div>
        </div>

        <div className="max-w-5xl mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-sm font-bold mb-8 shadow-sm">
              <BrainCircuit className="w-4 h-4" /> Nutrição baseada em Inteligência Artificial
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-8 leading-[1.1]">
              O seu acompanhamento <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-600">
                nunca foi tão inteligente.
              </span>
            </h1>
            <p className="mt-4 text-lg md:text-2xl text-slate-600 max-w-3xl mx-auto mb-12 leading-relaxed">
              Converse com a sua dieta. O Otri utiliza IA generativa para entender o que você come e calcular suas calorias com exatidão matemática, guiado pelo seu Nutricionista.
            </p>
          </motion.div>

          {/* Call to Action Principal (Cliente) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/login/cliente" className="group flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-emerald-500/30 transition-all transform hover:-translate-y-1">
              <UserCircle className="w-6 h-6" />
              Acessar Meu Chat
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Como Funciona Section */}
      <section id="como-funciona" className="bg-white py-32 border-t border-slate-100 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-slate-900 mb-6">Tecnologia a favor da Saúde</h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              Nossa plataforma une o poder dos Grandes Modelos de Linguagem (LLM) com uma base de dados nutricional rigorosa (RAG) para garantir precisão zero-alucinação.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-10">
            {[
              {
                icon: Activity,
                title: "Cálculo Preciso (RAG)",
                desc: "Seus alimentos são vetorizados e comparados matematicamente para deduzir calorias sem margem de erro da IA."
              },
              {
                icon: BrainCircuit,
                title: "Comunicação Humana",
                desc: "A inteligência artificial adapta o tom da conversa baseado nas diretrizes exclusivas criadas pela sua nutricionista."
              },
              {
                icon: HeartPulse,
                title: "Acompanhamento Real",
                desc: "Ao longo do dia, o Otri avisa suas calorias restantes, sugere pratos do seu plano e calcula o consumo de água."
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:shadow-xl hover:border-emerald-100 transition-all group"
              >
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed text-lg">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Seção TCC / Equipe */}
      <section id="sobre-tcc" className="py-32 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-500/10 blur-[100px] rounded-full"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-16">
            <div className="md:w-1/2">
              <div className="flex items-center gap-3 text-emerald-400 mb-6 font-bold text-lg">
                <GraduationCap className="w-8 h-8" /> Projeto Acadêmico
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">Desenvolvido com excelência no TCC 2026.</h2>
              <p className="text-slate-300 text-lg leading-relaxed mb-8">
                O Otri nasceu da necessidade de modernizar o acompanhamento nutricional. 
                Construído como um microsserviço assíncrono em FastAPI e Next.js, 
                o projeto implementa arquiteturas robustas em nuvem (Supabase) e vetorização semântica (Sentence-Transformers) para revolucionar a usabilidade na área da saúde.
              </p>
            </div>
            
            <div className="md:w-1/2 w-full">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-10 backdrop-blur-md">
                <h3 className="text-2xl font-bold mb-8 text-emerald-300 border-b border-white/10 pb-4">Os Desenvolvedores</h3>
                <ul className="space-y-6">
                  {[
                    "Guilherme Henrique",
                    "Pedro Fernandes",
                    "Guilherme Nicchio"
                  ].map((nome, index) => (
                    <li key={index} className="flex items-center gap-4 text-xl font-medium">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold border border-emerald-500/30">
                        {nome.charAt(0)}
                      </div>
                      {nome}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer minimalista */}
      <footer className="bg-slate-50 py-12 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-slate-800 font-bold">
            <Leaf className="w-5 h-5 text-emerald-500" /> Otri
          </div>
          <p className="text-slate-500 text-sm">© 2026 Otri Nutrição. Trabalho de Conclusão de Curso.</p>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/login/nutri" className="text-slate-400 hover:text-emerald-600 transition-colors">
              Login Nutricionista
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
