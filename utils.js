function lerp(A, B, t){
    return A + (B - A) * t;
}

function getIntersection(A, B, C, D){
    const tTop = (D.x - C.x) * (A.y - C.y) - (D.y - C.y) * (A.x - C.x);
    const uTop = (B.x - A.x) * (C.y - A.y) - (B.y - A.y) * (C.x - A.x);
    const bottom = (D.y - C.y) * (B.x - A.x) - (D.x - C.x) * (B.y - A.y);
    if(bottom != 0){
        const t = tTop / bottom;
        const u = uTop / bottom;
        if (t >= 0 && t <= 1 && u >= 0 && u <= 1){
            return {
                x: lerp(A.x, B.x, t),
                y: lerp(A.y, B.y, t),
                offset: t
            }
        }
    return null;
    }
}