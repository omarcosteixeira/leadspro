import React, { useState, useEffect, useMemo } from "react";
import { BotReport, UserProfile } from "../types";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db, COLLECTIONS } from "../firebase";
import { FileText, Calendar, Users, MessageSquare, Target } from "lucide-react";
import { startOfDay, endOfDay, subDays, format, parseISO } from "date-fns";

interface RelatoriosViewProps {
  profile: UserProfile;
}

export function RelatoriosView({ profile }: RelatoriosViewProps) {
  const [reports, setReports] = useState<BotReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(0);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        let startDt = startOfDay(subDays(new Date(), period));
        let endDt = endOfDay(new Date());

        const q = query(
          collection(db, COLLECTIONS.BOT_REPORTS),
          where("sentAt", ">=", Timestamp.fromDate(startDt)),
          where("sentAt", "<=", Timestamp.fromDate(endDt)),
        );

        const snap = await getDocs(q);
        const data = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as BotReport,
        );
        setReports(data);
      } catch (err: any) {
        console.error("Error fetching bot reports:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [period]);

  const { totalSends, byUser, byBase, byDate } = useMemo(() => {
    let sends = reports.length;
    const userMap: Record<string, { name: string; count: number }> = {};
    const baseMap: Record<string, number> = {};
    const dateMap: Record<string, number> = {};

    reports.forEach((r) => {
      // By user
      if (!userMap[r.userId]) {
        userMap[r.userId] = { name: r.userName, count: 0 };
      }
      userMap[r.userId].count += 1;

      // By base
      const bKey = r.baseName || r.tipoContato || "Desconhecido";
      if (!baseMap[bKey]) baseMap[bKey] = 0;
      baseMap[bKey] += 1;

      // By date
      if (r.sentAt) {
        const dtStr = format(r.sentAt.toDate(), "yyyy-MM-dd");
        if (!dateMap[dtStr]) dateMap[dtStr] = 0;
        dateMap[dtStr] += 1;
      }
    });

    const byUserArr = Object.values(userMap).sort((a, b) => b.count - a.count);
    const byBaseArr = Object.entries(baseMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    const byDateArr = Object.entries(dateMap)
      .map(([date, count]) => ({
        date: format(parseISO(date), "dd/MM"),
        count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalSends: sends,
      byUser: byUserArr,
      byBase: byBaseArr,
      byDate: byDateArr,
    };
  }, [reports]);

  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884D8",
    "#82CA9D",
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <FileText className="text-blue-600" />
            Relatórios
          </h2>
          <p className="text-slate-500 font-medium text-sm mt-1">
            Acompanhamento de Envios via Bot Argo's
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 flex text-sm font-bold">
            <button
              onClick={() => setPeriod(0)}
              className={`px-4 py-2 rounded-lg transition-all ${period === 0 ? "bg-blue-600 text-white shadow" : "text-slate-600 hover:bg-slate-100"}`}
            >
              Hoje
            </button>
            <button
              onClick={() => setPeriod(7)}
              className={`px-4 py-2 rounded-lg transition-all ${period === 7 ? "bg-blue-600 text-white shadow" : "text-slate-600 hover:bg-slate-100"}`}
            >
              7 Dias
            </button>
            <button
              onClick={() => setPeriod(30)}
              className={`px-4 py-2 rounded-lg transition-all ${period === 30 ? "bg-blue-600 text-white shadow" : "text-slate-600 hover:bg-slate-100"}`}
            >
              30 Dias
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-blue-500">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <span className="mt-4 font-bold text-sm">Carregando métricas...</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                <MessageSquare size={28} />
              </div>
              <div>
                <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider">
                  Total de Envios (Bot)
                </h3>
                <span className="text-4xl font-black text-slate-800">
                  {totalSends}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                <Users size={28} />
              </div>
              <div>
                <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider">
                  Usuários Ativos
                </h3>
                <span className="text-4xl font-black text-slate-800">
                  {byUser.length}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center shrink-0">
                <Target size={28} />
              </div>
              <div className="flex-1 w-0">
                <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider truncate">
                  Base Mais Trabalhada
                </h3>
                <span className="text-2xl font-black text-slate-800 truncate block">
                  {byBase.length > 0 ? byBase[0].name : "-"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Users size={18} className="text-slate-400" /> Envios por
                Usuário
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={byUser}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={false}
                      stroke="#E2E8F0"
                    />
                    <XAxis
                      type="number"
                      stroke="#64748B"
                      fontSize={12}
                      fontWeight="bold"
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={120}
                      stroke="#64748B"
                      fontSize={11}
                      fontWeight="bold"
                    />
                    <RechartsTooltip
                      cursor={{ fill: "#F1F5F9" }}
                      contentStyle={{
                        borderRadius: "16px",
                        border: "none",
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                        fontWeight: "bold",
                      }}
                    />
                    <Bar
                      dataKey="count"
                      name="Envios"
                      fill="#3B82F6"
                      radius={[0, 4, 4, 0]}
                    >
                      {byUser.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Target size={18} className="text-slate-400" /> Envios por Base
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={byBase}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="name"
                      label={({ name, percent }) =>
                        `${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {byBase.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: "16px",
                        border: "none",
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                        fontWeight: "bold",
                      }}
                    />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{
                        fontSize: "12px",
                        fontWeight: "bold",
                        color: "#64748B",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {period > 0 && (
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 lg:col-span-2">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <Calendar size={18} className="text-slate-400" /> Volume de
                  Envios ao Longo do Tempo
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={byDate}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#E2E8F0"
                      />
                      <XAxis
                        dataKey="date"
                        stroke="#64748B"
                        fontSize={12}
                        fontWeight="bold"
                      />
                      <YAxis stroke="#64748B" fontSize={12} fontWeight="bold" />
                      <RechartsTooltip
                        contentStyle={{
                          borderRadius: "16px",
                          border: "none",
                          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                          fontWeight: "bold",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        name="Envios"
                        stroke="#3B82F6"
                        strokeWidth={4}
                        dot={{ r: 4, strokeWidth: 2 }}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
