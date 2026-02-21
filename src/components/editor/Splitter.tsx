import React from 'react';
import { useSplitter } from '../../hooks/useSplitter';

interface SplitterProps {
  id: string;
  onResize: (ratio: number) => void;
  containerRef: React.RefObject<HTMLElement | null>;
  hidden?: boolean;
}

const Splitter: React.FC<SplitterProps> = React.memo(function Splitter({
  id,
  onResize,
  containerRef,
  hidden = false,
}) {
  const { splitterRef } = useSplitter({ onResize, containerRef });

  if (hidden) return null;

  return (
    <div
      ref={splitterRef as React.Ref<HTMLDivElement>}
      id={id}
      className={id === 'splitter-2' ? 'splitter-el' : undefined}
      role="separator"
      aria-label="Resize panels"
      tabIndex={0}
    />
  );
});

export default Splitter;
