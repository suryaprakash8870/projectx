import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { useGetDownlineQuery, useGetNetworkStatsQuery, useGetMeQuery } from '../store/apiSlice';
import { UserIcon, TreeIcon, ListIcon } from '../components/Icons';

// ── Layout constants ──────────────────────────────────────────────────────────
const MAX_LEVELS = 4;
const NODE_W = 190;
const NODE_H = 70;
const H_GAP = 16;
const V_GAP = 110;
const SLOT_W = NODE_W + H_GAP; // 206
const LEAF_COUNT = Math.pow(2, MAX_LEVELS - 1); // 8
const CANVAS_W = LEAF_COUNT * SLOT_W; // 1648
const CANVAS_H = MAX_LEVELS * V_GAP + NODE_H + 40;

function cx(level: number, index: number): number {
  const slotsPerNode = Math.pow(2, MAX_LEVELS - 1 - level);
  return index * slotsPerNode * SLOT_W + (slotsPerNode * SLOT_W) / 2;
}

function ty(level: number): number {
  return level * V_GAP + 20;
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface NodeData {
  userId: string;
  memberId: string;
  name: string;
  isEmpty?: boolean;
  isRoot?: boolean;
}

interface FlatNode {
  level: number;
  index: number;
  node: NodeData;
}

interface Connector {
  d: string;
}

// ── NodeCard ──────────────────────────────────────────────────────────────────
interface NodeCardProps {
  flatNode: FlatNode;
  onHover?: (x: number, y: number, node: NodeData) => void;
  onHoverEnd?: () => void;
}

function NodeCard({ flatNode, onHover, onHoverEnd }: NodeCardProps) {
  const { level, index, node } = flatNode;
  const left = cx(level, index) - NODE_W / 2;
  const top = ty(level);

  const isRoot  = node.isRoot;
  const isEmpty = node.isEmpty;

  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width: NODE_W,
        height: NODE_H,
        borderRadius: 14,
        border: isRoot
          ? '2px solid #0066ff'
          : isEmpty
          ? '1.5px dashed var(--color-border-2)'
          : '1.5px solid var(--color-border)',
        background: isRoot ? 'rgba(0,102,255,0.06)' : 'var(--color-surface)',
        boxShadow: isEmpty ? 'none' : '0 2px 8px rgba(0,0,0,0.07)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        gap: 10,
        cursor: 'default',
        transition: 'box-shadow 0.15s',
      }}
      onMouseEnter={() => onHover && onHover(cx(level, index), top, node)}
      onMouseLeave={() => onHoverEnd && onHoverEnd()}
    >
      {/* YOU pill */}
      {isRoot && (
        <div style={{
          position: 'absolute',
          top: -9,
          left: 12,
          background: '#0066ff',
          color: '#fff',
          fontSize: 8,
          fontWeight: 800,
          letterSpacing: '0.1em',
          padding: '1px 7px',
          borderRadius: 99,
        }}>
          YOU
        </div>
      )}

      {/* Icon area */}
      <div style={{
        width: 42,
        height: 42,
        borderRadius: '50%',
        background: isEmpty
          ? 'var(--color-surface-3)'
          : 'linear-gradient(135deg, #e879f9 0%, #7c3aed 100%)',
        border: isEmpty ? '2px dashed var(--color-border-2)' : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        color: isEmpty ? 'var(--color-text-4)' : '#fff',
      }}>
        <UserIcon size={22} />
      </div>

      {/* Text area */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13,
          fontWeight: 600,
          color: isEmpty ? 'var(--color-text-4)' : 'var(--color-text)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {node.name || '—'}
        </div>
        <div style={{
          fontSize: 11,
          fontFamily: 'monospace',
          color: isEmpty
            ? 'var(--color-text-4)'
            : isRoot
            ? '#0066ff'
            : 'var(--color-text-3)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {node.memberId || 'Empty'}
        </div>
      </div>
    </div>
  );
}

// ── HoverTooltip ──────────────────────────────────────────────────────────────
function HoverTooltip({ node, x, y }: { node: NodeData; x: number; y: number }) {
  return (
    <div style={{
      position: 'absolute',
      left: x - 110,
      top: y + NODE_H + 8,
      width: 220,
      borderRadius: 12,
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border-2)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
      padding: '12px 14px',
      pointerEvents: 'none',
      zIndex: 100,
      fontSize: 12,
    }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-text)', marginBottom: 6 }}>
        {node.name || 'Empty Slot'}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--color-text-4)' }}>Member ID</span>
          <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-text-2)' }}>{node.memberId || '—'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--color-text-4)' }}>Status</span>
          <span style={{
            fontWeight: 700,
            fontSize: 11,
            color: node.isEmpty ? '#f59e0b' : '#10b981',
            background: node.isEmpty ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
            padding: '1px 8px',
            borderRadius: 99,
          }}>{node.isEmpty ? 'Empty' : 'Active'}</span>
        </div>
        {node.isRoot && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
            <span style={{ color: 'var(--color-text-4)' }}>Role</span>
            <span style={{ fontWeight: 600, color: '#0066ff' }}>You (Root)</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── PanZoomCanvas ─────────────────────────────────────────────────────────────
interface PanZoomCanvasProps {
  children: React.ReactNode;
}

function PanZoomCanvas({ children }: PanZoomCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const posRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(0.85);
  const lastTouchDist = useRef<number | null>(null);

  const [, forceUpdate] = useState(0);
  const rerender = useCallback(() => forceUpdate((n) => n + 1), []);

  // Center on mount
  useEffect(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const rootCx = cx(0, 0);
      posRef.current = {
        x: containerWidth / 2 - rootCx * zoomRef.current,
        y: 40,
      };
      rerender();
    }
  }, [rerender]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    dragStart.current = {
      x: e.clientX - posRef.current.x,
      y: e.clientY - posRef.current.y,
    };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    posRef.current = {
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    };
    rerender();
  }, [rerender]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.08 : 0.92;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const oldZoom = zoomRef.current;
    const newZoom = Math.min(3, Math.max(0.2, oldZoom * factor));
    posRef.current = {
      x: mouseX - (mouseX - posRef.current.x) * (newZoom / oldZoom),
      y: mouseY - (mouseY - posRef.current.y) * (newZoom / oldZoom),
    };
    zoomRef.current = newZoom;
    rerender();
  }, [rerender]);

  const getTouchDist = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDragging.current = true;
      dragStart.current = {
        x: e.touches[0].clientX - posRef.current.x,
        y: e.touches[0].clientY - posRef.current.y,
      };
    } else if (e.touches.length === 2) {
      isDragging.current = false;
      lastTouchDist.current = getTouchDist(e.touches);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1 && isDragging.current) {
      posRef.current = {
        x: e.touches[0].clientX - dragStart.current.x,
        y: e.touches[0].clientY - dragStart.current.y,
      };
      rerender();
    } else if (e.touches.length === 2 && lastTouchDist.current !== null) {
      const dist = getTouchDist(e.touches);
      const factor = dist / lastTouchDist.current;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
      const oldZoom = zoomRef.current;
      const newZoom = Math.min(3, Math.max(0.2, oldZoom * factor));
      posRef.current = {
        x: midX - (midX - posRef.current.x) * (newZoom / oldZoom),
        y: midY - (midY - posRef.current.y) * (newZoom / oldZoom),
      };
      zoomRef.current = newZoom;
      lastTouchDist.current = dist;
      rerender();
    }
  }, [rerender]);

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
    lastTouchDist.current = null;
  }, []);

  const handleZoomIn = useCallback(() => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx2 = rect.width / 2;
    const cy2 = rect.height / 2;
    const oldZoom = zoomRef.current;
    const newZoom = Math.min(3, oldZoom * 1.2);
    posRef.current = {
      x: cx2 - (cx2 - posRef.current.x) * (newZoom / oldZoom),
      y: cy2 - (cy2 - posRef.current.y) * (newZoom / oldZoom),
    };
    zoomRef.current = newZoom;
    rerender();
  }, [rerender]);

  const handleZoomOut = useCallback(() => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx2 = rect.width / 2;
    const cy2 = rect.height / 2;
    const oldZoom = zoomRef.current;
    const newZoom = Math.max(0.2, oldZoom / 1.2);
    posRef.current = {
      x: cx2 - (cx2 - posRef.current.x) * (newZoom / oldZoom),
      y: cy2 - (cy2 - posRef.current.y) * (newZoom / oldZoom),
    };
    zoomRef.current = newZoom;
    rerender();
  }, [rerender]);

  const handleReset = useCallback(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const rootCx = cx(0, 0);
      zoomRef.current = 0.85;
      posRef.current = {
        x: containerWidth / 2 - rootCx * 0.85,
        y: 40,
      };
      rerender();
    }
  }, [rerender]);

  const pos = posRef.current;
  const zoom = zoomRef.current;

  return (
    <div style={{ position: 'relative' }}>
      <div
        ref={containerRef}
        style={{
          overflow: 'hidden',
          height: 480,
          cursor: isDragging.current ? 'grabbing' : 'grab',
          touchAction: 'none',
          background: 'var(--color-surface-2)',
          borderRadius: 12,
          border: '1px solid var(--color-border)',
          userSelect: 'none',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          style={{
            transform: `translate(${pos.x}px, ${pos.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            position: 'relative',
            width: CANVAS_W,
            height: CANVAS_H,
          }}
        >
          {children}
        </div>
      </div>

      {/* Zoom controls */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          right: 12,
          display: 'flex',
          gap: 6,
          zIndex: 10,
        }}
      >
        {[
          { label: '+', onClick: handleZoomIn },
          { label: '−', onClick: handleZoomOut },
          { label: 'Reset', onClick: handleReset },
        ].map((btn) => (
          <button
            key={btn.label}
            onClick={btn.onClick}
            style={{
              padding: btn.label === 'Reset' ? '4px 10px' : '4px 10px',
              fontSize: 13,
              fontWeight: 600,
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              color: 'var(--color-text-2)',
              cursor: 'pointer',
              minWidth: 32,
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Hint */}
      <p
        style={{
          textAlign: 'center',
          fontSize: 11,
          color: 'var(--color-text-4)',
          marginTop: 8,
        }}
      >
        Drag to pan · Scroll to zoom
      </p>
    </div>
  );
}

// ── TreeVisualization ─────────────────────────────────────────────────────────
interface TreeVisualizationProps {
  nodes: any[];
  me: any;
}

function TreeVisualization({ nodes, me }: TreeVisualizationProps) {
  const [tooltip, setTooltip] = useState<{ node: NodeData; x: number; y: number } | null>(null);

  const { flatNodes, connectors } = useMemo(() => {
    // Build children map: userId -> { LEFT?: userId, RIGHT?: userId }
    const childrenMap = new Map<string, { LEFT?: string; RIGHT?: string }>();
    for (const n of nodes) {
      if (!n.parentId) continue;
      const existing = childrenMap.get(n.parentId) ?? {};
      if (n.position === 'LEFT') existing.LEFT = n.userId;
      else if (n.position === 'RIGHT') existing.RIGHT = n.userId;
      childrenMap.set(n.parentId, existing);
    }

    // Build user info lookup
    const userMap = new Map<string, { memberId: string; name: string }>();
    for (const n of nodes) {
      userMap.set(n.userId, {
        memberId: n.user?.memberId || n.userId?.slice(0, 8) || 'Unknown',
        name: n.user?.name || 'Unknown',
      });
    }

    // BFS
    const flatNodes: FlatNode[] = [];
    // Queue: [userId | null, level, index]
    const queue: Array<{ userId: string | null; level: number; index: number }> = [];

    const rootId = (me?.id ?? me?.userId) ?? null;
    queue.push({ userId: rootId, level: 0, index: 0 });

    while (queue.length > 0) {
      const item = queue.shift()!;
      const { userId, level, index } = item;

      if (level >= MAX_LEVELS) continue;

      let node: NodeData;
      if (!userId) {
        node = { userId: `empty-${level}-${index}`, memberId: '', name: '', isEmpty: true };
      } else if (level === 0) {
        // Root = me
        node = {
          userId,
          memberId: me?.memberId || 'Me',
          name: me?.name || 'You',
          isRoot: true,
        };
      } else {
        const info = userMap.get(userId);
        if (info) {
          node = { userId, memberId: info.memberId, name: info.name };
        } else {
          node = { userId, memberId: userId.slice(0, 8), name: 'Unknown' };
        }
      }

      flatNodes.push({ level, index, node });

      if (level < MAX_LEVELS - 1) {
        const leftIndex = index * 2;
        const rightIndex = index * 2 + 1;
        if (userId && !node.isEmpty) {
          const children = childrenMap.get(userId) ?? {};
          queue.push({ userId: children.LEFT ?? null, level: level + 1, index: leftIndex });
          queue.push({ userId: children.RIGHT ?? null, level: level + 1, index: rightIndex });
        } else {
          // Empty node: push empty children to keep grid aligned
          queue.push({ userId: null, level: level + 1, index: leftIndex });
          queue.push({ userId: null, level: level + 1, index: rightIndex });
        }
      }
    }

    // Build connectors
    const connectors: Connector[] = [];
    for (const fn of flatNodes) {
      if (fn.level === 0) continue;
      const parentLevel = fn.level - 1;
      const parentIndex = Math.floor(fn.index / 2);

      const x1 = cx(parentLevel, parentIndex);
      const y1 = ty(parentLevel) + NODE_H; // bottom of parent card
      const x2 = cx(fn.level, fn.index);
      const y2 = ty(fn.level);             // top of child card
      const midY = (y1 + y2) / 2;

      connectors.push({ d: `M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}` });
    }

    return { flatNodes, connectors };
  }, [nodes, me]);

  return (
    <PanZoomCanvas>
      <div style={{ position: 'relative', width: CANVAS_W, height: CANVAS_H }}>
        {/* SVG connectors */}
        <svg
          style={{ position: 'absolute', top: 0, left: 0, width: CANVAS_W, height: CANVAS_H, overflow: 'visible', pointerEvents: 'none' }}
        >
          <defs>
            <marker id="tree-arrow" markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto">
              <polygon points="0 0, 7 2.5, 0 5" fill="var(--color-border-2)" />
            </marker>
          </defs>
          {connectors.map((c, i) => (
            <path
              key={i}
              d={c.d}
              fill="none"
              stroke="var(--color-border-2, var(--color-border))"
              strokeWidth={1.5}
              markerEnd="url(#tree-arrow)"
            />
          ))}
        </svg>

        {/* Node cards */}
        {flatNodes.map((fn) => (
          <NodeCard
            key={`${fn.level}-${fn.index}`}
            flatNode={fn}
            onHover={(x, y, node) => setTooltip({ node, x, y })}
            onHoverEnd={() => setTooltip(null)}
          />
        ))}

        {/* Hover tooltip */}
        {tooltip && <HoverTooltip node={tooltip.node} x={tooltip.x} y={tooltip.y} />}
      </div>
    </PanZoomCanvas>
  );
}

// ── DownlineList ──────────────────────────────────────────────────────────────
function DownlineList({ nodes }: { nodes: any[] }) {
  return (
    <div className="space-y-2">
      {nodes.slice(0, 60).map((n: any) => {
        const isLeft = n.position === 'LEFT';
        return (
          <div
            key={n.userId}
            className="flex items-center gap-3 p-3 rounded-xl border"
            style={{
              background: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
            }}
          >
            <span
              className="flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0"
              style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-3)' }}
            >
              <UserIcon size={16} />
            </span>
            <div className="flex-1 min-w-0">
              <div
                className="font-mono text-sm font-semibold"
                style={{ color: 'var(--color-brand-primary)' }}
              >
                {n.user?.memberId || n.userId}
              </div>
              <div
                className="text-xs truncate"
                style={{ color: 'var(--color-text-4)' }}
              >
                {n.user?.name || 'Unknown'} · L{n.user?.level ?? '?'}
              </div>
            </div>
            {n.position && (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-md border"
                style={
                  isLeft
                    ? {
                        background: 'var(--color-surface-left, rgba(14,165,233,0.1))',
                        color: 'var(--color-left, #38bdf8)',
                        borderColor: 'var(--color-left, #38bdf8)',
                      }
                    : {
                        background: 'var(--color-surface-right, rgba(139,92,246,0.1))',
                        color: 'var(--color-right, #a78bfa)',
                        borderColor: 'var(--color-right, #a78bfa)',
                      }
                }
              >
                {n.position}
              </span>
            )}
          </div>
        );
      })}
      {nodes.length > 60 && (
        <p
          className="text-center text-xs py-2"
          style={{ color: 'var(--color-text-4)' }}
        >
          … and {nodes.length - 60} more
        </p>
      )}
    </div>
  );
}

// ── Main Network page ─────────────────────────────────────────────────────────
export default function Network() {
  const authMemberId = useSelector((s: RootState) => s.auth.memberId);
  const { data: me } = useGetMeQuery();
  const { data: downline, isLoading: downLoading } = useGetDownlineQuery();
  const { data: stats, isLoading: statsLoading } = useGetNetworkStatsQuery();

  const myMemberId = me?.memberId || authMemberId || 'You';

  const [view, setView] = useState<'tree' | 'list'>('tree');

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold t-text tracking-tight">Downline Network</h1>
          <p className="t-text-3 text-sm mt-1">Binary organizational tree structure</p>
        </div>
        <div
          className="flex gap-1 rounded-lg p-0.5"
          style={{
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
          }}
        >
          <button
            onClick={() => setView('tree')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              view === 'tree' ? 't-text' : 't-text-3 hover:t-text'
            }`}
            style={view === 'tree' ? { background: 'var(--color-brand-primary)' } : {}}
          >
            <TreeIcon size={14} />
            Tree
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              view === 'list' ? 't-text' : 't-text-3 hover:t-text'
            }`}
            style={view === 'list' ? { background: 'var(--color-brand-primary)' } : {}}
          >
            <ListIcon size={14} />
            List
          </button>
        </div>
      </div>

      {/* Stats bar */}
      {!statsLoading && stats && (
        <div
          className="card shadow-lg shadow-black/20"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Level', value: me?.level ?? stats.level },
              { label: 'Member ID', value: myMemberId, mono: true },
              { label: 'Direct Referrals', value: stats.direct },
              { label: 'Total Downline', value: stats.downlines },
            ].map((item) => (
              <div
                key={item.label}
                className="text-center py-4 rounded-xl border transition-colors"
                style={{
                  background: 'var(--color-surface-2)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <div
                  className={`text-xl font-bold ${item.mono ? 'font-mono text-base' : ''}`}
                  style={{ color: 'var(--color-brand-primary)' }}
                >
                  {item.value}
                </div>
                <div
                  className="text-[10px] mt-1.5 uppercase tracking-wider font-bold"
                  style={{ color: 'var(--color-text-3)' }}
                >
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div
        className="card p-4"
        style={{ borderColor: 'var(--color-border)' }}
      >
        {downLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton h-12 rounded-xl" />
            ))}
          </div>
        ) : !downline?.length && view === 'list' ? (
          <div
            className="text-center py-16 rounded-2xl border border-dashed"
            style={{
              color: 'var(--color-text-4)',
              background: 'var(--color-surface-2)',
              borderColor: 'var(--color-border)',
            }}
          >
            <div className="flex justify-center mb-4 opacity-50">
              <UserIcon size={48} />
            </div>
            <p
              className="text-sm font-medium mb-1"
              style={{ color: 'var(--color-text-2)' }}
            >
              Your downline is empty
            </p>
            <p
              className="text-xs max-w-xs mx-auto"
              style={{ color: 'var(--color-text-4)' }}
            >
              Share your Left or Right referral link from the Dashboard to start building your downline
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <span
                className="text-sm font-semibold px-4 py-1.5 rounded-full border"
                style={{
                  color: 'var(--color-text-2)',
                  background: 'var(--color-surface-3)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <span
                  className="font-black"
                  style={{ color: 'var(--color-brand-primary)' }}
                >
                  {downline?.length ?? 0}
                </span>{' '}
                active members
              </span>
            </div>

            {view === 'tree' ? (
              <TreeVisualization nodes={downline ?? []} me={me} />
            ) : (
              <DownlineList nodes={downline ?? []} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
