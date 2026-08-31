import dagre from 'dagre';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  type Node,
  type Edge,
  type NodeTypes,
  Panel,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useSearchParams, Link } from 'react-router-dom';
import { Maximize2, Minimize2, Trees, ChevronRight, User } from 'lucide-react';
import { useI18n } from '@/context/I18nContext';
import { PersonNode, type PersonNodeData } from '@/components/PersonNode';
import { getRootAncestor, getPerson, getChildren, getSpouses, getDescendants } from '@/services/family';
import { displayName, birthYear } from '@/utils/person';
import type { Person } from '@/types';

const nodeTypes: NodeTypes = { person: PersonNode };

const NODE_W = 240;
const NODE_H = 130;
const SIBLING_GAP = 230;
const LEVEL_GAP = 210;

interface LoadedNode {
  person: Person;
  childrenExpanded: boolean;
  hasChildren: boolean;
  childrenCount: number;
  x: number;
  y: number;
  spouses?: Person[];
}

function TreeView() {
  const { t, lang } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const { setCenter, getNode } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<PersonNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [focusedId, setFocusedId] = useState<string | null>(null);

  const loadedRef = useRef<Map<string, LoadedNode>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  const focusId = searchParams.get('focus');

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    const ln = loadedRef.current.get(id);
    if (ln) setSelectedPerson(ln.person);
  }, []);

  const handleToggleChildren = useCallback(
    async (id: string) => {
      const ln = loadedRef.current.get(id);
      if (!ln) return;

      if (ln.childrenExpanded) {
        ln.childrenExpanded = false;
        const toRemove = new Set<string>();
        const collect = (parentId: string) => {
          loadedRef.current.forEach((child) => {
            if (
              (child.person.father_id === parentId || child.person.mother_id === parentId) &&
              !toRemove.has(child.person.id)
            ) {
              toRemove.add(child.person.id);
              collect(child.person.id);
            }
          });
        };
        collect(id);
        toRemove.forEach((rid) => loadedRef.current.delete(rid));
        return;
      }

      ln.childrenExpanded = true;
      setNodes((nds) =>
        nds.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, loadingChildren: true } } : n,
        ),
      );

      try {
        const children = await getChildren(id);
        children.forEach((c) => {
          if (!loadedRef.current.has(c.id)) {
            loadedRef.current.set(c.id, {
              person: c,
              childrenExpanded: false,
              hasChildren: c.children_status === 'has_children',
              childrenCount: 0,
              x: 0,
              y: 0,
            });
          }
        });
        ln.childrenCount = children.length;
        ln.hasChildren = children.length > 0 || ln.person.children_status === 'has_children';

        const spouses = await getSpouses(id);
        ln.spouses = spouses.map(s => s.spouse);
      } catch (e) {
        ln.childrenExpanded = false;
        setError((e as Error).message);
      }
    },
    [setNodes],
  );

  // Build the visual nodes/edges from loadedRef, with layout
  const renderTree = useCallback(() => {
    const map = loadedRef.current;
    if (map.size === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: 'BT', nodesep: 100, ranksep: 150 });
    g.setDefaultEdgeLabel(() => ({}));

    // Add nodes to dagre
    map.forEach((ln, id) => {
      g.setNode(id, { 
        width: NODE_W, 
        height: NODE_H 
      });
    });

    // Build edges
    const newEdges: Edge[] = [];
    map.forEach((ln, targetId) => {
      const peopleInNode = [ln.person, ...(ln.spouses || [])];
      
      peopleInNode.forEach((p) => {
        let parentId = null;
        if (p.father_id && map.has(p.father_id)) parentId = p.father_id;
        else if (p.mother_id && map.has(p.mother_id)) parentId = p.mother_id;
        else {
          // If parent node was hidden (deduplicated spouse), find the primary node holding them
          const missingParent = p.father_id || p.mother_id;
          if (missingParent) {
            for (const [id, node] of map.entries()) {
              if (node.spouses?.some(s => s.id === missingParent)) {
                parentId = id;
                break;
              }
            }
          }
        }

        if (parentId) {
          const edgeId = `e-${parentId}-${targetId}`;
          if (!newEdges.some(e => e.id === edgeId)) {
            g.setEdge(parentId, targetId);
            newEdges.push({
              id: edgeId,
              source: parentId,
              target: targetId,
              type: 'bezier',
              style: { stroke: '#78350f', strokeWidth: 5 },
            });
          }
        }
      });
    });

    dagre.layout(g);

    // Build React Flow nodes
    const newNodes: Node<PersonNodeData>[] = [];
    map.forEach((ln, id) => {
      const dNode = g.node(id);
      ln.x = dNode.x - dNode.width / 2 + NODE_W / 2;
      ln.y = dNode.y - dNode.height / 2;

      newNodes.push({
        id: ln.person.id,
        type: 'person',
        position: { x: ln.x, y: ln.y },
        data: {
          person: ln.person,
          lang,
          t,
          childrenExpanded: ln.childrenExpanded,
          hasChildren: ln.hasChildren,
          childrenCount: ln.childrenCount,
          loadingChildren: false,
          isHighlighted: focusedId === ln.person.id,
          isSelected: selectedId === ln.person.id,
          onToggleChildren: handleToggleChildren,
          onSelect: handleSelect,
          spouses: ln.spouses,
        },
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [lang, t, focusedId, selectedId, handleToggleChildren, handleSelect, setNodes, setEdges]);

  // Initial load: all persons + spouses
  useEffect(() => {
    if (focusId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { getPersons } = await import('@/services/family');
        const allPersons = await getPersons(1000);
        if (cancelled) return;
        
        loadedRef.current.clear();
        allPersons.forEach((c) => {
          loadedRef.current.set(c.id, {
            person: c,
            childrenExpanded: true,
            hasChildren: false,
            childrenCount: 0,
            x: 0,
            y: 0,
          });
        });

        // Calculate accurate children counts
        loadedRef.current.forEach((ln, id) => {
          let count = 0;
          loadedRef.current.forEach((childLn) => {
            if (childLn.person.father_id === id || childLn.person.mother_id === id) {
              count++;
            }
          });
          ln.childrenCount = count;
          if (count > 0) ln.hasChildren = true;
        });

        // Fetch spouses for everyone loaded
        const allIds = Array.from(loadedRef.current.keys());
        const spousesResults = await Promise.all(allIds.map(id => getSpouses(id).then(sp => ({ id, sp }))));
        
        spousesResults.forEach(({ id, sp }) => {
          if (sp.length > 0) {
            const ln = loadedRef.current.get(id);
            if (ln) ln.spouses = sp.map(s => s.spouse);
          }
        });

        // DEDUPLICATE SPOUSE NODES
        const toRemove = new Set<string>();
        loadedRef.current.forEach((ln, id) => {
          if (toRemove.has(id)) return;
          if (ln.spouses && ln.spouses.length > 0) {
            ln.spouses.forEach(spouse => {
              if (toRemove.has(spouse.id)) return;
              if (!loadedRef.current.has(spouse.id)) return;
              
              const p1 = ln.person;
              const p2 = spouse;
              const g1 = p1.gender || 'unknown';
              const g2 = p2.gender || 'unknown';
              
              if (g1 === 'male' && g2 !== 'male') toRemove.add(p2.id);
              else if (g2 === 'male' && g1 !== 'male') toRemove.add(p1.id);
              else toRemove.add(p1.id < p2.id ? p2.id : p1.id);
            });
          }
        });
        toRemove.forEach(id => loadedRef.current.delete(id));

        renderTree();
        setLoading(false);
      } catch (e) {
        if (!cancelled) {
          setError((e as Error).message);
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-render when focus/select changes
  useEffect(() => {
    if (!loading) renderTree();
  }, [renderTree, loading, focusedId, selectedId]);

  // Focus person from search
  useEffect(() => {
    if (!focusId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { getPersons, getPerson } = await import('@/services/family');
        const [allPersons, person] = await Promise.all([
          getPersons(1000),
          getPerson(focusId)
        ]);
        
        if (cancelled || !person) return;

        loadedRef.current.clear();
        allPersons.forEach((c) => {
          loadedRef.current.set(c.id, {
            person: c,
            childrenExpanded: true,
            hasChildren: false,
            childrenCount: 0,
            x: 0,
            y: 0,
          });
        });

        // Calculate accurate children counts
        loadedRef.current.forEach((ln, id) => {
          let count = 0;
          loadedRef.current.forEach((childLn) => {
            if (childLn.person.father_id === id || childLn.person.mother_id === id) count++;
          });
          ln.childrenCount = count;
          if (count > 0) ln.hasChildren = true;
        });

        // Fetch spouses for everyone loaded
        const allIds = Array.from(loadedRef.current.keys());
        const spousesResults = await Promise.all(allIds.map(id => getSpouses(id).then(sp => ({ id, sp }))));
        spousesResults.forEach(({ id, sp }) => {
          if (sp.length > 0) {
            const ln = loadedRef.current.get(id);
            if (ln) ln.spouses = sp.map(s => s.spouse);
          }
        });

        // DEDUPLICATE SPOUSE NODES
        // If a couple is married, we only render ONE main card. The spouse is rendered inside it.
        const toRemove = new Set<string>();
        loadedRef.current.forEach((ln, id) => {
          if (toRemove.has(id)) return;
          if (ln.spouses && ln.spouses.length > 0) {
            ln.spouses.forEach(spouse => {
              if (toRemove.has(spouse.id)) return;
              if (!loadedRef.current.has(spouse.id)) return;
              
              const p1 = ln.person;
              const p2 = spouse;
              const g1 = p1.gender || 'unknown';
              const g2 = p2.gender || 'unknown';
              
              if (g1 === 'male' && g2 !== 'male') toRemove.add(p2.id);
              else if (g2 === 'male' && g1 !== 'male') toRemove.add(p1.id);
              else toRemove.add(p1.id < p2.id ? p2.id : p1.id);
            });
          }
        });
        toRemove.forEach(id => loadedRef.current.delete(id));

        setFocusedId(person.id);
        setSelectedId(person.id);
        setSelectedPerson(person);
        renderTree();
        setLoading(false);

        setTimeout(() => {
          const node = getNode(person.id);
          if (node) {
            setCenter(node.position.x + NODE_W / 2, node.position.y + NODE_H / 2, {
              zoom: 1.2,
              duration: 800,
            });
          }
        }, 300);

        setSearchParams({}, { replace: true });
      } catch (e) {
        if (!cancelled) {
          setError((e as Error).message);
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId]);

  // Fullscreen
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const handler = () => setFullscreen(!!document.fullscreenElement);
    el.addEventListener('fullscreenchange', handler);
    return () => el.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  const selectedData = useMemo(() => selectedPerson, [selectedPerson]);

  return (
    <div className="flex h-[calc(100vh-65px)] flex-col">
      <div
        ref={containerRef}
        className={`relative flex-1 bg-stone-100 ${fullscreen ? 'fixed inset-0 z-50' : ''}`}
      >
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-stone-500">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-stone-300 border-t-amber-700" />
              <p>{t('loading')}</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center">
            <div className="max-w-md rounded-xl border border-red-200 bg-red-50 p-6 text-center">
              <p className="font-medium text-red-700">{t('error')}</p>
              <p className="mt-1 text-sm text-red-600">{error}</p>
            </div>
          </div>
        ) : nodes.length === 0 ? (
          <div className="flex h-full items-center justify-center px-4">
            <div className="max-w-md rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
              <Trees className="mx-auto mb-4 h-12 w-12 text-amber-700" />
              <p className="text-lg font-medium text-stone-700">{t('noPersonsYet')}</p>
              <Link
                to="/admin"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-amber-900 transition"
              >
                {t('addMember')}
              </Link>
            </div>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.1}
            maxZoom={2}
            defaultEdgeOptions={{ type: 'smoothstep' }}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#e7e5e4" gap={20} />
            <Controls showInteractive={false} />
            <Panel position="top-right" className="!bg-white !rounded-lg !shadow-md !border !border-stone-200">
              <button
                onClick={toggleFullscreen}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-stone-700 hover:text-amber-700"
              >
                {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                {fullscreen ? t('exitFullscreen') : t('fullscreen')}
              </button>
            </Panel>
          </ReactFlow>
        )}

        {/* Selected person panel */}
        {selectedData && !fullscreen && (
          <div className="absolute right-0 top-0 z-20 h-full w-80 overflow-y-auto border-l border-stone-200 bg-white shadow-lg">
            <div className="p-5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-500">{t('profile')}</h3>
                <button
                  onClick={() => {
                    setSelectedId(null);
                    setSelectedPerson(null);
                  }}
                  className="text-stone-400 hover:text-stone-600 text-xl leading-none"
                >
                  ×
                </button>
              </div>
              <div className="mt-4 flex flex-col items-center text-center">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-stone-100 ring-2 ring-stone-200">
                  {selectedData.profile_photo ? (
                    <img src={selectedData.profile_photo} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-10 w-10 text-stone-400" />
                  )}
                </div>
                <h2 className="mt-3 text-lg font-bold text-stone-800">
                  {displayName(selectedData, lang)}
                </h2>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                {selectedData.life_status === 'alive' && (
                  <div className="flex items-center gap-2 text-emerald-600">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    {t('alive')}
                  </div>
                )}
                {selectedData.life_status === 'deceased' && (
                  <div className="flex items-center gap-2 text-stone-500">
                    <span className="h-2 w-2 rounded-full bg-stone-400" />
                    {t('deceased')}
                  </div>
                )}
                {birthYear(selectedData) && (
                  <div className="text-stone-600">{t('born')}: {birthYear(selectedData)}</div>
                )}
              </div>
              <Link
                to={`/person/${selectedData.id}`}
                className="mt-5 flex items-center justify-center gap-2 rounded-lg bg-amber-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-900 transition"
              >
                {t('viewFamily')}
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function TreePage() {
  return (
    <ReactFlowProvider>
      <TreeView />
    </ReactFlowProvider>
  );
}
