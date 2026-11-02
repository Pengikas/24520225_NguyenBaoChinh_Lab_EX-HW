
import { useId } from 'react';

/**
 * M4 - Accessible ID generation.
 *
 * React useId provides stable IDs for accessibility
 * relationships between labels and form controls.
 */
export function useAccessibleId(prefix: string): string {
    const reactId = useId();

    return `${prefix}-${reactId}`;
}
