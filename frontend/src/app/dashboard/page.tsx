"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Stethoscope, LogOut, Users, Settings, Activity } from "lucide-react";

export default function DashboardNutri() {
  const router = useRouter();
  const [nutriNome, setNutriNome] = useState("");

  useEffect(() => {
    const nome = localStorage.getItem("nutri_nome");
    if (!nome) {
      router.push("/");
    } else {
      setNutriNome(nome);
    }
  }, [router]);

  const logout = () => {
    localStorage.clear();
    router.push("/");
  };

  if (!nutriNome) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3 text-blue-600">
          <Stethoscope className="w-8 h-8" />
          <h2 className="text-xl font-bold text-gray-800">Otri Admin</h2>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-blue-700 bg-blue-50 rounded-xl font-medium transition-colors">
            <Activity className="w-5 h-5" /> Dashboard
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl font-medium transition-colors opacity-50 cursor-not-allowed" title="Em breve">
            <Users className="w-5 h-5" /> Meus Pacientes
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl font-medium transition-colors opacity-50 cursor-not-allowed" title="Em breve">
            <Settings className="w-5 h-5" /> Configurar IA
          </button>
        </nav>
        
        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors"
          >
            <LogOut className="w-5 h-5" /> Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl"
        >
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Bem-vinda(o), {nutriNome}! 👋</h1>
          <p className="text-gray-600 mb-8">Aqui você gerencia seus pacientes e o comportamento da IA.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Pacientes Ativos</h3>
              <p className="text-3xl font-black text-blue-600 mt-2">--</p>
              <p className="text-sm text-gray-500 mt-2">Funcionalidade em desenvolvimento</p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Interações da IA</h3>
              <p className="text-3xl font-black text-emerald-600 mt-2">--</p>
              <p className="text-sm text-gray-500 mt-2">Funcionalidade em desenvolvimento</p>
            </div>
          </div>
          
          <div className="mt-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 text-white shadow-lg">
            <h2 className="text-2xl font-bold mb-2">Painel em Construção 🚧</h2>
            <p className="text-blue-100 opacity-90 max-w-2xl">
              Este painel administrativo faz parte da evolução do TCC. Atualmente, os recursos de gestão avançados (adicionar itens ao plano, criar dietas) e a configuração da Persona do bot podem ser testados na documentação interativa da API (Swagger).
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
