"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Stethoscope, LogOut, Users, Settings, Activity, UserCircle, 
  Plus, Search, ChevronRight, X, Loader2, Save, BrainCircuit, Apple, 
  FileText, ShieldAlert, CheckCircle2, Clock, Target, TrendingUp, Sparkles, Droplets
} from "lucide-react";
import axios from "axios";
import PlanoAlimentarForm from "./PlanoAlimentarForm";

// Tipos
type Cliente = {
  id_cliente: string;
  nome: string;
  email: string;
  peso_kg: number;
  altura_cm: number;
  idade?: number;
  sexo?: string;
  meta: string;
  ativo: boolean;
  anamnese: any;
  ia_persona: string;
  ia_restricoes: string;
};

type ItemPlano = {
  id: string;
  nome: string;
  per_100g: { cal: number; prot: number; carb: number; fat: number };
};

type Plano = {
  [refeicao: string]: ItemPlano[];
};

export default function DashboardNutri() {
  const router = useRouter();
  const [nutriId, setNutriId] = useState("");
  const [nutriNome, setNutriNome] = useState("");
  
  const [activeTab, setActiveTab] = useState<"dashboard" | "clientes" | "ai_config">("dashboard");
  const [loading, setLoading] = useState(true);
  
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  
  // Cliente Sub-Tabs
  const [clientTab, setClientTab] = useState<"overview" | "plano" | "prontuario" | "ia" | "chat">("overview");
  const [planoAtual, setPlanoAtual] = useState<Plano | null>(null);
  const [monitoramento, setMonitoramento] = useState<any>({ ultima_mensagem: null, ultimo_registro: null });
  const [chatHistorico, setChatHistorico] = useState<any[]>([]);
  const [nutriMensagem, setNutriMensagem] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);

  // Bot Global Config
  const [botConfig, setBotConfig] = useState({ persona: "", restricoes: "", cor: "#10b981" });
  const [savingBot, setSavingBot] = useState(false);

  // Form states
  const [novoItem, setNovoItem] = useState({ refeicao: "cafe da manha", nome_alimento: "", cal_100g: "", prot_100g: "", carb_100g: "", fat_100g: "" });
  const [addingItem, setAddingItem] = useState(false);
  
  const [novoCliente, setNovoCliente] = useState({ nome: "", email: "", senha: "", idade: "", sexo: "F", peso: "", altura: "" });
  const [creatingClient, setCreatingClient] = useState(false);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  
  const [showEditClientModal, setShowEditClientModal] = useState(false);
  const [editCliente, setEditCliente] = useState({ nome: "", idade: "", sexo: "F", peso_kg: "", altura_cm: "" });
  const [savingClient, setSavingClient] = useState(false);

  const [savingAnamnese, setSavingAnamnese] = useState(false);
  const [anamneseEdit, setAnamneseEdit] = useState({ 
    doencas: "", intolerancias: "", estilo_vida: "", observacoes: "", 
    peso_alvo: "", objetivo: "", agua_meta: "" 
  });
  const [iaClientEdit, setIaClientEdit] = useState({ persona: "", restricoes: "" });
  
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem("nutri_id");
    const nome = localStorage.getItem("nutri_nome");
    if (!id || !nome) {
      router.push("/login/nutri");
    } else {
      setNutriId(id);
      setNutriNome(nome);
      fetchData(id);
    }
  }, [router]);

  const fetchData = async (id: string) => {
    setLoading(true);
    try {
      const [resClientes, resBot] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/nutricionistas/${id}/clientes`),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/nutricionistas/${id}/bot-config`).catch(() => ({ data: null }))
      ]);
      setClientes(resClientes.data || []);
      if (resBot.data) {
        setBotConfig({
          persona: resBot.data.bot_persona || "",
          restricoes: resBot.data.bot_restricoes || "",
          cor: resBot.data.bot_cor || "#10b981"
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const abrirCliente = async (c_short: any) => {
    setClientTab("overview");
    setClienteSelecionado(null);
    try {
      const [resPerfil, resPlano, resMon] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/clientes/${c_short.id_cliente}/perfil`),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/planos/${c_short.id_cliente}`),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/clientes/${c_short.id_cliente}/monitoramento`)
      ]);
      const clienteCompleto = resPerfil.data;
      setClienteSelecionado(clienteCompleto);
      setPlanoAtual(resPlano.data);
      setMonitoramento(resMon.data);
      
      const anam = clienteCompleto.anamnese || {};
      setAnamneseEdit({
        doencas: anam.doencas || "",
        intolerancias: anam.intolerancias || "",
        estilo_vida: anam.estilo_vida || "",
        observacoes: anam.observacoes || "",
        peso_alvo: anam.peso_alvo || "",
        objetivo: anam.objetivo || "",
        agua_meta: anam.agua_meta || ""
      });
      setIaClientEdit({
        persona: clienteCompleto.ia_persona || "",
        restricoes: clienteCompleto.ia_restricoes || ""
      });
      fetchChat(c_short.id_cliente);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchChat = async (id: string) => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/chat/${id}/historico`);
      setChatHistorico(res.data || []);
    } catch (err) {}
  };

  const gerarRelatorioIA = async () => {
    if (!clienteSelecionado) return;
    setLoadingReport(true);
    setShowReportModal(true);
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/clientes/${clienteSelecionado.id_cliente}/relatorio-ia`);
      setAiReport(res.data.relatorio);
    } catch (err) {
      console.error(err);
      setAiReport("Erro ao gerar relatório. Tente novamente mais tarde.");
    } finally {
      setLoadingReport(false);
    }
  };

  const enviarMensagemNutri = async () => {
    if(!nutriMensagem.trim() || !clienteSelecionado) return;
    setSendingMsg(true);
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/chat/${clienteSelecionado.id_cliente}/nutri`, { texto: nutriMensagem });
      setNutriMensagem("");
      fetchChat(clienteSelecionado.id_cliente);
    } catch (err) {
      console.error(err);
    }
    setSendingMsg(false);
  };


  const criarPaciente = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingClient(true);
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}` + "/api/clientes", {
        id_nutri: nutriId,
        nome: novoCliente.nome,
        email: novoCliente.email,
        senha: novoCliente.senha,
        idade: parseInt(novoCliente.idade),
        sexo: novoCliente.sexo,
        peso_kg: parseFloat(novoCliente.peso),
        altura_cm: parseFloat(novoCliente.altura),
        atividade: "sedentario"
      });
      setShowNewClientModal(false);
      setNovoCliente({ nome: "", email: "", senha: "", idade: "", sexo: "F", peso: "", altura: "" });
      fetchData(nutriId);
    } catch (err) {
      alert("Erro ao criar paciente.");
    } finally {
      setCreatingClient(false);
    }
  };

  const atualizarPacienteBasico = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!clienteSelecionado) return;
    setSavingClient(true);
    try {
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/clientes/${clienteSelecionado.id_cliente}/basico`, {
        nome: editCliente.nome,
        idade: parseInt(editCliente.idade),
        sexo: editCliente.sexo,
        peso_kg: parseFloat(editCliente.peso_kg),
        altura_cm: parseFloat(editCliente.altura_cm)
      });
      setShowEditClientModal(false);
      
      // Update local state so it reflects immediately
      setClienteSelecionado({
        ...clienteSelecionado,
        nome: editCliente.nome,
        peso_kg: parseFloat(editCliente.peso_kg),
        altura_cm: parseFloat(editCliente.altura_cm)
      });
      fetchData(nutriId);
    } catch (err) {
      alert("Erro ao atualizar paciente.");
    } finally {
      setSavingClient(false);
    }
  };

  const toggleStatusCliente = async () => {
    if (!clienteSelecionado) return;
    const novoStatus = !clienteSelecionado.ativo;
    try {
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/clientes/${clienteSelecionado.id_cliente}/status`, { ativo: novoStatus });
      setClienteSelecionado({ ...clienteSelecionado, ativo: novoStatus });
      setClientes(clientes.map(c => c.id_cliente === clienteSelecionado.id_cliente ? { ...c, ativo: novoStatus } : c));
    } catch (err) {
      alert("Erro ao alterar status.");
    }
  };

  const salvarDetalhesCliente = async () => {
    if (!clienteSelecionado) return;
    setSavingAnamnese(true);
    try {
      const novaAnamnese = {
        ...clienteSelecionado.anamnese,
        ...anamneseEdit
      };
      
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/clientes/${clienteSelecionado.id_cliente}/detalhes`, {
        anamnese: novaAnamnese,
        ia_persona: iaClientEdit.persona,
        ia_restricoes: iaClientEdit.restricoes
      });
      setClienteSelecionado({
        ...clienteSelecionado, 
        anamnese: novaAnamnese, 
        ia_persona: iaClientEdit.persona, 
        ia_restricoes: iaClientEdit.restricoes 
      });
      alert("Salvo com sucesso!");
    } catch (err) {
      alert("Erro ao salvar prontuário/IA.");
    } finally {
      setSavingAnamnese(false);
    }
  };

  const salvarBotConfig = async () => {
    setSavingBot(true);
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/nutricionistas/${nutriId}/bot-config`, {
        persona: botConfig.persona,
        restricoes: botConfig.restricoes,
        cor: botConfig.cor
      });
      alert("Configuração global da IA salva com sucesso!");
    } catch (err) {
      alert("Erro ao salvar configuração.");
    } finally {
      setSavingBot(false);
    }
  };

  const adicionarItemAoPlano = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteSelecionado) return;
    setAddingItem(true);
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/planos/${clienteSelecionado.id_cliente}`, {
        refeicao: novoItem.refeicao,
        nome_alimento: novoItem.nome_alimento,
        cal_100g: parseFloat(novoItem.cal_100g),
        prot_100g: parseFloat(novoItem.prot_100g) || 0,
        carb_100g: parseFloat(novoItem.carb_100g) || 0,
        fat_100g: parseFloat(novoItem.fat_100g) || 0,
      });
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/planos/${clienteSelecionado.id_cliente}`);
      setPlanoAtual(res.data);
      setNovoItem({ ...novoItem, nome_alimento: "", cal_100g: "", prot_100g: "", carb_100g: "", fat_100g: "" });
    } catch (err) {
      alert("Erro ao adicionar item.");
    } finally {
      setAddingItem(false);
    }
  };

  const logout = () => {
    localStorage.clear();
    router.push("/");
  };

  if (!nutriNome) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed h-full z-10 shadow-sm">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3 text-emerald-600">
          <Stethoscope className="w-8 h-8" />
          <h2 className="text-xl font-bold text-slate-800">Otri CRM</h2>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 mt-4">
          <button 
            onClick={() => {setActiveTab("dashboard"); setClienteSelecionado(null);}}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === "dashboard" ? "text-emerald-700 bg-emerald-50" : "text-slate-600 hover:bg-slate-50"}`}
          >
            <Activity className="w-5 h-5" /> Início
          </button>
          <button 
            onClick={() => setActiveTab("clientes")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === "clientes" ? "text-emerald-700 bg-emerald-50" : "text-slate-600 hover:bg-slate-50"}`}
          >
            <Users className="w-5 h-5" /> Meus Pacientes
          </button>
          <button 
            onClick={() => {setActiveTab("ai_config"); setClienteSelecionado(null);}}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === "ai_config" ? "text-emerald-700 bg-emerald-50" : "text-slate-600 hover:bg-slate-50"}`}
          >
            <BrainCircuit className="w-5 h-5" /> Configuração IA
          </button>
        </nav>
        
        <div className="p-4 border-t border-slate-200">
          <div className="px-4 py-3 mb-2 flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-sm">
              {nutriNome.charAt(0)}
            </div>
            <div className="text-sm font-bold text-slate-700 truncate">{nutriNome}</div>
          </div>
          <button onClick={logout} className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors">
            <LogOut className="w-5 h-5" /> Sair
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        {loading ? (
          <div className="flex h-full items-center justify-center text-slate-400">
            <Loader2 className="w-10 h-10 animate-spin" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            
            {/* Aba: Dashboard Geral */}
            {activeTab === "dashboard" && (
              <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Resumo Geral</h1>
                <p className="text-slate-500 mb-8 text-lg">Monitore seus pacientes e a atividade da Inteligência Artificial.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-6">
                    <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                      <Users className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 font-medium">Pacientes Cadastrados</p>
                      <h3 className="text-3xl font-black text-slate-800">{clientes.length}</h3>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-6">
                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                      <BrainCircuit className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 font-medium">IA Híbrida Global</p>
                      <h3 className="text-xl font-bold text-emerald-600 mt-1">Configurada</h3>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Aba: Pacientes */}
            {activeTab === "clientes" && (
              <motion.div key="clientes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex gap-6 h-[calc(100vh-100px)]">
                
                {/* Lista Lateral */}
                <div className="w-1/3 bg-white border border-slate-200 rounded-3xl overflow-hidden flex flex-col shadow-sm">
                  <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-800">Meus Pacientes</h2>
                    <button 
                      onClick={() => setShowNewClientModal(true)}
                      className="bg-emerald-600 text-white p-2 rounded-lg hover:bg-emerald-700 transition-colors"
                      title="Novo Paciente"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {clientes.length === 0 ? (
                      <p className="text-center text-slate-500 mt-10 text-sm">Nenhum paciente cadastrado.</p>
                    ) : (
                      clientes.map(c => (
                        <button 
                          key={c.id_cliente}
                          onClick={() => abrirCliente(c)}
                          className={`w-full text-left p-4 rounded-2xl transition-all flex items-center justify-between group ${clienteSelecionado?.id_cliente === c.id_cliente ? 'bg-emerald-50 border border-emerald-100 shadow-sm' : 'hover:bg-slate-50 border border-transparent'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${clienteSelecionado?.id_cliente === c.id_cliente ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                              {c.nome.charAt(0)}
                            </div>
                            <div>
                              <p className={`font-bold ${clienteSelecionado?.id_cliente === c.id_cliente ? 'text-emerald-900' : 'text-slate-800'}`}>{c.nome}</p>
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${c.ativo ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                <p className="text-xs text-slate-500">{c.ativo ? 'Ativo' : 'Inativo'}</p>
                              </div>
                            </div>
                          </div>
                          <ChevronRight className={`w-5 h-5 ${clienteSelecionado?.id_cliente === c.id_cliente ? 'text-emerald-500' : 'text-slate-300 group-hover:text-slate-400'}`} />
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Área de Detalhes */}
                <div className="w-2/3 bg-white border border-slate-200 rounded-3xl overflow-hidden flex flex-col shadow-sm">
                  {!clienteSelecionado ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                      <UserCircle className="w-20 h-20 mb-4 opacity-20" />
                      <p className="text-lg">Selecione um paciente ao lado</p>
                    </div>
                  ) : (
                    <>
                      {/* Header Paciente */}
                      <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-2xl font-bold text-slate-900">{clienteSelecionado.nome}</h2>
                            {!clienteSelecionado.ativo && <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-md">Bloqueado</span>}
                          </div>
                          <div className="text-sm text-slate-500 font-medium">
                            {clienteSelecionado.idade} anos • {clienteSelecionado.sexo} • {clienteSelecionado.peso_kg} kg • {clienteSelecionado.altura_cm} cm
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              setEditCliente({
                                nome: clienteSelecionado.nome,
                                idade: clienteSelecionado.idade?.toString() || "",
                                sexo: clienteSelecionado.sexo || "F",
                                peso_kg: clienteSelecionado.peso_kg?.toString() || "",
                                altura_cm: clienteSelecionado.altura_cm?.toString() || ""
                              });
                              setShowEditClientModal(true);
                            }}
                            className="px-4 py-2 rounded-xl text-sm font-bold bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors flex items-center gap-2"
                          >
                            <Settings className="w-4 h-4"/> Editar Dados
                          </button>
                          <button 
                            onClick={toggleStatusCliente}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${clienteSelecionado.ativo ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                          >
                            {clienteSelecionado.ativo ? "Bloquear Acesso" : "Desbloquear Acesso"}
                          </button>
                        </div>
                      </div>

                      {/* Navegação Sub-Abas */}
                      <div className="flex px-6 border-b border-slate-200 bg-white">
                        <button onClick={() => setClientTab("overview")} className={`py-4 px-4 font-semibold text-sm border-b-2 transition-colors ${clientTab === "overview" ? "border-emerald-500 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}>Visão Geral</button>
                        <button onClick={() => setClientTab("prontuario")} className={`py-4 px-4 font-semibold text-sm border-b-2 transition-colors ${clientTab === "prontuario" ? "border-emerald-500 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}>Prontuário</button>
                        <button onClick={() => setClientTab("plano")} className={`py-4 px-4 font-semibold text-sm border-b-2 transition-colors ${clientTab === "plano" ? "border-emerald-500 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}>Plano Alimentar</button>
                        <button onClick={() => setClientTab("ia")} className={`py-4 px-4 font-semibold text-sm border-b-2 transition-colors ${clientTab === "ia" ? "border-purple-500 text-purple-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}>IA Customizada</button>
                        <button onClick={() => setClientTab("chat")} className={`py-4 px-4 font-semibold text-sm border-b-2 transition-colors ${clientTab === "chat" ? "border-blue-500 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}>Monitorar Chat</button>
                      </div>

                      {/* Conteúdo das Sub-Abas */}
                      <div className="flex-1 overflow-y-auto p-6 bg-white">
                        
                        {/* OVERVIEW */}
                        {clientTab === "overview" && (
                          <div className="space-y-6">
                            
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-bold text-slate-800">Evolução e Metas</h3>
                              <button onClick={gerarRelatorioIA} className="bg-purple-100 hover:bg-purple-200 text-purple-700 font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-colors text-sm">
                                <Sparkles className="w-4 h-4" /> Sintetizar Semana com IA
                              </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-2 text-slate-500 mb-2"><TrendingUp className="w-4 h-4"/> Peso Atual vs Alvo</div>
                                <div className="flex items-end gap-3 mb-2">
                                  <div className="text-3xl font-black text-emerald-600">{clienteSelecionado.peso_kg}<span className="text-base font-medium text-emerald-400">kg</span></div>
                                  <div className="text-slate-400 font-medium mb-1">/ {anamneseEdit.peso_alvo || "--"} kg alvo</div>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-2.5">
                                  {anamneseEdit.peso_alvo && clienteSelecionado.peso_kg ? (
                                    <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: `${Math.min(100, (clienteSelecionado.peso_kg / Number(anamneseEdit.peso_alvo)) * 100)}%` }}></div>
                                  ) : (
                                    <div className="bg-emerald-500 h-2.5 rounded-full w-0"></div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
                                <div>
                                  <div className="flex items-center gap-2 text-slate-500 mb-1"><Clock className="w-4 h-4"/> Último Acesso (Chat)</div>
                                  <div className="font-bold text-slate-800">
                                    {monitoramento.ultima_mensagem ? new Date(monitoramento.ultima_mensagem).toLocaleString() : "Nunca acessou"}
                                  </div>
                                </div>
                                <div className="pt-2 border-t border-slate-200">
                                  <div className="flex items-center gap-2 text-slate-500 mb-1"><Activity className="w-4 h-4"/> Último Registro Consumo</div>
                                  <div className="font-bold text-slate-800">
                                    {monitoramento.ultimo_registro ? new Date(monitoramento.ultimo_registro).toLocaleString() : "Sem registros"}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-emerald-500"/> Definir Metas Clínicas</h3>
                              
                              <div className="grid grid-cols-3 gap-4 mb-4">
                                <div>
                                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Objetivo Principal</label>
                                  <select value={anamneseEdit.objetivo} onChange={e => setAnamneseEdit({...anamneseEdit, objetivo: e.target.value})} className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none text-sm">
                                    <option value="">Selecione...</option>
                                    <option value="Emagrecimento">Emagrecimento</option>
                                    <option value="Hipertrofia">Hipertrofia</option>
                                    <option value="Manutenção">Manutenção de Peso</option>
                                    <option value="Reeducação">Reeducação Alimentar</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Peso Alvo (kg)</label>
                                  <input type="number" step="0.1" value={anamneseEdit.peso_alvo} onChange={e => setAnamneseEdit({...anamneseEdit, peso_alvo: e.target.value})} className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none text-sm" placeholder="Ex: 65.0"/>
                                </div>
                                <div>
                                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><Droplets className="w-3 h-3 text-blue-400"/> Meta Água (ml/dia)</label>
                                  <input type="number" step="100" value={anamneseEdit.agua_meta} onChange={e => setAnamneseEdit({...anamneseEdit, agua_meta: e.target.value})} className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none text-sm" placeholder="Ex: 2500"/>
                                </div>
                              </div>
                              
                              <div className="flex justify-end">
                                <button onClick={salvarDetalhesCliente} disabled={savingAnamnese} className="bg-emerald-600 text-white px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-emerald-700 transition-colors disabled:opacity-50">
                                  {savingAnamnese ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} Salvar Metas
                                </button>
                              </div>
                            </div>

                          </div>
                        )}

                        {/* PRONTUÁRIO */}
                        {clientTab === "prontuario" && (
                          <div className="space-y-6">
                            <div>
                              <label className="block text-sm font-bold text-slate-700 mb-1">Doenças Crônicas / Medicamentos</label>
                              <textarea rows={2} value={anamneseEdit.doencas} onChange={e => setAnamneseEdit({...anamneseEdit, doencas: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Ex: Diabetes, Hipertensão, uso de Omeprazol..."/>
                            </div>
                            <div>
                              <label className="block text-sm font-bold text-slate-700 mb-1">Alergias e Intolerâncias</label>
                              <textarea rows={2} value={anamneseEdit.intolerancias} onChange={e => setAnamneseEdit({...anamneseEdit, intolerancias: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Ex: Intolerância à lactose, alergia a amendoim..."/>
                            </div>
                            <div>
                              <label className="block text-sm font-bold text-slate-700 mb-1">Estilo de Vida / Rotina</label>
                              <textarea rows={2} value={anamneseEdit.estilo_vida} onChange={e => setAnamneseEdit({...anamneseEdit, estilo_vida: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Ex: Trabalha noturno, sedentarismo elevado..."/>
                            </div>
                            <div className="flex justify-end">
                              <button onClick={salvarDetalhesCliente} disabled={savingAnamnese} className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 transition-colors disabled:opacity-50">
                                {savingAnamnese ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} Salvar Prontuário
                              </button>
                            </div>
                          </div>
                        )}

                        {/* PLANO ALIMENTAR */}
                        {clientTab === "plano" && (
                          <div className="space-y-4">
                            <PlanoAlimentarForm
                              initialPaciente={clienteSelecionado.nome}
                              initialData={clienteSelecionado.anamnese?.plano_alimentar || null}
                              readOnlyPacienteField={true}
                              onSavePayload={async (payload) => {
                                try {
                                  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/planos/${clienteSelecionado.id_cliente}/completo`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(payload)
                                  });
                                  if (!res.ok) throw new Error("Erro ao salvar plano");
                                  
                                  // Atualiza o estado local para não perder o plano ao trocar de abas
                                  const novaAnamnese = { ...clienteSelecionado.anamnese, plano_alimentar: payload };
                                  setClienteSelecionado({ ...clienteSelecionado, anamnese: novaAnamnese });
                                  
                                  alert("Plano salvo com sucesso no banco de dados!");
                                } catch (e) {
                                  console.error(e);
                                  alert("Erro ao salvar plano no servidor.");
                                }
                              }}
                            />
                          </div>
                        )}

                        {/* IA CUSTOMIZADA */}
                        {clientTab === "ia" && (
                          <div className="space-y-6">
                            <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 flex items-start gap-3 mb-6">
                              <ShieldAlert className="w-5 h-5 text-purple-600 mt-0.5" />
                              <div>
                                <h4 className="font-bold text-purple-900">Sobreposição de IA (Override)</h4>
                                <p className="text-sm text-purple-800 mt-1">O que você digitar aqui vai sobrepor ou adicionar às regras globais da sua IA, afetando APENAS as respostas para <b>{clienteSelecionado.nome}</b>.</p>
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-bold text-slate-700 mb-1">Persona Específica (Deixe em branco para usar a Global)</label>
                              <textarea rows={3} value={iaClientEdit.persona} onChange={e => setIaClientEdit({...iaClientEdit, persona: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none" placeholder="Ex: Para esse paciente, aja como um sargento linha dura..."/>
                            </div>
                            <div>
                              <label className="block text-sm font-bold text-slate-700 mb-1">Restrições Adicionais da IA</label>
                              <textarea rows={3} value={iaClientEdit.restricoes} onChange={e => setIaClientEdit({...iaClientEdit, restricoes: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none" placeholder="Ex: Nunca sugira alimentos com lactose, pois ele é severamente intolerante."/>
                            </div>
                            <div className="flex justify-end">
                              <button onClick={salvarDetalhesCliente} disabled={savingAnamnese} className="bg-purple-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-purple-700 transition-colors disabled:opacity-50">
                                {savingAnamnese ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} Salvar Regras de IA
                              </button>
                            </div>
                          </div>
                        )}

                        {clientTab === "chat" && (
                          <div className="flex flex-col h-[500px] border border-slate-200 rounded-xl overflow-hidden">
                            <div className="bg-slate-50 p-4 border-b border-slate-200">
                              <h4 className="font-bold text-slate-800">Histórico de Conversas e Intervenção</h4>
                              <p className="text-sm text-slate-500">Acompanhe o que o cliente conversa com a IA e envie mensagens diretas (que aparecerão como o bot).</p>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
                              {chatHistorico.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                  <div className={`max-w-[70%] rounded-2xl p-4 shadow-sm ${msg.role === 'user' ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-slate-100 text-slate-800 rounded-bl-none'}`}>
                                    <div dangerouslySetInnerHTML={{ __html: msg.texto.replace(/\n/g, '<br/>') }} />
                                    <span className={`text-[10px] opacity-70 mt-2 block ${msg.role === 'user' ? 'text-emerald-100' : 'text-slate-500'}`}>
                                      {new Date(msg.time).toLocaleString('pt-BR')}
                                    </span>
                                  </div>
                                </div>
                              ))}
                              {chatHistorico.length === 0 && <p className="text-center text-slate-400 mt-10">Nenhuma conversa registrada ainda.</p>}
                            </div>
                            <div className="p-4 bg-white border-t border-slate-200 flex gap-2">
                              <input 
                                type="text" 
                                value={nutriMensagem}
                                onChange={e => setNutriMensagem(e.target.value)}
                                placeholder="Digite uma mensagem para intervir..." 
                                className="flex-1 p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                onKeyDown={e => e.key === 'Enter' && enviarMensagemNutri()}
                              />
                              <button 
                                onClick={enviarMensagemNutri} 
                                disabled={sendingMsg || !nutriMensagem.trim()}
                                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50"
                              >
                                {sendingMsg ? "Enviando..." : "Enviar"}
                              </button>
                            </div>
                          </div>
                        )}
                        
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {/* Aba: Configuração IA Global */}
            {activeTab === "ai_config" && (
              <motion.div key="ai_config" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-3xl mx-auto">
                <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                      <BrainCircuit className="w-8 h-8" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-slate-900">Configuração Global da IA</h1>
                      <p className="text-slate-500 font-medium">Define o comportamento padrão do bot para todos os pacientes (caso não haja sobreposição individual).</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Persona Base</label>
                      <textarea rows={4} value={botConfig.persona} onChange={(e) => setBotConfig({...botConfig, persona: e.target.value})} className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Ex: Seja amigável e use emojis..."/>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Restrições Globais</label>
                      <textarea rows={4} value={botConfig.restricoes} onChange={(e) => setBotConfig({...botConfig, restricoes: e.target.value})} className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Ex: Nunca passe diagnósticos médicos..."/>
                    </div>

                    <div className="pt-6 border-t border-slate-100 flex justify-end">
                      <button onClick={salvarBotConfig} disabled={savingBot} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-3 rounded-xl flex items-center gap-2 transition-transform transform hover:-translate-y-0.5 disabled:opacity-50">
                        {savingBot ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Salvar Regras Globais</>}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            
          </AnimatePresence>
        )}
      </main>

      {/* Modal Novo Cliente */}
      <AnimatePresence>
        {showNewClientModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative">
              <button onClick={() => setShowNewClientModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"><X className="w-6 h-6"/></button>
              
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Cadastrar Novo Paciente</h2>
              
              <form onSubmit={criarPaciente} className="space-y-4">
                <input required type="text" placeholder="Nome Completo" value={novoCliente.nome} onChange={e => setNovoCliente({...novoCliente, nome: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"/>
                <input required type="email" placeholder="Email (login)" value={novoCliente.email} onChange={e => setNovoCliente({...novoCliente, email: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"/>
                <input required type="password" placeholder="Senha provisória" value={novoCliente.senha} onChange={e => setNovoCliente({...novoCliente, senha: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"/>
                
                <div className="grid grid-cols-2 gap-4">
                  <input required type="number" placeholder="Idade" value={novoCliente.idade} onChange={e => setNovoCliente({...novoCliente, idade: e.target.value})} className="p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"/>
                  <select required value={novoCliente.sexo} onChange={e => setNovoCliente({...novoCliente, sexo: e.target.value})} className="p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none">
                    <option value="F">Feminino</option><option value="M">Masculino</option>
                  </select>
                  <input required type="number" step="0.1" placeholder="Peso (kg)" value={novoCliente.peso} onChange={e => setNovoCliente({...novoCliente, peso: e.target.value})} className="p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"/>
                  <input required type="number" step="1" placeholder="Altura (cm)" value={novoCliente.altura} onChange={e => setNovoCliente({...novoCliente, altura: e.target.value})} className="p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"/>
                </div>

                <button type="submit" disabled={creatingClient} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl mt-6 flex items-center justify-center hover:bg-emerald-700 transition-colors disabled:opacity-50">
                  {creatingClient ? <Loader2 className="w-5 h-5 animate-spin"/> : "Registrar Paciente"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Editar Paciente */}
      <AnimatePresence>
        {showEditClientModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative">
              <button onClick={() => setShowEditClientModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"><X className="w-6 h-6"/></button>
              
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Editar Paciente</h2>
              
              <form onSubmit={atualizarPacienteBasico} className="space-y-4">
                <input required type="text" placeholder="Nome Completo" value={editCliente.nome} onChange={e => setEditCliente({...editCliente, nome: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"/>
                
                <div className="grid grid-cols-2 gap-4">
                  <input required type="number" placeholder="Idade" value={editCliente.idade} onChange={e => setEditCliente({...editCliente, idade: e.target.value})} className="p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"/>
                  <select required value={editCliente.sexo} onChange={e => setEditCliente({...editCliente, sexo: e.target.value})} className="p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none">
                    <option value="F">Feminino</option><option value="M">Masculino</option>
                  </select>
                  <input required type="number" step="0.1" placeholder="Peso Atual (kg)" value={editCliente.peso_kg} onChange={e => setEditCliente({...editCliente, peso_kg: e.target.value})} className="p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"/>
                  <input required type="number" step="1" placeholder="Altura (cm)" value={editCliente.altura_cm} onChange={e => setEditCliente({...editCliente, altura_cm: e.target.value})} className="p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"/>
                </div>

                <button type="submit" disabled={savingClient} className="w-full bg-slate-800 text-white font-bold py-3 rounded-xl mt-6 flex items-center justify-center hover:bg-slate-900 transition-colors disabled:opacity-50">
                  {savingClient ? <Loader2 className="w-5 h-5 animate-spin"/> : "Salvar Alterações"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Relatório IA */}
      <AnimatePresence>
        {showReportModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
              <button onClick={() => setShowReportModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 z-10"><X className="w-6 h-6"/></button>
              
              <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                <div className="bg-purple-100 text-purple-600 p-2 rounded-xl">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Síntese Inteligente</h2>
              </div>
              
              <div className="overflow-y-auto flex-1 pr-2">
                {loadingReport ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                    <Loader2 className="w-10 h-10 animate-spin mb-4 text-purple-600" />
                    <p className="font-medium">A IA está analisando o chat e os registros...</p>
                    <p className="text-sm mt-2 opacity-70">Isso pode levar alguns segundos.</p>
                  </div>
                ) : (
                  <div className="prose prose-slate prose-p:leading-relaxed max-w-none text-slate-700 whitespace-pre-wrap">
                    {aiReport}
                  </div>
                )}
              </div>
              
              {!loadingReport && (
                <div className="pt-6 mt-2 border-t border-slate-100 flex justify-end">
                  <button onClick={() => setShowReportModal(false)} className="bg-slate-100 text-slate-700 font-bold py-2 px-6 rounded-xl hover:bg-slate-200 transition-colors">
                    Fechar
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
