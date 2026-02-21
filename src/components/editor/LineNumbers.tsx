import React, { useMemo } from 'react';

interface LineNumbersProps {
  lineCount: number;
  scrollTop?: number;
}

const LineNumbers: React.FC<LineNumbersProps> = React.memo(function LineNumbers({
  lineCount,
}) {
  const lines = useMemo(() => {
    const result: number[] = [];
    for (let i = 1; i <= lineCount; i++) {
      result.push(i);
    }
    return result;
  }, [lineCount]);

  return (
    <div className="line-numbers" aria-hidden="true">
      {lines.map((n) => (
        <div key={n} className="line-number">
          {n}
        </div>
      ))}
    </div>
  );
});

export default LineNumbers;
