figma.showUI(__html__, {
  width: 360,
  height: 320,
  themeColors: true
});

function toNodeIdParam(nodeId) {
  return nodeId.replace(/:/g, "-");
}

function byCanvasOrder(a, b) {
  const ay = a.absoluteBoundingBox ? a.absoluteBoundingBox.y : 0;
  const by = b.absoluteBoundingBox ? b.absoluteBoundingBox.y : 0;
  if (ay !== by) return ay - by;

  const ax = a.absoluteBoundingBox ? a.absoluteBoundingBox.x : 0;
  const bx = b.absoluteBoundingBox ? b.absoluteBoundingBox.x : 0;
  if (ax !== bx) return ax - bx;

  const nameDiff = a.name.localeCompare(b.name, "zh-Hans-CN");
  if (nameDiff !== 0) return nameDiff;

  return a.id.localeCompare(b.id);
}

function collectLinks() {
  const selection = figma.currentPage.selection;

  if (!selection.length) {
    figma.ui.postMessage({
      type: "result",
      ok: false,
      reason: "empty",
      message: "未选中任何节点。请先选中 FRAME、SECTION 或 INSTANCE。"
    });
    return;
  }

  const accepted = [];
  const ignored = [];

  for (const node of selection) {
    const isSupported = node.type === "FRAME" || node.type === "SECTION" || node.type === "INSTANCE";
    if (isSupported) {
      accepted.push(node);
    } else {
      ignored.push(node.type);
    }
  }

  if (!accepted.length) {
    figma.ui.postMessage({
      type: "result",
      ok: false,
      reason: "unsupported",
      message: "当前选择不包含 FRAME、SECTION 或 INSTANCE。"
    });
    return;
  }

  accepted.sort(byCanvasOrder);

  const fileKey = figma.fileKey;
  if (!fileKey) {
    figma.ui.postMessage({
      type: "result",
      ok: false,
      reason: "no-file-key",
      message: "无法读取文件 Key。请确认文件已保存到云端，并使用支持私有 API 的插件后重试。"
    });
    return;
  }

  const lines = accepted.map((node) => {
    const nodeId = toNodeIdParam(node.id);
    const url = `https://www.figma.com/file/${fileKey}?node-id=${nodeId}`;
    return `${node.name}\t${url}`;
  });

  figma.ui.postMessage({
    type: "result",
    ok: true,
    copiedText: lines.join("\n"),
    count: accepted.length,
    ignoredCount: ignored.length,
    ignoredTypes: Array.from(new Set(ignored)).sort()
  });
}

figma.on("selectionchange", collectLinks);
collectLinks();

figma.ui.onmessage = (msg) => {
  if (!msg || typeof msg !== "object") return;
  if (msg.type === "refresh") {
    collectLinks();
    return;
  }
  if (msg.type === "close") {
    figma.closePlugin();
  }
};
