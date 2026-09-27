"use client";

import React, { useState, useRef, useEffect } from "react";
import { Copy, Check, X, Plus, Trash2, Code, Save, AlertCircle } from "lucide-react";

export type AlimentoItem = {
  id: string;
  quantidade: number | string;
  unidade: string;
  nome: string;
  daTabela: boolean;
  alimentoId: string | null;
};

export type OpcaoMeal = {
  id: string;
  alimentos: AlimentoItem[];
};

export type RefeicaoPlan = {
  id: string;
  tipo: string;
  horario: string;
  opcoes: OpcaoMeal[];
};

export const FOOD_DB = [
  { id: "f1", nome: "Pão de forma integral", unidade: "fatia", kcal: 70 },
  { id: "f2", nome: "Pão francês", unidade: "unidade", kcal: 150 },
  { id: "f3", nome: "Ovo cozido", unidade: "unidade", kcal: 78 },
  { id: "f4", nome: "Ovo mexido", unidade: "unidade", kcal: 90 },
  { id: "f5", nome: "Tapioca (goma hidratada)", unidade: "g", kcal: 0.33 },
  { id: "f6", nome: "Aveia em flocos", unidade: "g", kcal: 3.9 },
  { id: "f7", nome: "Banana prata", unidade: "unidade", kcal: 98 },
  { id: "f8", nome: "Maçã", unidade: "unidade", kcal: 95 },
  { id: "f9", nome: "Leite desnatado", unidade: "ml", kcal: 0.35 },
  { id: "f10", nome: "Iogurte natural desnatado", unidade: "g", kcal: 0.6 },
  { id: "f11", nome: "Queijo minas frescal", unidade: "g", kcal: 2.6 },
  { id: "f12", nome: "Whey protein (1 scoop)", unidade: "unidade", kcal: 120 },
  { id: "f13", nome: "Arroz branco cozido", unidade: "g", kcal: 1.3 },
  { id: "f14", nome: "Feijão carioca cozido", unidade: "g", kcal: 0.76 },
  { id: "f15", nome: "Peito de frango grelhado", unidade: "g", kcal: 1.65 },
  { id: "f16", nome: "Batata doce cozida", unidade: "g", kcal: 0.86 },
  { id: "f17", nome: "Brócolis cozido", unidade: "g", kcal: 0.35 },
  { id: "f18", nome: "Cenoura crua", unidade: "g", kcal: 0.41 },
  { id: "f19", nome: "Alface", unidade: "g", kcal: 0.15 },
  { id: "f20", nome: "Tomate", unidade: "g", kcal: 0.18 },
  { id: "f21", nome: "Carne bovina magra grelhada", unidade: "g", kcal: 2.1 },
  { id: "f22", nome: "Salmão grelhado", unidade: "g", kcal: 2.08 },
  { id: "f23", nome: "Quinoa cozida", unidade: "g", kcal: 1.2 },
  { id: "f24", nome: "Abacate", unidade: "g", kcal: 1.6 },
  { id: "f25", nome: "Pasta de amendoim integral", unidade: "colher de sopa", kcal: 95 },
  { id: "f26", nome: "Castanha do Pará", unidade: "unidade", kcal: 29 },
  { id: "f27", nome: "Azeite de oliva extravirgem", unidade: "colher de sopa", kcal: 119 },
  { id: "f28", nome: "Mel", unidade: "colher de sopa", kcal: 64 },
  { id: "f29", nome: "Granola sem açúcar", unidade: "g", kcal: 4.5 },
  { id: "f30", nome: "Suco de laranja natural", unidade: "ml", kcal: 0.45 },
  { id: "f31", nome: "Requeijão light", unidade: "colher de sopa", kcal: 30 },
  { id: "f32", nome: "Torrada integral", unidade: "unidade", kcal: 25 },
  { id: "f33", nome: "Presunto magro", unidade: "fatia", kcal: 25 },
  { id: "f34", nome: "Peito de peru fatiado", unidade: "fatia", kcal: 20 },
];

export const UNITS = ["g", "ml", "unidade", "fatia", "colher de sopa", "colher de chá", "xícara", "concha", "a gosto"];

