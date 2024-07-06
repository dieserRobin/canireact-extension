import React from 'react';
import { createRoot, Root } from 'react-dom/client';

const TosSegmentEditor: React.FC = () => {
    return (<>
        <div className='tos-editor'>
            <h1 className=''>TOS Segment Editor</h1>
        </div>
    </>)
}

class TosEditor {
    container: HTMLElement;
    root: Root;

    constructor(container: HTMLElement) {
        this.container = container;

        const element = document.createElement('div');
        element.id = 'tos-segment-editor';

        this.root = createRoot(element);
        this.root.render(<TosSegmentEditor />);

        this.container.insertBefore(element, this.container.firstChild);
    }

    destroy() {
        this.root.unmount();
        document.getElementById('tos-segment-editor')?.remove();
    }
}

export default TosEditor;