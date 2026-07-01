import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MapPin,
  ExternalLink,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Layers,
  Globe,
  Building2,
  Calendar,
  Search,
  Maximize2,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { cn } from "../lib/utils";

interface Empresa {
  id: string;
  nome: string;
  endereco?: string;
  classificacao?: string;
  statusEmpresa?: string;
  seguimento?: string;
  responsavel?: string;
  telefone?: string;
  consultorNome?: string;
  linkMaps?: string;
  bairro?: string;
  unidadesVinculadas?: string[];
}

interface Mapa3DProps {
  empresas: Empresa[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onGenerateAction: (empresa: Empresa) => void;
  formatPhone: (phone?: string) => string;
}

export default function Mapa3D({
  empresas,
  selectedId,
  onSelect,
  onGenerateAction,
  formatPhone,
}: Mapa3DProps) {
  // Map Modes: "city" (3D Isometric City)
  
  // 3D Isometric View Parameters
  const [rotation, setRotation] = useState<number>(-35); // Degrees around Z axis
  const [pitch, setPitch] = useState<number>(60); // Degrees around X axis
  const [zoom, setZoom] = useState<number>(0.9); // Scale
  const [showRoads, setShowRoads] = useState<boolean>(true);
  const [showZones, setShowZones] = useState<boolean>(true);

  // Mouse pan/drag state for the 3D board
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Map Filter/Search
  const [searchTerm, setSearchTerm] = useState("");
  const [isFiltersExpanded, setIsFiltersExpanded] = useState<boolean>(false);
  const [filterConsultor, setFilterConsultor] = useState<string>("Todos");
  const [filterBairro, setFilterBairro] = useState<string>("Todos");
  const [filterCidade, setFilterCidade] = useState<string>("Todas");
  const [filterStatus, setFilterStatus] = useState<string>("Todos");
  const [filterClassificacao, setFilterClassificacao] = useState<string>("Todas");
  const [filterUnidade, setFilterUnidade] = useState<string>("Todas");

  // Helper to detect city from address
  const detectCidade = (endereco?: string) => {
    if (!endereco) return "Rio de Janeiro";
    const lower = endereco.toLowerCase();
    
    // Check known cities of RJ
    const cities = [
      "Niterói", "Duque de Caxias", "Nova Iguaçu", "São Gonçalo", 
      "Belford Roxo", "São João de Meriti", "Petrópolis", "Volta Redonda", 
      "Campos dos Goytacazes", "Macaé", "Cabo Frio", "Angra dos Reis", 
      "Maricá", "Nilópolis", "Itaboraí", "Magé", "Mesquita", 
      "Queimados", "Resende", "Araruama", "Saquarema", "Teresópolis",
      "Rio das Ostras", "Itaguaí"
    ];
    
    for (const city of cities) {
      if (lower.includes(city.toLowerCase())) {
        return city;
      }
    }
    
    if (lower.includes("rio de janeiro") || lower.includes("rj") || lower.includes("capital")) {
      return "Rio de Janeiro";
    }
    
    const match = endereco.match(/,\s*([^,]+)\s*-\s*R[Jj]/);
    if (match && match[1]) {
      const parsed = match[1].trim();
      return parsed.charAt(0).toUpperCase() + parsed.slice(1);
    }
    
    return "Rio de Janeiro"; // Default
  };

  // Dynamic filter values
  const uniqueConsultores = useMemo(() => {
    return Array.from(new Set(empresas.map((e) => e.consultorNome).filter(Boolean))).sort() as string[];
  }, [empresas]);

  const uniqueBairros = useMemo(() => {
    return Array.from(new Set(empresas.map((e) => e.bairro).filter(Boolean))).sort() as string[];
  }, [empresas]);

  const uniqueCidades = useMemo(() => {
    const cities = empresas.map(e => detectCidade(e.endereco));
    return Array.from(new Set(cities)).sort() as string[];
  }, [empresas]);

  const uniqueUnidades = useMemo(() => {
    const list: string[] = [];
    empresas.forEach(e => {
      if (Array.isArray(e.unidadesVinculadas)) {
        e.unidadesVinculadas.forEach(u => {
          if (u) list.push(u);
        });
      }
    });
    return Array.from(new Set(list)).sort() as string[];
  }, [empresas]);

  // Master Filter List
  const filteredEmpresas = useMemo(() => {
    return empresas.filter((e) => {
      // 1. Search term (Matches Name or Address or CNPJ/Status)
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch = !term || 
        e.nome.toLowerCase().includes(term) ||
        (e.endereco && e.endereco.toLowerCase().includes(term)) ||
        (e.statusEmpresa && e.statusEmpresa.toLowerCase().includes(term));
      
      // 2. Consultor
      const matchesConsultor = filterConsultor === "Todos" || e.consultorNome === filterConsultor;
      
      // 3. Bairro
      const matchesBairro = filterBairro === "Todos" || e.bairro === filterBairro;
      
      // 4. Cidade
      const matchesCidade = filterCidade === "Todas" || detectCidade(e.endereco) === filterCidade;
      
      // 5. Status
      const currentStatus = e.statusEmpresa || "Não visitada";
      const matchesStatus = filterStatus === "Todos" || currentStatus === filterStatus;
      
      // 6. Classificação
      const matchesClassificacao = filterClassificacao === "Todas" || e.classificacao === filterClassificacao;
      
      // 7. Unidade
      const matchesUnidade = filterUnidade === "Todas" || 
        (Array.isArray(e.unidadesVinculadas) && e.unidadesVinculadas.includes(filterUnidade));
        
      return matchesSearch && matchesConsultor && matchesBairro && matchesCidade && matchesStatus && matchesClassificacao && matchesUnidade;
    });
  }, [empresas, searchTerm, filterConsultor, filterBairro, filterCidade, filterStatus, filterClassificacao, filterUnidade]);

  const selectedEmpresa = useMemo(() => {
    return (
      filteredEmpresas.find((emp) => emp.id === selectedId) ||
      filteredEmpresas[0] ||
      null
    );
  }, [filteredEmpresas, selectedId]);

  // Sync selectedId to first item if none is selected
  useEffect(() => {
    if (filteredEmpresas.length > 0 && !selectedId) {
      onSelect(filteredEmpresas[0].id);
    }
  }, [filteredEmpresas, selectedId, onSelect]);

  // Deterministic positioning matching Rio de Janeiro's real geography sectors
  const getCoordinates = (empresa: Empresa) => {
    const { id, nome, endereco, bairro } = empresa;
    const combined = id + nome;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      hash = combined.charCodeAt(i) + ((hash << 5) - hash);
    }
    const noiseX = Math.abs((hash * 17) % 15);
    const noiseY = Math.abs((hash * 31) % 15);
    
    const lowerBairro = (bairro || "").toLowerCase();
    const lowerAddress = (endereco || "").toLowerCase();
    
    const zonaSul = ["copacabana", "ipanema", "leblon", "botafogo", "flamengo", "gávea", "catete", "laranjeiras", "glória", "urca", "jardim botânico", "humaitá", "leme", "lagoa", "cosme velho", "são conrado"];
    const centro = ["centro", "lapa", "santa teresa", "estácio", "rio comprido", "gamboa", "saúde", "santo cristo", "maravilha", "castelo", "cinelândia", "praça xv", "catumbi"];
    const zonaOeste = ["barra", "recreio", "jacarepaguá", "campo grande", "santa cruz", "bangu", "realengo", "taquara", "anil", "freguesia", "curicica", "camorim", "itanhangá", "vargem", "cosmos", "paciência", "guaratiba", "pechincha", "sulacap", "padre miguel", "senador camará"];
    const zonaNorte = ["tijuca", "vila isabel", "grajaú", "maracanã", "méier", "madureira", "penha", "bonsucesso", "ilha do governador", "ramos", "iraja", "irajá", "cascadura", "meier", "del castilho", "galeão", "inhaúma", "pavuna", "vaz lobo", "benfica", "sampaio", "engenho", "piedade", "quintino", "anchieta", "coelho neto", "colégio", "cordovil", "higienópolis", "jacaré", "manguinhos", "olaria", "rocha", "vargas", "vicente de carvalho", "vigário geral", "vista alegre"];

    let minX = 15;
    let maxX = 85;
    let minY = 15;
    let maxY = 85;

    const matchesRegion = (list: string[]) => {
      return list.some(item => lowerBairro.includes(item) || lowerAddress.includes(item));
    };

    if (matchesRegion(zonaSul)) {
      // Bottom Center-Right (near Atlantic Ocean)
      minX = 55;
      maxX = 75;
      minY = 65;
      maxY = 82;
    } else if (matchesRegion(centro)) {
      // Center Top-Right (near Guanabara Bay)
      minX = 62;
      maxX = 82;
      minY = 25;
      maxY = 48;
    } else if (matchesRegion(zonaOeste)) {
      // Bottom Left / Wide territory
      minX = 12;
      maxX = 45;
      minY = 55;
      maxY = 82;
    } else if (matchesRegion(zonaNorte)) {
      // Top Center-Left
      minX = 25;
      maxX = 52;
      minY = 15;
      maxY = 45;
    } else {
      const regionChoice = Math.abs(hash) % 4;
      if (regionChoice === 0) { // Zona Sul
        minX = 55; maxX = 75; minY = 65; maxY = 82;
      } else if (regionChoice === 1) { // Centro
        minX = 62; maxX = 82; minY = 25; maxY = 48;
      } else if (regionChoice === 2) { // Zona Oeste
        minX = 12; maxX = 45; minY = 55; maxY = 82;
      } else { // Zona Norte
        minX = 25; maxX = 52; minY = 15; maxY = 45;
      }
    }

    const x = minX + (noiseX % (maxX - minX + 1));
    const y = minY + (noiseY % (maxY - minY + 1));
    return { x, y };
  };

