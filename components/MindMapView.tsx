import React, { useState, useCallback } from 'react';
import ReactFlow, {
    Controls,
    Background,
    applyNodeChanges,
    applyEdgeChanges,
    Node,
    Edge,
    NodeChange,
    EdgeChange,
    addEdge,
    Connection,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { generateMindMapData } from '../services/geminiService';
import MindMapNodeComponent from './MindMapNodeComponent';
import { SparklesIcon } from './IconComponents';
import LoadingSpinner from './LoadingSpinner';
import { MindMapNode, MindMapEdge } from '../types';

const nodeTypes = {
    custom: MindMapNodeComponent,
};

const proOptions = { hideAttribution: true };

const MindMapView: React.FC = () => {
    const [nodes, setNodes] = useState<Node<MindMapNode['data']>[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [topic, setTopic] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onNodesChange = useCallback((changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
    const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);
    const onConnect = useCallback((params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)), []);

    const layoutNodes = (mindMapNodes: MindMapNode[]) => {
        // Simple layouting logic
        const centerX = (window.innerWidth - 256) / 2; // Adjust for sidebar
        const centerY = window.innerHeight / 3;
        const radius = Math.min(300, window.innerWidth / 4);
        
        const centralNode = mindMapNodes.find(n => n.type === 'input');
        const otherNodes = mindMapNodes.filter(n => n.type !== 'input');

        const positionedNodes: Node[] = [];

        if (centralNode) {
            positionedNodes.push({
                ...centralNode,
                position: { x: centerX, y: centerY },
                type: 'custom',
            });
        }

        otherNodes.forEach((node, index) => {
            const angle = (index / otherNodes.length) * 2 * Math.PI;
            positionedNodes.push({
                ...node,
                position: {
                    x: centerX + radius * Math.cos(angle),
                    y: centerY + radius * Math.sin(angle),
                },
                type: 'custom',
            });
        });

        return positionedNodes;
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic.trim()) {
            setError("Please enter a topic.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setNodes([]);
        setEdges([]);

        try {
            const data = await generateMindMapData(topic);
            if (data.nodes && data.edges) {
                 const laidOutNodes = layoutNodes(data.nodes);
                 setNodes(laidOutNodes);
                 setEdges(data.edges);
            } else {
                throw new Error("Received invalid data structure for mind map.");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
         <div className="flex flex-col flex-1 h-full bg-gray-100 dark:bg-gray-900">
            <header className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 z-10">
                <h1 className="text-xl font-semibold">Mind Map Generator</h1>
            </header>
            <div className="relative flex-1">
                 <div className="absolute top-4 left-4 z-10 w-full max-w-md p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                    <form onSubmit={handleSubmit}>
                        <h2 className="text-lg font-medium mb-2 text-gray-700 dark:text-gray-300">Enter a topic</h2>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="e.g., Artificial Intelligence"
                                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none transition bg-gray-50 dark:bg-gray-700"
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                {isLoading ? <LoadingSpinner /> : <><SparklesIcon className="w-5 h-5" /> <span className="ml-2 hidden sm:inline">Generate</span></>}
                            </button>
                        </div>
                    </form>
                    {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
                </div>

                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    nodeTypes={nodeTypes}
                    proOptions={proOptions}
                    fitView
                >
                    <Background />
                    <Controls />
                </ReactFlow>
            </div>
        </div>
    );
};

export default MindMapView;
