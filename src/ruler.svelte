<script>
import { draggable } from 'svelte-drag';

export let disposition = "horizontal"

export let thickness = 12
export let length = 20000
export let ruler_top = 0
export let ruler_left = 0
export let ruler_magnification = 1.0
export let zero_tick = 0


function shorten_label(label) {
    if ( label > 1000 ) {
        label = label/1000;
        label = '' + label
        label = label.substr(0,5) + "k"
    }
    return label
}



function drawInterval_H(ctx,curD,totalLen,thick,tick_delta,label,label_offset,label_v) {
    //
    if ( typeof label !== 'string' ) {
        label = shorten_label(label)
        label = '' + label
    }
    //
    ctx.moveTo(curD, thick);
    ctx.lineTo(curD, 0);        // grow upwards
    //
    ctx.fillText(label, (curD + label_offset), label_v);
    for ( let i = 1; i < 10; i++ ) {
        curD += tick_delta
        if ( curD >= totalLen ) break
        const tick_size = (i % 2) ? thick - 2 : thick - 5;
        ctx.moveTo(curD, thick);
        ctx.lineTo(curD, tick_size);        // grow upwards
    }
    
    curD += tick_delta
    return curD
}


function drawInterval_V(ctx,curD,totalLen,thick,tick_delta,label,label_offset) {
    //
    if ( typeof label !== 'string' ) {
        label = shorten_label(label)
        label = '' + label
    }
    //
    ctx.moveTo(thick, curD);
    ctx.lineTo(0, curD);          // grow right to left

    // draw label vertically
    let n = label.length
    for ( let i = 0; i < n; i++ ) {
        ctx.fillText(label[i], 1, (curD + label_offset) + i * 9);
    }

    for ( let i = 1; i < 10; i++ ) {
        curD += tick_delta
        if ( curD >= totalLen ) break
        const tick_size = (i % 2) ? thick - 2 : thick - 5;
        ctx.moveTo(thick,curD);
        ctx.lineTo(tick_size,curD);        // grow upwards
    }
    
    curD += tick_delta
    return curD
}

function drawTicks(ctx,start,totalLen,thick,interval,mag,label_offset,isHorizontal) {
    //

    ctx.font = '9px sans-serif';
    ctx.lineWidth = 1
    ctx.fillStyle = '#000';
    ctx.strokeStyle = '#000';
    ctx.beginPath();

    let next_interval = start
    let tick_delta = mag*Math.floor(interval/10)
    let label = 0
    //
    if ( isHorizontal ) {
        let label_v = 6
        while ( next_interval < totalLen ) {
            next_interval = drawInterval_H(ctx,next_interval,totalLen,thick,tick_delta,label,label_offset,label_v)
            label += interval
        }
    } else {
        while ( next_interval < totalLen ) {
            next_interval = drawInterval_V(ctx,next_interval,totalLen,thick,tick_delta,label,9)
            label += interval
        }
    }


    ctx.stroke();
    ctx.closePath()
}

let ruler_width = 200
let ruler_height = 16

let drag_x = 0
let drag_y = 0

let drag_direction = ( disposition === "horizontal" ) ? "y" : "x"


let calc_ruler_top = 0
let calc_ruler_left = 0

$: calc_ruler_top = ruler_top + drag_y
$: calc_ruler_left = ruler_left + drag_x

function handle_drag(evt) {
    if ( disposition === "horizontal" ) {
        drag_x = 0
    } else if ( disposition === "vertical" ) {
        drag_y = 0
    }
}

let the_ruler
$: if ( the_ruler && (zero_tick > 0) ) {
    let ctxt = the_ruler.getContext("2d");
    ctxt.fillStyle = '#F00';
    ctxt.strokeStyle = '#F00';
    ctxt.clearRect(0, 0, the_ruler.width, the_ruler.height);
    //
    ctxt.fillStyle = 'rgba(90,80,120,0.4)';
    if ( disposition === "horizontal" ) {
        ctxt.fillRect(0,0,zero_tick,thickness)
    } else if ( disposition === "vertical" ) {
        ctxt.fillRect(0,0,thickness,zero_tick)        
    }
    ctxt.fill()
    //
    ctxt.fillStyle = '#F00';
    ctxt.beginPath();
    // zero_tick
    if ( disposition === "horizontal" ) {
        ctxt.moveTo(zero_tick, 0);
        ctxt.lineTo(zero_tick, thickness);
    } else if ( disposition === "vertical" ) {
        ctxt.moveTo(0, zero_tick);
        ctxt.lineTo(thickness,zero_tick);
    }
    ctxt.lineWidth = 3;
    ctxt.stroke();
    ctxt.closePath()

    let totalLen = Math.max(ruler_width,ruler_height)
    let thick = Math.min(ruler_width,ruler_height)
    let interval = 50
    if ( ruler_magnification < 1 ) {
        interval = Math.floor(100*(1/ruler_magnification))
    }
    drawTicks(ctxt,zero_tick,totalLen,thick,interval,
                ruler_magnification,2,( disposition === "horizontal" ))
}


if ( disposition === "horizontal" ) {
    ruler_width = length
    ruler_height = thickness
} else if ( disposition === "vertical" ) {
    ruler_width = thickness
    ruler_height = length
}

</script>
<canvas bind:this={the_ruler} use:draggable={{ axis: drag_direction, bounds: 'parent' }} width={ruler_width} height={ruler_height} class="ruler" style="left:{calc_ruler_left}px;top:{calc_ruler_top}px;height:{ruler_height}px;width:{ruler_width}px" >
</canvas>
<style>

    .ruler {
        position: absolute;
        background-color: rgba(233, 240, 238, 0.527);
        border: 1px solid black;
        cursor: grabbing;
    }

</style>