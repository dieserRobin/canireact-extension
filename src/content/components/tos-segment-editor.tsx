import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { formatTime, getCurrentTime } from '../utils/youtube';
import { Button } from './ui/button';
import { TrashIcon } from "@radix-ui/react-icons";

const TosSegmentEditor: React.FC = () => {
    const [segments, setSegments] = React.useState<[number, number][]>([]);
    const [startTimestamp, setStartTimestamp] = React.useState<number>(0);
    const [endTimestamp, setEndTimestamp] = React.useState<number>(0);

    const [videoStatus, setVideoStatus] = React.useState<'safe' | 'tos' | 'mixed' | null>(null);

    const deleteCurrent = () => {
        setStartTimestamp(0);
        setEndTimestamp(0);
    }

    const addCurrent = () => {
        setSegments([...segments, [startTimestamp, endTimestamp]]);
        deleteCurrent();
    }

    const save = () => {

    }

    return (
        <div className='tos-editor'>
            <h1 className='cir-text-4xl cir-font-bold'>TOS Segment Editor</h1>

            <h2 className='cir-text-2xl'>Video Status</h2>
            <div className='cir-my-2 cir-flex cir-items-center cir-gap-2 cir-text-xl'>
                <Button disabled={videoStatus === "safe"} onClick={() => setVideoStatus('safe')}>Safe</Button>
                <Button disabled={videoStatus === "tos"} onClick={() => setVideoStatus('tos')}>TOS</Button>
                <Button disabled={videoStatus === "mixed"} onClick={() => setVideoStatus('mixed')}>Mixed</Button>
            </div>

            <div className=''>
                <h2 className='cir-text-2xl'>Segments</h2>
                <div className='tos-editor__segments__list'>
                    {segments.map(([start, end], index) => (
                        <div key={index} className='cir-text-xl cir-font-medium cir-my-1'>
                            <span>{formatTime(start)}</span>
                            -
                            <span>{formatTime(end)}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className='cir-mt-2 cir-flex cir-items-center cir-gap-2 cir-text-xl'>
                <Button disabled={startTimestamp > 0} onClick={async () => setStartTimestamp(await getCurrentTime())}>Start</Button>
                <Button disabled={endTimestamp > 0} onClick={async () => setEndTimestamp(await getCurrentTime())}>Stop</Button>
                <Button disabled={startTimestamp === 0 && endTimestamp === 0} onClick={addCurrent}>Add</Button>
                <Button disabled={segments.length === 0} onClick={deleteCurrent}>
                    <TrashIcon />
                </Button>
            </div>

            <Button className='cir-mt-4' onClick={save}>Save</Button>
        </div >
    );
};

class TosEditor {
    container: HTMLElement;
    root: Root;

    constructor(container: HTMLElement) {
        this.container = container;

        const element = document.createElement('div');
        element.id = 'tos-segment-editor';
        this.container.insertBefore(element, this.container.firstChild);

        this.root = createRoot(element);
        this.root.render(<TosSegmentEditor />);
    }

    destroy() {
        this.root.unmount();
        document.getElementById('tos-segment-editor')?.remove();
    }
}

export default TosEditor;