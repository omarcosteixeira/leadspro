import React, { useState, useMemo } from "react";
import { 
  MapPin, 
  Building2, 
  Search, 
  Filter, 
  ArrowLeft, 
  Layers, 
  CheckCircle, 
  Clock, 
  Phone, 
  X, 
  Maximize2,
  TrendingUp,
  SlidersHorizontal,
  FileText
} from "lucide-react";
import { EmpresaParceira, UserProfile } from "../types";

// Coordinates for RJ Municipalities (X, Y in a 0 to 100 canvas grid)
const RJ_CITIES_COORDS: Record<string, { x: number; y: number; label: string }> = {
  "rio de janeiro": { x: 42, y: 78, label: "Rio de Janeiro" },
  "niterói": { x: 49, y: 76, label: "Niterói" },
  "niteroi": { x: 49, y: 76, label: "Niterói" },
  "são gonçalo": { x: 53, y: 74, label: "São Gonçalo" },
  "sao goncalo": { x: 53, y: 74, label: "São Gonçalo" },
  "duque de caxias": { x: 39, y: 68, label: "Duque de Caxias" },
  "caxias": { x: 39, y: 68, label: "Duque de Caxias" },
  "nova iguaçu": { x: 34, y: 68, label: "Nova Iguaçu" },
  "nova iguacu": { x: 34, y: 68, label: "Nova Iguaçu" },
  "belford roxo": { x: 36, y: 65, label: "Belford Roxo" },
  "são joão de meriti": { x: 38, y: 70, label: "São João de Meriti" },
  "sao joao de meriti": { x: 38, y: 70, label: "São João de Meriti" },
  "magé": { x: 46, y: 62, label: "Magé" },
  "mage": { x: 46, y: 62, label: "Magé" },
  "itaboraí": { x: 56, y: 70, label: "Itaboraí" },
  "itaborai": { x: 56, y: 70, label: "Itaboraí" },
  "maricá": { x: 57, y: 77, label: "Maricá" },
  "marica": { x: 57, y: 77, label: "Maricá" },
  "petrópolis": { x: 43, y: 53, label: "Petrópolis" },
  "petropolis": { x: 43, y: 53, label: "Petrópolis" },
  "teresópolis": { x: 48, y: 50, label: "Teresópolis" },
  "teresopolis": { x: 48, y: 50, label: "Teresópolis" },
  "nova friburgo": { x: 58, y: 46, label: "Nova Friburgo" },
  "friburgo": { x: 58, y: 46, label: "Nova Friburgo" },
  "cabo frio": { x: 75, y: 74, label: "Cabo Frio" },
  "búzios": { x: 78, y: 71, label: "Armação dos Búzios" },
  "buzios": { x: 78, y: 71, label: "Armação dos Búzios" },
  "arraial do cabo": { x: 74, y: 77, label: "Arraial do Cabo" },
  "macaé": { x: 77, y: 55, label: "Macaé" },
  "macae": { x: 77, y: 55, label: "Macaé" },
  "campos": { x: 87, y: 34, label: "Campos dos Goytacazes" },
  "itaperuna": { x: 84, y: 17, label: "Itaperuna" },
  "volta redonda": { x: 20, y: 58, label: "Volta Redonda" },
  "barra mansa": { x: 16, y: 59, label: "Barra Mansa" },
  "resende": { x: 9, y: 57, label: "Resende" },
  "angra": { x: 18, y: 80, label: "Angra dos Reis" },
  "paraty": { x: 8, y: 88, label: "Paraty" },
  "araruama": { x: 66, y: 75, label: "Araruama" },
  "saquarema": { x: 62, y: 76, label: "Saquarema" },
  "rio das ostras": { x: 75, y: 61, label: "Rio das Ostras" },
};

