export interface Theme {
  key: string
  name: string
  colors: Record<string, string>
}

export const themes: Theme[] = [
  {
    key: 'blue',
    name: '默认蓝',
    colors: {
      '--el-color-primary': '#409eff',
      '--sidebar-bg': '#1a1a2e',
      '--sidebar-text': '#a0aec0',
      '--header-bg': '#fff',
      '--header-border': '#e5e7eb',
      '--main-bg': '#f5f7fa',
      '--table-header-bg': '#f5f7fa',
      '--tabs-border': '#e4e7ed',
    },
  },
  {
    key: 'green',
    name: '极光绿',
    colors: {
      '--el-color-primary': '#67c23a',
      '--sidebar-bg': '#1a2e1a',
      '--sidebar-text': '#a0c0a0',
      '--header-bg': '#fff',
      '--header-border': '#cfe8c0',
      '--main-bg': '#f0f9eb',
      '--table-header-bg': '#f0f9eb',
      '--tabs-border': '#cfe8c0',
    },
  },
  {
    key: 'orange',
    name: '晚霞橙',
    colors: {
      '--el-color-primary': '#e6a23c',
      '--sidebar-bg': '#2e221a',
      '--sidebar-text': '#c0b0a0',
      '--header-bg': '#fff',
      '--header-border': '#f0dbb5',
      '--main-bg': '#fdf6ec',
      '--table-header-bg': '#fdf6ec',
      '--tabs-border': '#f0dbb5',
    },
  },
  {
    key: 'purple',
    name: '典雅紫',
    colors: {
      '--el-color-primary': '#722ed1',
      '--sidebar-bg': '#1e1a2e',
      '--sidebar-text': '#b0a0c0',
      '--header-bg': '#fff',
      '--header-border': '#d4c0e8',
      '--main-bg': '#f0e6fb',
      '--table-header-bg': '#f0e6fb',
      '--tabs-border': '#d4c0e8',
    },
  },
]

export const DEFAULT_THEME = 'blue'

export function getTheme(key: string): Theme {
  return themes.find(t => t.key === key) || themes[0]
}
