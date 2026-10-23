# 手势动画 · 主题分发

这个仓库只放主题文件，供「手势动画」的在线主题功能拉取。

## 结构

- `themes/index.json` —— 主题列表，程序先拉这个
- `themes/<id>.json` —— 单个主题，用户选中后再下载
- `icons/` —— 图片按钮用的图标（可选，PNG）

## 程序如何访问

```
https://cdn.jsdelivr.net/gh/Originalprinci/github-file-server@main/themes/index.json
```

## 主题格式

`themes/<id>.json` 里 `colors` 定义整体配色，`buttons` 可以按控件覆盖：

```json
"buttons": {
  "panel.0": { "label": "关机", "fill": "#E5484D", "text": "#FFFFFF", "icon": "icons/x.png" }
}
```

`panel.0` ~ `panel.11` 对应快捷控制面板的十二个按钮，`icon` 支持相对仓库根目录的 PNG。
