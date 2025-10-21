import React from 'react';

// Simple inline parser for bold and italic
const parseInline = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.filter(Boolean).map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={index}>{part.substring(2, part.length - 2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*')) {
            return <em key={index}>{part.substring(1, part.length - 1)}</em>;
        }
        return part;
    });
};

const MarkdownRenderer: React.FC<{ text: string }> = ({ text }) => {
    // Split by one or more newlines to handle paragraphs and lists
    const blocks = text.split(/\n+/);

    return (
        <div>
            {blocks.map((block, i) => {
                // Check for list items
                if (block.trim().startsWith('* ') || block.trim().startsWith('- ')) {
                    const item = block.trim().substring(2);
                    return (
                        <ul key={i} className="list-disc list-inside">
                            <li>{parseInline(item)}</li>
                        </ul>
                    );
                }
                // Default to paragraph
                return <p key={i}>{parseInline(block)}</p>;
            })}
        </div>
    );
};

export default MarkdownRenderer;
