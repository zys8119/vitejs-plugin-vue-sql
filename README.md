# vite-npm-build

vite 快熟构建npm包

## 使用指南

在vite.config.ts中配置入口文件及虚拟文件，虚拟文件用于编译后的文件导出默认模块

```typescript
// 入口文件
const inputFiles = glob.sync(["src/*"], {absolute:false})
// 虚拟文件
const virtualFiles = glob.sync(["**/*.vue"], {absolute:false})
```
