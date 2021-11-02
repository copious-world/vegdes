<script>

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
