import { useState, useEffect } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';
import { Loader2, Globe, TrendingUp, MousePointer, Mail } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTheme } from '../lib/ThemeContext';
import { ScrollArea } from '../components/ui/ScrollArea';

// World map topology
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface GeoData {
    id: string; // ISO 2 or 3 code
    value: number; // Traffic count
}

interface AnalyticsStats {
    totalSent: number;
    totalOpens: number;
    totalClicks: number;
    totalReplies: number;
}

export default function AnalyticsPage() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [loading, setLoading] = useState(true);
    const [geoData, setGeoData] = useState<GeoData[]>([]);
    const [stats, setStats] = useState<AnalyticsStats>({ totalSent: 0, totalOpens: 0, totalClicks: 0, totalReplies: 0 });

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('bulkEmailToken');
            const res = await fetch('/api/bulk-email/analytics/geo', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setGeoData(data.geoData || []);
                setStats(data.stats || { totalSent: 0, totalOpens: 0, totalClicks: 0, totalReplies: 0 });
            }
        } catch (error) {
            console.error('Failed to fetch analytics', error);
        } finally {
            setLoading(false);
        }
    };

    // Prepare color scale
    const maxValue = Math.max(...geoData.map(d => d.value), 1);
    const colorScale = scaleLinear<string>()
        .domain([0, maxValue])
        .range(isDark ? ["#262626", "#f97316"] : ["#e5e7eb", "#f97316"]);

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col p-6 overflow-hidden">
            <div className="mb-8">
                <h1 className={cn("text-2xl font-bold mb-1", isDark ? "text-white" : "text-gray-900")}>Global Traffic Analytics</h1>
                <p className={cn("text-sm", isDark ? "text-neutral-400" : "text-gray-500")}>Real-time visualization of your campaign engagement across the world.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <StatCard
                    label="People Visited"
                    value={stats.totalOpens}
                    icon={Globe}
                    isDark={isDark}
                    change={stats.totalOpens > 0 ? `${((stats.totalOpens / (stats.totalSent || 1)) * 100).toFixed(0)}% of recipients` : undefined}
                />
                <StatCard
                    label="Total Opens"
                    value={stats.totalOpens}
                    icon={Globe}
                    isDark={isDark}
                    subtext={`${((stats.totalOpens / (stats.totalSent || 1)) * 100).toFixed(1)}% Rate`}
                />
                <StatCard
                    label="Link Clicks"
                    value={stats.totalClicks}
                    icon={MousePointer}
                    isDark={isDark}
                    subtext={`${((stats.totalClicks / (stats.totalSent || 1)) * 100).toFixed(1)}% Rate`}
                />
                <StatCard
                    label="Replies"
                    value={stats.totalReplies}
                    icon={TrendingUp}
                    isDark={isDark}
                    subtext={`${((stats.totalReplies / (stats.totalSent || 1)) * 100).toFixed(1)}% Rate`}
                />
            </div>

            {/* Main Content: Map + Table */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                {/* World Map */}
                <div className={cn(
                    "lg:col-span-2 rounded-xl border p-4 flex flex-col items-center justify-center relative overflow-hidden",
                    isDark ? "bg-[#111] border-neutral-800" : "bg-white border-gray-200"
                )}>
                    <div className="absolute top-4 left-4 z-10">
                        <h3 className={cn("text-sm font-semibold", isDark ? "text-white" : "text-gray-900")}>Live Engagement Map</h3>
                        <div className="flex items-center gap-2 mt-2 text-xs">
                            <span className="w-2 h-2 rounded-full bg-neutral-500"></span> <span>Low</span>
                            <span className="w-20 h-1 rounded-full bg-gradient-to-r from-neutral-500 to-orange-500 mx-1"></span>
                            <span className="w-2 h-2 rounded-full bg-orange-500"></span> <span>High</span>
                        </div>
                    </div>

                    <div className="w-full h-full min-h-[400px]">
                        <ComposableMap projectionConfig={{ scale: 147 }} width={800} height={500} style={{ width: "100%", height: "100%" }}>
                            <ZoomableGroup>
                                <Geographies geography={geoUrl}>
                                    {({ geographies }) =>
                                        geographies.map((geo) => {
                                            // Need to map ISO 2 (from geoip) to ISO 3 (topology) or verify names.
                                            // geoip-lite returns ISO 2 (e.g. US). 
                                            // TopoJSON 110m typically has ISO_A2 or ISO_A3 properties.
                                            // Let's assume our data ID matches 'ISO_A2'.
                                            const d = geoData.find((s) => s.id === geo.properties.ISO_A2);
                                            return (
                                                <Geography
                                                    key={geo.rsmKey}
                                                    geography={geo}
                                                    fill={d ? colorScale(d.value) : (isDark ? "#262626" : "#e5e7eb")}
                                                    stroke={isDark ? "#171717" : "#fff"}
                                                    strokeWidth={0.5}
                                                    style={{
                                                        default: { outline: "none" },
                                                        hover: { fill: "#f97316", outline: "none", cursor: "pointer" },
                                                        pressed: { outline: "none" },
                                                    }}
                                                />
                                            );
                                        })
                                    }
                                </Geographies>
                            </ZoomableGroup>
                        </ComposableMap>
                    </div>
                </div>

                {/* Top Countries List */}
                <div className={cn(
                    "rounded-xl border flex flex-col overflow-hidden",
                    isDark ? "bg-[#111] border-neutral-800" : "bg-white border-gray-200"
                )}>
                    <div className={cn("p-4 border-b", isDark ? "border-neutral-800" : "border-gray-100")}>
                        <h3 className={cn("text-sm font-semibold", isDark ? "text-white" : "text-gray-900")}>Top Countries</h3>
                    </div>
                    <ScrollArea className="flex-1">
                        <div className="p-2">
                            {geoData.length === 0 ? (
                                <div className="text-center py-8 text-xs text-gray-500">No geographic data yet</div>
                            ) : (
                                geoData.sort((a, b) => b.value - a.value).map((item, idx) => (
                                    <div key={item.id} className={cn(
                                        "flex items-center justify-between p-3 rounded-lg mb-1",
                                        isDark ? "hover:bg-neutral-800/50" : "hover:bg-gray-50"
                                    )}>
                                        <div className="flex items-center gap-3">
                                            <span className={cn("text-xs font-mono w-4", isDark ? "text-neutral-600" : "text-gray-400")}>{idx + 1}</span>
                                            <div className="flex flex-col">
                                                <span className={cn("text-sm font-medium", isDark ? "text-white" : "text-gray-900")}>{item.id}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-24 h-1.5 rounded-full bg-gray-200 dark:bg-neutral-800 overflow-hidden">
                                                <div
                                                    className="h-full bg-orange-500 rounded-full"
                                                    style={{ width: `${(item.value / maxValue) * 100}%` }}
                                                />
                                            </div>
                                            <span className={cn("text-xs font-mono w-8 text-right", isDark ? "text-neutral-400" : "text-gray-600")}>
                                                {item.value}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, icon: Icon, isDark, subtext, change }: any) {
    return (
        <div className={cn(
            "p-5 rounded-xl border flex items-center justify-between",
            isDark ? "bg-[#111] border-neutral-800 text-white" : "bg-white border-gray-200 text-gray-900"
        )}>
            <div>
                <p className={cn("text-xs font-medium mb-1", isDark ? "text-neutral-500" : "text-gray-500")}>{label}</p>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl font-bold font-mono tracking-tight">{value.toLocaleString()}</h3>
                    {change && <span className="text-xs text-emerald-500 font-medium">{change}</span>}
                </div>
                {subtext && <p className={cn("text-xs mt-1", isDark ? "text-neutral-600" : "text-gray-400")}>{subtext}</p>}
            </div>
            <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                isDark ? "bg-neutral-800" : "bg-gray-100"
            )}>
                <Icon className={cn("w-5 h-5", isDark ? "text-neutral-400" : "text-gray-500")} />
            </div>
        </div>
    );
}
