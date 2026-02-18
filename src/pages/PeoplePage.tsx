import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Header } from '@/components/layout/Header'
import { ProgressRing } from '@/components/common/ProgressRing'
import { EmptyState } from '@/components/common/EmptyState'
import { MiniTrace } from '@/components/cascade/MiniTrace'
import { useCascadeStore } from '@/stores/cascadeStore'
import { useOrgStore } from '@/stores/orgStore'
import { useUIStore } from '@/stores/uiStore'
import { getTeamRankingWithExpectation, getPersonContribution } from '@/lib/cascade'
import type { Profile } from '@/types'

type SortMode = 'contribution' | 'performance'

function PersonDetail({ profile }: { profile: Profile }) {
  const { nodes, nodeMap, childrenMap } = useCascadeStore()
  const t = useUIStore((s) => s.t)

  const contributions = useMemo(
    () => getPersonContribution(profile.id, nodes, nodeMap, childrenMap),
    [profile.id, nodes, nodeMap, childrenMap],
  )
  const totalImpact = contributions.reduce((s, c) => s + c.impact, 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4"
    >
      {/* Person header */}
      <div className="flex items-center gap-4 p-4 rounded-xl bg-surface border border-surface-border">
        <div className="w-14 h-14 rounded-full bg-trace/20 text-trace flex items-center justify-center text-2xl font-bold shrink-0">
          {profile.display_name[0]}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold">{profile.display_name}</h3>
          <div className="text-sm text-text-muted">
            {profile.department && <span>{profile.department} &middot; </span>}
            {profile.hire_year && <span>{new Date().getFullYear() - profile.hire_year}{t('people.yearExp')} &middot; </span>}
            {profile.email}
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold font-mono text-trace">{totalImpact.toFixed(1)}%</div>
          <div className="text-xs text-text-muted">{t('people.contribution')}</div>
        </div>
      </div>

      {/* Actions list */}
      <div className="text-sm text-text-muted">{contributions.length}{t('common.count')} {t('people.actions')}</div>
      {contributions.map(({ node, progress }) => (
        <div key={node.id} className="p-4 rounded-xl bg-surface border border-surface-border">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xl">{node.emoji}</span>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold truncate">{node.title}</h4>
              {node.milestones && node.milestones.length > 0 && (
                <span className="text-xs text-text-muted">
                  ✓ {node.milestones.filter((m) => m.done).length}/{node.milestones.length}
                </span>
              )}
            </div>
            <ProgressRing progress={progress} depth={2} size={40} strokeWidth={3} />
          </div>

          {/* Milestones */}
          {node.milestones && node.milestones.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {node.milestones.map((m) => (
                <span
                  key={m.id}
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    m.done ? 'bg-depth-2/15 text-depth-2' : 'bg-surface-light text-text-muted'
                  }`}
                >
                  {m.done ? '✓' : '○'} {m.label}
                </span>
              ))}
            </div>
          )}

          <MiniTrace nodeId={node.id} />
        </div>
      ))}

      {contributions.length === 0 && (
        <EmptyState emoji="📋" title={t('people.noAssignedActions')} description="" />
      )}
    </motion.div>
  )
}

export default function PeoplePage() {
  const { userId } = useParams()
  const { nodes, nodeMap, childrenMap } = useCascadeStore()
  const members = useOrgStore((s) => s.members)
  const t = useUIStore((s) => s.t)

  const [selectedId, setSelectedId] = useState<string | null>(userId || null)
  const [sortMode, setSortMode] = useState<SortMode>('contribution')

  const ranking = useMemo(
    () => getTeamRankingWithExpectation(nodes, nodeMap, childrenMap, members),
    [nodes, nodeMap, childrenMap, members],
  )

  // Sort by selected mode
  const sorted = useMemo(() => {
    if (sortMode === 'performance') {
      return [...ranking].sort((a, b) => b.performanceRatio - a.performanceRatio)
    }
    return ranking // already sorted by contribution
  }, [ranking, sortMode])

  const selectedProfile = selectedId ? members.find((m) => m.id === selectedId) : null

  // Max values for bar scaling
  const maxContrib = Math.max(...ranking.map((r) => r.totalContribution), 1)
  const maxExpected = Math.max(...ranking.map((r) => r.expectedContrib), 1)
  const maxBar = Math.max(maxContrib, maxExpected)

  return (
    <>
      <Header title={t('people.title')} />
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="max-w-5xl mx-auto">
          {members.length === 0 ? (
            <EmptyState emoji="👥" title={t('people.noMembers')} description={t('people.inviteMembers')} />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6">
              {/* Ranking list */}
              <div className="flex flex-col gap-2">
                {/* Sort toggle + legend */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setSortMode('contribution')}
                      className={`text-xs px-2.5 py-1 rounded-md cursor-pointer transition-colors
                        ${sortMode === 'contribution' ? 'bg-trace/15 text-trace' : 'text-text-muted hover:text-text'}`}
                    >
                      {t('people.sortByContrib')}
                    </button>
                    <button
                      onClick={() => setSortMode('performance')}
                      className={`text-xs px-2.5 py-1 rounded-md cursor-pointer transition-colors
                        ${sortMode === 'performance' ? 'bg-depth-0/15 text-depth-0' : 'text-text-muted hover:text-text'}`}
                    >
                      {t('people.sortByExpected')}
                    </button>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-text-muted">
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-1.5 rounded-full bg-trace inline-block" /> {t('people.actualContrib')}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-1.5 rounded-full bg-depth-0/50 inline-block" /> {t('people.expected')}
                    </span>
                  </div>
                </div>

                {sorted.map((entry, i) => {
                  const isTop = i === 0 && entry.totalContribution > 0
                  const isActive = selectedId === entry.profile.id
                  const actualBarW = maxBar > 0 ? (entry.totalContribution / maxBar) * 100 : 0
                  const expectedBarW = maxBar > 0 ? (entry.expectedContrib / maxBar) * 100 : 0
                  const ratio = entry.performanceRatio
                  const ratioColor = ratio >= 1.2 ? 'text-success' : ratio >= 0.8 ? 'text-trace' : ratio >= 0.5 ? 'text-warning' : 'text-danger'

                  return (
                    <motion.button
                      key={entry.profile.id}
                      layout
                      onClick={() => setSelectedId(isActive ? null : entry.profile.id)}
                      className={`flex items-start gap-3 p-3 rounded-xl border text-left cursor-pointer transition-colors
                        ${isActive
                          ? 'border-trace/50 bg-trace/5'
                          : isTop
                            ? 'border-trace/30 bg-trace/5 hover:border-trace/50'
                            : 'border-surface-border bg-surface hover:border-depth-2/30'
                        }`}
                    >
                      {/* Rank badge */}
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5
                        ${isTop ? 'bg-trace/20 text-trace' : 'bg-surface-light text-text-muted'}`}
                      >
                        {i + 1}
                      </div>

                      {/* Avatar */}
                      <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                        {entry.profile.display_name[0]}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold truncate">
                            {entry.profile.display_name}
                            {isTop && sortMode === 'contribution' && <span className="ml-1">🏆</span>}
                          </span>
                          <span className="text-[10px] text-text-muted shrink-0">
                            {entry.seniority}{t('people.yearExp')}
                          </span>
                        </div>
                        <div className="text-[10px] text-text-muted">
                          {entry.profile.department && <span>{entry.profile.department} · </span>}
                          {entry.actionCount}{t('people.actionsCount')}
                        </div>

                        {/* Dual bars */}
                        <div className="mt-2 space-y-1">
                          {/* Actual contribution bar */}
                          <div className="flex items-center gap-1.5">
                            <div className="flex-1 h-2 bg-surface-light/50 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full rounded-full bg-trace"
                                initial={{ width: 0 }}
                                animate={{ width: `${actualBarW}%` }}
                                transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.03 }}
                              />
                            </div>
                            <span className="text-[10px] font-mono font-bold text-trace w-10 text-right">
                              {entry.totalContribution.toFixed(1)}%
                            </span>
                          </div>
                          {/* Expected contribution bar (ghost/dimmed) */}
                          <div className="flex items-center gap-1.5">
                            <div className="flex-1 h-1.5 bg-surface-light/30 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full rounded-full"
                                style={{ background: 'rgba(167, 139, 250, 0.35)' }}
                                initial={{ width: 0 }}
                                animate={{ width: `${expectedBarW}%` }}
                                transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.03 + 0.1 }}
                              />
                            </div>
                            <span className="text-[10px] font-mono text-depth-0/60 w-10 text-right">
                              {entry.expectedContrib.toFixed(1)}%
                            </span>
                          </div>
                        </div>

                        {/* Performance ratio badge */}
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className="text-[9px] text-text-muted">{t('people.vsExpected')}</span>
                          <span className={`text-xs font-bold font-mono ${ratioColor}`}>
                            {ratio > 0 ? `${(ratio * 100).toFixed(0)}%` : '—'}
                          </span>
                          {ratio >= 1.2 && <span className="text-[9px]">🔥</span>}
                          {ratio > 0 && ratio < 0.5 && <span className="text-[9px]">⚠️</span>}
                        </div>
                      </div>
                    </motion.button>
                  )
                })}
              </div>

              {/* Person detail */}
              <AnimatePresence mode="wait">
                {selectedProfile ? (
                  <PersonDetail key={selectedProfile.id} profile={selectedProfile} />
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-center h-64 text-text-muted text-sm"
                  >
                    {t('people.selectMember')}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
