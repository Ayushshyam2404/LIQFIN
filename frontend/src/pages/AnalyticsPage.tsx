import React, { useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area 
} from 'recharts';
import { BarChart3, PieChart as PieIcon, LineChart } from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';
import { useSettingsStore } from '../store/useSettingsStore';

export const AnalyticsPage: React.FC = () => {
  const { dashboardStats, fetchDashboard } = useFinanceStore();
  const { formatCurrency } = useSettingsStore();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const data = dashboardStats || {
    stats: {},
    charts: {
      categoryBreakdown: [],
      spendingTrends: []
    }
  };

  const categoryData = data.charts?.categoryBreakdown || [];
  const trendsData = data.charts?.spendingTrends || [];

  // Neo-Brutalist Solid Contrast Palette
  const COLORS = ['#0040e0', '#baf600', '#f59e0b', '#ec4899', '#0d9488', '#8b5cf6', '#e2e2e2', '#747688'];

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h2 className="text-xl font-black text-brand-on-surface uppercase tracking-tight font-mono">SPENDING_ANALYTICS</h2>
        <p className="text-xs text-brand-outline font-medium">Observe dynamic breakdowns and cashflow cycles.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Category Pie Chart */}
        <div className="border-4 border-brand-on-surface bg-brand-surface-lowest p-6 shadow-[4px_4px_0px_0px_var(--border-color)] h-[380px] flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <PieIcon className="w-5 h-5 text-brand-primary" />
            <h3 className="font-extrabold text-sm uppercase font-mono tracking-tight text-brand-on-surface">Category Allocation</h3>
          </div>

          <div className="flex-1 min-h-0 flex flex-col sm:flex-row items-center justify-center gap-4">
            {categoryData.length > 0 ? (
              <>
                <div className="w-full sm:w-2/3 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={90}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryData.map((_entry: any, index: number) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="var(--border-color)" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          background: 'var(--color-brand-surface-lowest)', 
                          border: '2px solid var(--border-color)',
                          boxShadow: '2px 2px 0px 0px var(--border-color)',
                          color: 'var(--color-brand-on-surface)',
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: '11px'
                        }}
                        itemStyle={{ color: '#1b1b1b' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Custom list description */}
                <div className="w-full sm:w-1/3 max-h-[200px] overflow-y-auto space-y-1.5 pr-2 font-mono text-[10px] font-bold">
                  {categoryData.map((item: any, i: number) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="w-2.5 h-2.5 border border-brand-on-surface shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-brand-outline truncate uppercase">{item.name}</span>
                      </div>
                      <span className="text-brand-on-surface font-black">{formatCurrency(item.value, { precision: 0 })}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-20 font-mono text-xs text-brand-outline font-bold">
                POST LEDGER ITEMS TO MAP DATA
              </div>
            )}
          </div>
        </div>

        {/* Cashflow Trends Bar Chart */}
        <div className="border-4 border-brand-on-surface bg-brand-surface-lowest p-6 shadow-[4px_4px_0px_0px_var(--border-color)] h-[380px] flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-5 h-5 text-brand-secondary" />
            <h3 className="font-extrabold text-sm uppercase font-mono tracking-tight text-brand-on-surface">Cashflow Cycles</h3>
          </div>

          <div className="flex-1 min-h-0">
            {trendsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={trendsData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="2 2" stroke="var(--color-brand-on-surface)" opacity={0.15} />
                  <XAxis dataKey="name" stroke="var(--color-brand-on-surface)" style={{ fontSize: '9px', fontFamily: 'JetBrains Mono', fontWeight: 'bold' }} />
                  <YAxis stroke="var(--color-brand-on-surface)" style={{ fontSize: '9px', fontFamily: 'JetBrains Mono', fontWeight: 'bold' }} />
                  <Tooltip
                    contentStyle={{ 
                      background: 'var(--color-brand-surface-lowest)', 
                      border: '2px solid var(--border-color)',
                      boxShadow: '2px 2px 0px 0px var(--border-color)',
                      color: 'var(--color-brand-on-surface)',
                      fontFamily: 'JetBrains Mono',
                      fontSize: '11px'
                    }}
                    itemStyle={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-brand-on-surface)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'JetBrains Mono', paddingTop: '10px', fontWeight: 'bold' }} />
                  <Bar dataKey="income" name="Inflow" fill="#baf600" stroke="var(--border-color)" strokeWidth={2} radius={0} />
                  <Bar dataKey="expenses" name="Outflow" fill="#0040e0" stroke="var(--border-color)" strokeWidth={2} radius={0} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-20 font-mono text-xs text-brand-outline font-bold">
                NO CASHFLOW TRENDS REPORTED YET
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Credit Utilization Area Chart */}
      <div className="border-4 border-brand-on-surface bg-brand-surface-lowest p-6 shadow-[8px_8px_0px_0px_var(--border-color)] h-[320px] flex flex-col justify-between">
        <div className="flex items-center gap-2 mb-2">
          <LineChart className="w-5 h-5 text-brand-primary" />
          <h3 className="font-extrabold text-sm uppercase font-mono tracking-tight text-brand-on-surface">Utilization Ratio Index</h3>
        </div>

        <div className="flex-1 min-h-0">
          {trendsData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={trendsData.map((item: any) => ({
                  ...item,
                  utilization: Math.min(100, Math.max(0, (item.expenses / 15000) * 100))
                }))}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="2 2" stroke="var(--color-brand-on-surface)" opacity={0.15} />
                <XAxis dataKey="name" stroke="var(--color-brand-on-surface)" style={{ fontSize: '9px', fontFamily: 'JetBrains Mono', fontWeight: 'bold' }} />
                <YAxis stroke="var(--color-brand-on-surface)" style={{ fontSize: '9px', fontFamily: 'JetBrains Mono', fontWeight: 'bold' }} unit="%" />
                <Tooltip
                  contentStyle={{ 
                    background: 'var(--color-brand-surface-lowest)', 
                    border: '2px solid var(--border-color)',
                    boxShadow: '2px 2px 0px 0px var(--border-color)',
                    color: 'var(--color-brand-on-surface)',
                    fontFamily: 'JetBrains Mono',
                    fontSize: '11px'
                  }}
                />
                <Area type="monotone" dataKey="utilization" name="Debt Ratio" stroke="#0040e0" strokeWidth={3} fill="#dde1ff" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-20 font-mono text-xs text-brand-outline font-bold">
              NO DEBT UTILIZATION TRACKS RECORDED
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
