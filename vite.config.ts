import {defineConfig} from "vite"
import vue from "@vitejs/plugin-vue"
import {parse, resolve} from "path"
import glob from "fast-glob"
import fsExtra from "fs-extra"
// 入口文件
const inputFiles = glob.sync(["src/*"], {absolute:false})
// 虚拟文件
const virtualFiles = glob.sync([], {absolute:false})
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
            load(id) {
                if(/virtual:model-/.test(id)) {
                    const file = id.replace(/^virtual:model-|\.ts$/g, "")
                    const {name} = parse(file)
                    return `import VIRTUALMODEL_${name.toUpperCase()} from "${file}"\nconsole.log(VIRTUALMODEL_${name.toUpperCase()});`
                }
            },
            renderChunk(code,a, opt){
                const fileCode = a.modules[a.facadeModuleId].code
                if(!fileCode || !code.match(fileCode)){
                    return  code
                }
                const fileCodeReturn = fileCode.replace(/.*\(([^\(\)]*).*\).*;/,'$1')
                const format = {
                    "cjs":()=>`exports.default = ${fileCodeReturn};\nexports.${fileCodeReturn} = ${fileCodeReturn};`
                }[opt.format]?.() || `export default ${fileCodeReturn};`
                return code.replace(fileCode, `${format} `)
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
            }
        },
        watch:{},
    },
})
