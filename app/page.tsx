'use client'

import { useState, useCallback } from 'react'

interface LawResult {
  title: string
  lawId: string
  mst: string
  lawType: string
  ministry: string
  promulgationDate: string
  revisionType: string
  abbreviation?: string
  source: string
}

interface SearchResults {
  laws: LawResult[]
  articles: any[]
  precedents: any[]
  rules: any[]
  ordinances: any[]
}

const PATHWAY_NAVY = '#1a3366'
const PATHWAY_BLUE = '#309ce8'
const PATHWAY_BG = '#f6f7f9'
const PATHWAY_DARK = '#131720'
const PATHWAY_GRAY = '#6a7181'
const PATHWAY_LIGHT_BLUE = '#e8f0fe'

export default function Home() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)
  const [activeTab, setActiveTab] = useState<'laws' | 'precedents' | 'rules' | 'ordinances'>('laws')
  const [meta, setMeta] = useState<{ durationMs?: number; totalCount?: number } | null>(null)

  const handleSearch = useCallback(async (q?: string) => {
    const searchQuery = q ?? query
    if (!searchQuery.trim()) return
    setLoading(true)
    setError(null)
    setSearched(true)
    try {
      const res = await fetch(`/api/search/law?query=${encodeURIComponent(searchQuery)}`)
      const data = await res.json()
      if (data.success) {
        setResults(data.results)
        setMeta(data.meta)
        const counts = data.results
        const first = (['laws', 'precedents', 'rules', 'ordinances'] as const).find(k => counts[k]?.length > 0)
        if (first) setActiveTab(first)
      } else {
        setError(data.error?.message || '검색 중 오류가 발생했습니다.')
      }
    } catch (e) {
      setError('서버 연결에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }, [query])

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleSearch() }
  const QUICK_SEARCHES = ['민법', '상법', '형법', '근로기준법', '헌법', '행정소송법']
  const tabItems: { key: typeof activeTab; label: string; count: number }[] = results ? [
    { key: 'laws', label: '법령', count: results.laws.length },
    { key: 'precedents', label: '판례', count: results.precedents.length },
    { key: 'rules', label: '행정규칙', count: results.rules.length },
    { key: 'ordinances', label: '자치법규', count: results.ordinances.length },
  ] : []
  const activeResults = results ? results[activeTab] : []
  const formatDate = (d: string) => { if (!d || d.length < 8) return d; return `${d.slice(0,4)}.${d.slice(4,6)}.${d.slice(6,8)}` }
  const getLawTypeColor = (type: string) => {
    if (type?.includes('법률')) return { bg: '#e8f0fe', color: PATHWAY_NAVY }
    if (type?.includes('대통령령')) return { bg: '#e8f8f0', color: '#1a6644' }
    if (type?.includes('규칙') || type?.includes('령')) return { bg: '#fff3e0', color: '#a85500' }
    return { bg: '#f0f0f0', color: PATHWAY_GRAY }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: PATHWAY_BG, fontFamily: "'Noto Sans KR', sans-serif" }}>
      <header style={{ backgroundColor: '#fff', borderBottom: '1px solid #e5e8ef', padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="https://pathwaypartners-fund-platform.lovable.app/assets/pathway-logo-BCMGXXKZ.png" alt="PATHWAY Partners" style={{ height: 28 }} />
          <div style={{ width: 1, height: 20, backgroundColor: '#e5e8ef', margin: '0 4px' }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: PATHWAY_DARK }}>법령 검색</span>
        </div>
        <div style={{ fontSize: 12, color: PATHWAY_GRAY }}>Korean Legal Research</div>
      </header>
      <div style={{ background: `linear-gradient(135deg, ${PATHWAY_NAVY} 0%, #0f2148 60%, #1a3a6e 100%)`, padding: searched ? '32px 32px 40px' : '64px 32px 72px', transition: 'padding 0.3s ease' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          {!searched && (<><h1 style={{ color: 'rgba(255,255,255,0.95)', fontSize: 36, fontWeight: 700, margin: '0 0 8px', letterSpacing: '-0.5px', lineHeight: 1.3 }}>한국 법령 통합 검색</h1><p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15, margin: '0 0 32px' }}>법률, 시행령, 판례, 행정규칙을 빠르게 검색하세요</p></>)}
          <div style={{ position: 'relative', display: 'flex', gap: 0 }}>
            <input type="text" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={handleKeyDown} placeholder="법령명, 조문 내용으로 검색..." style={{ flex: 1, padding: '14px 20px', fontSize: 15, border: 'none', borderRadius: '8px 0 0 8px', outline: 'none', backgroundColor: 'rgba(255,255,255,0.97)', color: PATHWAY_DARK, boxShadow: '0 2px 12px rgba(0,0,0,0.2)' }} autoFocus />
            <button onClick={() => handleSearch()} disabled={loading} style={{ padding: '14px 24px', backgroundColor: PATHWAY_BLUE, color: '#fff', border: 'none', borderRadius: '0 8px 8px 0', fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, boxShadow: '0 2px 12px rgba(0,0,0,0.2)', minWidth: 80 }}>{loading ? '...' : '검색'}</button>
          </div>
          {!searched && (<div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>{QUICK_SEARCHES.map(q => (<button key={q} onClick={() => { setQuery(q); handleSearch(q) }} style={{ padding: '5px 14px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.25)', backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', fontSize: 13, cursor: 'pointer', transition: 'all 0.15s' }} onMouseEnter={e => { (e.target as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.2)' }} onMouseLeave={e => { (e.target as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.1)' }}>{q}</button>))}</div>)}
        </div>
      </div>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 32px 60px' }}>
        {error && (<div style={{ marginTop: 24, padding: '14px 18px', backgroundColor: '#fff0f0', border: '1px solid #ffd0d0', borderRadius: 8, color: '#c0392b', fontSize: 14 }}>{error}</div>)}
        {results && (<>
          <div style={{ marginTop: 20, marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: PATHWAY_GRAY }}>&ldquo;<strong style={{ color: PATHWAY_DARK }}>{query}</strong>&rdquo; 검색 결과</span>
            {meta?.durationMs && (<span style={{ fontSize: 12, color: PATHWAY_GRAY }}>{meta.durationMs}ms</span>)}
          </div>
          <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #e5e8ef', marginBottom: 20, marginTop: 8 }}>
            {tabItems.map(tab => (<button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ padding: '10px 18px', fontSize: 14, fontWeight: activeTab === tab.key ? 600 : 400, color: activeTab === tab.key ? PATHWAY_NAVY : PATHWAY_GRAY, backgroundColor: 'transparent', border: 'none', borderBottom: activeTab === tab.key ? `2px solid ${PATHWAY_NAVY}` : '2px solid transparent', marginBottom: -2, cursor: 'pointer', transition: 'all 0.15s' }}>{tab.label}<span style={{ marginLeft: 6, padding: '2px 7px', borderRadius: 10, fontSize: 11, fontWeight: 600, backgroundColor: activeTab === tab.key ? PATHWAY_LIGHT_BLUE : '#f0f0f0', color: activeTab === tab.key ? PATHWAY_NAVY : PATHWAY_GRAY }}>{tab.count}</span></button>))}
          </div>
          {activeResults.length === 0 ? (<div style={{ textAlign: 'center', padding: '48px 0', color: PATHWAY_GRAY, fontSize: 14 }}>해당 유형의 검색 결과가 없습니다.</div>) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {activeResults.map((item: LawResult, i: number) => {
                const typeStyle = getLawTypeColor(item.lawType)
                return (<div key={i} style={{ backgroundColor: '#fff', border: '1px solid #e5e8ef', borderRadius: 10, padding: '16px 20px', transition: 'box-shadow 0.15s, border-color 0.15s', cursor: 'pointer' }} onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(26,51,102,0.1)'; (e.currentTarget as HTMLDivElement).style.borderColor = '#c5d0e8' }} onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; (e.currentTarget as HTMLDivElement).style.borderColor = '#e5e8ef' }} onClick={() => window.open(`https://www.law.go.kr/lsInfoP.do?lsiSeq=${item.mst}`, '_blank')}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, backgroundColor: typeStyle.bg, color: typeStyle.color }}>{item.lawType || '법령'}</span>
                        {item.abbreviation && (<span style={{ fontSize: 12, color: PATHWAY_GRAY }}>({item.abbreviation})</span>)}
                      </div>
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: PATHWAY_DARK, lineHeight: 1.4 }}>{item.title}</h3>
                      <div style={{ marginTop: 6, display: 'flex', gap: 16, fontSize: 12, color: PATHWAY_GRAY }}>
                        <span>소관: {item.ministry}</span><span>{item.revisionType}</span><span>시행 {formatDate(item.promulgationDate)}</span>
                      </div>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={PATHWAY_GRAY} strokeWidth="2" style={{ flexShrink: 0, marginTop: 4 }}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15,3 21,3 21,9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                  </div>
                </div>)
              })}
            </div>
          )}
        </>)}
        {!searched && !loading && (<div style={{ marginTop: 48, textAlign: 'center' }}><div style={{ display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap' }}>{[{ icon: '📋', title: '법령', desc: '법률·시행령·시행규칙' }, { icon: '⚖️', title: '판례', desc: '대법원·헌법재판소' }, { icon: '📌', title: '행정규칙', desc: '고시·훈령·예규' }, { icon: '🏛️', title: '자치법규', desc: '조례·규칙' }].map(item => (<div key={item.title} style={{ backgroundColor: '#fff', border: '1px solid #e5e8ef', borderRadius: 10, padding: '20px 24px', width: 130, textAlign: 'center' }}><div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div><div style={{ fontSize: 14, fontWeight: 600, color: PATHWAY_DARK, marginBottom: 4 }}>{item.title}</div><div style={{ fontSize: 12, color: PATHWAY_GRAY }}>{item.desc}</div></div>))}</div></div>)}
      </div>
      <footer style={{ borderTop: '1px solid #e5e8ef', padding: '16px 32px', textAlign: 'center', backgroundColor: '#fff', fontSize: 12, color: PATHWAY_GRAY }}>Copyright ⓒ PATHWAY Partners, co, Ltd. All rights reserved.</footer>
    </div>
  )
                       }
