var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

var canvas2 = document.getElementById("canvas2");
var ctx2 = canvas2.getContext("2d");

function mainLoop() {
    updatePlayer();

    var viewMatrix = mat4MulMat4(mat4Rotation(rads(-player.angle)),
                                 mat4Translation({x: -player.x, y: -player.y, z: 0}));

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx2.clearRect(0, 0, ctx2.canvas.width, ctx2.canvas.height);

    drawMap({context: ctx, viewMatrix: viewMatrix, fillSectors: false});


    var nearClip = 5.0;
    var ratio = ctx2.canvas.width / ctx.canvas.height;

    var renderState = {
        context: ctx2,
        viewMatrix: viewMatrix,
        nearClip: nearClip,
        projection: mat4Projection(rads(15), ratio, nearClip, 500.0),
    };

    drawSector3d(player.sector, -1, renderState, 0, ctx2.canvas.width);

    if (mapShown)
        drawMap({context: ctx2, viewMatrix: viewMatrix, fillSectors: false});
}

document.addEventListener('keydown', function(event) {
    switch (event.keyCode) {
        case 83 /* s */: saveMap(); break;
        case 76 /* l */: loadMap(); break;
    }
});

completeSectors();
window.setInterval(mainLoop, 1000/30);