  // Pre-calculate company positions
  const empresasWithPositions = useMemo(() => {
    return filteredEmpresas.map((emp) => {
      const { x, y } = getCoordinates(emp);
      return {
        ...emp,
        pos: { x, y },
      };
    });
  }, [filteredEmpresas]);

  // Stats
  const stats = useMemo(() => {
    const counts = {
      conveniada: 0,
      tratativa: 0,
      cancelada: 0,
      naoVisitada: 0,
    };
    filteredEmpresas.forEach((e) => {
      const status = e.statusEmpresa || "Não visitada";
      if (status === "Conveniada") counts.conveniada++;
      else if (status === "Em tratativa") counts.tratativa++;
      else if (status === "Cancelada") counts.cancelada++;
      else counts.naoVisitada++;
    });
    return counts;
  }, [filteredEmpresas]);

  // Reset 3D camera
  const handleResetCamera = () => {
    setRotation(-35);
    setPitch(60);
    setZoom(0.9);
    setDragOffset({ x: 0, y: 0 });
  };

  // Map drag handling
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    
    // We adjust rotation and pitch slightly with drag, or pan the map
    setRotation((prev) => (prev + dx * 0.3) % 360);
    setPitch((prev) => Math.max(30, Math.min(80, prev - dy * 0.3)));
    
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* LEFT SIDEBAR: List with high-fidelity color filters & stats */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col space-y-4 max-h-[75vh] overflow-hidden">
        <div>
          <h3 className="font-bold text-slate-800 text-lg flex items-center space-x-2">
            <span>🏢 Empresas & Localização 3D</span>
            <span className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full font-bold">
              {filteredEmpresas.length}
            </span>
          </h3>
          <p className="text-slate-400 text-xs mt-1">
            Selecione uma empresa para focar e visualizar as coordenadas e mapas.
          </p>
        </div>