// Coordinates for specific neighborhoods inside Rio de Janeiro and Niterói
const NEIGHBORHOODS_COORDS: Record<string, Record<string, { x: number; y: number }>> = {
  "Rio de Janeiro": {
    "barra da tijuca": { x: 35, y: 81 },
    "barra": { x: 35, y: 81 },
    "copacabana": { x: 45, y: 82 },
    "centro": { x: 43, y: 75 },
    "madureira": { x: 33, y: 73 },
    "campo grande": { x: 21, y: 76 },
    "tijuca": { x: 39, y: 76 },
    "botafogo": { x: 44, y: 80 },
    "jacarepaguá": { x: 30, y: 78 },
    "jacarepagua": { x: 30, y: 78 },
    "meier": { x: 36, y: 74 },
    "méier": { x: 36, y: 74 },
    "recreio": { x: 27, y: 82 },
    "recreio dos bandeirantes": { x: 27, y: 82 },
    "ipanema": { x: 43, y: 83 },
    "leblon": { x: 42, y: 83 },
    "flamengo": { x: 44, y: 78 },
    "bangu": { x: 24, y: 73 },
    "realengo": { x: 27, y: 73 },
    "ilha do governador": { x: 43, y: 68 },
    "zona oeste": { x: 22, y: 77 },
    "zona sul": { x: 43, y: 81 },
    "zona norte": { x: 38, y: 72 },
  },
  "Niterói": {
    "icaraí": { x: 50, y: 77 },
    "icarai": { x: 50, y: 77 },
    "centro": { x: 47, y: 76 },
    "santa rosa": { x: 51, y: 76 },
    "fonseca": { x: 49, y: 73 },
    "piratininga": { x: 51, y: 79 },
    "pendotiba": { x: 52, y: 76 },
    "são francisco": { x: 49, y: 78 },
    "sao francisco": { x: 49, y: 78 },
  }
};

