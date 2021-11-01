


export function popup_size() {
    let smallest_w = 200   // smallest and bigget willing to accomodate
    let biggest_w = 3000

    let smallest_h = 600
    let biggest_h = 1000

    // bounded window width
    let w = Math.max(smallest_w,window.innerWidth)
    w = Math.min(biggest_w,w)

    // bounded window height
    let h = Math.max(smallest_h,window.innerHeight)
    h = Math.min(biggest_h,h)

    let p_range
    let P
    //	percentage h range 
    let h_p_max = 0.80
    let h_p_min = 0.60
    p_range = h_p_max - h_p_min
    P = (biggest_h - h)/(biggest_h - smallest_h)
    //console.log("P h: " + P)
    let h_scale = P*(p_range) + h_p_min

    //	percentage w range 
    let w_p_max = 0.96
    let w_p_min = 0.20
    p_range = w_p_max - w_p_min
    P = (biggest_w - w)/(biggest_w - smallest_w)
    //console.log("P w: " + P)
    let w_scale = P*(p_range) + w_p_min

    // Setting the current height & width 
    // to the elements 

    return { "w" : w_scale, "h" : h_scale }
}
