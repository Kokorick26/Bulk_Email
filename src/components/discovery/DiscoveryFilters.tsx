import { useState } from 'react';
import {
    Building2, MapPin, Users, Briefcase, DollarSign, Cpu, Globe,
    ChevronDown, X, Check, Filter
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTheme } from '../../lib/ThemeContext';
import {
    DiscoveryFilters as FiltersType,
    INDUSTRIES,
    REGIONS,
    COMPANY_SIZES,
    TARGET_ROLES,
    PLATFORMS,
    DEFAULT_FILTERS,
} from './types';

interface DiscoveryFiltersProps {
    filters: FiltersType;
    onChange: (filters: FiltersType) => void;
    onClear: () => void;
}

export function DiscoveryFilters({ filters, onChange, onClear }: DiscoveryFiltersProps) {
    const { theme } = useTheme();
    const [expandedSection, setExpandedSection] = useState<string | null>('industry');

    const hasActiveFilters = () => {
        return (
            filters.industry.length > 0 ||
            filters.region.length > 0 ||
            filters.companySize.length > 0 ||
            filters.targetRole.length > 0 ||
            filters.techMaturity !== '' ||
            filters.platforms.length !== 3
        );
    };

    const toggleArrayValue = (key: keyof FiltersType, value: string) => {
        const currentArray = filters[key] as string[];
        const newArray = currentArray.includes(value)
            ? currentArray.filter(v => v !== value)
            : [...currentArray, value];
        onChange({ ...filters, [key]: newArray });
    };

    const FilterSection = ({
        id,
        icon: Icon,
        title,
        children,
        count
    }: {
        id: string;
        icon: React.ElementType;
        title: string;
        children: React.ReactNode;
        count?: number;
    }) => (
        <div className={cn(
            'border-b transition-colors',
            theme === 'dark' ? 'border-neutral-800' : 'border-gray-200'
        )}>
            <button
                onClick={() => setExpandedSection(expandedSection === id ? null : id)}
                className={cn(
                    'w-full flex items-center justify-between px-4 py-3 text-left transition-colors',
                    theme === 'dark' ? 'hover:bg-white/[0.04]' : 'hover:bg-gray-50'
                )}
            >
                <div className="flex items-center gap-3">
                    <Icon className={cn(
                        'w-4 h-4',
                        theme === 'dark' ? 'text-orange-400' : 'text-orange-600'
                    )} />
                    <span className={cn(
                        'text-sm font-medium',
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                    )}>
                        {title}
                    </span>
                    {count !== undefined && count > 0 && (
                        <span className={cn(
                            'px-2 py-0.5 text-xs rounded-full font-medium',
                            theme === 'dark'
                                ? 'bg-orange-500/20 text-orange-400'
                                : 'bg-orange-100 text-orange-600'
                        )}>
                            {count}
                        </span>
                    )}
                </div>
                <ChevronDown className={cn(
                    'w-4 h-4 transition-transform',
                    theme === 'dark' ? 'text-neutral-500' : 'text-gray-400',
                    expandedSection === id && 'rotate-180'
                )} />
            </button>
            {expandedSection === id && (
                <div className={cn(
                    'px-4 pb-4 pt-1',
                    theme === 'dark' ? 'bg-white/[0.02]' : 'bg-gray-50'
                )}>
                    {children}
                </div>
            )}
        </div>
    );

    const Chip = ({
        label,
        selected,
        onClick
    }: {
        label: string;
        selected: boolean;
        onClick: () => void;
    }) => (
        <button
            onClick={onClick}
            className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-all border',
                selected
                    ? theme === 'dark'
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-orange-600 text-white border-orange-600'
                    : theme === 'dark'
                        ? 'bg-transparent text-neutral-300 border-neutral-700 hover:border-orange-500 hover:bg-orange-500/10'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-orange-500 hover:bg-orange-50'
            )}
        >
            {selected && <Check className="w-3 h-3 inline mr-1" />}
            {label}
        </button>
    );

    return (
        <div className={cn(
            'rounded-xl overflow-hidden border',
            theme === 'dark'
                ? 'bg-[#0c0c0c] border-neutral-800'
                : 'bg-white border-gray-200'
        )}>
            {/* Header */}
            <div className={cn(
                'flex items-center justify-between px-4 py-3 border-b',
                theme === 'dark' ? 'border-neutral-800' : 'border-gray-200'
            )}>
                <div className="flex items-center gap-2">
                    <Filter className={cn(
                        'w-4 h-4',
                        theme === 'dark' ? 'text-orange-400' : 'text-orange-600'
                    )} />
                    <span className={cn(
                        'text-sm font-semibold',
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                    )}>
                        Filters
                    </span>
                </div>
                {hasActiveFilters() && (
                    <button
                        onClick={onClear}
                        className={cn(
                            'text-xs font-medium flex items-center gap-1 px-2 py-1 rounded-md transition-colors',
                            theme === 'dark'
                                ? 'text-red-400 hover:bg-red-500/10'
                                : 'text-red-600 hover:bg-red-50'
                        )}
                    >
                        <X className="w-3 h-3" />
                        Clear all
                    </button>
                )}
            </div>

            {/* Filter Sections */}
            <FilterSection
                id="industry"
                icon={Building2}
                title="Industry / Service Type"
                count={filters.industry.length}
            >
                <div className="flex flex-wrap gap-2">
                    {INDUSTRIES.map(industry => (
                        <Chip
                            key={industry}
                            label={industry}
                            selected={filters.industry.includes(industry)}
                            onClick={() => toggleArrayValue('industry', industry)}
                        />
                    ))}
                </div>
            </FilterSection>

            <FilterSection
                id="region"
                icon={MapPin}
                title="Target Region"
                count={filters.region.length}
            >
                <div className="flex flex-wrap gap-2">
                    {REGIONS.map(region => (
                        <Chip
                            key={region.value}
                            label={region.label}
                            selected={filters.region.includes(region.value)}
                            onClick={() => toggleArrayValue('region', region.value)}
                        />
                    ))}
                </div>
            </FilterSection>

            <FilterSection
                id="size"
                icon={Users}
                title="Company Size"
                count={filters.companySize.length}
            >
                <div className="flex flex-wrap gap-2">
                    {COMPANY_SIZES.map(size => (
                        <Chip
                            key={size.value}
                            label={size.label}
                            selected={filters.companySize.includes(size.value)}
                            onClick={() => toggleArrayValue('companySize', size.value)}
                        />
                    ))}
                </div>
            </FilterSection>

            <FilterSection
                id="role"
                icon={Briefcase}
                title="Decision Maker Role"
                count={filters.targetRole.length}
            >
                <div className="flex flex-wrap gap-2">
                    {TARGET_ROLES.map(role => (
                        <Chip
                            key={role}
                            label={role}
                            selected={filters.targetRole.includes(role)}
                            onClick={() => toggleArrayValue('targetRole', role)}
                        />
                    ))}
                </div>
            </FilterSection>

            <FilterSection
                id="techMaturity"
                icon={Cpu}
                title="Tech Maturity"
            >
                <div className="flex gap-2">
                    {['low', 'medium', 'high'].map(level => (
                        <button
                            key={level}
                            onClick={() => onChange({
                                ...filters,
                                techMaturity: filters.techMaturity === level ? '' : level as FiltersType['techMaturity']
                            })}
                            className={cn(
                                'flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all border',
                                filters.techMaturity === level
                                    ? theme === 'dark'
                                        ? 'bg-orange-500 text-white border-orange-500'
                                        : 'bg-orange-600 text-white border-orange-600'
                                    : theme === 'dark'
                                        ? 'bg-transparent text-neutral-300 border-neutral-700 hover:border-orange-500'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-orange-500'
                            )}
                        >
                            {level.charAt(0).toUpperCase() + level.slice(1)}
                        </button>
                    ))}
                </div>
            </FilterSection>

            <FilterSection
                id="revenue"
                icon={DollarSign}
                title="Revenue Range"
            >
                <div className="space-y-3">
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <label className={cn(
                                'text-xs mb-1 block',
                                theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                            )}>
                                Min (£M)
                            </label>
                            <input
                                type="number"
                                value={filters.revenueRange.min}
                                onChange={(e) => onChange({
                                    ...filters,
                                    revenueRange: { ...filters.revenueRange, min: Number(e.target.value) }
                                })}
                                className={cn(
                                    'w-full px-3 py-2 rounded-lg text-sm border transition-colors outline-none',
                                    theme === 'dark'
                                        ? 'bg-neutral-900 border-neutral-700 text-white focus:border-orange-500'
                                        : 'bg-white border-gray-200 text-gray-900 focus:border-orange-500'
                                )}
                                min={0}
                            />
                        </div>
                        <div className={cn(
                            'mt-5',
                            theme === 'dark' ? 'text-neutral-500' : 'text-gray-400'
                        )}>—</div>
                        <div className="flex-1">
                            <label className={cn(
                                'text-xs mb-1 block',
                                theme === 'dark' ? 'text-neutral-500' : 'text-gray-500'
                            )}>
                                Max (£M)
                            </label>
                            <input
                                type="number"
                                value={filters.revenueRange.max}
                                onChange={(e) => onChange({
                                    ...filters,
                                    revenueRange: { ...filters.revenueRange, max: Number(e.target.value) }
                                })}
                                className={cn(
                                    'w-full px-3 py-2 rounded-lg text-sm border transition-colors outline-none',
                                    theme === 'dark'
                                        ? 'bg-neutral-900 border-neutral-700 text-white focus:border-orange-500'
                                        : 'bg-white border-gray-200 text-gray-900 focus:border-orange-500'
                                )}
                                min={0}
                            />
                        </div>
                    </div>
                </div>
            </FilterSection>

            <FilterSection
                id="platforms"
                icon={Globe}
                title="Search Platforms"
                count={filters.platforms.length}
            >
                <div className="space-y-2">
                    {PLATFORMS.map(platform => (
                        <label
                            key={platform.value}
                            className={cn(
                                'flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors',
                                filters.platforms.includes(platform.value)
                                    ? theme === 'dark' ? 'bg-orange-500/10' : 'bg-orange-50'
                                    : theme === 'dark' ? 'hover:bg-white/[0.04]' : 'hover:bg-gray-50'
                            )}
                        >
                            <input
                                type="checkbox"
                                checked={filters.platforms.includes(platform.value)}
                                onChange={() => toggleArrayValue('platforms', platform.value)}
                                className="w-4 h-4 rounded accent-orange-500"
                            />
                            <span className={cn(
                                'text-sm',
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                            )}>
                                {platform.label}
                            </span>
                        </label>
                    ))}
                </div>
            </FilterSection>
        </div>
    );
}
