import { theme, fonts } from '../config/theme.config';
import { appConfig } from '../config/app.config';

export function Steps({ phase, onStepClick, maxReachedPhase }) {
  const list = appConfig.steps;
  const phaseForIndex = phase === 'scanning' ? 'review' : phase;
  const idx = list.findIndex((s) => s.phase === phaseForIndex);
  const currentIdx = idx >= 0 ? idx : 0;
  const maxReachedIdx = list.findIndex((s) => s.phase === maxReachedPhase);
  const effectiveMaxReachedIdx = maxReachedIdx >= 0 ? maxReachedIdx : 0;
  const canClick = typeof onStepClick === 'function' && phase !== 'scanning';
  const reachable = (i) => i <= effectiveMaxReachedIdx;

  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 40 }}>
      {list.map((step, i) => {
        const clickable = canClick && reachable(i);
        const handleClick = clickable ? () => onStepClick(step.phase) : undefined;
        const isReached = reachable(i);
        const isCurrent = i === currentIdx;
        return (
          <div
            key={step.phase}
            style={{ display: 'flex', alignItems: 'center', flex: i < list.length - 1 ? 1 : 'none' }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 5,
                cursor: clickable ? 'pointer' : 'default',
              }}
              onClick={handleClick}
              onKeyDown={handleClick ? (e) => e.key === 'Enter' && handleClick() : undefined}
              role={clickable ? 'button' : undefined}
              tabIndex={clickable ? 0 : undefined}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: isReached ? theme.navy : theme.border,
                  color: isReached ? '#fff' : theme.faint,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: fonts.mono,
                  transition: 'all 0.3s',
                  outline: isCurrent ? `3px solid ${theme.blueBg}` : 'none',
                  outlineOffset: 2,
                }}
              >
                {isReached && !isCurrent ? '✓' : i + 1}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: isReached ? theme.navy : theme.faint,
                  fontWeight: isCurrent ? 600 : 400,
                  whiteSpace: 'nowrap',
                  fontFamily: fonts.sans,
                }}
              >
                {step.label}
              </div>
            </div>
            {i < list.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: 2,
                  background: isReached ? theme.navy : theme.border,
                  margin: '0 4px',
                  marginBottom: 18,
                  transition: 'background 0.3s',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
