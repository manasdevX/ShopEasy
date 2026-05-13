const ANALYTICS_WINDOW_MAX = 1000;

const state = {
  startedAt: new Date().toISOString(),
  chats: {
    total: 0,
    streaming: 0,
    fallback: 0,
    errors: 0,
    durationsMs: [],
  },
  intents: new Map(),
  tools: {
    total: 0,
    success: 0,
    failure: 0,
    byTool: new Map(),
  },
};

const clampWindow = (arr) => {
  if (arr.length > ANALYTICS_WINDOW_MAX) {
    arr.splice(0, arr.length - ANALYTICS_WINDOW_MAX);
  }
};

const percent = (part, whole) => {
  if (!whole) return 0;
  return Number(((part / whole) * 100).toFixed(2));
};

const average = (arr) => {
  if (!arr.length) return 0;
  return Math.round(arr.reduce((sum, n) => sum + n, 0) / arr.length);
};

const p95 = (arr) => {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil(0.95 * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
};

export const recordChatAnalytics = ({
  intent,
  usedFallback = false,
  isStreaming = false,
  hadError = false,
  durationMs = 0,
}) => {
  state.chats.total += 1;
  if (isStreaming) state.chats.streaming += 1;
  if (usedFallback) state.chats.fallback += 1;
  if (hadError) state.chats.errors += 1;

  if (durationMs > 0) {
    state.chats.durationsMs.push(durationMs);
    clampWindow(state.chats.durationsMs);
  }

  const resolvedIntent = String(intent || "UNKNOWN").toUpperCase();
  state.intents.set(resolvedIntent, (state.intents.get(resolvedIntent) || 0) + 1);
};

export const recordToolAnalytics = ({ toolName, success, durationMs = 0 }) => {
  const resolvedName = String(toolName || "unknown_tool");

  state.tools.total += 1;
  if (success) state.tools.success += 1;
  else state.tools.failure += 1;

  const current =
    state.tools.byTool.get(resolvedName) ||
    {
      total: 0,
      success: 0,
      failure: 0,
      durationsMs: [],
    };

  current.total += 1;
  if (success) current.success += 1;
  else current.failure += 1;

  if (durationMs > 0) {
    current.durationsMs.push(durationMs);
    clampWindow(current.durationsMs);
  }

  state.tools.byTool.set(resolvedName, current);
};

export const getChatAnalyticsDashboard = () => {
  const totalChats = state.chats.total;
  const totalTools = state.tools.total;

  const intents = [...state.intents.entries()]
    .map(([name, count]) => ({
      intent: name,
      count,
      hitRate: percent(count, totalChats),
    }))
    .sort((a, b) => b.count - a.count);

  const tools = [...state.tools.byTool.entries()]
    .map(([name, data]) => ({
      tool: name,
      total: data.total,
      success: data.success,
      failure: data.failure,
      successRate: percent(data.success, data.total),
      avgDurationMs: average(data.durationsMs),
      p95DurationMs: p95(data.durationsMs),
    }))
    .sort((a, b) => b.total - a.total);

  return {
    status: "ok",
    generatedAt: new Date().toISOString(),
    windowStartedAt: state.startedAt,
    chats: {
      total: totalChats,
      streaming: state.chats.streaming,
      fallback: state.chats.fallback,
      errors: state.chats.errors,
      fallbackRate: percent(state.chats.fallback, totalChats),
      errorRate: percent(state.chats.errors, totalChats),
      avgDurationMs: average(state.chats.durationsMs),
      p95DurationMs: p95(state.chats.durationsMs),
    },
    tools: {
      total: totalTools,
      success: state.tools.success,
      failure: state.tools.failure,
      successRate: percent(state.tools.success, totalTools),
      failureRate: percent(state.tools.failure, totalTools),
      byTool: tools,
    },
    intents,
  };
};
