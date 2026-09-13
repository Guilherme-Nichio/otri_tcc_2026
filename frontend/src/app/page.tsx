"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { 
  Leaf, UserCircle, Stethoscope, ArrowRight, BrainCircuit, Activity, 
  HeartPulse, GraduationCap, Bot, Sparkles 
} from "lucide-react";

function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
    </svg>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F7F5F0] text-slate-800 font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* Navbar Estilizada com Fundo #F7F5F0 */}
      <nav className="fixed top-0 w-full bg-[#F7F5F0]/90 backdrop-blur-xl border-b border-stone-300/70 shadow-sm z-50 transition-all">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex justify-between items-center">
          {/* Logo Mantido Intacto */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-md shadow-emerald-600/20">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-slate-900">Otri</span>
          </div>

          {/* Links de Navegação com Design Ajustado */}
          <div className="hidden md:flex items-center gap-3 text-sm font-semibold">
            <a 
              href="#como-funciona" 
              className="px-4 py-2 rounded-xl text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 border border-transparent hover:border-emerald-200/60 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-emerald-600 opacity-80" /> Como funciona
            </a>
            <a 
              href="#sobre-tcc" 
              className="px-4 py-2 rounded-xl text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 border border-transparent hover:border-emerald-200/60 transition-all flex items-center gap-2"
            >
              <GraduationCap className="w-4 h-4 text-emerald-600 opacity-80" /> Sobre o Projeto
            </a>
            <Link 
              href="/login/nutri" 
              className="px-4 py-2 rounded-xl text-emerald-700 hover:text-emerald-800 bg-emerald-100/70 hover:bg-emerald-100 border border-emerald-300/60 transition-all flex items-center gap-2 font-bold shadow-sm" 
              title="Acesso do Profissional"
            >
              <Stethoscope className="w-4 h-4 text-emerald-700" /> Portal Nutri
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section com Fundo #F7F5F0 e Imagem de Nutrição/Tecnologia */}
      <section className="relative pt-32 pb-16 lg:pt-44 lg:pb-24 overflow-hidden bg-[#F7F5F0] text-slate-900">
        {/* Imagem de Fundo Nutrição + Tecnologia com Película de Embaçamento em Degradê Verde */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-95">
          <img
            src="/nutrition_tech_bg.svg"
            alt="Nutrição e Tecnologia Fundo"
            className="w-full h-full object-cover"
          />
          {/* Película embaçada (blur) com degradê verde esmeralda */}
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-800/10 via-emerald-600/15 to-[#F7F5F0] backdrop-blur-[3px]"></div>
        </div>

        <div className="max-w-5xl mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300/60 text-sm font-bold mb-8 shadow-sm backdrop-blur-md">
              <BrainCircuit className="w-4 h-4 text-emerald-700" /> Nutrição baseada em Inteligência Artificial
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-8 leading-[1.1]">
              O seu acompanhamento <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700">
                nunca foi tão inteligente.
              </span>
            </h1>
            <p className="mt-4 text-lg md:text-2xl text-slate-700 max-w-3xl mx-auto mb-12 leading-relaxed">
              Converse com a sua dieta. O Otri utiliza IA generativa para entender o que você come e calcular suas calorias com exatidão matemática, guiado pelo seu Nutricionista.
            </p>
          </motion.div>

          {/* Call to Action Principal */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-5"
          >
            <Link href="/login/cliente" className="group flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-emerald-600/20 transition-all transform hover:-translate-y-1">
              <UserCircle className="w-6 h-6" />
              Acessar Meu Chat (Cliente)
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/login/nutri" className="group flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-5 bg-white hover:bg-stone-50 text-slate-900 border border-stone-300 rounded-2xl font-bold text-lg shadow-md transition-all transform hover:-translate-y-1">
              <Stethoscope className="w-6 h-6 text-emerald-600" />
              Portal do Nutricionista
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Seção Tecnologia a favor da Saúde - Fundo #F7F5F0 */}
      <section id="como-funciona" className="bg-[#F7F5F0] py-10 px-6 relative border-t border-stone-200/60">
        <div className="max-w-6xl mx-auto">
          {/* Card Central com Bordas Arredondadas */}
          <div className="relative bg-slate-900 rounded-[2.5rem] p-8 md:p-14 border border-emerald-500/20 shadow-2xl overflow-hidden text-white">
            {/* Decorações sutis de fundo */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500/10 blur-[100px] rounded-full pointer-events-none"></div>

            {/* Cabeçalho com Robô Humanoide IA */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-14 relative z-10 border-b border-slate-800 pb-10">
              <div className="flex items-center gap-6">
                {/* Ícone de Robô Humanoide IA */}
                <div className="relative w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-3xl p-0.5 shadow-xl shadow-emerald-500/20 flex-shrink-0">
                  <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <Bot className="w-10 h-10 text-emerald-400" />
                  </div>
                </div>
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold mb-2">
                    <Sparkles className="w-3.5 h-3.5" /> Assistente Virtual Humanoide
                  </div>
                  <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                    Tecnologia a favor da Saúde
                  </h2>
                </div>
              </div>
              <p className="text-slate-300 text-base md:text-lg max-w-lg leading-relaxed">
                Nossa plataforma une o poder da Inteligência Artificial Generativa com uma base de dados nutricional rigorosa (RAG) para garantir precisão absoluta.
              </p>
            </div>
            
            {/* Grid de Recursos */}
            <div className="grid md:grid-cols-3 gap-8 relative z-10">
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
                  className="bg-slate-800/60 backdrop-blur-md p-8 rounded-3xl border border-slate-700/60 hover:border-emerald-500/40 hover:bg-slate-800 transition-all group"
                >
                  <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-slate-300 leading-relaxed text-sm">
                    {feature.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Seção TCC / Equipe - Espaçamento e Estilo Idêntico ao Bloco de Cima */}
      <section id="sobre-tcc" className="bg-[#F7F5F0] py-10 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 md:p-14 shadow-2xl relative overflow-hidden border border-slate-800">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none"></div>
            <div className="flex flex-col md:flex-row items-center justify-between gap-16 relative z-10">
              <div className="md:w-1/2">
                <div className="flex items-center gap-3 text-emerald-400 mb-6 font-bold text-lg">
                  <GraduationCap className="w-8 h-8" /> Projeto Acadêmico
                </div>
                <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-8 leading-tight">
                  Desenvolvimento TCC 2026 Ciência da Computação
                </h2>
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
        </div>
      </section>

      {/* Rodapé com Fundo #F7F5F0 */}
      <footer className="bg-[#F7F5F0] py-12 border-t border-stone-300/80 text-slate-700">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">Otri</span>
          </div>

          <p className="text-slate-600 text-sm font-medium text-center md:text-left">
            © 2026 Otri Nutrição. Trabalho de Conclusão de Curso.
          </p>

          {/* Instagram Otri */}
          <a
            href="https://instagram.com/otri.ia"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white border border-stone-300 hover:border-emerald-500 text-slate-800 hover:text-emerald-700 transition-all shadow-sm group"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold group-hover:scale-110 transition-transform">
              <InstagramIcon className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold tracking-wide">@otri.ia</span>
          </a>
        </div>
      </footer>
    </div>
  );
}
