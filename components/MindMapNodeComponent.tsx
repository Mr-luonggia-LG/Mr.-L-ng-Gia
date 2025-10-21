import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

const MindMapNodeComponent: React.FC<NodeProps> = ({ data, type }) => {
    const isRoot = type === 'input';
    
    return (
        <div className={`
            px-6 py-3 rounded-lg shadow-md border-2
            ${isRoot 
                ? 'bg-blue-600 text-white border-blue-700' 
                : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600'
            }
        `}>
            <Handle type="target" position={Position.Top} className="!bg-gray-400" />
            <div className="font-semibold">{data.label}</div>
            <Handle type="source" position={Position.Bottom} className="!bg-gray-400" />
        </div>
    );
};

export default memo(MindMapNodeComponent);
