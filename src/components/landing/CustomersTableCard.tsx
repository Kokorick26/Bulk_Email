'use client'

import React from 'react'
import { cn } from '@/lib/utils'

// Avatars
const BERNARD_AVATAR = 'https://avatars.githubusercontent.com/u/31113941?v=4'
const MESCHAC_AVATAR = 'https://avatars.githubusercontent.com/u/47919550?v=4'
const GLODIE_AVATAR = 'https://avatars.githubusercontent.com/u/99137927?v=4'

export type Customer = {
    id: number | string
    date: string
    status: 'Paid' | 'Cancelled' | 'Ref'
    statusVariant: 'success' | 'danger' | 'warning'
    name: string
    avatar: string
    revenue: string
}

const DEFAULT_CUSTOMERS: Customer[] = [
    { id: 1, date: '10/31/2023', status: 'Paid', statusVariant: 'success', name: 'Bernard Ng', avatar: BERNARD_AVATAR, revenue: '$43.99' },
    { id: 2, date: '10/21/2023', status: 'Ref', statusVariant: 'warning', name: 'Méschac Irung', avatar: MESCHAC_AVATAR, revenue: '$19.99' },
    { id: 3, date: '10/15/2023', status: 'Paid', statusVariant: 'success', name: 'Glodie Ng', avatar: GLODIE_AVATAR, revenue: '$99.99' },
]

const Badge = ({ children, variant }: { children: React.ReactNode; variant: 'success' | 'danger' | 'warning' }) => {
    const styles =
        variant === 'success'
            ? 'bg-emerald-500/15 text-emerald-400'
            : variant === 'danger'
                ? 'bg-red-500/15 text-red-400'
                : 'bg-amber-500/15 text-amber-400'

    return <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', styles)}>{children}</span>
}

export default function CustomersTableCard({
    title = 'Customers',
    subtitle = 'Recent campaign revenue',
    customers = DEFAULT_CUSTOMERS,
    className,
}: { title?: string; subtitle?: string; className?: string; customers?: Customer[] }) {
    return (
        <section className={cn('bg-zinc-900/50 w-full overflow-hidden rounded-xl border border-white/10', className)}>
            {/* Header */}
            <div className="space-y-0.5 border-b border-white/5 px-4 py-3">
                <div className="flex items-center gap-1 mb-1.5">
                    <span className="size-2 rounded-full bg-zinc-700 border border-white/5" />
                    <span className="size-2 rounded-full bg-zinc-700 border border-white/5" />
                    <span className="size-2 rounded-full bg-zinc-700 border border-white/5" />
                </div>
                <h3 className="text-sm font-semibold text-white">{title}</h3>
                <p className="text-xs text-zinc-500">{subtitle}</p>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead className="bg-zinc-800/50">
                        <tr className="text-zinc-500 text-left">
                            <th className="px-3 py-2 font-medium">#</th>
                            <th className="px-3 py-2 font-medium">Date</th>
                            <th className="px-3 py-2 font-medium">Status</th>
                            <th className="px-3 py-2 font-medium">Customer</th>
                            <th className="px-3 py-2 font-medium text-right">Revenue</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers.map((c, i) => (
                            <tr key={c.id} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                                <td className="px-3 py-2 text-zinc-600">{i + 1}</td>
                                <td className="px-3 py-2 text-zinc-400 whitespace-nowrap">{c.date}</td>
                                <td className="px-3 py-2"><Badge variant={c.statusVariant}>{c.status}</Badge></td>
                                <td className="px-3 py-2">
                                    <div className="flex items-center gap-2">
                                        <img src={c.avatar} alt={c.name} className="size-5 rounded-full ring-1 ring-white/10" />
                                        <span className="text-zinc-300 font-medium truncate">{c.name}</span>
                                    </div>
                                </td>
                                <td className="px-3 py-2 text-right font-medium text-zinc-300 tabular-nums">{c.revenue}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-white/5 text-[10px] text-zinc-600">
                <span>Showing <strong className="text-zinc-400">{customers.length}</strong> rows</span>
                <span>Updated just now</span>
            </div>
        </section>
    )
}
