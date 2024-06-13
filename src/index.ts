import {Plugin} from "vite"
import {merge} from "lodash"
import {readFileSync} from "fs-extra"
const AutoImport = require('unplugin-auto-import/vite')
const defaultConfig = {
    include: [
        /\.vue$/
    ],
} as const
const plugin = function (options:Partial<typeof defaultConfig>){
    const config = merge(defaultConfig, options)
    return {
        name:"vitejs-plugin-vue-sql",
        enforce:"post",
        configResolved(config) {
            config.plugins.push(AutoImport.default({
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
                const sql = code.match(/\$sql(\(|`)(.|\n)*?(\)|`)/g)
                if(sql) {
                    sql.forEach(e=>{
                        code = code.replace(e,`__vue__sql__const`)
                    })
                    code.replace(/_ctx\.__vue__sql__const/g,`__vue__sql__const`)
                    return code
                }
            }
        },
        transform(code, id, options) {
            if(config.include.some(v => id.match(v))) {
                return code.replace(/_ctx\.__vue__sql__const/g,`__vue__sql__const`)
            }
        },

    } as Plugin
}
export default plugin
