import {defineConfig} from "vite"
import vue from "@vitejs/plugin-vue"
import {parse, resolve} from "path"
import glob from "fast-glob"
import fsExtra from "fs-extra"
import strip from "strip-comments"
// 入口文件
const inputFiles = glob.sync(["src/*"], {absolute:false})
// 虚拟文件
const virtualFiles = glob.sync(["**/*","{!node_modules,!release.sh,!dist}"], {absolute:false})
const virtualFileMap = new Map()
export default defineConfig({
    plugins:[
        vue(),
        {
            name:"vite-plugin-vite-npm-build-virtual-model",
            resolveId(source) {
                if(/virtual:model-/.test(source)) {
                    return source
                }
                return  source
            },
            load(id) {
                if(virtualFileMap.has(id)){
                    return fsExtra.readFileSync(id,'utf8')+'\nexport default null'
                }
                if(/virtual:model-/.test(id)) {
                    const file = id.replace(/^virtual:model-|\.ts$/g, "")
                    const {name} = parse(file)
                    const filePath = resolve(__dirname, file)
                    const fileContent = strip(fsExtra.readFileSync(filePath,'utf8'))
                    let exportsName = (fileContent.match(/export\s*((const|class|function|default).*[^\s]*|\{[^\{|\}]*?\})/g) || []).map(e=>e.trim()).map(e=>{
                        if(/export\s*(const)/.test(e)){
                            return e.match(/export\s*(const)\s*([^\s]*)/)?.[2]
                        }else if(/export\s*(default)/.test(e)){
                            return 'default'
                        }else if(/export\s*(\*)/.test(e)){
                            return '*'
                        }else if(/export\s*(function)/.test(e)){
                            return e.match(/export\s*(function)\s*([^\s{}()]*)/)?.[2]
                        }else if(/export\s*(class)/.test(e)){
                            return e.match(/export\s*(class)\s*([^\s{}()]*)/)?.[2]
                        }
                        return e.match(/\{([^{}]*)\}/)?.[1]?.split?.(',').map(e=>e.trim().replace(/:.*|\s{1,}.*/,''))
                    }).reduce((a:string[],b:any)=>{return a.concat(b)},[]).map(e=>e.replace(/(:|;).*|\s{1,}.*/,'')).reduce((a:string[],b:any)=>{return a.includes(b) ?a:a.concat(b)},[])
                    if(exportsName.length === 0){
                        virtualFileMap.set(file, true)
                        exportsName = ['default']
                    }
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
            writeBundle(error) {
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