export default function EmpresaMapDashboard({
  data,
  users = [],
  cursos = [],
}: {
  data: EmpresaParceira[];
  users?: UserProfile[];
  cursos?: any[];
}) {
  const [selectedCity, setSelectedCity] = useState<string>("Todas");
  const [selectedBairro, setSelectedBairro] = useState<string>("Todos");
  const [selectedUnidade, setSelectedUnidade] = useState<string>("Todas");
  const [selectedPromotor, setSelectedPromotor] = useState<string>("Todos");
  const [statusFilter, setStatusFilter] = useState<string>("Todos");
  const [viewMode, setViewMode] = useState<"cidade" | "bairro">("cidade");
  const [hoveredNode, setHoveredNode] = useState<any>(null);
  const [activeCompanyDetails, setActiveCompanyDetails] = useState<EmpresaParceira | null>(null);

  // Parse location details helper
  const parsedData = useMemo(() => {
    return data.map((emp) => {
      const addressLower = (emp.endereco || "").toLowerCase();
      const bFieldLower = (emp.bairro || "").toLowerCase();

      // 1. Detect City
      let city = "Rio de Janeiro"; // Default if not found
      let matchedCityKey = "rio de janeiro";
      for (const [key, val] of Object.entries(RJ_CITIES_COORDS)) {
        if (addressLower.includes(key)) {
          city = val.label;
          matchedCityKey = key;
          break;
        }
      }

      // 2. Detect Neighborhood
      let detectedBairro = emp.bairro ? emp.bairro.trim() : "";
      if (!detectedBairro && emp.endereco) {
        const parts = emp.endereco.split("-");
        if (parts.length > 1) {
          detectedBairro = parts[parts.length - 2].trim();
        } else {
          const partsComma = emp.endereco.split(",");
          if (partsComma.length > 2) {
            detectedBairro = partsComma[2].trim();
          }
        }
      }

      if (!detectedBairro) {
        detectedBairro = "Centro";
      }

      // Format casing
      const formattedBairro = detectedBairro
        .split(" ")
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");

      // Generate accurate map coords
      let mapX = RJ_CITIES_COORDS[matchedCityKey]?.x || 50;
      let mapY = RJ_CITIES_COORDS[matchedCityKey]?.y || 50;

      // Special coordinate check for known neighborhoods inside Rio and Niterói
      const cityBairros = NEIGHBORHOODS_COORDS[city];
      if (cityBairros) {
        const bLower = formattedBairro.toLowerCase();
        let matchedBKey = "";
        for (const key of Object.keys(cityBairros)) {
          if (bLower.includes(key) || key.includes(bLower)) {
            matchedBKey = key;
            break;
          }
        }
        if (matchedBKey && cityBairros[matchedBKey]) {
          mapX = cityBairros[matchedBKey].x;
          mapY = cityBairros[matchedBKey].y;
        } else {
          // Jitter the default city coordinates slightly so multiple neighborhoods don't perfectly overlap
          const hash = formattedBairro.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
          const jitterX = ((hash % 10) - 5) * 0.5; // -2.5 to 2.5
          const jitterY = (((hash >> 2) % 10) - 5) * 0.5;
          mapX += jitterX;
          mapY += jitterY;
        }
      } else {
        // Jitter other cities' neighborhoods slightly around the city coordinate
        const hash = formattedBairro.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const jitterX = ((hash % 10) - 5) * 0.4;
        const jitterY = (((hash >> 2) % 10) - 5) * 0.4;
        mapX += jitterX;
        mapY += jitterY;
      }

      return {
        ...emp,
        parsedCity: city,
        parsedBairro: formattedBairro,
        mapX,
        mapY,
      };
    });
  }, [data]);

  // Unique lists for filters
  const availableCities = useMemo(() => {
    return Array.from(new Set(parsedData.map(d => d.parsedCity))).sort();
  }, [parsedData]);

  const availableBairros = useMemo(() => {
    let filtered = parsedData;
    if (selectedCity !== "Todas") {
      filtered = parsedData.filter(d => d.parsedCity === selectedCity);
    }
    return Array.from(new Set(filtered.map(d => d.parsedBairro))).sort();
  }, [parsedData, selectedCity]);

  const availableUnits = useMemo(() => {
    if (cursos && cursos.length > 0) {
      return Array.from(new Set(cursos.map((c: any) => c.nomeUnidade).filter(Boolean) as string[])).sort();
    }
    // Fallback if no courses
    const fromData = parsedData.flatMap(d => d.unidadesVinculadas || []).filter(Boolean);
    return Array.from(new Set(fromData)).sort();
  }, [cursos, parsedData]);

  const availablePromotores = useMemo(() => {
    // Extract from FDV / Comercial users, fallback or merge with actual consultorNames in data
    const fromUsers = (users || [])
      .filter((u: any) => {
        const roleLower = (u.role || "").toLowerCase();
        const isComercialServer = u.servidor === "comercial";
        return (
          roleLower.includes("fdv") ||
          roleLower.includes("comercial") ||
          roleLower.includes("promotor") ||
          isComercialServer
        );
      })
      .map((u: any) => u.name)
      .filter(Boolean);

    const fromData = parsedData.map(d => d.consultorNome).filter(Boolean) as string[];
    return Array.from(new Set([...fromUsers, ...fromData])).sort();
  }, [users, parsedData]);

  // Handle auto view-mode change when a city is selected
  React.useEffect(() => {
    if (selectedCity !== "Todas") {
      setViewMode("bairro");
    } else {
      setViewMode("cidade");
      setSelectedBairro("Todos");
    }
  }, [selectedCity]);

  // Filtered dataset
  const filteredData = useMemo(() => {
    return parsedData.filter((emp) => {
      const matchCity = selectedCity === "Todas" || emp.parsedCity === selectedCity;
      const matchBairro = selectedBairro === "Todos" || emp.parsedBairro === selectedBairro;
      const matchStatus = 
        statusFilter === "Todos" || 
        (statusFilter === "Conveniada" && emp.statusEmpresa === "Conveniada") ||
        (statusFilter === "Em tratativa" && emp.statusEmpresa === "Em tratativa") ||
        (statusFilter === "Cancelada" && emp.statusEmpresa === "Cancelada") ||
        (statusFilter === "Não visitada" && emp.statusEmpresa === "Não visitada");

      const matchUnidade = 
        selectedUnidade === "Todas" || 
        (emp.unidadesVinculadas || []).includes(selectedUnidade);

      const matchPromotor = 
        selectedPromotor === "Todos" || 
        emp.consultorNome === selectedPromotor;

      return matchCity && matchBairro && matchStatus && matchUnidade && matchPromotor;
    });
  }, [parsedData, selectedCity, selectedBairro, statusFilter, selectedUnidade, selectedPromotor]);

  // Grouped metrics for Map Display Nodes
  const mapNodes = useMemo(() => {
    const groups: Record<string, { 
      key: string; 
      label: string; 
      x: number; 
      y: number; 
      count: number; 
      conveniadaCount: number;
      tratativaCount: number;
      companies: any[];
    }> = {};

    filteredData.forEach((emp) => {
      // Grouping key depending on current view mode
      const groupKey = viewMode === "cidade" ? emp.parsedCity : `${emp.parsedCity} - ${emp.parsedBairro}`;
      const label = viewMode === "cidade" ? emp.parsedCity : emp.parsedBairro;

      if (!groups[groupKey]) {
        groups[groupKey] = {
          key: groupKey,
          label,
          x: emp.mapX,
          y: emp.mapY,
          count: 0,
          conveniadaCount: 0,
          tratativaCount: 0,
          companies: [],
        };
      }

      groups[groupKey].count += 1;
      if (emp.statusEmpresa === "Conveniada") groups[groupKey].conveniadaCount += 1;
      if (emp.statusEmpresa === "Em tratativa") groups[groupKey].tratativaCount += 1;
      groups[groupKey].companies.push(emp);
    });

    return Object.values(groups);
  }, [filteredData, viewMode]);

  // Concentration leaderboards
  const cityLeaderboard = useMemo(() => {
    const counts: Record<string, number> = {};
    parsedData.forEach(d => {
      counts[d.parsedCity] = (counts[d.parsedCity] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [parsedData]);

  const bairroLeaderboard = useMemo(() => {
    const counts: Record<string, number> = {};
    parsedData.forEach(d => {
      if (selectedCity === "Todas" || d.parsedCity === selectedCity) {
        counts[d.parsedBairro] = (counts[d.parsedBairro] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [parsedData, selectedCity]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Sidebar Filters & Statistics */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Filters Card */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3">
            <h4 className="font-extrabold text-slate-800 text-sm flex items-center space-x-2">
              <SlidersHorizontal size={16} className="text-blue-600" />
              <span>Filtros do Mapa</span>
            </h4>
            <button
              onClick={() => {
                setSelectedCity("Todas");
                setSelectedBairro("Todos");
                setSelectedUnidade("Todas");
                setSelectedPromotor("Todos");
                setStatusFilter("Todos");
                setViewMode("cidade");
              }}
              className="text-xs text-blue-600 font-bold hover:underline"
            >
              Resetar Filtros
            </button>
          </div>

          <div className="space-y-3">
            {/* City Selector */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Cidade / Município
              </label>
              <select
                value={selectedCity}
                onChange={(e) => {
                  setSelectedCity(e.target.value);
                  setSelectedBairro("Todos");
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="Todas">Todas as Cidades ({availableCities.length})</option>
                {availableCities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Neighborhood Selector */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Bairro {selectedCity !== "Todas" && `em ${selectedCity}`}
              </label>
              <select
                value={selectedBairro}
                disabled={selectedCity === "Todas"}
                onChange={(e) => setSelectedBairro(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
              >
                <option value="Todos">Todos os Bairros ({availableBairros.length})</option>
                {availableBairros.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Unidade Selector */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Unidade Vinculada
              </label>
              <select
                value={selectedUnidade}
                onChange={(e) => setSelectedUnidade(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="Todas">Todas as Unidades ({availableUnits.length})</option>
                {availableUnits.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            {/* Promotor Selector */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Promotor / Consultor
              </label>
              <select
                value={selectedPromotor}
                onChange={(e) => setSelectedPromotor(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="Todos">Todos os Promotores ({availablePromotores.length})</option>
                {availablePromotores.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Status da Empresa
              </label>
              <div className="grid grid-cols-2 gap-2 pt-1">
                {[
                  { value: "Todos", label: "Todos" },
                  { value: "Conveniada", label: "Conveniada", dot: "bg-emerald-500" },
                  { value: "Em tratativa", label: "Em Tratativa", dot: "bg-amber-500" },
                  { value: "Não visitada", label: "Não Visitada", dot: "bg-slate-400" },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setStatusFilter(item.value)}
                    className={`px-2 py-1.5 rounded-xl text-xs font-bold text-left border flex items-center space-x-1.5 transition-all ${
                      statusFilter === item.value
                        ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200"
                        : "bg-slate-50/50 text-slate-600 border-slate-100 hover:bg-slate-100/50"
                    }`}
                  >
                    {item.dot && <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />}
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* View Mode Toggle */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Nível de Visualização
              </label>
              <div className="flex bg-slate-100 p-0.5 rounded-xl">
                <button
                  type="button"
                  onClick={() => setViewMode("cidade")}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    viewMode === "cidade"
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  🏙️ Municípios
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("bairro")}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    viewMode === "bairro"
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  📍 Bairros
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Leaderboard Card */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div>
            <h4 className="font-black text-slate-800 text-sm flex items-center space-x-2">
              <TrendingUp size={16} className="text-emerald-500" />
              <span>Concentração Geográfica</span>
            </h4>
            <p className="text-slate-400 text-[11px] mt-0.5">Top hubs com mais empresas registradas</p>
          </div>

          <div className="space-y-4">
            {/* Top Cities */}
            <div>
              <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Ranking de Municípios
              </h5>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {cityLeaderboard.slice(0, 5).map((city, idx) => {
                  const maxCount = cityLeaderboard[0]?.count || 1;
                  const pct = (city.count / maxCount) * 100;
                  return (
                    <button
                      key={city.name}
                      onClick={() => setSelectedCity(city.name)}
                      className="w-full text-left group"
                    >
                      <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                        <span className="group-hover:text-blue-600 transition-colors flex items-center space-x-1">
                          <span className="text-slate-300">#{idx + 1}</span>
                          <span className="truncate max-w-[150px]">{city.name}</span>
                        </span>
                        <span className="text-slate-500 font-mono">{city.count} empresas</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Top Bairros */}
            <div>
              <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Concentração por Bairro {selectedCity !== "Todas" && `em ${selectedCity}`}
              </h5>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {bairroLeaderboard.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Nenhum bairro encontrado.</p>
                ) : (
                  bairroLeaderboard.map((b, idx) => {
                    const maxCount = bairroLeaderboard[0]?.count || 1;
                    const pct = (b.count / maxCount) * 100;
                    return (
                      <div key={b.name} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-slate-600">
                          <span className="truncate max-w-[150px]">{b.name}</span>
                          <span className="font-mono text-slate-500 text-[11px]">{b.count} empresas</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Main Map Visualization */}
      <div className="lg:col-span-8 flex flex-col space-y-4">
        
        {/* State Map Box */}
        <div className="bg-[#0b1329] p-6 rounded-3xl shadow-lg border border-slate-800/80 relative flex-1 min-h-[480px] overflow-hidden flex flex-col justify-between">
          
          {/* Top Info Bar */}
          <div className="z-10 flex justify-between items-start shrink-0">
            <div>
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest font-mono flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>Mapeamento de Hubs</span>
              </span>
              <h3 className="text-lg font-extrabold text-white mt-0.5">
                Estado do Rio de Janeiro
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Exibindo <strong className="text-white font-mono">{filteredData.length}</strong> de <strong className="text-slate-300 font-mono">{data.length}</strong> empresas parceiras
              </p>
            </div>

            {/* Map Badges */}
            <div className="flex space-x-1.5 bg-slate-900/60 backdrop-blur-md p-1.5 rounded-xl border border-slate-800/50">
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded-lg font-bold font-mono">
                {filteredData.filter(e => e.statusEmpresa === "Conveniada").length} Conv.
              </span>
              <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-1 rounded-lg font-bold font-mono">
                {filteredData.filter(e => e.statusEmpresa === "Em tratativa").length} Trat.
              </span>
            </div>
          </div>

          {/* Interactive SVG Map Canvas */}
          <div className="relative w-full h-[320px] md:h-[380px] my-auto flex items-center justify-center">
            
            {/* Tech Cartographic Grid */}
            <div className="absolute inset-0 grid grid-cols-12 grid-rows-6 pointer-events-none opacity-[0.03]">
              {Array.from({ length: 72 }).map((_, i) => (
                <div key={i} className="border border-cyan-400" />
              ))}
            </div>

            {/* Stylized SVG Outline of Rio de Janeiro state */}
            <svg 
              viewBox="0 0 100 100" 
              className="w-full h-full max-w-[650px] opacity-90 select-none transition-all duration-700 transform hover:scale-[1.01]"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <linearGradient id="rjStateGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="40%" stopColor="#0f172a" />
                  <stop offset="100%" stopColor="#1e1b4b" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="1.5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Surrounding Coast / Oceans representation */}
              <path 
                d="M -10 100 Q 30 110 110 100 L 110 115 L -10 115 Z" 
                fill="#080e1e" 
                opacity="0.4"
              />

              {/* State Landmass (Polished curved stylized vector representation of RJ State shape) */}
              <path 
                d="M 5,50 
                   Q 8,53 12,54 
                   Q 15,54 18,59
                   Q 21,63 25,60 
                   Q 28,58 31,62 
                   Q 33,65 37,64
                   Q 40,63 43,65
                   Q 46,67 47,72
                   Q 49,76 48,78
                   C 46,78 44,79 43,81
                   Q 41,83 44,83
                   Q 47,82 48,80
                   Q 49,77 52,77
                   Q 55,77 58,78
                   Q 62,79 66,77
                   Q 71,76 75,76
                   Q 77,75 79,72
                   Q 81,69 82,65
                   Q 84,62 87,55
                   Q 90,48 93,42
                   Q 94,36 94,30
                   Q 91,28 88,30
                   Q 85,32 83,28
                   Q 81,25 79,25
                   Q 76,27 72,25
                   Q 68,23 65,26
                   Q 61,28 58,26
                   Q 55,24 53,24
                   Q 50,24 48,27
                   Q 46,29 42,28
                   Q 39,27 36,31
                   Q 33,35 30,35
                   Q 27,35 24,38
                   Q 22,40 18,39
                   Q 15,38 12,42
                   Q 9,46 5,50 Z" 
                fill="url(#rjStateGrad)" 
                stroke="#334155" 
                strokeWidth="0.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />

              {/* Bay outline details (Guanabara Bay interior water representation) */}
              <path 
                d="M 43,72 C 43.5,69 45,66 46,65 C 47,66 47.5,69 47.2,71.5 Z" 
                fill="#0b1329" 
                stroke="#1e293b" 
                strokeWidth="0.3" 
              />

              {/* Interactive Node Markers */}
              {mapNodes.map((node) => {
                // Determine marker size based on company concentration
                const minRadius = 1.8;
                const maxRadius = 5.5;
                const counts = mapNodes.map(n => n.count);
                const maxCount = Math.max(...counts, 1);
                const sizePct = (node.count / maxCount);
                const r = minRadius + sizePct * (maxRadius - minRadius);

                // Colors based on dominant status
                let markerColor = "#3b82f6"; // Default Blue
                let glowColor = "rgba(59, 130, 246, 0.4)";
                
                if (node.conveniadaCount > node.tratativaCount) {
                  markerColor = "#10b981"; // Emerald
                  glowColor = "rgba(16, 185, 129, 0.4)";
                } else if (node.tratativaCount > 0) {
                  markerColor = "#f59e0b"; // Amber
                  glowColor = "rgba(245, 158, 11, 0.4)";
                }

                const isHovered = hoveredNode?.key === node.key;

                return (
                  <g 
                    key={node.key}
                    className="cursor-pointer group"
                    onClick={() => {
                      if (viewMode === "cidade" && selectedCity === "Todas") {
                        setSelectedCity(node.label);
                      } else if (node.companies.length > 0) {
                        setActiveCompanyDetails(node.companies[0]);
                      }
                    }}
                    onMouseEnter={() => setHoveredNode(node)}
                    onMouseLeave={() => setHoveredNode(null)}
                  >
                    {/* Glowing outer aura */}
                    <circle 
                      cx={node.x} 
                      cy={node.y} 
                      r={r + (isHovered ? 2.5 : 1.2)} 
                      fill="none" 
                      stroke={markerColor} 
                      strokeWidth={isHovered ? 0.8 : 0.4}
                      opacity={isHovered ? 0.9 : 0.4}
                      className="transition-all duration-300"
                    />

                    {/* Interactive pulsing radar ring */}
                    {isHovered && (
                      <circle 
                        cx={node.x} 
                        cy={node.y} 
                        r={r + 4} 
                        fill="none" 
                        stroke={markerColor} 
                        strokeWidth="0.3"
                        opacity="0.7"
                        className="animate-ping"
                        style={{ transformOrigin: `${node.x}% ${node.y}%` }}
                      />
                    )}

                    {/* Central solid dot */}
                    <circle 
                      cx={node.x} 
                      cy={node.y} 
                      r={r} 
                      fill={markerColor} 
                      filter="url(#glow)"
                      className="transition-all duration-300 group-hover:scale-110"
                    />

                    {/* Small inner core */}
                    <circle 
                      cx={node.x} 
                      cy={node.y} 
                      r={Math.max(0.5, r * 0.3)} 
                      fill="#ffffff" 
                      opacity="0.9"
                    />
                  </g>
                );
              })}
            </svg>

            {/* Float Tooltip */}
            {hoveredNode && (
              <div 
                className="absolute bg-slate-950/95 border border-slate-800 text-white p-3.5 rounded-2xl shadow-xl z-20 pointer-events-none max-w-xs transition-all duration-200 backdrop-blur-md"
                style={{
                  left: `${hoveredNode.x}%`,
                  top: `${hoveredNode.y - 12}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div className="flex items-center justify-between space-x-2 mb-1">
                  <span className="font-extrabold text-xs text-white truncate pr-2">
                    {hoveredNode.label}
                  </span>
                  <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] px-1.5 py-0.5 rounded-md font-bold font-mono shrink-0">
                    {hoveredNode.count} {hoveredNode.count === 1 ? 'empresa' : 'empresas'}
                  </span>
                </div>

                <div className="space-y-1.5 text-[10px] text-slate-300 border-t border-slate-800/80 pt-1.5">
                  <div className="flex justify-between">
                    <span>Conveniada(s):</span>
                    <span className="font-bold text-emerald-400 font-mono">{hoveredNode.conveniadaCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Em Tratativa:</span>
                    <span className="font-bold text-amber-400 font-mono">{hoveredNode.tratativaCount}</span>
                  </div>
                  <div className="text-[9px] text-slate-500 italic mt-1 font-sans">
                    {viewMode === "cidade" && selectedCity === "Todas" 
                      ? "💡 Clique para detalhar bairros" 
                      : "💡 Clique no ponto para ver detalhes"}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Help Legend Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-800/60 pt-3 text-[10px] text-slate-400 gap-2 shrink-0">
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-400/40 shrink-0" />
                <span>Predomínio Conveniada</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-amber-400/40 shrink-0" />
                <span>Em Tratativa</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 border border-blue-400/40 shrink-0" />
                <span>Outros</span>
              </span>
            </div>
            <span className="font-mono text-[9px] text-slate-500">
              *Arraste ou passe o mouse nos pontos para obter informações geográficas
            </span>
          </div>

        </div>

        {/* Selected Hub Details Table / Drawer below the map */}
        {filteredData.length > 0 && (
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-extrabold text-slate-800 text-sm flex items-center space-x-2">
                <Building2 size={16} className="text-blue-600" />
                <span>
                  {selectedCity === "Todas" ? "Todas as Empresas" : `Empresas em ${selectedCity}`}
                  {selectedBairro !== "Todos" && ` - Bairro ${selectedBairro}`}
                </span>
              </h4>
              <span className="text-xs bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-xl text-slate-500 font-bold">
                {filteredData.length} resultados
              </span>
            </div>

            <div className="overflow-x-auto max-h-60 overflow-y-auto border border-slate-50 rounded-2xl scrollbar-thin scrollbar-thumb-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0 z-10">
                  <tr>
                    <th className="p-3 pl-4">Empresa</th>
                    <th className="p-3">Localização</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Representante Comercial</th>
                    <th className="p-3 pr-4 text-center">Contato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.map((emp) => (
                    <tr 
                      key={emp.id} 
                      className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                      onClick={() => setActiveCompanyDetails(emp)}
                    >
                      <td className="p-3 pl-4 font-bold text-slate-800">
                        {emp.nome}
                      </td>
                      <td className="p-3 text-slate-500 font-medium">
                        {emp.parsedCity} • <span className="text-slate-700">{emp.parsedBairro}</span>
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          emp.statusEmpresa === "Conveniada"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : emp.statusEmpresa === "Em tratativa"
                            ? "bg-amber-50 text-amber-700 border-amber-100"
                            : emp.statusEmpresa === "Cancelada"
                            ? "bg-rose-50 text-rose-700 border-rose-100"
                            : "bg-slate-50 text-slate-600 border-slate-100"
                        }`}>
                          {emp.statusEmpresa === "Conveniada" && <CheckCircle size={10} />}
                          {emp.statusEmpresa === "Em tratativa" && <Clock size={10} />}
                          <span>{emp.statusEmpresa || "Não Visitada"}</span>
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 font-medium">
                        {emp.consultorNome || "Sem comercial"}
                      </td>
                      <td className="p-3 pr-4 text-center">
                        {emp.telefone ? (
                          <a
                            href={`https://web.whatsapp.com/send?phone=55${emp.telefone.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center space-x-1 text-emerald-600 hover:text-emerald-700 font-bold hover:underline"
                          >
                            <Phone size={12} />
                            <span>Contatar</span>
                          </a>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Detail Modal for Selected Company */}
      {activeCompanyDetails && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 space-y-4 border border-slate-100">
            <div className="flex justify-between items-start">
              <div>
                <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold border mb-2 ${
                  activeCompanyDetails.statusEmpresa === "Conveniada"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                    : activeCompanyDetails.statusEmpresa === "Em tratativa"
                    ? "bg-amber-50 text-amber-700 border-amber-100"
                    : "bg-slate-50 text-slate-600 border-slate-100"
                }`}>
                  {activeCompanyDetails.statusEmpresa || "Não Visitada"}
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 leading-tight">
                  {activeCompanyDetails.nome}
                </h3>
              </div>
              <button
                onClick={() => setActiveCompanyDetails(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="divide-y divide-slate-100 text-xs space-y-3 pt-2">
              <div className="flex justify-between py-2">
                <span className="text-slate-400 font-medium">CNPJ:</span>
                <span className="text-slate-800 font-bold font-mono">{activeCompanyDetails.cnpj || "Não cadastrado"}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400 font-medium">Município / Bairro:</span>
                <span className="text-slate-800 font-bold">{activeCompanyDetails.bairro || "Centro"}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400 font-medium">Endereço Completo:</span>
                <span className="text-slate-800 font-bold text-right max-w-[250px]">{activeCompanyDetails.endereco || "Não cadastrado"}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400 font-medium">Responsável:</span>
                <span className="text-slate-800 font-bold">{activeCompanyDetails.responsavel || "Não cadastrado"}</span>
              </div>
              {activeCompanyDetails.lembrete && (
                <div className="py-3">
                  <span className="text-amber-700 font-extrabold block mb-1 uppercase text-[9px] tracking-wider font-mono">
                    ⏰ Lembrete de Tratativa
                  </span>
                  <div className="p-3 bg-amber-50 text-amber-900 border border-amber-100 rounded-2xl italic">
                    "{activeCompanyDetails.lembrete}"
                  </div>
                </div>
              )}
              <div className="flex justify-between py-2 items-center">
                <span className="text-slate-400 font-medium">Comercial / FDV:</span>
                <span className="text-slate-800 font-bold flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  <span>{activeCompanyDetails.consultorNome || "Sem comercial atribuído"}</span>
                </span>
              </div>
            </div>

            <div className="pt-3 flex gap-2">
              {activeCompanyDetails.telefone && (
                <a
                  href={`https://web.whatsapp.com/send?phone=55${activeCompanyDetails.telefone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl font-bold text-xs text-center hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center space-x-2"
                >
                  <Phone size={14} />
                  <span>Enviar Mensagem WhatsApp</span>
                </a>
              )}
              {activeCompanyDetails.linkMaps && (
                <a
                  href={activeCompanyDetails.linkMaps}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs text-center transition-all flex items-center justify-center"
                >
                  <MapPin size={14} className="mr-1.5" />
                  <span>Ver no Maps</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
