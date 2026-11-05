# 批量复制画板链接（Figma 私有插件）

一个 v1 私有小工具：对当前页面已选中的 `FRAME` / `SECTION` / `INSTANCE` 批量生成链接并复制。

## 功能范围（v1）

- 仅私有插件使用
- 仅基于当前页面选区
- 仅支持节点类型：`FRAME`、`SECTION`、`INSTANCE`
- 无设置项
- 无本地持久化
- 无埋点/分析
- 无其他导出模式

## 目录结构

- `manifest.json`：插件清单
- `code.js`：主线程逻辑（选区过滤、排序、链接构建）
- `ui.html`：插件 UI（状态展示、复制、刷新、关闭）

## 安装与运行

1. 打开 Figma Desktop。
2. 进入 `Plugins` -> `Development` -> `Import plugin from manifest...`。
3. 选择本目录下的 `manifest.json`。
4. 在任意设计文件中，选中若干 `FRAME` / `SECTION` / `INSTANCE`。
5. 运行插件：`Plugins` -> `Development` -> `批量复制画板链接`。
6. 点击 `复制到剪贴板`，结果格式为：

```text
节点名<TAB>链接
节点名<TAB>链接
```

## 输出规则（确定性）

- 先按画布位置排序：Y 升序，再 X 升序
- 坐标相同则按名称升序
- 名称相同则按节点 ID 升序

这样即使选择顺序不同，也能得到一致输出。

## 限制说明

- 仅处理当前页面中的当前选区。
- 非 `FRAME` / `SECTION` / `INSTANCE` 会被忽略并在 UI 中提示。
- 若取不到 `fileKey`，无法生成链接。请确认文件已保存到云端，且在支持私有 API 的开发或私有插件环境中运行。
- 链接格式使用 Figma 标准 `node-id` 参数（将 `:` 转为 `-`）。

## 自动测试

安装 Node.js 后，在本目录运行 `node --test tests/collect-links.test.js`。测试使用模拟 Figma API，不能代替 Desktop 验收。

`INSTANCE` 是组件实例；`COMPONENT` 是组件本体，本工具暂不导出本体。仅生成链接，不支持批量替换组件。

## Figma Desktop 手动测试清单（待执行）

- [ ] 空选区运行：显示“未选中任何节点”
- [ ] 仅选中非支持类型（如 `RECTANGLE`）：显示“不包含 FRAME、SECTION 或 INSTANCE”
- [ ] 混合选区（FRAME + SECTION + INSTANCE + 其他）：仅输出支持的节点，并显示忽略数量
- [ ] 多个 FRAME/SECTION/INSTANCE：输出顺序稳定（与选中顺序无关）
- [ ] 点击“复制到剪贴板”：剪贴板内容与文本框完全一致
- [ ] 点击“刷新”：在不重开插件情况下，选区变化可立即反映
- [ ] 点击“关闭”：插件正常退出
- [ ] 在未保存云端的文件中：提示无法读取 file key

- [ ] 选择多个同名 INSTANCE：每个节点各有一行，链接分别定位正确
- [ ] 选择嵌套 INSTANCE：导出的链接能定位到所选实例
- [ ] 选择 COMPONENT 本体：被忽略并正确提示
