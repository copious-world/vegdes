<script>
    import { get_file }  from "../../utils/file-utils"
    import { db_store, dialog_control } from "../../utils/db-utils"
    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
    export let ui_target= false
    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

    let project_db = false
    //
    let storage_top = false
    let project_selected = false

    let project_name = ""
    let project_description = ""
    let author = ""

	db_store.subscribe((db_obj) => {
		storage_top = db_obj
		project_selected = db_obj.ready
	})

    $: if ( storage_top ) {
        project_selected = storage_top.ready
        project_db = storage_top.db_storage_ref[0]
    }

        // from the selection store
    let sel_project = false//storage_top
    $: if ( project_db ) {
        project_name = storage_top ? storage_top.project_name  : "" // get it from the shared store -- editor state store
        setTimeout(async () => {
            sel_project = await project_db.get_project(project_name)
        },10)
    }
    $: author = storage_top ? storage_top.author : ""
    $: project_description = storage_top ? storage_top.description : ""


    // ---- ----
    let to_layer = 1;
    let file_name = ""
    let description = ""
    let file_svg = ""
    let check_mime = ""

    function to_layer_changed(evt) {
        if ( to_layer > 10 ) to_layer = 10
        if ( to_layer < 1 ) to_layer = 1
    }

    let file_clicker
    async function load_svg() {
        if ( file_clicker ) {
            let {data,name,mime} = await get_file(file_clicker)
            file_svg = data
            file_name = name
            check_mime = mime
        }
    }

    // // ----/ ----/ ----/ ----/ ----
    async function data_ready() {
        if ( project_db ) {
            await project_db.add_file(file_name,description,file_svg,to_layer)
        }
    }

    let dialog_control_unsub = false
    // ----/ ----/ ----/ ----/ ----
    $: if ( ui_target ) {
        dialog_control_unsub = dialog_control.subscribe(async value => {
            if ( value ) {
                await data_ready()
                dialog_control.update(d_val => { return null })
            }
        });
    } else {
        if ( dialog_control_unsub ) dialog_control_unsub()
    }

    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
    //
</script>
<div class="project-creation">
    <div class="labelish">Add SVG to the current project</div> 
    {#if project_selected }
        <div lass="field-wrappers" >
            <div class="field-wrappers" >
                <div><span class="labelish" >Project name: </span> {project_name}</div>
                <div>
                    <span class="labelish" >Layer: </span> <input type=number bind:value={to_layer} min="1" max="10" on:change={to_layer_changed} />
                </div>        
                <div>
                    <div><span class="labelish" >Author Name: </span> {author} </div>
                </div>    
                <div>
                    <div class="labelish" >Description: </div> 
                    <blockquote>{project_description}</blockquote>
                </div>
            </div>
            <div class="field-wrappers" >
                <div class="labelish">Load an SVG file from disk:</div> 
                <div>
                    <span class="labelish" >To DB File: </span><input type=text bind:value={file_name} />
                </div>
            </div>
            <button class="uploader-button" on:click={load_svg} >▲ import</button>&nbsp;&nbsp;<span>{file_name}</span>
            {#if file_name.length }
                <div class="field-wrappers">
                    <div>
                        <div class="labelish" style="margin-bottom:3px" >Description: </div> 
                        <textarea bind:value={description} style="width:95%;margin-left:3%" />    
                    </div>    
                </div>
            {/if}
        </div>
    {:else}
        <div lass="field-wrappers" >
            Select a project for editing. Use <b>Manage Projects</b>
        </div>
    {/if}

    <div style="visibility: hidden;" >
        <input bind:this={file_clicker} type=file bind:value={file_name} />
	</div>
</div>
<style>

    .project-creation {
        background-color: wheat;
        border: solid 1px darkslateblue;
        padding:8px;
    }

    .labelish {
        font-weight: bold;
        color:rgb(19, 46, 46)
    }

    .uploader-button {
        cursor: pointer;
        border-radius: 8px;
    }


    .field-wrappers {
        border: black 1px solid;
        padding: 4px;
        margin: 4px;
        background-color: rgb(255, 247, 232);
    }


</style>
