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
import { getTeamRanking, getPersonContribution } from '@/lib/cascade'
import type { Profile } from '@/types'

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
          <div className="text-sm text-text-muted">{profile.email}</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold font-mono text-trace">{totalImpact.toFixed(1)}%</div>
          <div className="text-xs text-text-muted">{t('people.contribution')}</div>
        </div>
      </div>

      {/* Actions list */}
      <div className="text-sm text-text-muted">{contributions.length}개 {t('people.actions')}</div>
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
        <EmptyState emoji="📋" title="배정된 액션이 없습니다" description="" />
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

  const ranking = useMemo(
    () => getTeamRanking(nodes, nodeMap, childrenMap, members),
    [nodes, nodeMap, childrenMap, members],
  )

  const selectedProfile = selectedId ? members.find((m) => m.id === selectedId) : null

  return (
    <>
      <Header title={t('people.title')} />
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          {members.length === 0 ? (
            <EmptyState emoji="👥" title="팀원이 없습니다" description="조직에 멤버를 초대하세요" />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
              {/* Ranking list */}
              <div className="flex flex-col gap-2">
                <div className="text-sm text-text-muted mb-1">{t('people.rank')}</div>
                {ranking.map((entry, i) => {
                  const isTop = i === 0 && entry.totalContribution > 0
                  const isActive = selectedId === entry.profile.id
                  return (
                    <motion.button
                      key={entry.profile.id}
                      layout
                      onClick={() => setSelectedId(isActive ? null : entry.profile.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left cursor-pointer transition-colors
                        ${isActive
                          ? 'border-trace/50 bg-trace/5'
                          : isTop
                            ? 'border-trace/30 bg-trace/5 hover:border-trace/50'
                            : 'border-surface-border bg-surface hover:border-depth-2/30'
                        }`}
                    >
                      {/* Rank badge */}
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                        ${isTop ? 'bg-trace/20 text-trace' : 'bg-surface-light text-text-muted'}`}
                      >
                        {i + 1}
                      </div>

                      {/* Avatar + name */}
                      <div className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                        {entry.profile.display_name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate">
                          {entry.profile.display_name}
                          {isTop && <span className="ml-1">🏆</span>}
                        </div>
                        <div className="text-xs text-text-muted">
                          {entry.actionCount}개 액션
                        </div>
                      </div>

                      {/* Contribution */}
                      <div className="text-right shrink-0">
                        <div className={`text-sm font-bold font-mono ${isTop ? 'text-trace' : 'text-depth-2'}`}>
                          {entry.totalContribution.toFixed(1)}%
                        </div>
                        <div className="w-16 h-1.5 rounded-full bg-surface-light overflow-hidden mt-1">
                          <div
                            className={`h-full rounded-full ${isTop ? 'bg-trace' : 'bg-depth-2'}`}
                            style={{ width: `${Math.min(100, entry.totalContribution * 2)}%` }}
                          />
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
                    팀원을 선택하여 기여도를 확인하세요
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
