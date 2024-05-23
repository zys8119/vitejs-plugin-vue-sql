# vite-npm-build

vite 快熟构建npm包

## 使用指南

在`vite.config.ts`中配置入口文件及虚拟文件，虚拟文件用于编译后的文件导出默认模块

```typescript
// 入口文件
const inputFiles = glob.sync(["src/*"], {absolute:false})
// 虚拟文件
const virtualFiles = glob.sync(["**/*.vue"], {absolute:false})
```

在`package.json`中修改您的npm包的（版本号、npm包名、main入口、bin脚本、类型等）

```json
{
	"name": "vite-npm-build",
	"version": "1.0.0",
	"main": "index.js",
	"bin": "index.js"
}

```
