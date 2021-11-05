<script>
    import { get } from "svelte/store";
    import { file_store, download_session_record } from "../../utils/file-utils"
    import { db_store, dialog_control } from "../../utils/db-utils"
    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
    export let ui_target= false
    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
        
    let snapping = false
    let snapping_step = 10

    let languages = [
        "English",
        "Francais"
    ]

    let language = languages[0]


    let units = [
        "Pixels",
        "Centimeters",
        "Milimeters",
        "Inches",
        "Points",
        "Picas",
        "Ems"
    ]

    let unit = units[0]

    let dialog_control_unsub = false
    // ----/ ----/ ----/ ----/ ----
    $: if ( ui_target ) {
        dialog_control_unsub = dialog_control.subscribe(value => {
            if ( value ) {
                // data_ready()
                dialog_control.update(d_val => { return null })
            }
        });
    } else {
        if ( dialog_control_unsub ) dialog_control_unsub()
    }

</script>
<div class="project-creation">
    <div class="labelish">Languages</div>
    <div>
        <select bind:value={language} >
            {#each languages as lang}
                <option value={lang}>
                    {lang}
                </option>
            {/each}
        </select>
    </div>
    <div class="labelish">Units and Ruler</div>
    <div>
        <select bind:value={unit} >
            {#each units as u}
                <option value={u}>
                    {u}
                </option>
            {/each}
        </select>
    </div>
    <div class="labelish">Grid</div>
    <div>
        <span class="labelish">Snap to Grid:</span> <input type="checkbox" bind:value={snapping} >
        <span class="labelish">Snapping Step Size:</span> <input type="number" min="0" max="50" bind:value={snapping_step} >
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


</style>
