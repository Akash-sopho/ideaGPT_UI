import { useState, useRef, useEffect } from 'react';
import { theme, fonts } from '../config/theme.config';
import { appConfig } from '../config/app.config';
import { ApiSearchView } from '../components/ApiSearchView';

const cfg = () => appConfig.ideaScreen || {};

export function IdeaScreen({
  idea,
  setIdea,
  chatMessages,
  onSendMessage,
  loadingChat,
  onSummarise,
  loadingSummarise,
  summaryResult,
  onContinueChat,
  onContinueToFeatures,
  loadingFeatures,
  errorChat,
  errorSummarise,
  errorFeatures,
}) {
  const [startTab, setStartTab] = useState('idea');
  const [chatDraft, setChatDraft] = useState('');
  const chatInputRef = useRef(null);
  const chatEndRef = useRef(null);

  const canSummarise =
    (chatMessages && chatMessages.length > 0) || (idea && idea.trim().length > 0);
  const summariseDisabled = !canSummarise || loadingSummarise;

  useEffect(() => {
    if (chatMessages && chatMessages.length > 0) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const handleContinueChat = () => {
    onContinueChat();
    setTimeout(() => chatInputRef.current?.focus(), 100);
  };

  return (
    <div className="fu" style={{ maxWidth: 720, margin: '72px auto 0' }}>
      <div
        style={{
          display: 'flex',
          gap: 4,
          marginBottom: 28,
          borderBottom: `1px solid ${theme.border}`,
          paddingBottom: 0,
        }}
      >
        <button
          type="button"
          onClick={() => setStartTab('idea')}
          style={{
            padding: '10px 18px',
            background: 'transparent',
            border: 'none',
            borderBottom: startTab === 'idea' ? `2px solid ${theme.navy}` : '2px solid transparent',
            color: startTab === 'idea' ? theme.navy : theme.muted,
            fontSize: 14,
            fontWeight: startTab === 'idea' ? 600 : 500,
            fontFamily: fonts.sans,
            cursor: 'pointer',
            marginBottom: -1,
          }}
        >
          {cfg().describeIdeaTabLabel || 'Describe your idea'}
        </button>
        <button
          type="button"
          onClick={() => setStartTab('apis')}
          style={{
            padding: '10px 18px',
            background: 'transparent',
            border: 'none',
            borderBottom: startTab === 'apis' ? `2px solid ${theme.navy}` : '2px solid transparent',
            color: startTab === 'apis' ? theme.navy : theme.muted,
            fontSize: 14,
            fontWeight: startTab === 'apis' ? 600 : 500,
            fontFamily: fonts.sans,
            cursor: 'pointer',
            marginBottom: -1,
          }}
        >
          {cfg().browseApisTabLabel || 'Browse APIs'}
        </button>
      </div>

      {startTab === 'apis' && <ApiSearchView />}

      {startTab === 'idea' && (
        <>
      <div style={{ textAlign: 'center', marginBottom: 44 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: theme.blueBg,
            border: `1px solid ${theme.blueBorder}`,
            borderRadius: 100,
            padding: '6px 16px',
            fontSize: 12,
            color: theme.blue,
            fontFamily: fonts.mono,
            marginBottom: 20,
          }}
        >
          ⚡ {cfg().badge}
        </div>
        <h1
          style={{
            fontSize: 44,
            fontWeight: 700,
            fontFamily: fonts.serif,
            color: theme.ink,
            lineHeight: 1.18,
            margin: '0 0 14px',
            letterSpacing: -1,
          }}
        >
          What are you
          <br />
          <em style={{ color: theme.accent }}>{cfg().titleEmphasis || 'building today?'}</em>
        </h1>
        <p style={{ color: theme.muted, fontSize: 15, lineHeight: 1.7, margin: 0 }}>{cfg().subtitle}</p>
      </div>

      {/* Optional initial idea */}
      <div
        style={{
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 8px 40px rgba(26,39,68,0.07)',
          marginBottom: 24,
        }}
      >
        <textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder={cfg().ideaPlaceholder || appConfig.ideaPlaceholder}
          rows={3}
          disabled={loadingChat || loadingSummarise}
          style={{
            width: '100%',
            padding: '16px 20px',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: theme.ink,
            fontSize: 14,
            lineHeight: 1.6,
            resize: 'none',
            fontFamily: fonts.sans,
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Chat thread */}
      <div
        style={{
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 8px 40px rgba(26,39,68,0.07)',
          minHeight: 120,
          maxHeight: 360,
          overflowY: 'auto',
          padding: '16px 20px',
        }}
        aria-label="Chat to refine your idea"
      >
        {(!chatMessages || chatMessages.length === 0) && (
          <p style={{ color: theme.faint, fontSize: 13, margin: 0 }}>
            Send a message to start refining your idea with the coach.
          </p>
        )}
        {chatMessages &&
          chatMessages.map((m, idx) => (
            <div
              key={idx}
              style={{
                textAlign: m.role === 'user' ? 'right' : 'left',
                marginBottom: 12,
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  maxWidth: '85%',
                  padding: '10px 14px',
                  borderRadius: 12,
                  fontSize: 14,
                  lineHeight: 1.5,
                  fontFamily: fonts.sans,
                  background: m.role === 'user' ? theme.navy : theme.alt,
                  color: m.role === 'user' ? '#fff' : theme.ink,
                  border: m.role === 'user' ? 'none' : `1px solid ${theme.border}`,
                }}
              >
                {m.content}
              </span>
            </div>
          ))}
        <div ref={chatEndRef} />
      </div>

      {/* Chat input + Summarise */}
      <div
        style={{
          padding: '12px 0 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <textarea
            ref={chatInputRef}
            aria-label="Chat message"
            value={chatDraft}
            onChange={(e) => setChatDraft(e.target.value)}
            placeholder={cfg().chatPlaceholder || 'Type a message…'}
            rows={2}
            disabled={loadingChat || loadingSummarise}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const v = chatDraft.trim();
                if (v) {
                  onSendMessage(v);
                  setChatDraft('');
                }
              }
            }}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: `1px solid ${theme.border}`,
              borderRadius: 12,
              background: theme.surface,
              color: theme.ink,
              fontSize: 14,
              lineHeight: 1.5,
              fontFamily: fonts.sans,
              resize: 'none',
              outline: 'none',
            }}
          />
          <button
            type="button"
            onClick={() => {
              const v = chatDraft.trim();
              if (v) {
                onSendMessage(v);
                setChatDraft('');
              }
            }}
            disabled={loadingChat || loadingSummarise}
            style={{
              padding: '12px 20px',
              background: theme.navy,
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              cursor: loadingChat || loadingSummarise ? 'not-allowed' : 'pointer',
              fontFamily: fonts.sans,
            }}
          >
            {loadingChat ? '…' : cfg().sendCta || 'Send'}
          </button>
        </div>
        {(errorChat || errorSummarise) && (
          <p style={{ color: theme.accent, fontSize: 13, margin: 0 }}>{errorChat || errorSummarise}</p>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: theme.faint, fontSize: 12, fontFamily: fonts.mono }}>
            {cfg().shortcutHint || '⌘ + Enter to send'}
          </span>
          <button
            type="button"
            onClick={onSummarise}
            disabled={summariseDisabled}
            style={{
              background: summariseDisabled ? theme.border : theme.navy,
              color: summariseDisabled ? theme.muted : '#fff',
              border: 'none',
              borderRadius: 9,
              padding: '11px 26px',
              fontSize: 14,
              fontWeight: 600,
              cursor: summariseDisabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              fontFamily: fonts.sans,
            }}
          >
            {loadingSummarise ? (cfg().summarisingLabel || 'Summarising…') : (cfg().summariseCta || 'Summarise idea →')}
          </button>
        </div>
      </div>

      {/* Summary panel */}
      {summaryResult && (
        <div
          style={{
            marginTop: 24,
            padding: 24,
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: 16,
            boxShadow: '0 8px 40px rgba(26,39,68,0.07)',
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 600, color: theme.ink, margin: '0 0 8px', fontFamily: fonts.sans }}>
            {cfg().summaryTitle || 'Your idea summary'}
          </h3>
          <p style={{ fontSize: 13, color: theme.muted, margin: '0 0 16px', lineHeight: 1.5 }}>
            {cfg().summarySubtitle}
          </p>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: theme.faint, marginBottom: 4, fontFamily: fonts.mono }}>Idea</div>
            <p style={{ fontSize: 14, color: theme.ink, margin: 0, lineHeight: 1.6 }}>{summaryResult.idea}</p>
          </div>
          {summaryResult.idea_summary && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: theme.faint, marginBottom: 4, fontFamily: fonts.mono }}>One-line summary</div>
              <p style={{ fontSize: 14, color: theme.ink, margin: 0, lineHeight: 1.6 }}>{summaryResult.idea_summary}</p>
            </div>
          )}
          {summaryResult.detailed_description && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: theme.faint, marginBottom: 4, fontFamily: fonts.mono }}>Detailed description</div>
              <p style={{ fontSize: 14, color: theme.ink, margin: 0, lineHeight: 1.6 }}>{summaryResult.detailed_description}</p>
            </div>
          )}
          {errorFeatures && (
            <p style={{ color: theme.accent, fontSize: 13, margin: '0 0 12px' }}>{errorFeatures}</p>
          )}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleContinueChat}
              disabled={loadingFeatures}
              style={{
                padding: '11px 22px',
                background: theme.surface,
                color: theme.navy,
                border: `1px solid ${theme.border}`,
                borderRadius: 9,
                fontSize: 14,
                fontWeight: 600,
                cursor: loadingFeatures ? 'not-allowed' : 'pointer',
                fontFamily: fonts.sans,
              }}
            >
              {cfg().continueChatCta || 'Continue chat'}
            </button>
            <button
              type="button"
              onClick={onContinueToFeatures}
              disabled={loadingFeatures}
              style={{
                padding: '11px 22px',
                background: loadingFeatures ? theme.border : theme.navy,
                color: loadingFeatures ? theme.muted : '#fff',
                border: 'none',
                borderRadius: 9,
                fontSize: 14,
                fontWeight: 600,
                cursor: loadingFeatures ? 'not-allowed' : 'pointer',
                fontFamily: fonts.sans,
              }}
            >
              {loadingFeatures
                ? (cfg().continueToFeaturesLoading || 'Breaking into features…')
                : (cfg().continueToFeaturesCta || 'Continue to features →')}
            </button>
          </div>
        </div>
      )}

      {loadingSummarise && (
        <p style={{ textAlign: 'center', color: theme.muted, fontSize: 13, marginTop: 12 }}>
          {cfg().summarisingLabel || 'Summarising…'}
        </p>
      )}

      {/* Example chips */}
      <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
        {(appConfig.exampleIdeas || []).map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => setIdea(ex)}
            disabled={loadingChat || loadingSummarise}
            style={{
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              color: theme.muted,
              borderRadius: 100,
              padding: '7px 16px',
              fontSize: 12,
              cursor: loadingChat || loadingSummarise ? 'not-allowed' : 'pointer',
              fontFamily: fonts.sans,
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              if (!loadingChat && !loadingSummarise) {
                e.currentTarget.style.borderColor = theme.navy;
                e.currentTarget.style.color = theme.navy;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = theme.border;
              e.currentTarget.style.color = theme.muted;
            }}
          >
            {ex}
          </button>
        ))}
      </div>
        </>
      )}
    </div>
  );
}
