// Update MarkdownSyncContext.tsx to track file save status

import React, { useState, useEffect } from 'react';

const MarkdownSyncContext = () => {
    const [content, setContent] = useState('');
    const [isSaved, setIsSaved] = useState(true);

    const handleChange = (newContent) => {
        setContent(newContent);
        setIsSaved(false); // Mark as unsaved when content changes
    };

    const saveContent = async () => {
        // Simulated save function
        await backendSave(content);
        setIsSaved(true); // Mark as saved after backend confirms save
    };

    useEffect(() => {
        // You can call saveContent when needed, for example:
        if (!isSaved) {
            const timer = setTimeout(() => {
                saveContent();
            }, 2000); // Save after 2 seconds

            return () => clearTimeout(timer);
        }
    }, [isSaved, content]);

    return (
        <div>
            <textarea value={content} onChange={(e) => handleChange(e.target.value)} />
            <p>{isSaved ? 'File is saved' : 'Unsaved changes'}</p>
        </div>
    );
};

export default MarkdownSyncContext;
