import {defineConfig} from "vite"
import vue from "@vitejs/plugin-vue"
import {parse, resolve} from "path"
import glob from "fast-glob"
import fsExtra from "fs-extra"
import {rollup} from "rollup"
// 入口文件
const inputFiles = glob.sync(["src/*"], {absolute:false})
// 虚拟文件
const virtualFiles = glob.sync(["*/*"], {absolute:false})
export default defineConfig({
    plugins:[
        vue(),
        {
            name:"vite-plugin-virtual-model",
            resolveId(source) {
                if(/virtual:model-/.test(source)) {
                    return source
                }
                return  source
            },
            async load(id) {
                if(/virtual:model-/.test(id)) {
                    const file = id.replace(/^virtual:model-|\.ts$/g, "")
                    const {name} = parse(file)
                    const filePath = resolve(__dirname, file)
                    const res = await rollup({
                        input:filePath,
                    })
                    const exportsName = (await res.generate({})).output[0].exports
                    const defaultName = `default_exports_${name}`
                    const defaultNameCopy = `default_exports_copy_${name}`
                    const _imports = exportsName.map(e=>e === 'default' ? `${e} as ${defaultName}`:e).join()
                    const _exports = exportsName.map(e=>e === 'default' ? `${defaultNameCopy} as ${e}`:e).join()
                    const _logs = exportsName.map(e=>e === 'default' ? defaultName:e).map(e=>`console.log(${e})`).join("\n")
                    return `import {${_imports}} from "${file}"\nconst ${defaultNameCopy}= ${defaultName}\nconsole.log(${defaultNameCopy})\n${_logs}\nconsole.log("${_exports}")`
                }
            },
            renderChunk(code,a, opt){
                const fileCode = a.modules[a.facadeModuleId]?.code
                if(!fileCode || !code?.includes?.(fileCode)){
                    return  code
                }
                const _exports = fileCode.match(/console.log\("(.*)"\)/)[1]
                const _default = fileCode.match(/const.*default_exports_copy.*/)?.[0]
                const _defaultText = /default_exports_copy/.test(_exports) ? `${_default || ''}\n` : ''
                return {
                    "iife":()=>code.replace(fileCode, '')
                }[opt.format]?.() || code.replace(fileCode, `${_defaultText}export {${_exports}}`)
            },
            writeBundle(opt, bundle) {
                const input = resolve(__dirname,'package.json')
                const out = resolve(__dirname,'dist/package.json')
                const json = fsExtra.readJSONSync(input)
                json.scripts = {}
                json.devDependencies = {}
                fsExtra.writeJSONSync(out, json, {spaces: 4})
            },
        }
    ],
    build: {
        emptyOutDir:true,
        minify: false,
        rollupOptions:{
            input:inputFiles.reduce((a: any, b) => {
                const {name} = parse(b)
                a[name] = virtualFiles.includes(b) ? `virtual:model-${b}.ts` : b
                return a
            },{}),
            external: ["vue",'fs','path'],
            output:{
                entryFileNames: `[name].js`,
                chunkFileNames: `[name].js`,
                assetFileNames: `[name].[ext]`,
                format:'cjs'
            }
        },
        watch:{},
    },
})
