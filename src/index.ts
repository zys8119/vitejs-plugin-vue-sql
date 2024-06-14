import {Plugin} from "vite"
import {merge} from "lodash"
import {readFileSync} from "fs-extra"
import {resolve} from "path"
import AutoImport from "unplugin-auto-import/vite"
const defaultConfig = {
    include: [
        /\.vue$/
    ],
    file:null,
    importName:'default',
} as const
const plugin = function (options:Partial<typeof defaultConfig>){
    let __vue__sql__const_ctx_map_index = 0
    const config = merge(defaultConfig, options)
    const file = resolve("/", config.file)
    const importNameAsName = '_vue_sql_as_importName'
    const importNameAs = typeof config.file === 'string' && typeof config.importName === 'string' ? importNameAsName: null
    const importCode = importNameAs ? `(${importNameAs})`: ``
    return {
        name:"vitejs-plugin-vue-sql",
        enforce:"post",
        configResolved(config) {
            config.plugins.push((AutoImport?.default || AutoImport)({
                include:[
                    /\.[tj]sx?$/, // .ts, .tsx, .js, .jsx
                    /\.vue$/, /\.vue\?vue/, // .vue
                    /\.md$/, // .md
                ],
                resolvers:[
                    [
                        (name)=>{
                            if(/__vue__sql__const/.test(name)) {
                                return {
                                    name: "default",
                                    from: '/node_modules/vitejs-plugin-vue-sql/vueSql.js',
                                }
                            }
                        }
                    ]
                ],
            }))
        },
        load(id) {
            if(config.include.some(v => id.match(v))) {
                let code = readFileSync(id,'utf8')
                const sql = code.match(/(\$sql(\`([^`])*(\$\{.*\}`))+|\$sql(\`([^`])*`)+|\$sql\([^()]*\))(`[^`]*`|\([^()]*\))*/g)
                if(sql) {
                    sql.forEach(e=>{
                        code = code.replace(e,`__vue__sql__const('vitejs-plugin-vue-sql-start')${e.replace(/^\$sql/,'')}${importCode}('vitejs-plugin-vue-sql-end')`)
                    })
                    return code
                }
            }
        },
        transform(code, id, options) {
            if(config.include.some(v => id.match(v))) {
                if(importNameAs){
                    code = `import {${config.importName} as ${importNameAs}} from "${file}";${code}`
                }
                const sql = code.match(/(_ctx\.__vue__sql__const(\`([^`])*(\$\{.*\}`))+|_ctx\.__vue__sql__const(\`([^`])*`)+|_ctx\.__vue__sql__const\([^()]*\))(`[^`]*`|\([^()]*\))*/g)
                if(sql) {
                    sql.forEach(e=>{
                        const name = `__vue__sql__const_ctx_${__vue__sql__const_ctx_map_index}`
                        code = code.replace(e,`${name}.value`)
                        code = `const ${name} = ${e};${code}`
                        __vue__sql__const_ctx_map_index += 1
                    })
                    return code
                        .replace(/_ctx\.__vue__sql__const/g, (e)=>{
                            return `__vue__sql__const`
                        })
                        .replace(new RegExp(`_ctx\\.${importNameAs}`,'g'),(e)=>{
                            return importNameAs
                        })
                }
                return code
            }
        },

    } as Plugin
}
export default plugin
