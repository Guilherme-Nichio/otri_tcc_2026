"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Stethoscope, LogOut, Users, Settings, Activity, UserCircle, 
  Plus, Search, ChevronRight, X, Loader2, Save, BrainCircuit, Apple, 
  FileText, ShieldAlert, CheckCircle2, Clock
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
  const [clientTab, setClientTab] = useState<"overview" | "plano" | "prontuario" | "ia">("overview");
  const [planoAtual, setPlanoAtual] = useState<Plano | null>(null);
  const [monitoramento, setMonitoramento] = useState({ ultima_mensagem: null, ultimo_registro: null });

  // Bot Global Config
  const [botConfig, setBotConfig] = useState({ persona: "", restricoes: "", cor: "#10b981" });
  const [savingBot, setSavingBot] = useState(false);

  // Form states
  const [novoItem, setNovoItem] = useState({ refeicao: "cafe da manha", nome_alimento: "", cal_100g: "", prot_100g: "", carb_100g: "", fat_100g: "" });
  const [addingItem, setAddingItem] = useState(false);
  
  const [novoCliente, setNovoCliente] = useState({ nome: "", email: "", senha: "", idade: "", sexo: "F", peso: "", altura: "" });
  const [creatingClient, setCreatingClient] = useState(false);
  const [showNewClientModal, setShowNewClientModal] = useState(false);

  const [savingAnamnese, setSavingAnamnese] = useState(false);
  const [anamneseEdit, setAnamneseEdit] = useState({ doencas: "", intolerancias: "", estilo_vida: "", observacoes: "" });
  const [iaClientEdit, setIaClientEdit] = useState({ persona: "", restricoes: "" });

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
        axios.get(`http://localhost:8000/api/nutricionistas/${id}/clientes`),
        axios.get(`http://localhost:8000/api/nutricionistas/${id}/bot-config`).catch(() => ({ data: null }))
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
        axios.get(`http://localhost:8000/api/clientes/${c_short.id_cliente}/perfil`),
        axios.get(`http://localhost:8000/api/planos/${c_short.id_cliente}`),
        axios.get(`http://localhost:8000/api/clientes/${c_short.id_cliente}/monitoramento`)
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
        observacoes: anam.observacoes || ""
      });
      setIaClientEdit({
        persona: clienteCompleto.ia_persona || "",
        restricoes: clienteCompleto.ia_restricoes || ""
      });
    } catch (err) {
      console.error(err);
    }
  };

  const criarPaciente = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingClient(true);
    try {
      await axios.post("http://localhost:8000/api/clientes", {
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

  const toggleStatusCliente = async () => {
    if (!clienteSelecionado) return;
    const novoStatus = !clienteSelecionado.ativo;
    try {
      await axios.put(`http://localhost:8000/api/clientes/${clienteSelecionado.id_cliente}/status`, { ativo: novoStatus });
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
      await axios.put(`http://localhost:8000/api/clientes/${clienteSelecionado.id_cliente}/detalhes`, {
        anamnese: anamneseEdit,
        ia_persona: iaClientEdit.persona,
        ia_restricoes: iaClientEdit.restricoes
      });
      setClienteSelecionado({
        ...clienteSelecionado, 
        anamnese: anamneseEdit, 
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
      await axios.post(`http://localhost:8000/api/nutricionistas/${nutriId}/bot-config`, {
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
      await axios.post(`http://localhost:8000/api/planos/${clienteSelecionado.id_cliente}`, {
        refeicao: novoItem.refeicao,
        nome_alimento: novoItem.nome_alimento,
        cal_100g: parseFloat(novoItem.cal_100g),
        prot_100g: parseFloat(novoItem.prot_100g) || 0,
        carb_100g: parseFloat(novoItem.carb_100g) || 0,
        fat_100g: parseFloat(novoItem.fat_100g) || 0,
      });
      const res = await axios.get(`http://localhost:8000/api/planos/${clienteSelecionado.id_cliente}`);
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
                        <button 
                          onClick={toggleStatusCliente}
                          className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${clienteSelecionado.ativo ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                        >
                          {clienteSelecionado.ativo ? "Bloquear Acesso" : "Desbloquear Acesso"}
                        </button>
                      </div>

                      {/* Navegação Sub-Abas */}
                      <div className="flex px-6 border-b border-slate-200 bg-white">
                        <button onClick={() => setClientTab("overview")} className={`py-4 px-4 font-semibold text-sm border-b-2 transition-colors ${clientTab === "overview" ? "border-emerald-500 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}>Visão Geral</button>
                        <button onClick={() => setClientTab("prontuario")} className={`py-4 px-4 font-semibold text-sm border-b-2 transition-colors ${clientTab === "prontuario" ? "border-emerald-500 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}>Prontuário</button>
                        <button onClick={() => setClientTab("plano")} className={`py-4 px-4 font-semibold text-sm border-b-2 transition-colors ${clientTab === "plano" ? "border-emerald-500 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}>Plano Alimentar</button>
                        <button onClick={() => setClientTab("ia")} className={`py-4 px-4 font-semibold text-sm border-b-2 transition-colors ${clientTab === "ia" ? "border-purple-500 text-purple-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}>IA Customizada</button>
                      </div>

                      {/* Conteúdo das Sub-Abas */}
                      <div className="flex-1 overflow-y-auto p-6 bg-white">
                        
                        {/* OVERVIEW */}
                        {clientTab === "overview" && (
                          <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-2 text-slate-500 mb-1"><Clock className="w-4 h-4"/> Último Login/Chat</div>
                                <div className="font-bold text-slate-800">
                                  {monitoramento.ultima_mensagem ? new Date(monitoramento.ultima_mensagem).toLocaleString() : "Nunca acessou"}
                                </div>
                              </div>
                              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-2 text-slate-500 mb-1"><Activity className="w-4 h-4"/> Última Refeição Registrada</div>
                                <div className="font-bold text-slate-800">
                                  {monitoramento.ultimo_registro ? new Date(monitoramento.ultimo_registro).toLocaleString() : "Sem registros"}
                                </div>
                              </div>
                            </div>
                            
                            <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
                              <h3 className="font-bold text-blue-900 mb-2">Meta Principal</h3>
                              <p className="text-blue-800">{clienteSelecionado.meta || "Nenhuma meta definida pelo paciente ainda."}</p>
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
                              readOnlyPacienteField={true}
                              onSavePayload={async (payload) => {
                                console.log("Salvando plano para o cliente", clienteSelecionado.id_cliente, payload);
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

    </div>
  );
}
