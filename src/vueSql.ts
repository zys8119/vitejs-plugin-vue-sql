import {ref} from "vue"
const $sql = function (result:any,...a){
    if(Object.prototype.toString.call(a[0]) === '[object Array]') {
        if(a?.[0]?.raw[0] === a?.[0]?.[0]){
            result = result.concat([a[0][0]])
            return $sql.bind(null,result)
        }
    }
    if(a[0] === 'vitejs-plugin-vue-sql-end'){
        const resultRef = ref(result)
        return resultRef
    }
    if(result === 'vitejs-plugin-vue-sql-start') {
        return $sql.bind(null,[])
    }
    result = result.concat(a)
    return $sql.bind(null,result)
}
export default $sql
