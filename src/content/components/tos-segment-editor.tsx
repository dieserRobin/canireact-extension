import React, { useState } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { formatTime, getCurrentTime, getVideoId } from '../utils/youtube';
import { Button } from './ui/button';
import { TrashIcon } from "@radix-ui/react-icons";
import { submitSegment, TosSegment } from '../utils/api';
import { log } from '../utils';

type Props = {
    defaultSegments: TosSegment[];
}

const TosSegmentEditor: React.FC<Props> = ({ defaultSegments }) => {
    const [segments, setSegments] = React.useState<[number, number][]>([]);
    const [startTimestamp, setStartTimestamp] = React.useState<number>(0);
    const [endTimestamp, setEndTimestamp] = React.useState<number>(0);

    const [saving, setSaving] = useState(false);

    const deleteCurrent = () => {
        setStartTimestamp(0);
        setEndTimestamp(0);
    }

    const addCurrent = () => {
        setSegments([...segments, [startTimestamp, endTimestamp]]);
        deleteCurrent();
    }

    const save = async () => {
        setSaving(true);

        try {
            for (const segment of segments) {
                await submitSegment(await getVideoId(), {
                    start: segment[0],
                    end: segment[1],
                    category: 'TOS'
                });
            }
        } catch (e) {
            log(e);
        }

        setSaving(false);
    }

    return (
        <div className='tos-editor'>
            <h1 className='cir-text-4xl cir-font-bold'>TOS Segment Editor</h1>

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

            <Button className='cir-mt-4' disabled={saving} onClick={save}>Save</Button>
        </div >
    );
};

const Segment: React.FC<{ start: number, end: number }> = ({ start, end }) => {
    return (
        <div className='cir-text-xl cir-font-medium cir-my-1'>
            <span>{formatTime(start)}</span>
            -
            <span>{formatTime(end)}</span>
        </div>
    );
};

class TosEditor {
    container: HTMLElement;
    root: Root;

    constructor(container: HTMLElement, segments: TosSegment[]) {
        this.container = container;

        const element = document.createElement('div');
        element.id = 'tos-segment-editor';
        this.container.insertBefore(element, this.container.firstChild);

        this.root = createRoot(element);
        this.root.render(<TosSegmentEditor defaultSegments={segments} />);
    }

    destroy() {
        this.root.unmount();
        document.getElementById('tos-segment-editor')?.remove();
    }
}

export default TosEditor;