        {/* Quick Colored Status Legend / Mini-Stats */}
        <div className="grid grid-cols-4 gap-1.5 shrink-0 text-center text-[10px]">
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-1.5 flex flex-col items-center">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mb-0.5" />
            <span className="font-bold text-emerald-800">{stats.conveniada}</span>
            <span className="text-slate-400 font-medium scale-90 origin-top">Conv.</span>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-1.5 flex flex-col items-center">
            <span className="w-2 h-2 rounded-full bg-amber-500 mb-0.5" />
            <span className="font-bold text-amber-800">{stats.tratativa}</span>
            <span className="text-slate-400 font-medium scale-90 origin-top">Trat.</span>
          </div>
          <div className="bg-rose-50 border border-rose-100 rounded-xl p-1.5 flex flex-col items-center">
            <span className="w-2 h-2 rounded-full bg-rose-500 mb-0.5" />
            <span className="font-bold text-rose-800">{stats.cancelada}</span>
            <span className="text-slate-400 font-medium scale-90 origin-top">Canc.</span>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-1.5 flex flex-col items-center">
            <span className="w-2 h-2 rounded-full bg-slate-400 mb-0.5" />
            <span className="font-bold text-slate-700">{stats.naoVisitada}</span>
            <span className="text-slate-400 font-medium scale-90 origin-top">N. Vis.</span>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 shrink-0 space-y-2">
          <div className="flex justify-between items-center cursor-pointer select-none" onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}>
            <div className="flex items-center space-x-1.5 text-slate-700 font-bold text-xs">
              <Sliders size={13} className="text-blue-600" />
              <span>Filtros do Mapa</span>
            </div>
            <span className="text-blue-600 text-[10px] font-bold hover:underline">
              {isFiltersExpanded ? "Recolher ▲" : "Expandir ▼"}
            </span>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
            <input
              type="text"
              placeholder="Buscar por nome ou endereço..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-xs"
            />
          </div>

          <AnimatePresence initial={false}>
            {isFiltersExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden space-y-2 pt-1 border-t border-slate-200/50 mt-1.5"
              >
                {/* 1. Consultor */}
                <div>
                  <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                    Consultor
                  </label>
                  <select
                    value={filterConsultor}
                    onChange={(e) => setFilterConsultor(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px] outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="Todos">Todos os Consultores</option>
                    {uniqueConsultores.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {/* 2. Bairro */}
                  <div>
                    <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                      Bairro
                    </label>
                    <select
                      value={filterBairro}
                      onChange={(e) => setFilterBairro(e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px] outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="Todos">Todos</option>
                      {uniqueBairros.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 3. Cidade */}
                  <div>
                    <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                      Cidade
                    </label>
                    <select
                      value={filterCidade}
                      onChange={(e) => setFilterCidade(e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px] outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="Todas">Todas</option>
                      {uniqueCidades.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {/* 4. Status */}
                  <div>
                    <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                      Status
                    </label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px] outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="Todos">Todos</option>
                      <option value="Conveniada">Conveniada</option>
                      <option value="Em tratativa">Em tratativa</option>
                      <option value="Cancelada">Cancelada</option>
                      <option value="Não visitada">Não visitada</option>
                    </select>
                  </div>

                  {/* 5. Classificação */}
                  <div>
                    <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                      Classificações
                    </label>
                    <select
                      value={filterClassificacao}
                      onChange={(e) => setFilterClassificacao(e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px] outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="Todas">Todas</option>
                      <option value="Ouro">Ouro</option>
                      <option value="Prata">Prata</option>
                      <option value="Bronze">Bronze</option>
                    </select>
                  </div>
                </div>

                {/* 6. Unidade */}
                <div>
                  <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                    Unidade Vinculada
                  </label>
                  <select
                    value={filterUnidade}
                    onChange={(e) => setFilterUnidade(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px] outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="Todas">Todas as Unidades</option>
                    {uniqueUnidades.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Reset Link */}
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm("");
                      setFilterConsultor("Todos");
                      setFilterBairro("Todos");
                      setFilterCidade("Todas");
                      setFilterStatus("Todos");
                      setFilterClassificacao("Todas");
                      setFilterUnidade("Todas");
                    }}
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Limpar Filtros
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* List items with elegant scrollbar */}
        <div className="space-y-2 overflow-y-auto flex-1 pr-1 scrollbar-thin">
          {filteredEmpresas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 italic text-xs">
              <Building2 size={24} className="mb-2 text-slate-300" />
              <span>Nenhuma empresa encontrada com os filtros atuais.</span>
            </div>
          ) : (
            empresasWithPositions.map((emp) => {
              const isSelected = selectedId === emp.id;
              const status = emp.statusEmpresa || "Não visitada";
              const coordinates = emp.pos;

              return (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => onSelect(emp.id)}
                  className={cn(
                    "w-full text-left p-3.5 rounded-2xl border transition-all flex flex-col space-y-2 cursor-pointer relative overflow-hidden group",
                    isSelected
                      ? "border-blue-500 bg-blue-50/20 ring-2 ring-blue-500/20"
                      : "border-slate-100 hover:bg-slate-50"
                  )}
                >
                  {/* Selected Indicator Left Line */}
                  {isSelected && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-md" />
                  )}

                  <div className="flex justify-between items-start gap-2">
                    <span className="font-bold text-slate-800 text-xs line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {emp.nome}
                    </span>
                    {emp.classificacao && (
                      <span
                        className={cn(
                          "text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full shrink-0 border",
                          emp.classificacao === "Ouro"
                            ? "bg-amber-100 text-amber-800 border-amber-200"
                            : emp.classificacao === "Prata"
                              ? "bg-slate-100 text-slate-700 border-slate-300"
                              : "bg-orange-100 text-orange-800 border-orange-200"
                        )}
                      >
                        {emp.classificacao}
                      </span>
                    )}
                  </div>

                  {emp.endereco && (
                    <div className="flex items-center space-x-1.5 text-slate-500 text-[10px]">
                      <MapPin size={10} className="shrink-0 text-slate-400" />
                      <span className="truncate">{emp.endereco}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-[9px] pt-1 border-t border-slate-50">
                    <div className="flex items-center space-x-1">
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          status === "Conveniada" && "bg-emerald-500",
                          status === "Em tratativa" && "bg-amber-500",
                          status === "Cancelada" && "bg-rose-500",
                          status === "Não visitada" && "bg-slate-400"
                        )}
                      />
                      <span className="font-bold text-slate-500">{status}</span>
                    </div>
                    {/* Simulated Coordinates */}
                    <span className="font-mono text-slate-400 scale-90">
                      3D Coord: ({coordinates.x}, {coordinates.y})
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT WORKSPACE: 3D Isometric View vs Live Satellite Maps */}
      <div className="lg:col-span-2 flex flex-col space-y-4">
        {/* Toggle Mode Controller & High-tech style details */}
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Globe size={18} />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Visualização Tridimensional (3D)</h4>
              <p className="text-slate-400 text-xs">Visualize e interaja com as empresas parceiras no espaço 3D.</p>
            </div>
          </div>
        </div>

        {/* Map Body container */}
        {selectedEmpresa ? (
          <div className="bg-slate-950 rounded-3xl overflow-hidden border border-slate-900 flex flex-col h-[65vh] relative shadow-2xl">
            {/* Header overlay displaying focused company details */}
            <div className="absolute top-4 left-4 z-10 bg-slate-900/90 backdrop-blur-md border border-slate-800/80 p-3.5 rounded-2xl max-w-sm text-xs text-white shadow-xl">
              <div className="flex items-center space-x-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="font-bold tracking-wider text-slate-400 uppercase text-[9px]">Empresa em Destaque</span>
              </div>
              <h5 className="font-bold text-white text-sm truncate">{selectedEmpresa.nome}</h5>
              <p className="text-slate-400 text-[11px] line-clamp-1 mt-0.5">{selectedEmpresa.endereco || "Sem endereço cadastrado"}</p>
              
              <div className="flex gap-1.5 mt-2">
                <span
                  className={cn(
                    "text-[8px] font-bold px-1.5 py-0.2 rounded-full border border-opacity-30",
                    selectedEmpresa.statusEmpresa === "Conveniada" && "bg-emerald-500/20 text-emerald-400 border-emerald-500",
                    selectedEmpresa.statusEmpresa === "Em tratativa" && "bg-amber-500/20 text-amber-400 border-amber-500",
                    selectedEmpresa.statusEmpresa === "Cancelada" && "bg-rose-500/20 text-rose-400 border-rose-500",
                    (!selectedEmpresa.statusEmpresa || selectedEmpresa.statusEmpresa === "Não visitada") && "bg-slate-500/20 text-slate-300 border-slate-400"
                  )}
                >
                  {selectedEmpresa.statusEmpresa || "Não visitada"}
                </span>
                {selectedEmpresa.classificacao && (
                  <span className="text-[8px] font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded-full border border-amber-500/30">
                    🏆 {selectedEmpresa.classificacao}
                  </span>
                )}
              </div>
            </div>

            {/* 3D CITY PERSPECTIVE MODE */}
              <div
                className="flex-1 relative overflow-hidden select-none cursor-grab active:cursor-grabbing bg-radial from-slate-900 to-slate-950 flex items-center justify-center"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {/* 3D Terrain controls top-right */}
                <div className="absolute top-4 right-4 z-10 flex flex-col space-y-1 bg-slate-900/95 backdrop-blur-md p-2 rounded-2xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.min(1.8, z + 0.1))}
                    title="Aproximar Zoom"
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <ZoomIn size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
                    title="Afastar Zoom"
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <ZoomOut size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setRotation((r) => r - 45)}
                    title="Girar para Esquerda"
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors text-xs font-bold"
                  >
                    ↺
                  </button>
                  <button
                    type="button"
                    onClick={() => setRotation((r) => r + 45)}
                    title="Girar para Direita"
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors text-xs font-bold"
                  >
                    ↺
                  </button>
                  <button
                    type="button"
                    onClick={handleResetCamera}
                    title="Redefinir Câmera"
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <RotateCcw size={15} />
                  </button>
                </div>

                {/* Sub-layers Display Toggle Bottom Left */}
                <div className="absolute bottom-4 left-4 z-10 flex space-x-1 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 text-[10px] text-slate-400 font-bold">
                  <button
                    type="button"
                    onClick={() => setShowRoads(!showRoads)}
                    className={cn(
                      "px-2 py-1 rounded-lg transition-colors",
                      showRoads ? "bg-slate-800 text-blue-400" : "hover:text-white"
                    )}
                  >
                    Estradas
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowZones(!showZones)}
                    className={cn(
                      "px-2 py-1 rounded-lg transition-colors",
                      showZones ? "bg-slate-800 text-blue-400" : "hover:text-white"
                    )}
                  >
                    Bairros
                  </button>
                </div>

                {/* Perspective Guide & Map compass background */}
                <div className="absolute inset-0 pointer-events-none border border-slate-900 flex items-center justify-center opacity-30">
                  <div className="w-[600px] h-[600px] border border-dashed border-blue-500/20 rounded-full animate-spin-slow" />
                  <div className="absolute w-[450px] h-[450px] border border-dashed border-slate-500/10 rounded-full" />
                </div>

                {/* THE 3D ISOMETRIC CITY BOARD */}
                <div
                  className="relative transition-transform duration-300 ease-out"
                  style={{
                    width: "800px",
                    height: "800px",
                    transform: `perspective(1000px) rotateX(${pitch}deg) rotateZ(${rotation}deg) scale3d(${zoom}, ${zoom}, ${zoom})`,
                    transformStyle: "preserve-3d",
                  }}
                >
                  {/* Base Flat Layer representing Map Territory */}
                  <div className="absolute inset-0 bg-slate-900 border-4 border-slate-800 rounded-[40px] shadow-2xl relative overflow-hidden">
                    {/* Grid texture lines */}
                    <div
                      className="absolute inset-0 opacity-15"
                      style={{
                        backgroundImage: `linear-gradient(#475569 1px, transparent 1px), linear-gradient(90deg, #475569 1px, transparent 1px)`,
                        backgroundSize: "40px 40px",
                      }}
                    />

                    {/* Neighborhoods / Zoning colored patches */}
                    {showZones && (
                      <>
                        {/* Oceano Atlântico & Baía de Guanabara (Deep blue-teal water) */}
                        <div className="absolute right-0 bottom-0 w-[45%] h-[45%] bg-gradient-to-br from-teal-950/45 to-blue-900/60 rounded-tl-[100px] border-t border-l border-teal-500/20 overflow-hidden pointer-events-none">
                          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-teal-400 via-transparent to-transparent" />
                          <div className="absolute bottom-6 right-12 text-[10px] text-teal-400/40 font-black tracking-widest uppercase select-none">
                            Oceano Atlântico
                          </div>
                          <div className="absolute top-10 right-32 text-[9px] text-teal-500/40 font-black tracking-widest uppercase select-none rotate-12">
                            Baía de Guanabara
                          </div>
                        </div>

                        {/* Zona Sul (Copacabana, Ipanema, Botafogo) */}
                        <div className="absolute bottom-[10%] right-[35%] w-[30%] h-[25%] rounded-[30px] bg-gradient-to-tr from-amber-500/10 to-transparent border border-amber-500/5 pointer-events-none" />
                        <div className="absolute bottom-[15%] right-[38%] text-[9px] text-amber-500/40 font-black tracking-widest uppercase select-none">
                          Zona Sul (Orla / Lagoa)
                        </div>

                        {/* Centro & Porto Maravilha */}
                        <div className="absolute top-[25%] right-[15%] w-[30%] h-[30%] rounded-[30px] bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/5 pointer-events-none" />
                        <div className="absolute top-[35%] right-[22%] text-[9px] text-blue-500/45 font-black tracking-widest uppercase select-none">
                          Centro & Porto
                        </div>

                        {/* Zona Norte (Tijuca, Méier, Madureira) */}
                        <div className="absolute top-[15%] left-[20%] w-[35%] h-[30%] rounded-[30px] bg-gradient-to-bl from-rose-500/10 to-transparent border border-rose-500/5 pointer-events-none" />
                        <div className="absolute top-[25%] left-[28%] text-[9px] text-rose-500/45 font-black tracking-widest uppercase select-none">
                          Zona Norte (Tijuca / Méier)
                        </div>

                        {/* Zona Oeste (Barra da Tijuca, Recreio, Jacarepaguá) */}
                        <div className="absolute bottom-[15%] left-[5%] w-[45%] h-[35%] rounded-[40px] bg-gradient-to-tr from-emerald-500/10 to-transparent border border-emerald-500/5 pointer-events-none" />
                        <div className="absolute bottom-[25%] left-[12%] text-[9px] text-emerald-500/45 font-black tracking-widest uppercase select-none">
                          Zona Oeste (Barra / Recreio / Jacarepaguá)
                        </div>

                        {/* Stylized Cristo Redentor / Corcovado Beacon */}
                        <div 
                          className="absolute top-[48%] left-[48%] pointer-events-none"
                          style={{ transformStyle: "preserve-3d" }}
                        >
                          <div className="w-12 h-12 rounded-full bg-slate-800/40 blur-md absolute -translate-x-1/2 -translate-y-1/2" />
                          <div 
                            className="w-[3px] bg-gradient-to-t from-blue-600 to-cyan-300 absolute bottom-0 -translate-x-1/2 origin-bottom" 
                            style={{ height: "55px", transform: "rotateX(-90deg)" }}
                          />
                          <div 
                            style={{ transform: "translate3d(0, 0, 55px)" }}
                            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                          >
                            <div className="w-2.5 h-2.5 rounded-full bg-cyan-300 shadow-[0_0_15px_#22d3ee] animate-pulse" />
                            <div 
                              style={{ transform: `rotateZ(${-rotation}deg) rotateX(${-pitch}deg)` }}
                              className="text-[8px] text-cyan-300/80 font-extrabold tracking-wider whitespace-nowrap mt-1 uppercase"
                            >
                              Corcovado / Cristo ✝
                            </div>
                          </div>
                        </div>

                        {/* Stylized Pão de Açúcar Mountain Landmark */}
                        <div 
                          className="absolute top-[53%] right-[22%] pointer-events-none"
                          style={{ transformStyle: "preserve-3d" }}
                        >
                          <div className="w-10 h-10 rounded-full bg-teal-900/40 blur-md absolute -translate-x-1/2 -translate-y-1/2" />
                          <div 
                            className="w-[2px] bg-teal-500/50 absolute bottom-0 -translate-x-1/2 origin-bottom" 
                            style={{ height: "35px", transform: "rotateX(-90deg)" }}
                          />
                          <div 
                            style={{ transform: "translate3d(0, 0, 35px)" }}
                            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                          >
                            <div className="w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_8px_#2dd4bf]" />
                            <div 
                              style={{ transform: `rotateZ(${-rotation}deg) rotateX(${-pitch}deg)` }}
                              className="text-[7px] text-teal-400/70 font-black tracking-widest whitespace-nowrap mt-1 uppercase"
                            >
                              Pão de Açúcar ⛰
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Animated Roads */}
                    {showRoads && (
                      <div className="absolute inset-0 pointer-events-none">
                        {/* Diagonal Main Road (Avenida Brasil / Linha Vermelha) */}
                        <div className="absolute top-0 bottom-0 left-[48%] w-8 bg-slate-950/80 border-l border-r border-slate-800/50 flex items-center justify-center">
                          <div className="h-full w-0.5 border-r border-dashed border-slate-700" />
                        </div>
                        {/* Horizontal Main Avenue (Avenida das Américas) */}
                        <div className="absolute left-0 right-0 top-[48%] h-8 bg-slate-950/80 border-t border-b border-slate-800/50 flex items-center justify-center">
                          <div className="w-full h-0.5 border-b border-dashed border-slate-700" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 3D FLOATING PINS LAYER */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    {empresasWithPositions.map((emp) => {
                      const isFocused = selectedId === emp.id;
                      const status = emp.statusEmpresa || "Não visitada";
                      
                      // Determine pin styles based on status
                      let pinColor = "bg-slate-400 shadow-slate-400/50";
                      let stemColor = "bg-slate-500";
                      let glowColor = "bg-slate-400/30";
                      let ringPulse = "border-slate-400/40";
                      
                      if (status === "Conveniada") {
                        pinColor = "bg-emerald-500 shadow-emerald-500/80";
                        stemColor = "bg-emerald-600";
                        glowColor = "bg-emerald-500/40";
                        ringPulse = "border-emerald-500/50";
                      } else if (status === "Em tratativa") {
                        pinColor = "bg-amber-500 shadow-amber-500/80";
                        stemColor = "bg-amber-600";
                        glowColor = "bg-amber-500/40";
                        ringPulse = "border-amber-500/50";
                      } else if (status === "Cancelada") {
                        pinColor = "bg-rose-500 shadow-rose-500/80";
                        stemColor = "bg-rose-600";
                        glowColor = "bg-rose-500/40";
                        ringPulse = "border-rose-500/50";
                      }

                      return (
                        <div
                          key={emp.id}
                          className="absolute pointer-events-auto cursor-pointer"
                          style={{
                            left: `${emp.pos.x}%`,
                            top: `${emp.pos.y}%`,
                            transformStyle: "preserve-3d",
                            transform: "translate3d(-50%, -50%, 0)",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelect(emp.id);
                          }}
                        >
                          {/* 1. Ground Shadow (flat) */}
                          <div
                            className={cn(
                              "w-10 h-10 rounded-full blur-sm absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300",
                              glowColor,
                              isFocused ? "scale-150 opacity-100" : "scale-100 opacity-60"
                            )}
                            style={{ transform: "rotateX(0deg)" }}
                          />

                          {/* 2. Concentric animated pulses for selected ones */}
                          {isFocused && (
                            <div className="absolute -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full border-2 animate-ping pointer-events-none" />
                          )}

                          {/* 3. The Vertical Stem (3D altitude extrusion) */}
                          <div
                            className={cn(
                              "w-[3px] absolute bottom-0 -translate-x-1/2 origin-bottom transition-all duration-300",
                              stemColor
                            )}
                            style={{
                              height: isFocused ? "40px" : "24px",
                              transform: "rotateX(-90deg)",
                            }}
                          />

                          {/* 4. The Floating Pin Head */}
                          <div
                            style={{
                              transformStyle: "preserve-3d",
                              transform: `translate3d(0, 0, ${isFocused ? "40px" : "24px"})`,
                            }}
                            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center animate-bounce-slow"
                          >
                            {/* Colorful 3D Pin Bubble */}
                            <div
                              className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-white/20 text-[9px] text-white font-bold transition-all duration-300 hover:scale-125",
                                pinColor,
                                isFocused ? "ring-4 ring-blue-500/40 scale-110" : ""
                              )}
                              style={{ transform: `rotateZ(${-rotation}deg) rotateX(${-pitch}deg)` }}
                            >
                              {emp.classificacao === "Ouro" ? "⭐" : <Building2 size={10} />}
                            </div>

                            {/* Floating Name Overlay above Pin Head (shows permanently if focused) */}
                            {isFocused && (
                              <div
                                style={{
                                  transform: `rotateZ(${-rotation}deg) rotateX(${-pitch}deg) translate3d(0, -32px, 10px)`,
                                  transformStyle: "preserve-3d",
                                }}
                                className="absolute pointer-events-none bg-slate-900 border border-slate-800 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg shadow-xl whitespace-nowrap z-50 animate-fade-in flex items-center space-x-1"
                              >
                                <span>{emp.nome}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

            {/* Quick Details footer under the Map workspace */}
            <div className="p-5 bg-slate-900 border-t border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs shrink-0 z-10 text-white">
              <div>
                <span className="text-slate-500 font-bold block uppercase text-[9px] tracking-wider">Contato / Responsável</span>
                <span className="text-slate-200 font-semibold">{selectedEmpresa.responsavel || "Não cadastrado"}</span>
              </div>
              <div>
                <span className="text-slate-500 font-bold block uppercase text-[9px] tracking-wider">Telefone Comercial</span>
                <span className="text-slate-200 font-semibold">{formatPhone(selectedEmpresa.telefone) || "Sem telefone"}</span>
              </div>
              {selectedEmpresa.consultorNome && (
                <div>
                  <span className="text-slate-500 font-bold block uppercase text-[9px] tracking-wider">Comercial Vinculado</span>
                  <span className="text-blue-400 font-bold">{selectedEmpresa.consultorNome}</span>
                </div>
              )}
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => onGenerateAction(selectedEmpresa)}
                  className="w-full md:w-auto px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-900/30 flex items-center justify-center space-x-2"
                >
                  <Calendar size={14} />
                  <span>Gerar Ação</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center text-slate-400 italic">
            Adicione empresas parceiras com endereços para visualizar o mapa 3D interactivo.
          </div>
        )}
      </div>
    </div>
  );
}