export const MEAL_TYPES = [
  { value: "cafe_da_manha", label: "Café da Manhã" },
  { value: "lanche_manha", label: "Lanche da Manhã" },
  { value: "almoco", label: "Almoço" },
  { value: "lanche_tarde", label: "Lanche da Tarde" },
  { value: "pre_treino", label: "Pré-treino" },
  { value: "pos_treino", label: "Pós-treino" },
  { value: "janta", label: "Janta" },
  { value: "ceia", label: "Ceia" },
  { value: "outro", label: "Outra refeição" },
];

interface PlanoAlimentarFormProps {
  initialPaciente?: string;
  initialData?: any;
  onSavePayload?: (payload: any) => Promise<void> | void;
  readOnlyPacienteField?: boolean;
}

let uidCounter = 100;
const uid = () => "id_" + (uidCounter++);

function novoAlimento(): AlimentoItem {
  return { id: uid(), quantidade: 1, unidade: "unidade", nome: "", daTabela: true, alimentoId: null };
}

function novaOpcao(): OpcaoMeal {
  return { id: uid(), alimentos: [novoAlimento()] };
}

function novaRefeicao(tipo?: string): RefeicaoPlan {
  return { id: uid(), tipo: tipo || "cafe_da_manha", horario: "", opcoes: [novaOpcao()] };
}

