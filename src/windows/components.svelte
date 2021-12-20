<script>

    export let selected_component = false
    let local_component = false

    $: local_component = selected_component

    let input_connector_names = []
    let can_show_inputs = false
    $: {
        let intputs_source = false
        if ( local_component ) {
            if ( local_component.stretching_inputs ) {
                intputs_source = local_component.stretching_inputs
                can_show_inputs = true
            } else if ( local_component.refed && local_component.refed.stretching_inputs ){
                intputs_source = local_component.refed.stretching_inputs
                can_show_inputs = true
            }
        }
        if ( intputs_source ) {
            input_connector_names = Object.keys(intputs_source)
        }
    }
    
    let output_connector_names = []
    let can_show_outputs = false
    $: {
        let outputs_source = false
        if ( local_component ) {
            if ( local_component.stretching_outputs ) {
                outputs_source = local_component.stretching_outputs
                can_show_outputs = true
            } else if ( local_component.refed && local_component.refed.stretching_outputs ){
                outputs_source = local_component.refed.stretching_outputs
                can_show_outputs = true
            }
        }
        if ( outputs_source ) {
            output_connector_names = Object.keys(outputs_source)
        }
    }


</script>
<div>

    {#if local_component === false }
        No connector selected
    {:else}
        <div>
            <span class="title-con">Component Properties: </span> <span class="title-con-id">{local_component.id}</span>
         </div>
         <div>
             <div>
                 <div>
                    <span class="title-con">Inputs: </span>
                 </div>
                 {#if can_show_inputs }
                    {#each input_connector_names as connect_id }
                    <div class="title-con-id">{connect_id}</div>
                    {/each}
                 {/if}
             </div>
             <div>
                <div>
                    <span class="title-con">Outputs: </span>
                 </div>
                 {#if can_show_outputs }
                    {#each output_connector_names as connect_id }
                    <div class="title-con-id">{connect_id}</div>
                    {/each}
                 {/if}
             </div>
         </div>
     
    {/if}

</div>
<style>

</style>