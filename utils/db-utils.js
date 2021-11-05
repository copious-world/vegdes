


import { writable } from 'svelte/store';
import { AppDBWrapper } from './one_table_db'


class SVGEditDB extends AppDBWrapper {

    constructor(conf) {
        super("SVGEdit-projects",conf)
        this.current_project_name = ""
        this.current_author = ""
        this.current_description = ""
        this.current_file_list = []
        //
        this.current_project_object = false
    }

    async add_project() {
        this.current_session_name = this.current_project_name
        let part_id = "project-meta"
        //
        let blob_data = {
            "name" : this.current_project_name,
            "description" :  this.current_description,
            "author" : this.current_author
        }
        //
        blob_data = JSON.stringify(blob_data)
        await this.add_data(blob_data,part_id)
    }

    async update_project() {
        await this.add_project()
    }

    async get_project(sel_project) {
        try {
            let prj_Obj = await this.get_session(sel_project)
            if ( prj_Obj ) {
                //
                this.current_project_object = prj_Obj
                //
                this.current_project_name = prj_Obj.name
                this.current_author =  prj_Obj.author
                this.current_description = prj_Obj.description
                //
                this.current_session_name = this.current_project_name
                //
                this.current_file_list = []
                let data_map = prj_Obj.data
                for ( let part_id in data_map ) {
                    if ( part_id !== "project-meta" ) {
                        this.current_file_list.push(JSON.parse(data_map[part_id]))
                    }
                }
                //
                return prj_Obj
            }
        } catch (e) {
            console.log("get_project")
        }
    }

    get_file_details(part_id) {
        if ( !(part_id) || (part_id.length === 0) ) return ""
        if ( this.current_project_object ) {
            let prj_Obj = this.current_project_object
            if ( prj_Obj ) {
                let data_map = prj_Obj.data
                if ( typeof data_map[part_id] === "string" ) {
                    return JSON.parse(data_map[part_id])    
                }
            }
        }
        return false
    }

    //
    async add_file(file_name,description,svg,to_layer) {
        if ( svg === undefined ) svg = ""
        if ( to_layer == undefined ) to_layer = 0
        let file_record = {
            "name" : file_name, 
            "description" : description, 
            "author" : this.current_author, 
            "data" : "", "ouput" : "", "svg" : svg, "layer" : to_layer }
        //
        let data = JSON.stringify(file_record)
        await this.add_data(data,file_name)
    }

    //
    async remove_file(file_name) {
        this.current_session_name = this.current_project_name
        await this.remove_data(file_name,this.current_project_name)
    }

    //
    async remove_project() {
        this.current_session_name = this.current_project_name
        await this.delete_session(this.current_project_name)
    }

    // 
    async get_file_names() {
        let sess_name = this.current_session_name
        try {
            let sess_data = await this.get_session(sess_name)
            if ( sess_data ) {
                let f_names = Object.keys(sess_data.data)
                return f_names
            }    
        } catch (e) {
            console.log("get_file_names")
        }
        return []
    }

    async get_file_entries() {
        let sess_name = this.current_session_name
        try {
            let sess_data = await this.get_session(sess_name)
            if ( sess_data ) {
                let f_names = sess_data.data.map((f_data) => JSON.parse(f_data))
                return f_names
            }
        } catch (e) {
            console.log("get_file_entries")
        }
        return []    
    }

    // // // // // // // // // // // // // // // // // // // // // // // // // // // // 

    app_add_fields(sessionObj) {
        sessionObj.project_name = this.current_project_name
        sessionObj.author = this.current_author
        sessionObj.description = this.current_description
    }

    application_data_update(blob_url,part_id,blob_data) {
        // implemented by derived method (override)
    }

    async app_secure_total_session(sess_name) {
         // implemented by derived method (override)
    }

    application_revise_current_session(sess_name) {
        // implemented by derived method (override)
    }

    application_update_session_name_selections(sess_name,name_list) {

    }

}


const DB_VERSION = 1
const DATA_STORE = "svg-projects"
const describe_data = "svg"

let g_svg_edit_storage = false

let g_svg_edit_storage_ref = [false]

export async function db_startup() {
    //
    g_svg_edit_storage = new SVGEditDB({
        "DB_VERSION" : DB_VERSION,
        "DATA_STORE" : DATA_STORE,
        "describe_data" : describe_data
    })

    await g_svg_edit_storage.init_database()
    await g_svg_edit_storage.load_name_list()

    g_svg_edit_storage_ref[0] = g_svg_edit_storage
    
    return g_svg_edit_storage
}


export const db_store = writable({
    "db_storage_ref" : g_svg_edit_storage_ref,
    "current_project" : "",
    "current_file_entry" : {},
    "ready" : false
});



export let dialog_control = writable(null)