export default function PlanoAlimentarForm({
  initialPaciente = "",
  initialData = null,
  onSavePayload,
  readOnlyPacienteField = false,
}: PlanoAlimentarFormProps) {
  const [paciente, setPaciente] = useState(initialPaciente);
  const [observacoes, setObservacoes] = useState("");
  const [refeicoes, setRefeicoes] = useState<RefeicaoPlan[]>([novaRefeicao("cafe_da_manha")]);

  const [banner, setBanner] = useState<{ msg: string; type: "error" | "success" } | null>(null);


  // Auto-complete focus/active tracking
  const [activeInputId, setActiveInputId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<typeof FOOD_DB>([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

  useEffect(() => {
    if (initialPaciente) setPaciente(initialPaciente);
  }, [initialPaciente]);

  useEffect(() => {
    if (initialData) {
      if (initialData.observacoesGerais) setObservacoes(initialData.observacoesGerais);
      if (initialData.refeicoes && initialData.refeicoes.length > 0) {
        const loaded = initialData.refeicoes.map((r: any) => ({
          id: uid(),
          tipo: r.tipo,
          horario: r.horario || "",
          opcoes: r.opcoes.map((o: any) => ({
            id: uid(),
            alimentos: o.alimentos.map((a: any) => ({
              id: uid(),
              quantidade: a.quantidade,
              unidade: a.unidade,
              nome: a.nome,
              alimentoId: a.alimentoId,
              daTabela: a.origem === 'tabela_alimentos'
            }))
          }))
        }));
        setRefeicoes(loaded);
      }
    }
  }, [initialData]);

  const mealLabel = (tipo: string) => {
    return MEAL_TYPES.find((t) => t.value === tipo)?.label || tipo;
  };

  const normalizeStr = (str: string) => {
    return String(str ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  // State mutations
  const addRefeicao = () => {
    const usados = new Set(refeicoes.map((r) => r.tipo));
    const sugestao = MEAL_TYPES.find((t) => !usados.has(t.value));
    setRefeicoes([...refeicoes, novaRefeicao(sugestao ? sugestao.value : "outro")]);
  };

  const removeRefeicao = (mealId: string) => {
    if (refeicoes.length <= 1) return;
    setRefeicoes(refeicoes.filter((r) => r.id !== mealId));
  };

  const updateRefeicaoTipo = (mealId: string, tipo: string) => {
    setRefeicoes(refeicoes.map((r) => (r.id === mealId ? { ...r, tipo } : r)));
  };

  const updateRefeicaoHorario = (mealId: string, horario: string) => {
    setRefeicoes(refeicoes.map((r) => (r.id === mealId ? { ...r, horario } : r)));
  };

  const addOpcao = (mealId: string) => {
    setRefeicoes(
      refeicoes.map((r) => (r.id === mealId ? { ...r, opcoes: [...r.opcoes, novaOpcao()] } : r))
    );
  };

  const removeOpcao = (mealId: string, opcaoId: string) => {
    setRefeicoes(
      refeicoes.map((r) => {
        if (r.id !== mealId || r.opcoes.length <= 1) return r;
        return { ...r, opcoes: r.opcoes.filter((o) => o.id !== opcaoId) };
      })
    );
  };

  const addAlimento = (mealId: string, opcaoId: string) => {
    setRefeicoes(
      refeicoes.map((r) => {
        if (r.id !== mealId) return r;
        return {
          ...r,
          opcoes: r.opcoes.map((o) => (o.id === opcaoId ? { ...o, alimentos: [...o.alimentos, novoAlimento()] } : o)),
        };
      })
    );
  };

  const removeAlimento = (mealId: string, opcaoId: string, alimentoId: string) => {
    setRefeicoes(
      refeicoes.map((r) => {
        if (r.id !== mealId) return r;
        return {
          ...r,
          opcoes: r.opcoes.map((o) => {
            if (o.id !== opcaoId) return o;
            return { ...o, alimentos: o.alimentos.filter((a) => a.id !== alimentoId) };
          }),
        };
      })
    );
  };

  const updateAlimento = (
    mealId: string,
    opcaoId: string,
    alimentoId: string,
    field: Partial<AlimentoItem>
  ) => {
    setRefeicoes(
      refeicoes.map((r) => {
        if (r.id !== mealId) return r;
        return {
          ...r,
          opcoes: r.opcoes.map((o) => {
            if (o.id !== opcaoId) return o;
            return {
              ...o,
              alimentos: o.alimentos.map((a) => (a.id === alimentoId ? { ...a, ...field } : a)),
            };
          }),
        };
      })
    );
  };

  // Autocomplete logic
  const handleFoodInputFocus = (alimento: AlimentoItem) => {
    if (alimento.daTabela) {
      setActiveInputId(alimento.id);
      updateSuggestions(alimento.nome);
    } else {
      setActiveInputId(null);
    }
  };

  const updateSuggestions = (query: string) => {
    const termo = normalizeStr(query.trim());
    const matches =
      termo.length === 0
        ? FOOD_DB.slice(0, 8)
        : FOOD_DB.filter((f) => normalizeStr(f.nome).includes(termo)).slice(0, 8);
    setSuggestions(matches);
    setActiveSuggestionIndex(matches.length ? 0 : -1);
  };

  const selectSuggestion = (mealId: string, opcaoId: string, alimentoId: string, food: typeof FOOD_DB[0]) => {
    updateAlimento(mealId, opcaoId, alimentoId, {
      nome: food.nome,
      alimentoId: food.id,
      unidade: food.unidade,
    });
    setActiveInputId(null);
  };

  // Validation & Payload
  const validar = () => {
    if (!paciente.trim()) {
      return "Informe o nome do paciente antes de salvar.";
    }
    for (const [i, meal] of refeicoes.entries()) {
      for (const [j, opcao] of meal.opcoes.entries()) {
        const semNome = opcao.alimentos.some((a) => !a.nome.trim());
        if (semNome) {
          return `Preencha o nome de todos os alimentos em "${mealLabel(meal.tipo)}" (Refeição ${i + 1}, Opção ${j + 1}).`;
        }
      }
    }
    return null;
  };

  const montarPayload = () => {
    return {
      paciente: paciente.trim(),
      observacoesGerais: observacoes.trim() || null,
      refeicoes: refeicoes.map((meal) => ({
        tipo: meal.tipo,
        nomeExibicao: mealLabel(meal.tipo),
        horario: meal.horario || null,
        opcoes: meal.opcoes.map((opcao, i) => ({
          nome: `Opção ${i + 1}`,
          alimentos: opcao.alimentos.map((a) => ({
            quantidade: Number(a.quantidade) || 0,
            unidade: a.unidade,
            nome: a.nome.trim(),
            alimentoId: a.daTabela ? a.alimentoId : null,
            origem: a.daTabela ? "tabela_alimentos" : "personalizado",
          })),
        })),
      })),
    };
  };

  const handleSave = async () => {
    const erro = validar();
    if (erro) {
      setBanner({ msg: erro, type: "error" });
      return;
    }
    const payload = montarPayload();
    
    if (onSavePayload) {
      try {
        await onSavePayload(payload);
        setBanner({ msg: "Plano alimentar salvo com sucesso!", type: "success" });
      } catch (err) {
        setBanner({ msg: "Erro ao salvar o plano no servidor.", type: "error" });
      }
    } else {
      setBanner({ msg: "Plano alimentar gerado com sucesso!", type: "success" });
    }
  };

  return (
    <div className="page-plano">
      {/* Topbar (só mostra se não estiver readonly / dentro do dashboard do paciente) */}
      {!readOnlyPacienteField && (
        <div className="topbar-plano mb-6">
          <div className="topbar__row">
            <div className="topbar__title-group">
              <h1 className="text-2xl font-bold text-slate-800">Plano Alimentar</h1>
              <p className="text-slate-500">Monte refeições com uma ou mais opções, cada uma com seus próprios alimentos.</p>
            </div>
          </div>
          <hr className="topbar__rule" />
          <div className="patient-grid">
            <div className="field">
              <label htmlFor="pacienteInput">Paciente</label>
              <input
                type="text"
                id="pacienteInput"
                placeholder="Nome do paciente"
                value={paciente}
                onChange={(e) => setPaciente(e.target.value)}
                readOnly={readOnlyPacienteField}
              />
            </div>
            <div className="field">
              <label htmlFor="observacoesInput">Observações gerais (opcional)</label>
              <input
                type="text"
                id="observacoesInput"
                placeholder="Ex: evitar frituras, beber 2L de água por dia..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Se estiver no dashboard, mostrar apenas o campo de observações de forma mais limpa */}
      {readOnlyPacienteField && (
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 mb-6">
          <label htmlFor="observacoesInput" className="block text-sm font-bold text-slate-700 mb-2">Observações gerais (Opcional)</label>
          <input
            type="text"
            id="observacoesInput"
            className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
            placeholder="Ex: evitar frituras, beber 2L de água por dia..."
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
          />
        </div>
      )}

      {/* Banner */}
      {banner && (
        <div className={`banner-plano show ${banner.type === "success" ? "success" : ""}`} role="alert">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{banner.msg}</span>
        </div>
      )}

      {/* Lista de Refeições */}
      <div id="mealsContainer">
        {refeicoes.map((meal, idx) => (
          <article className="meal-card" key={meal.id}>
            <div className="meal-card__head">
              <div className="meal-card__title-group">
                <span className="meal-index">Refeição {idx + 1}</span>
                <select
                  className="meal-type-select"
                  value={meal.tipo}
                  onChange={(e) => updateRefeicaoTipo(meal.id, e.target.value)}
                >
                  {MEAL_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="meal-card__meta">
                <label className="time-field">
                  <span>Horário</span>
                  <input
                    type="time"
                    value={meal.horario}
                    onChange={(e) => updateRefeicaoHorario(meal.id, e.target.value)}
                  />
                </label>
                <button
                  className="icon-btn danger"
                  type="button"
                  onClick={() => removeRefeicao(meal.id)}
                  disabled={refeicoes.length <= 1}
                  title="Remover refeição"
                >
                  ✕
                </button>
              </div>
            </div>
            <p className="meal-card__hint">
              O paciente poderá escolher entre as {meal.opcoes.length} opção(ões) cadastradas abaixo para esta refeição.
            </p>

            {/* Opções */}
            <div className="options-list">
              {meal.opcoes.map((opcao, oIdx) => (
                <div className="option-block" key={opcao.id}>
                  <div className="option-block__head">
                    <span className="option-label">Opção {oIdx + 1}</span>
                    {meal.opcoes.length > 1 && (
                      <button
                        className="icon-btn subtle"
                        type="button"
                        onClick={() => removeOpcao(meal.id, opcao.id)}
                      >
                        Remover opção
                      </button>
                    )}
                  </div>

                  {/* Linhas de Alimentos */}
                  <div className="food-rows">
                    {opcao.alimentos.map((a) => {
                      const foodObj = a.alimentoId ? FOOD_DB.find((f) => f.id === a.alimentoId) : null;
                      let kcalEstimado = 0;
                      if (a.daTabela && foodObj) {
                        kcalEstimado = Math.round(foodObj.kcal * (Number(a.quantidade) || 0));
                      }

                      return (
                        <div className="food-row" key={a.id}>
                          <input
                            className="qty-input"
                            type="number"
                            min="0"
                            step="0.5"
                            value={a.quantidade}
                            onChange={(e) => updateAlimento(meal.id, opcao.id, a.id, { quantidade: e.target.value })}
                            aria-label="Quantidade"
                          />
                          <select
                            className="unit-select"
                            value={a.unidade}
                            onChange={(e) => updateAlimento(meal.id, opcao.id, a.id, { unidade: e.target.value })}
                            aria-label="Unidade"
                          >
                            {UNITS.map((u) => (
                              <option key={u} value={u}>
                                {u}
                              </option>
                            ))}
                          </select>

                          <div className="food-name-wrap">
                            <input
                              className="food-name-input"
                              type="text"
                              autoComplete="off"
                              placeholder="Digite o alimento..."
                              value={a.nome}
                              onFocus={() => handleFoodInputFocus(a)}
                              onChange={(e) => {
                                updateAlimento(meal.id, opcao.id, a.id, { nome: e.target.value, alimentoId: null });
                                updateSuggestions(e.target.value);
                              }}
                              aria-label="Nome do alimento"
                            />
                            {a.daTabela && foodObj && (
                              <span className="db-badge" title="Vinculado à tabela de alimentos">
                                ✓ tabela · ~{kcalEstimado} kcal
                              </span>
                            )}
                            {!a.daTabela && (
                              <span className="custom-badge" title="Item digitado livremente">
                                livre
                              </span>
                            )}

                            {/* Dropdown de Autocomplete */}
                            {activeInputId === a.id && a.daTabela && (
                              <div className="suggestions-box">
                                {suggestions.length === 0 ? (
                                  <div className="suggestion-empty">
                                    Nenhum alimento encontrado. Desmarque "Buscar na tabela" para usar texto livre.
                                  </div>
                                ) : (
                                  suggestions.map((food, sIdx) => (
                                    <div
                                      key={food.id}
                                      className={`suggestion-item ${sIdx === activeSuggestionIndex ? "active" : ""}`}
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        selectSuggestion(meal.id, opcao.id, a.id, food);
                                      }}
                                    >
                                      <span>{food.nome}</span>
                                      <span className="kcal">{food.unidade} · ~{Math.round(food.kcal)} kcal</span>
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>

                          <label className="toggle-db" title="Buscar na tabela de alimentos">
                            <input
                              type="checkbox"
                              checked={a.daTabela}
                              onChange={(e) =>
                                updateAlimento(meal.id, opcao.id, a.id, {
                                  daTabela: e.target.checked,
                                  alimentoId: e.target.checked ? a.alimentoId : null,
                                })
                              }
                            />
                            <span>Buscar na tabela</span>
                          </label>

                          <button
                            className="icon-btn danger remove-food-btn"
                            type="button"
                            onClick={() => removeAlimento(meal.id, opcao.id, a.id)}
                            title="Remover alimento"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    className="btn-add-food"
                    type="button"
                    onClick={() => addAlimento(meal.id, opcao.id)}
                  >
                    + Adicionar alimento
                  </button>
                </div>
              ))}
            </div>

            <button
              className="btn-add-option"
              type="button"
              onClick={() => addOpcao(meal.id)}
            >
              + Adicionar opção
            </button>
          </article>
        ))}
      </div>

      <button className="add-meal-btn w-full py-4 border-2 border-dashed border-emerald-200 text-emerald-600 font-bold rounded-2xl hover:bg-emerald-50 transition-colors mt-4" type="button" onClick={addRefeicao}>
        + Adicionar nova refeição
      </button>

      <div className="footer-actions mt-8 flex justify-end gap-4">
        <button className="btn-plano btn-plano-primary bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-sm" type="button" onClick={handleSave}>
          Salvar Plano Alimentar
        </button>
      </div>

    </div>
  );
}
