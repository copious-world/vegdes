

export function erase_canvas(ctxt,width,height) {
    ctxt.clearRect(0, 0, width, height);
}


function draw_tick_delta(ctx,width,height,tick_delta) {
    //
    let cur_x = 0
    let cur_y = 0
    while ( cur_x < width ) {
        ctx.moveTo(cur_x,0)
        ctx.lineTo(cur_x,height)
        cur_x += tick_delta
    }

    while ( cur_y < height ) {
        ctx.moveTo(0,cur_y)
        ctx.lineTo(width,cur_y)
        cur_y += tick_delta
    }
    //
}

 
export function grid_on_canvas(ctx,width,height,mag,ruler_interval) {

    let interval = ruler_interval
    if ( mag < 1 ) {
        interval = Math.floor(100*(1/mag))
    }
    let tick_delta = mag*Math.floor(interval/10)

    ctx.lineWidth = 1
    ctx.fillStyle = '#000';
    ctx.strokeStyle = '#000000';
    ctx.beginPath();
    draw_tick_delta(ctx,width,height,20*tick_delta)
    ctx.stroke();
    ctx.closePath()

    ctx.strokeStyle = '#CFCFCF';
    ctx.beginPath();
    draw_tick_delta(ctx,width,height,2*tick_delta)
    ctx.stroke();
    ctx.closePath()

}
