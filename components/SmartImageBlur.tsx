
import React, { useMemo } from 'react';

interface BoundingBox {
    box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax]
    label: string;
}

interface SmartImageBlurProps {
    imageUrl: string;
    boundingBoxes: BoundingBox[];
    className?: string; // Allow passing extra classes for sizing
}

export const SmartImageBlur: React.FC<SmartImageBlurProps> = ({
    imageUrl,
    boundingBoxes,
    className = "w-full h-64" // Default size
}) => {

    // Memoize overlays to avoid re-calculating on every render if props don't change
    const overlays = useMemo(() => {
        return boundingBoxes.map((box, index) => {
            const [ymin, xmin, ymax, xmax] = box.box_2d;

            // Convert to percentages
            const top = ymin * 100;
            const left = xmin * 100;
            const height = (ymax - ymin) * 100;
            const width = (xmax - xmin) * 100;

            return (
                <div
                    key={index}
                    style={{
                        position: 'absolute',
                        top: `${top}%`,
                        left: `${left}%`,
                        height: `${height}%`,
                        width: `${width}%`,
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)', // Safari support
                        backgroundColor: 'rgba(255, 255, 255, 0.1)', // Slight transparency to debug/visualize
                        borderRadius: '4px',
                        overflow: 'hidden',
                        pointerEvents: 'none' // Let clicks pass through if needed
                    }}
                    title={`Redacted: ${box.label}`}
                />
            );
        });
    }, [boundingBoxes]);

    return (
        <div className={`relative overflow-hidden ${className}`}>
            <img
                src={imageUrl}
                alt="Analyzed Evidence"
                className="w-full h-full object-cover"
            />
            {overlays}
        </div>
    );
};
