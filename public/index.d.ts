import {Plugin} from 'vite'
import {Ref} from 'vue'
type SqlPluginOptios = {
    // 处理的文件范围
    include?: RegExp[]
    // sql执行文件路径，即请求库文件路径
    file?:string
    // 默认default
    importName?:string
}
declare function SqlPlugin(options: SqlPluginOptios):Plugin<any>
export default SqlPlugin
declare function SqlFunction(sql: string): typeof SqlFunction & Ref<any>
declare function SqlFunction(sql: TemplateStringsArray): typeof SqlFunction & Ref<any>
declare function SqlFunction(...data: any[]): typeof SqlFunction & Ref<any>
declare global {
    const $sql:typeof SqlFunction
}
declare module "vue"{
    interface ComponentCustomProperties {
        $sql:typeof SqlFunction
    }
    interface ComponentCustomOptions {
        $sql:typeof SqlFunction
    }
    interface ComponentCustomProps {
        $sql:typeof SqlFunction
    }
}
