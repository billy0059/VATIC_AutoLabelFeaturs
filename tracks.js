//import regression from 'regression';
/*
 * Allows the user to draw a box on the screen.
 */
function BoxDrawer(container)
{
    var me = this;

    this.onstartdraw = [];
    this.onstopdraw = []

    this.enabled = false;
    this.drawing = false;

    this.startx = 0;
    this.starty = 0;

    this.container = container;
    this.handle = null;
    this.color = null;

    this.vcrosshair = null;
    this.hcrosshair = null;

    /*
     * Enables the drawer.
     */
    this.enable = function()
    {
        this.enabled = true;

        this.container.css({
            'cursor': 'crosshair'
        });

        this.hcrosshair = $('<div></div>').appendTo(this.container);
        this.vcrosshair = $('<div></div>').appendTo(this.container);

        this.vcrosshair.css({
            width: '2px',
            height: '100%',
            position: 'relative',
            top: '0px',
            left: '0px',
            backgroundColor: this.color,
            zIndex: 1
        }).hide();

        this.hcrosshair.css({
            height: '2px',
            width: '100%',
            position: 'relative',
            top: '0px',
            left: '0px',
            backgroundColor: this.color,
            zIndex: 1
        }).hide();
    }

    /*
     * Disables the drawer. No boxes can be drawn and interface cues are
     * disabled.
     */
    this.disable = function()
    {
        this.enabled = false;

        this.container.css({
            'cursor': 'default'
        });

        this.vcrosshair.remove();
        this.hcrosshair.remove();
    }

    /*
     * Method called when we receive a click on the target area.
     */
    this.click = function(xc, yc)
    {
        if (this.enabled)
        {
            if (!this.drawing)
            {
                this.startdrawing(xc, yc);
            }
            else
            {
                this.finishdrawing(xc, yc);
            }
        }
    }

    /*
     * Updates the current visualization of the current box.
     */
    this.updatedrawing = function(xc, yc)
    {
        if (this.drawing)
        {
            var pos = this.calculateposition(xc, yc);
            var offset = this.container.offset();
            this.handle.css({
                "top": pos.ytl + offset.top + "px",
                "left": pos.xtl + offset.left + "px",
                "width": (pos.width - 3) + "px",
                "height": (pos.height - 3)+ "px",
                "border-color": this.color
            });
        }
    }

    /*
     * Updates the cross hairs.
     */
    this.updatecrosshairs = function(visible, xc, yc)
    {
        if (this.enabled)
        {
            if (visible && !this.drawing)
            {
                this.vcrosshair.show().css('left', xc + 'px');
                this.hcrosshair.show().css('top', yc + 'px');
            }
            else
            {
                this.vcrosshair.hide();
                this.hcrosshair.hide();
            }
        }
    }

    /*
     * Calculates the position of the box given the starting coordinates and
     * some new coordinates.
     */
    this.calculateposition = function(xc, yc)
    {
        var xtl = Math.min(xc, this.startx);
        var ytl = Math.min(yc, this.starty);
        var xbr = Math.max(xc, this.startx);
        var ybr = Math.max(yc, this.starty);
        return new Position(xtl, ytl, xbr, ybr)
    }

    /*
     * Starts drawing a box.
     */
    this.startdrawing = function(xc, yc)
    {
        if (!this.drawing)
        {
            console.log("Starting new drawing");

            this.startx = xc;
            this.starty = yc;

            this.drawing = true;

            this.handle = $('<div class="boundingbox"><div>');
            this.updatedrawing(xc, yc);
            this.container.append(this.handle);

            for (var i in this.onstartdraw)
            {
                this.onstartdraw[i]();
            }
        }
    }

    /*
     * Completes drawing the box. This will remove the visualization, so you will
     * have to redraw it.
     */
    this.finishdrawing = function(xc, yc)
    {
        if (this.drawing)
        {
            console.log("Finishing drawing");

            var position = this.calculateposition(xc, yc);

            // call callbacks
            for (var i in this.onstopdraw)
            {
                this.onstopdraw[i](position);
            }

            this.drawing = false;
            this.handle.remove();
            this.startx = 0;
            this.starty = 0;
        }
    }

    /*
     * Cancels the current drawing.
     */
    this.canceldrawing = function()
    {
        if (this.drawing)
        {
            console.log("Cancelling drawing");
            this.drawing = false;
            this.handle.remove();
            this.startx = 0;
            this.starty = 0;
        }
    }

    var respondtoclick = function(e) {
        var offset = container.offset();
        me.click(e.pageX - offset.left, e.pageY - offset.top);
    };

    var ignoremouseup = false;

    container.mousedown(function(e) {
        ignoremouseup = true;
        window.setTimeout(function() {
            ignoremouseup = false;
        }, 500);

        respondtoclick(e);
    });

    container.mouseup(function(e) {
        if (!ignoremouseup)
        {
            respondtoclick(e);
        }
    });

    container.click(function(e) {
        e.stopPropagation();
    });

    container.mousemove(function(e) {
        var offset = container.offset();
        var xc = e.pageX - offset.left;
        var yc = e.pageY - offset.top;

        me.updatedrawing(xc, yc);
        me.updatecrosshairs(true, xc, yc);
    });

    $("body").click(function(e) {
        me.canceldrawing();
    });
}

var track_collection_dump = null;

/*
 * A collection of tracks.
 */
function TrackCollection(player, job)
{
    var me = this;
    //console.log(player);
    this.player = player;
    this.job = job;
    this.tracks = [];

    this.onnewobject = [];

    player.onupdate.push(function() {
        me.update(player.frame);
    });

    /*player.onpause.push(function() {
        for (var i in me.tracks)
        {
            me.tracks[i].recordposition();
        }
    });*/

    // if the window moves, we have to update boxes
    $(window).resize(function() {
        me.update(me.player.frame);
    });

    /*
     * Creates a new object.
     */
    this.add = function(frame, position, color)
    {
        var track = new Track(this.player, color, position);
        this.tracks.push(track);

        console.log("Added new track");

        for (var i = 0; i < this.onnewobject.length; i++)
        {
            console.log(onnewobject[i]);
            this.onnewobject[i](track);
        }

        return track;
    }

    /*
     * Changes the draggable functionality. If true, allow dragging,
     * otherwise disable.
     */
    this.draggable = function(value)
    {
        for (var i in this.tracks)
        {
            this.tracks[i].draggable(value);
        }
    }

    /*
     * Changes the resize functionality. If true, allow resize, otherwise disable.
     */
    this.resizable = function(value)
    {
        for (var i in this.tracks)
        {
            this.tracks[i].resizable(value);
        }
    }

    /*
     * Changes the visibility on the boxes. If true, show boxes, otherwise hide.
     */
    this.visible = function(value)
    {
        for (var i in this.tracks)
        {
            this.tracks[i].visible(value);
        }
    }

    /*
     * Changes the opacity on the boxes.
     */
    this.dim = function(value)
    {
        for (var i in this.tracks)
        {
            this.tracks[i].dim(value);
        }
    }

    this.drawingnew = function(value)
    {
        for (var i in this.tracks)
        {
            this.tracks[i].drawingnew = value;
        }
    }

	this.merge = function(track1, track2){
		console.log(track1 + track1);
	}

    var linear = function (anno1, anno2){

        var coordinateX_1 = [], coordinateY_1 = [];
        var boxArea = [];
        for (var i in anno1){
            if( (anno1[i].occluded == false) && (anno1[i].outside == false)){
                var midx = (parseInt(anno1[i].xtl) + parseInt(anno1[i].xbr)) / 2.0;
                var midy = (parseInt(anno1[i].ytl) + parseInt(anno1[i].ybr)) / 2.0;
                var area = (parseInt(anno1[i].xbr) - parseInt(anno1[i].xtl)) * (parseInt(anno1[i].ybr) - parseInt(anno1[i].ytl));
                var tempX = [i, midx];
                var tempY = [i, midy];
                var tempArea = [i, area];
                //console.log(temp);
                coordinateX_1.push(tempX);
                coordinateY_1.push(tempY);
                boxArea.push(tempArea);
            }
        }
        //console.log("X array " + coordinateX_1);
        //console.log("Y array " + coordinateY_1);

        /*var regressionX_1 = methods.linear(coordinateX_1, { order: 2, precision: 2, period: null });
        var regressionY_1 = methods.linear(coordinateY_1, { order: 2, precision: 2, period: null });

        console.log(regressionX_1);
        console.log(regressionY_1);*/



        //var coordinateX_2 = [], coordinateY_2 = [];
        for (var i in anno2){
            if( (anno2[i].occluded == false) && (anno2[i].outside == false)){
                var midx = (parseInt(anno2[i].xtl) + parseInt(anno2[i].xbr)) / 2.0;
                var midy = (parseInt(anno2[i].ytl) + parseInt(anno2[i].ybr)) / 2.0;
                var area = (parseInt(anno2[i].xbr) - parseInt(anno2[i].xtl)) * (parseInt(anno2[i].ybr) - parseInt(anno2[i].ytl));
                var tempX = [i, midx];
                var tempY = [i, midy];
                var tempArea = [i, area];
                //console.log(temp);
                //coordinateX_2.push(tempX);
                //coordinateY_2.push(tempY);

                coordinateX_1.push(tempX);
                coordinateY_1.push(tempY);
                boxArea.push(tempArea);
            }
        }
        //console.log("X array " + coordinateX_1);
        //console.log("Y array " + coordinateY_1);

        /*
        var regressionX_2 = methods.linear(coordinateX_2, { order: 2, precision: 2, period: null });
        var regressionY_2 = methods.linear(coordinateY_2, { order: 2, precision: 2, period: null });
        console.log(regressionX_2);
        console.log(regressionY_2);*/



        var regressionX_1 = methods.linear(coordinateX_1, { order: 4, precision: 3, period: null });
        var regressionY_1 = methods.linear(coordinateY_1, { order: 4, precision: 3, period: null });
        var regression_area = methods.linear(boxArea, { order: 4, precision: 3, period: null });

        if (regressionX_1.r2 > 0.5 && regressionY_1.r2 > 0.5 && regression_area.r2 > 0.5){
            //caseMerge2++;
            console.log(regressionX_1);
            console.log(regressionY_1);
            console.log(regression_area);
            return 1;
        }
        return 0;

    }


	var mergeFunc = function (track1, track2){
		console.log(me.tracks);

	    console.log(me.tracks[track1].journal.annotations);
		console.log(me.tracks[track2].journal.annotations);

		var anno1 = Object.keys(me.tracks[track1].journal.annotations);
		var anno2 = Object.keys(me.tracks[track2].journal.annotations);

		var track1start = parseInt(anno1[1]);
		var track2start = parseInt(anno2[1]);

        //console.log(me.tracks[track1].journal.annotations);
        //console.log(anno1);


		if (track1start < track2start){
			console.log("track" + track1 + " is going to merge track" + track2 + "..." );
			for(var frameNum in anno2){
				if (anno1.includes(parseInt(anno2[frameNum]).toString()) || anno1.includes((parseInt(anno2[frameNum])+1).toString()) ||
                    anno1.includes((parseInt(anno2[frameNum])+2).toString()) || anno1.includes((parseInt(anno2[frameNum])+3).toString()) ||
                    anno1.includes((parseInt(anno2[frameNum])-1).toString()) || anno1.includes((parseInt(anno2[frameNum])-2).toString()) ||
                    anno1.includes((parseInt(anno2[frameNum])-3).toString()) )
				{
					console.log("annotations is within blow radius ... abandon");
				}
				else{
					console.log("merging ...");
					console.log(anno2[frameNum]);
                    me.tracks[track1].journal.annotations[anno2[frameNum]] = me.tracks[track2].journal.annotations[anno2[frameNum]];
                    console.log(me.tracks[track2].journal.annotations[anno2[frameNum]]);
					// wait for implemntation, done
				}
			}
            console.log(me.tracks[track1].journal.annotations);
			me.tracks[track2].remove(); // remove track2
			console.log(me.tracks[track2]);
            //me.tracks.splice(track2, 1);
		}

		else {
			console.log("track" + track2 + " is going to merge track" + track1 + "..." );
            for(var frameNum in anno1){
                if (anno2.includes(parseInt(anno1[frameNum]).toString()) || anno2.includes((parseInt(anno1[frameNum])+1).toString()) ||
                    anno2.includes((parseInt(anno1[frameNum])+2).toString()) || anno2.includes((parseInt(anno1[frameNum])+3).toString()) ||
                    anno2.includes((parseInt(anno1[frameNum])-1).toString()) || anno2.includes((parseInt(anno1[frameNum])-2).toString()) ||
                    anno2.includes((parseInt(anno1[frameNum])-3).toString()))
                {
                    console.log("annotations is within blow radius ... abandon");
                }
                else{
                    console.log("merging ...");
                    console.log(anno1[frameNum]);
                    me.tracks[track2].journal.annotations[anno1[frameNum]] = me.tracks[track1].journal.annotations[anno1[frameNum]];
                    console.log(me.tracks[track1].journal.annotations[anno1[frameNum]]);
                    // wait for implemntation, done
                }
            }
            console.log(me.tracks[track2].journal.annotations);
            me.tracks[track1].remove(); // remove track1
            console.log(me.tracks[track1]);
            //me.tracks.splice(track1, 1);
		}
    }

    this.mergeEventDetect1 = function(frame, i, j){
        //console.log(frame);
        if(stageButton == 1){
            //stage ++;
            stageButton = 0;
            //$("#nextStage").empty();
            $("#nextStage").click(function() {
                stageButton = 1;
                stage ++;
                console.log("test" + stage);
                console.log(frame);

                $(this).button({
                    //disabled: true,
                    icons: {
                        primary: "ui-icon-arrowthick-1-e"
                    }
                });

                $("#mergeTable").empty();
                $("#stageText").text("STAGE2 : Same object? Press \"Merge\" button to merge them. (" + caseMerge2 + " cases detected.)");
                mergeLog = {};
                me.player.seek(0);
                //me.player.play();

            }).button({
                //disabled: true,
                icons: {
                    primary: "ui-icon-arrowthick-1-e"
                }
            });
        }

        if(this.tracks[i].estimate(frame).outside != true && this.tracks[j].estimate(frame).outside != true && (this.tracks[i].label == this.tracks[j].label)){
            var overlap = this.overlapRatio(parseInt(this.tracks[i].estimate(frame).xtl),
                                            parseInt(this.tracks[i].estimate(frame).ytl),
                                            parseInt(this.tracks[i].estimate(frame).xbr),
                                            parseInt(this.tracks[i].estimate(frame).ybr),
                                            parseInt(this.tracks[j].estimate(frame).xtl),
                                            parseInt(this.tracks[j].estimate(frame).ytl),
                                            parseInt(this.tracks[j].estimate(frame).xbr),
                                            parseInt(this.tracks[j].estimate(frame).ybr)
                                            );
                    //console.log(overlap);

            if(overlap>0.5 && overlap<1 && mergeLog[i.toString()+"_"+j.toString()] != 1 && mergeLog[j.toString()+"_"+i.toString()] != 1){  // consider as the same object, ask if to merge


                $("#stageText").text("STAGE1 : Same object? Press \"Merge\" button to merge them. (" + caseMerge1 + " cases detected.)");

                mergeLog[i.toString()+"_"+j.toString()] = 1;  // avoid repeat

                console.log(overlap);
                console.log(this.tracks[i].label);
                console.log(this.tracks[j].label);
                console.log(this.tracks[i].estimate(frame));
                console.log(this.tracks[j].estimate(frame));
                console.log(frame);

                var buttonID = "track" + i.toString() + "_" + j.toString(); // track1_5

                var toFrame = "To" + frame;

                var frameURL = job.frameurl(frame);
                //console.log(frameURL);

                var track1Img = frame+"_"+i.toString();
                var track2Img = frame+"_"+j.toString();

                if(caseMerge1 %2 == 0){
                    merge1ID = "merge" + (caseMerge1/2).toString();
                    $("#mergeTable").append("<tr id=\"" + merge1ID + "\" style= \"height : 100px; \"></tr>");
                }

                //$("#mergeTable").append("<tr id=\"" + merge1ID + "\" style= \"height : 100px; \"></tr>");




                $("#" + merge1ID ).append("<td>" + job.labels[this.tracks[i].label] + (parseInt(i)+1).toString() + "<div id=\"" + track1Img +"\" style= \"width : 100px; height : 100px; overflow: hidden\"></div> </td>");
                $("#" + merge1ID ).append("<td>" + job.labels[this.tracks[j].label] + (parseInt(j)+1).toString() + "<div id=\"" + track2Img +"\" style= \"width : 100px; height : 100px; overflow: hidden\"></div> </td>");

                //$("#" + buttonID + "frame"+ frame ).append("<td border=\"0\"><div class='button' id='"+ toFrame +"' style = \"margin-top : 0\">" + toFrame + "</div></td>");

                $("#" + merge1ID ).append("<td><div class = \"btn-group\"><button id='"+ toFrame +"'>" + toFrame + "</button> <button id='"+buttonID+"_"+frame+"''>Merge</button></div></td>");

                var scaleX = 100 / (parseInt(this.tracks[i].estimate(frame).xbr) - parseInt(this.tracks[i].estimate(frame).xtl));
                var scaleY = 100 / (parseInt(this.tracks[i].estimate(frame).ybr) - parseInt(this.tracks[i].estimate(frame).ytl));
                var style = "style = \"width :"+ (scaleX*parseInt(job.width)).toString() +"; height:" +(scaleY*parseInt(job.height)).toString() +"; margin-left : "+ (-Math.round(scaleX * parseInt(this.tracks[i].estimate(frame).xtl))).toString()+"; margin-top : " + (-Math.round(scaleY * parseInt(this.tracks[i].estimate(frame).ytl))).toString()+";\"";

                $('<img class ="'+i.toString()+'"src="'+ frameURL +'"'+style +' >').load(function() {    // load i
                    $(this).appendTo("#" + track1Img );
                });

                scaleX = 100 / (parseInt(this.tracks[j].estimate(frame).xbr) - parseInt(this.tracks[j].estimate(frame).xtl));
                scaleY = 100 / (parseInt(this.tracks[j].estimate(frame).ybr) - parseInt(this.tracks[j].estimate(frame).ytl));
                style = "style = \"width :"+ (scaleX*parseInt(job.width)).toString() +"; height:" +(scaleY*parseInt(job.height)).toString() +"; margin-left : "+ (-Math.round(scaleX * parseInt(this.tracks[j].estimate(frame).xtl))).toString()+"; margin-top : " + (-Math.round(scaleY * parseInt(this.tracks[j].estimate(frame).ytl))).toString()+";\"";

                $('<img class ="'+j.toString()+'"src="'+ frameURL +'"'+style +' >').load(function() {   // load j
                    $(this).appendTo("#" + track2Img );
                });


                $("#"+toFrame).click(function() { // change to that frame
                    me.player.seek($(this).attr('id').split("o")[1]);
                    console.log($(this).attr('id'));
                    $('html, body').scrollTop(0);
                });

                $("#"+buttonID+"_"+frame).click(function() { // merge implementation
                    var track1 = $(this).attr('id').split("k")[1].split("_")[0];
                    var track2 = $(this).attr('id').split("k")[1].split("_")[1];
                    console.log(track1 + track2);
                    mergeFunc(track1,track2);
                    caseMerge1--;

                    $(this).prop('disabled',true); // disable the button.
                    $(this).text("Done");
                    merge1Count++;

                    //console.log(i.toString() + j.toString());
                });
                caseMerge1++;

            }
        }

    }

    this.mergeEventDetect2 = function(frame, i, j){

        if(stageButton == 1){
            $("#nextStage").unbind();
            stageButton = 0;
            //$("#nextStage").empty();
            //$("#nextStage .ui-button-text").text("Nexxxxxt Stage (current " + stage + ")");
            $("#nextStage").click(function() {
                stageButton = 1;
                stage ++;
                console.log("test2");
                $(this).empty();
                //$(this).text("Nexxxxxt Stage (current " + stage + ")");
                $(this).button({
                    //disabled: true,
                    icons: {
                        primary: "ui-icon-arrowthick-1-e"
                    }
                });

                $("#mergeTable").empty();
                $("#stageText").text("STAGE3 : FP? Press \"FP\" button to delete them. (" + caseFP + " cases detected.)");
                me.player.seek(0);
                me.player.play();
            }).button({
                //disabled: true,
                icons: {
                    primary: "ui-icon-arrowthick-1-e"
                }
            });
        }

        //console.log(me.tracks[track1].journal.annotations);
        //console.log(me.tracks[track2].journal.annotations);

        var anno1 = Object.keys(this.tracks[i].journal.annotations);
        var anno2 = Object.keys(this.tracks[j].journal.annotations);




        //console.log("!!");
        if(frame == 0 && !(this.tracks[i].deleted) && !(this.tracks[j].deleted) &&(this.tracks[i].label == this.tracks[j].label) && (mergeLog[i.toString()+"_"+j.toString()] != 1) && (mergeLog[j.toString()+"_"+i.toString()] != 1)) {
            mergeLog[i.toString()+"_"+j.toString()] = 1;
            //console.log(i.toString() + " " + j.toString());

            if (   ((i<j) && (parseInt(anno1[anno1.length - 2]) > parseInt(anno2[1])))
                || ((i>j) && (parseInt(anno2[anno2.length - 2]) > parseInt(anno1[1])))
                || (i == j)
              ){
                console.log(anno1);
                console.log(anno2);
                return 0;
            }

            /*for(var frameNum in anno2){



                if((  anno1.includes(parseInt(anno2[frameNum]).toString())
                   || anno1.includes((parseInt(anno2[frameNum])+1).toString())
                   || anno1.includes((parseInt(anno2[frameNum])+2).toString())
                   || anno1.includes((parseInt(anno2[frameNum])+3).toString())
                   || anno1.includes((parseInt(anno2[frameNum])-1).toString())
                   || anno1.includes((parseInt(anno2[frameNum])-2).toString())
                   || anno1.includes((parseInt(anno2[frameNum])-3).toString())
                   )
                   && (parseInt(frameNum) != 0)
                   && (parseInt(frameNum) != (anno2.length - 1)) )
                {
                    return 0;
                }
            }*/
            console.log(i.toString() + " " + j.toString());
            console.log("-------------------------------");


            console.log(anno1);
            console.log(anno2);

            console.log(caseMerge2);

            if (linear(this.tracks[i].journal.annotations, this.tracks[j].journal.annotations) == 1){
                $("#stageText").text("STAGE2 : Same object? Press \"Merge\" button to merge them. (" + (caseMerge2 + 1) + " cases detected.)");
                if (caseMerge2 % 2 == 0){
                    merge2ID = "merge" + (caseMerge2/2).toString();
                    $("#mergeTable").append("<tr id=\"" + merge2ID + "\" style= \"height : 100px; \"></tr>");
                }
                var buttonID = "track" + i.toString() + "_" + j.toString(); // track1_5

                var track1Img = caseMerge2.toString() + "path_" + i.toString();
                var track2Img = caseMerge2.toString() + "path_" + j.toString();

                var toFrame1 = caseMerge2.toString() + "To" + anno1[1];
                var toFrame2 = caseMerge2.toString() + "To" + anno2[1];
                var toFrame1Text = "To" + anno1[1];
                var toFrame2Text = "To" + anno2[1];



                $("#" + merge2ID ).append("<td>" + job.labels[this.tracks[i].label] + (parseInt(i)+1).toString() + "_" + anno1[1] + "<div id=\"" + track1Img +"\" style= \"width : 100px; height : 100px; overflow: hidden\"></div> </td>");
                $("#" + merge2ID ).append("<td>......</td>");
                $("#" + merge2ID ).append("<td>" + job.labels[this.tracks[j].label] + (parseInt(j)+1).toString() + "_" + anno2[1] + "<div id=\"" + track2Img +"\" style= \"width : 100px; height : 100px; overflow: hidden\"></div> </td>");

                $("#" + merge2ID ).append("<td><div class = \"btn-group\"><button id='"+ toFrame1 +"'>" + toFrame1Text + "</button><button id='"+ toFrame2 +"'>" + toFrame2Text + "</button> <button id='"+buttonID+"''>Merge</button></div></td>");

                var frameURL = job.frameurl(anno1[1]);

                var scaleX = 100 / (parseInt(this.tracks[i].estimate(anno1[1]).xbr) - parseInt(this.tracks[i].estimate(anno1[1]).xtl));
                var scaleY = 100 / (parseInt(this.tracks[i].estimate(anno1[1]).ybr) - parseInt(this.tracks[i].estimate(anno1[1]).ytl));
                var style = "style = \"width :"+ (scaleX*parseInt(job.width)).toString() +"; height:" +(scaleY*parseInt(job.height)).toString() +"; margin-left : "+ (-Math.round(scaleX * parseInt(this.tracks[i].estimate(anno1[1]).xtl))).toString()+"; margin-top : " + (-Math.round(scaleY * parseInt(this.tracks[i].estimate(anno1[1]).ytl))).toString()+";\"";

                $('<img class ="'+i.toString()+'"src="'+ frameURL +'"'+style +' >').load(function() {    // load i
                    $(this).appendTo("#" + track1Img );
                });

                frameURL = job.frameurl(anno2[1]);

                scaleX = 100 / (parseInt(this.tracks[j].estimate(anno2[1]).xbr) - parseInt(this.tracks[j].estimate(anno2[1]).xtl));
                scaleY = 100 / (parseInt(this.tracks[j].estimate(anno2[1]).ybr) - parseInt(this.tracks[j].estimate(anno2[1]).ytl));
                style = "style = \"width :"+ (scaleX*parseInt(job.width)).toString() +"; height:" +(scaleY*parseInt(job.height)).toString() +"; margin-left : "+ (-Math.round(scaleX * parseInt(this.tracks[j].estimate(anno2[1]).xtl))).toString()+"; margin-top : " + (-Math.round(scaleY * parseInt(this.tracks[j].estimate(anno2[1]).ytl))).toString()+";\"";

                $('<img class ="'+j.toString()+'"src="'+ frameURL +'"'+style +' >').load(function() {    // load j
                    $(this).appendTo("#" + track2Img );
                });


                $("#"+toFrame1).click(function() { // change to that frame

                    me.player.seek($(this).attr('id').split("o")[1]);
                    console.log($(this).attr('id'));
                    $('html, body').scrollTop(0);
                });
                $("#"+toFrame2).click(function() { // change to that frame

                    me.player.seek($(this).attr('id').split("o")[1]);
                    console.log($(this).attr('id'));
                    $('html, body').scrollTop(0);
                });

                $("#"+buttonID).click(function() { // change to that frame
                    mergeFunc(i,j);
                    $(this).prop('disabled',true); // disable the button.
                    $(this).text("Done");
                    caseMerge2 = 0;
                    mergeLog = {};
                    $("#mergeTable").empty();
                    me.player.seek(0);
                    merge2Count++;

                });


                caseMerge2++;
            }
        }
    }


    this.FPEvent = function(frame, i){
      if(stageButton == 1){
          $("#nextStage").unbind();
          stageButton = 0;
          //$("#nextStage").empty();
          //$("#nextStage .ui-button-text").text("Nexxxxxt Stage (current " + stage + ")");
          $("#nextStage").click(function() {
              disappear = disappearDoubt(me.tracks);
              console.log(disappear);
              stageButton = 1;
              stage ++;
              console.log("test2");
              $(this).empty();
              //$(this).text("Nexxxxxt Stage (current " + stage + ")");
              $(this).button({
                  //disabled: true,
                  icons: {
                      primary: "ui-icon-arrowthick-1-e"
                  }
              });

              $("#mergeTable").empty();
              $("#stageText").text("STAGE4 : Exist? Press \"Recover\" button to recover them. (" + caseDisappear + " cases detected.)");


              me.player.seek(0);
              me.player.play();
          }).button({
              //disabled: true,
              icons: {
                  primary: "ui-icon-arrowthick-1-e"
              }
          });
      }
      if (this.tracks[i].estimate(frame).outside != true && appearLog[i.toString()] != 1 && !(this.tracks[i].deleted)) {
          appearLog[i.toString()] = 1;
          console.log(this.tracks[i]);
          console.log(frame);
          var frameURL = job.frameurl(frame);
          var buttonID = "track" + i.toString(); // track1
          var toFrame = i + "To" + frame;

          var trackImg = frame+"_"+i.toString();
          if (caseFP % 5 == 0){
              fpTrID = "FP"+caseFP.toString();
              $("#mergeTable").append("<tr id=\"" + fpTrID + "\" style= \"height : 100px; \"></tr>"); //track1frame1
          }
          $("#" + fpTrID ).append("<td>" + job.labels[this.tracks[i].label] + (parseInt(i)+1).toString() + "<div id=\"" + trackImg +"\" style= \"width : 100px; height : 100px; overflow: hidden\"></div> </td>");

          $("#" + fpTrID ).append("<td><div class = \"btn-group\"><button id='"+ toFrame +"'>To" + frame + "</button> <button id='"+buttonID+"_"+frame+"''>FP</button></div></td>");

          var scaleX = 100 / (parseInt(this.tracks[i].estimate(frame).xbr) - parseInt(this.tracks[i].estimate(frame).xtl));
          var scaleY = 100 / (parseInt(this.tracks[i].estimate(frame).ybr) - parseInt(this.tracks[i].estimate(frame).ytl));
          var style = "style = \"width :"+ (scaleX*parseInt(job.width)).toString() +"; height:" +(scaleY*parseInt(job.height)).toString() +"; margin-left : "+ (-Math.round(scaleX * parseInt(this.tracks[i].estimate(frame).xtl))).toString()+"; margin-top : " + (-Math.round(scaleY * parseInt(this.tracks[i].estimate(frame).ytl))).toString()+";\"";
          $('<img class ="'+i.toString()+'"src="'+ frameURL +'"'+style +' >').load(function() {    // load i
              $(this).appendTo("#" + trackImg );
          });

          $("#"+toFrame).click(function() { // change to that frame
              me.player.seek($(this).attr('id').split("o")[1]);
              console.log($(this).attr('id'));
              $('html, body').scrollTop(0);
          });

          $("#"+buttonID+"_"+frame).click(function(){
              console.log("test");
              me.tracks[i].remove();
              //me.tracks.splice(i, 1);
              console.log(me.tracks);

              $(this).prop('disabled',true); // disable the button.
              $(this).text("Done");
              fpCount++;
          });

          caseFP++;
          $("#stageText").text("STAGE3 : FP? Press \"FP\" button to delete them. (" + caseFP + " cases detected.)");
        }
    }



    this.disappearEvent = function(frame, i){
    	if(stageButton == 1){
          $("#nextStage").unbind();
          stageButton = 0;
          //$("#nextStage").empty();
          //$("#nextStage .ui-button-text").text("Nexxxxxt Stage (current " + stage + ")");
          $("#nextStage").click(function() {
              //disappear = disappearDoubt(me.tracks);
              //console.log(disappear);
              stageButton = 1;
              stage ++;
              console.log("test2");
              $(this).empty();
              //$(this).text("Nexxxxxt Stage (current " + stage + ")");
              $(this).button({
                  //disabled: true,
                  icons: {
                      primary: "ui-icon-arrowthick-1-e"
                  }
              });

              $("#mergeTable").empty();
              $("#stageText").text("STAGE5 : You might want to resize/relocate these objects.");


              me.player.seek(0);
              me.player.play();
            }).button({
              //disabled: true,
                icons: {
                    primary: "ui-icon-arrowthick-1-e"
                }
            });
        }

        var trackImg1;
        if (me.tracks[i].deleted){
        	return;
        }

        if(disappear[i.toString()].includes(frame.toString()) && DAlog[i.toString() + "_" + frame] != 1 ) {


            $("#stageText").text("STAGE4 : Exist? Press \"Recover\" button to recover them. (" + (caseDisappear+1) + " cases detected.)");
                    //console.log(me.tracks);
            trackImg1 =  i.toString() + "_" + frame;
            DAlog[trackImg1] = 1;
            var frameURL = job.frameurl(frame);
            console.log(frameURL);

            var toFrame = "path_" + i.toString() + "_To" + frame;
            if (caseDisappear % 5 == 0){
                  DATrID = "DA"+caseDisappear.toString();
                  $("#mergeTable").append("<tr id=\"" + DATrID + "\" style= \"height : 100px; \"></tr>"); //track1frame1
            }
            var disappearID = "path_" + i.toString() + "_" + frame;
            $("#" + DATrID ).append("<td>" + job.labels[me.tracks[i].label] + (parseInt(i)+1).toString() + "<div id=\"" + trackImg1 +"\" style= \"width : 100px; height : 100px; overflow: hidden\"></div> </td>");

            $("#" + DATrID ).append("<td><div class = \"btn-group\"><button id='"+ toFrame +"'>To" + frame + "</button> <button id='"+disappearID+"_"+frame+"''>Recover</button></div></td>");

            var keys = Object.keys(me.tracks[i].journal.annotations);
            console.log(keys);
            var DSIndex = keys.indexOf(frame.toString());
            console.log(DSIndex);

            var ratio = (parseInt(keys[DSIndex]) - parseInt(keys[DSIndex-1])) / (parseInt(keys[DSIndex+1]) - parseInt(keys[DSIndex-1]));

            var xbr = parseInt(parseInt(me.tracks[i].estimate(keys[DSIndex-1]).xbr) + (parseInt(me.tracks[i].estimate(keys[DSIndex+1]).xbr) - parseInt(me.tracks[i].estimate(keys[DSIndex-1]).xbr)) * ratio);
            var xtl = parseInt(parseInt(me.tracks[i].estimate(keys[DSIndex-1]).xtl) + (parseInt(me.tracks[i].estimate(keys[DSIndex+1]).xtl) - parseInt(me.tracks[i].estimate(keys[DSIndex-1]).xtl)) * ratio);
            var ybr = parseInt(parseInt(me.tracks[i].estimate(keys[DSIndex-1]).ybr) + (parseInt(me.tracks[i].estimate(keys[DSIndex+1]).ybr) - parseInt(me.tracks[i].estimate(keys[DSIndex-1]).ybr)) * ratio);
            var ytl = parseInt(parseInt(me.tracks[i].estimate(keys[DSIndex-1]).ytl) + (parseInt(me.tracks[i].estimate(keys[DSIndex+1]).ytl) - parseInt(me.tracks[i].estimate(keys[DSIndex-1]).ytl)) * ratio);
            console.log(parseInt(me.tracks[i].estimate(keys[DSIndex-1]).xbr));
            console.log(xbr);
            console.log(xtl);
            console.log(ybr);
            console.log(ytl);
            console.log(parseInt(me.tracks[i].estimate(keys[DSIndex+1]).xbr));
            console.log("--------");


            console.log(xtl);
            console.log(ybr);
            console.log(ytl);


            var scaleX = 100 / (xbr-xtl);
            var scaleY = 100 / (ybr-ytl);
            var style = "style = \"width :"+ (scaleX*parseInt(job.width)).toString() +"; height:" +(scaleY*parseInt(job.height)).toString() +"; margin-left : "+ (-Math.round(scaleX * xtl)).toString()+"; margin-top : " + (-Math.round(scaleY * ytl)).toString()+";\"";
            $('<img class ="'+i.toString()+'"src="'+ frameURL +'"'+style +' >').load(function() {    // load i
                $(this).appendTo("#" + trackImg1 );
            });

            $("#"+toFrame).click(function() { // change to that frame
              me.player.seek($(this).attr('id').split("o")[1]);
              console.log($(this).attr('id'));
              $('html, body').scrollTop(0);
            });

            $("#"+disappearID+"_"+frame).click(function() { // change to that frame
                me.tracks[i].journal.annotations[frame].outside = false;
                console.log(me.tracks[i].journal.annotations[frame]);
                me.player.seek(frame);
                $(this).prop('disabled',true); // disable the button.
                $(this).text("Done");
                DACount++;
            });

            caseDisappear++;
        }
    }

    this.displacementEvent = function(frame, i){
    	if(stageButton == 1){
            $("#nextStage").unbind();
            stageButton = 0;
            $("#nextStage").click(function() {
                stage ++;
                $(this).empty();
                //$(this).text("Nexxxxxt Stage (current " + stage + ")");
                $(this).button({
                  //disabled: true,
                    icons: {
                      primary: "ui-icon-arrowthick-1-e"
                    }
                });

	            $("#mergeTable").empty();
	            $("#stageText").text("All stages are finished, now you can create bounding boxes with unannotated objects.");
	            console.log("merge1Count : " + merge1Count);
	            console.log("merge2Count : " + merge2Count);
	            console.log("fpCount : " + fpCount);
	            console.log("DACount : " + DACount);
	            console.log("DPCount : " + DPCount);
	            me.player.seek(0);
	            me.player.play();
	            $("#nextStage").button("option", "disabled", true);
	            $("#nextStage").unbind();
            }).button({
                icons: {
                    primary: "ui-icon-arrowthick-1-e"
                }
            });
        }

        if ( (frame == 0) && (!me.tracks[i].deleted) && DPlog[i] != 1){ //this.tracks[i].journal.annotations
        	DPlog[i] = 1;
        	var coordinateX = [], coordinateY = [];
            var boxArea = [];
            var anno1 = this.tracks[i].journal.annotations;
            for (var j in anno1){
	            if( (anno1[j].occluded == false) && (anno1[j].outside == false)){
	                var midx = (parseInt(anno1[j].xtl) + parseInt(anno1[j].xbr)) / 2.0;
	                var midy = (parseInt(anno1[j].ytl) + parseInt(anno1[j].ybr)) / 2.0;
	                var area = (parseInt(anno1[j].xbr) - parseInt(anno1[j].xtl)) * (parseInt(anno1[j].ybr) - parseInt(anno1[j].ytl));
	                var tempX = [j, midx];
	                var tempY = [j, midy];
	                var tempArea = [j, area];
	                coordinateX.push(tempX);
	                coordinateY.push(tempY);
	                boxArea.push(tempArea);
                }
            }

            var regressionX = methods.linear(coordinateX, { order: 3, precision: 3, period: null });
            var regressionY = methods.linear(coordinateY, { order: 3, precision: 3, period: null });
            var regression_area = methods.linear(boxArea, { order: 3, precision: 3, period: null });
            var ratio = 0.1
            if (regressionX.r2 < 0.5){

            	var xindex = [];
            	var xvalue = [];
                console.log("X regression r2 < 0.5 ... ");
                for (var j in anno1){
                	if( (anno1[j].occluded == false) && (anno1[j].outside == false)){
			            xindex.push(j);
			            var midx = (parseInt(anno1[j].xtl) + parseInt(anno1[j].xbr)) / 2.0;
			            //console.log(midx);
			            //console.log(regressionX.predict(parseInt(j))[1]);
	                    xvalue.push(parseInt(Math.abs(regressionX.predict(parseInt(j))[1] - midx).toFixed(2) * 100));
                    }
                }
            	console.log(xindex);
            	console.log(xvalue);
                var times = parseInt(xindex.length * ratio);
                console.log(times);
                for (var n=0; n<times; n++){
                	

                	var index = xvalue.indexOf(Math.max(...xvalue));
                	console.log(Math.max(...xvalue));
                	console.log(index);
                	console.log(xindex[index]); // object frame 
                	if (DPlog[i+"_"+xindex[index]] == 1){
                		continue;
                	}
                	DPlog[i+"_"+xindex[index]] = 1;

                	if(caseDisplacement % 5 == 0){
	                    DPTrID = "DP"+caseDisplacement.toString();
	                    $("#mergeTable").append("<tr id=\"" + DPTrID + "\" style= \"height : 100px; \"></tr>"); //track1frame1
                    }

                    var toFrame = "path_" + i.toString() + "_To" + xindex[index].toString();
                    var frameURL = job.frameurl(xindex[index].toString());

                    var trackImg1 = i.toString() + "_" + xindex[index].toString() + caseDisplacement;

                    $("#" + DPTrID ).append("<td>" + job.labels[me.tracks[i].label] + (parseInt(i)+1).toString() + "<div id=\"" + trackImg1 +"\" style= \"width : 100px; height : 100px; overflow: hidden\"></div> </td>");
                    $("#" + DPTrID ).append("<td><div class = \"btn-group\"><button id='"+ toFrame +"'>To" + xindex[index] + "</button> </div></td>");

                    var scaleX = 100 / (parseInt(this.tracks[i].estimate(xindex[index].toString()).xbr) - parseInt(this.tracks[i].estimate(xindex[index].toString()).xtl));
                    var scaleY = 100 / (parseInt(this.tracks[i].estimate(xindex[index].toString()).ybr) - parseInt(this.tracks[i].estimate(xindex[index].toString()).ytl));
                    var style = "style = \"width :"+ (scaleX*parseInt(job.width)).toString() +"; height:" +(scaleY*parseInt(job.height)).toString() +"; margin-left : "+ (-Math.round(scaleX * parseInt(this.tracks[i].estimate(xindex[index].toString()).xtl))).toString()+"; margin-top : " + (-Math.round(scaleY * parseInt(this.tracks[i].estimate(xindex[index].toString()).ytl))).toString()+";\"";
			        
			        $('<img class ="'+trackImg1+'"src="'+ frameURL +'"'+style +'>').load(function() {    // load i
			            $(this).appendTo("#" + $(this).attr("class"));
			        });
			        
			        $("#"+toFrame).click(function() { // change to that frame
		                me.player.seek($(this).attr('id').split("o")[1]);
		                console.log($(this).attr('id'));
		                $('html, body').scrollTop(0);
		                DPCount++;
                    });

                	xvalue.splice(index, 1);
                	xindex.splice(index, 1);
                	caseDisplacement++;

                }
            }
            if (regressionY.r2 < 0.5){
            	var xindex = [];
            	var xvalue = [];
                console.log("X regression r2 < 0.5 ... ");
                for (var j in anno1){
                	if( (anno1[j].occluded == false) && (anno1[j].outside == false)){
			            xindex.push(j);
			            var midx = (parseInt(anno1[j].ytl) + parseInt(anno1[j].ybr)) / 2.0;
			            //console.log(midx);
			            //console.log(regressionX.predict(parseInt(j))[1]);
	                    xvalue.push(parseInt(Math.abs(regressionX.predict(parseInt(j))[1] - midx).toFixed(2) * 100));
                    }
                }
            	console.log(xindex);
            	console.log(xvalue);
                var times = parseInt(xindex.length * ratio);
                console.log(times);
                for (var n=0; n<times; n++){

                	var index = xvalue.indexOf(Math.max(...xvalue));
                	console.log(Math.max(...xvalue));
                	console.log(index);
                	console.log(xindex[index]); // object frame 

                	if (DPlog[i+"_"+xindex[index]] == 1){
                		continue;
                	}
                	DPlog[i+"_"+xindex[index]] = 1;

                	if(caseDisplacement % 5 == 0){
	                    DPTrID = "DP"+caseDisplacement.toString();
	                    $("#mergeTable").append("<tr id=\"" + DPTrID + "\" style= \"height : 100px; \"></tr>"); //track1frame1
                    }

                    var toFrame = "path_" + i.toString() + "_To" + xindex[index].toString();
                    var frameURL = job.frameurl(xindex[index].toString());

                    var trackImg1 = i.toString() + "_" + xindex[index].toString() + caseDisplacement;

                    $("#" + DPTrID ).append("<td>" + job.labels[me.tracks[i].label] + (parseInt(i)+1).toString() + "<div id=\"" + trackImg1 +"\" style= \"width : 100px; height : 100px; overflow: hidden\"></div> </td>");
                    $("#" + DPTrID ).append("<td><div class = \"btn-group\"><button id='"+ toFrame +"'>To" + xindex[index] + "</button> </div></td>");

                    var scaleX = 100 / (parseInt(this.tracks[i].estimate(xindex[index].toString()).xbr) - parseInt(this.tracks[i].estimate(xindex[index].toString()).xtl));
                    var scaleY = 100 / (parseInt(this.tracks[i].estimate(xindex[index].toString()).ybr) - parseInt(this.tracks[i].estimate(xindex[index].toString()).ytl));
                    var style = "style = \"width :"+ (scaleX*parseInt(job.width)).toString() +"; height:" +(scaleY*parseInt(job.height)).toString() +"; margin-left : "+ (-Math.round(scaleX * parseInt(this.tracks[i].estimate(xindex[index].toString()).xtl))).toString()+"; margin-top : " + (-Math.round(scaleY * parseInt(this.tracks[i].estimate(xindex[index].toString()).ytl))).toString()+";\"";
			        
			        $('<img class ="'+trackImg1+'"src="'+ frameURL +'"'+style +'>').load(function() {    // load i
			            $(this).appendTo("#" + $(this).attr("class"));
			        });
			        
			        $("#"+toFrame).click(function() { // change to that frame
		                me.player.seek($(this).attr('id').split("o")[1]);
		                console.log($(this).attr('id'));
		                $('html, body').scrollTop(0);
		                DPCount++;
                    });

                	xvalue.splice(index, 1);
                	xindex.splice(index, 1);
                	caseDisplacement++;

                }
            	
            }
            if (regression_area.r2 < 0.5){
            	var xindex = [];
            	var xvalue = [];
                console.log("X regression r2 < 0.5 ... ");
                for (var j in anno1){
                	if( (anno1[j].occluded == false) && (anno1[j].outside == false)){
			            xindex.push(j);
			            var midx = (parseInt(anno1[j].xbr) - parseInt(anno1[j].xtl)) * (parseInt(anno1[j].ybr) - parseInt(anno1[j].ytl));
			            //console.log(midx);
			            //console.log(regressionX.predict(parseInt(j))[1]);
	                    xvalue.push(parseInt(Math.abs(regressionX.predict(parseInt(j))[1] - midx).toFixed(2) * 100));
                    }
                }
            	console.log(xindex);
            	console.log(xvalue);
                var times = parseInt(xindex.length * ratio);
                console.log(times);
                for (var n=0; n<times; n++){

                	var index = xvalue.indexOf(Math.max(...xvalue));
                	console.log(Math.max(...xvalue));
                	console.log(index);
                	console.log(xindex[index]); // object frame 

                	if (DPlog[i+"_"+xindex[index]] == 1){
                		continue;
                	}
                	DPlog[i+"_"+xindex[index]] = 1;

                	if(caseDisplacement % 5 == 0){
	                    DPTrID = "DP"+caseDisplacement.toString();
	                    $("#mergeTable").append("<tr id=\"" + DPTrID + "\" style= \"height : 100px; \"></tr>"); //track1frame1
                    }

                    var toFrame = "path_" + i.toString() + "_To" + xindex[index].toString();
                    var frameURL = job.frameurl(xindex[index].toString());

                    var trackImg1 = i.toString() + "_" + xindex[index].toString() + caseDisplacement;

                    $("#" + DPTrID ).append("<td>" + job.labels[me.tracks[i].label] + (parseInt(i)+1).toString() + "<div id=\"" + trackImg1 +"\" style= \"width : 100px; height : 100px; overflow: hidden\"></div> </td>");
                    $("#" + DPTrID ).append("<td><div class = \"btn-group\"><button id='"+ toFrame +"'>To" + xindex[index] + "</button> </div></td>");

                    var scaleX = 100 / (parseInt(this.tracks[i].estimate(xindex[index].toString()).xbr) - parseInt(this.tracks[i].estimate(xindex[index].toString()).xtl));
                    var scaleY = 100 / (parseInt(this.tracks[i].estimate(xindex[index].toString()).ybr) - parseInt(this.tracks[i].estimate(xindex[index].toString()).ytl));
                    var style = "style = \"width :"+ (scaleX*parseInt(job.width)).toString() +"; height:" +(scaleY*parseInt(job.height)).toString() +"; margin-left : "+ (-Math.round(scaleX * parseInt(this.tracks[i].estimate(xindex[index].toString()).xtl))).toString()+"; margin-top : " + (-Math.round(scaleY * parseInt(this.tracks[i].estimate(xindex[index].toString()).ytl))).toString()+";\"";
			        
			        $('<img class ="'+trackImg1+'"src="'+ frameURL +'"'+style +'>').load(function() {    // load i
			            $(this).appendTo("#" + $(this).attr("class"));
			        });
			        
			        $("#"+toFrame).click(function() { // change to that frame
		                me.player.seek($(this).attr('id').split("o")[1]);
		                console.log($(this).attr('id'));
		                $('html, body').scrollTop(0);
		                DPCount++;
                    });

                	xvalue.splice(index, 1);
                	xindex.splice(index, 1);
                	caseDisplacement++;

                }
                
            }
        }

    	//console.log("test displacement event");
    	//console.log(me.tracks);

    }


    /*
     * Updates boxes with the given frame
     */
    this.update = function(frame)
    {
        //$('#mergeArea').empty();
        for (var i in this.tracks)
        {
            this.tracks[i].draw(frame);
            if(stage == 0){
                for (var j in this.tracks){
                    this.mergeEventDetect1(frame, i, j);  // type 1 merge
                }
            }
            else if (stage == 1){ // type 2 merge
                for (var j in this.tracks){
                    this.mergeEventDetect2(frame, i, j);
                }
            }
            else if (stage == 2){ // FP case
                this.FPEvent(frame, i);
            }
            else if (stage == 3){ // disappear case
                this.disappearEvent(frame, i);

            }
            else if (stage == 4){
            	this.displacementEvent(frame, i);

            }
        }
        //console.log(caseMerge1);
    }





    this.overlapRatio = function(K, L, M, N, P, Q, R, S){
      	var area1 = (M - K) * (N - L);
      	var area2 = (R - P) * (S - Q);
      	var overlap;
      	if ((P>=M) || (Q>=N) || (K>=R) || (L>=S)){
      		overlap = 0;
      	}
      	else{
            blX = Math.max(K, P);
            blY = Math.max(L, Q);
            trX = Math.min(M, R);
            trY = Math.min(N, S);
            overlap = (trX - blX) * (trY - blY);
      	}
      	return overlap / (area1 + area2 - overlap);
    }

    /*
     * Returns the number of tracks.
     */
    this.count = function()
    {
        var count = 0;
        for (var i in this.tracks)
        {
            if (!this.tracks[i].deleted)
            {
                count++;
            }
        }
        return count;
    }

    this.recordposition = function()
    {
        for (var i in this.tracks)
        {
            this.tracks[i].recordposition();
        }
    }

    /*
     * Serializes all tracks for sending to server.
     */
    this.serialize = function()
    {
        var count = 0;
        var str = "[";
        for (var i in this.tracks)
        {
            if (!this.tracks[i].deleted)
            {
                str += this.tracks[i].serialize() + ",";
                count++;
            }
        }
        if (count == 0)
        {
            return "[]";
        }
        return str.substr(0, str.length - 1) + "]";
    }

    track_collection_dump = function() {
        return me.serialize();
    };
}

/*
 * A track class.
 */
function Track(player, color, position)
{
    var me = this;

    this.journal = new Journal(player.job.start, player.job.blowradius);
    this.attributejournals = {};
    this.label = null;
    this.player = player;
    this.handle = null;
    this.color = color;
    this.htmloffset = 3;
    this.deleted = false;

    this.onmouseover = [];
    this.onmouseout = [];
    this.oninteract = [];
    this.onupdate = [];
    this.onstartupdate = [];

    this.candrag = true;
    this.canresize = true;

    this.locked = false;
    this.drawingnew = false;

    this.journal.mark(this.player.job.start,
        new Position(position.xtl, position.ytl,
                     position.xbr, position.ybr,
                     false, true, []));

    this.journal.mark(this.player.frame, position);

    this.journal.artificialrightframe = this.player.job.stop;
    this.journal.artificialright = position;

    /*
     * Polls the on screen position of the box and returns it.
     */
    this.pollposition = function()
    {
        var hidden = this.handle.css("display") == "none";
        this.handle.show();

        var pos = this.handle.position();
        var width = this.handle.width();
        var height = this.handle.height();
        var offset = this.player.handle.offset();

        if (hidden)
        {
            this.handle.hide();
        }

        if (width < 1)
        {
            width = 1;
        }

        if (height < 1)
        {
            height = 1;
        }

        var xtl = pos.left - offset.left;
        var ytl = pos.top - offset.top;
        var xbr = xtl + width + this.htmloffset;
        var ybr = ytl + height + this.htmloffset;

        var estimate = this.estimate(this.player.frame);
        var position = new Position(xtl, ytl, xbr, ybr)
        position.occluded = estimate.occluded;
        position.outside = estimate.outside;
        return position;
    }

    /*
     * Polls the on screen position and marks it in the journal.
     */
    this.recordposition = function()
    {
        this.journal.mark(this.player.frame, this.pollposition());
        this.journal.artificialright = this.journal.rightmost();
    }

    /*
     * Fixes the position to force box to be inside frame.
     */
    this.fixposition = function()
    {
        var width = this.player.job.width;
        var height = this.player.job.height;
        var pos = this.pollposition();

        if (pos.xtl > width)
        {
            pos = new Position(width - pos.width, pos.ytl, width, pos.ybr);
        }
        if (pos.ytl > height)
        {
            pos = new Position(pos.xtl, height - pos.height, pos.xbr, height);
        }
        if (pos.xbr < 0)
        {
            pos = new Position(0, pos.ytl, pos.width, pos.ybr);
        }
        if (pos.ybr < 0)
        {
            pos = new Position(pos.xtl, 0, pos.xbr, pos.height);
        }

        var xtl = Math.max(pos.xtl, 0);
        var ytl = Math.max(pos.ytl, 0);
        var xbr = Math.min(pos.xbr, width - 1);
        var ybr = Math.min(pos.ybr, height - 1);

        var fpos = new Position(xtl, ytl, xbr, ybr);
        fpos.occluded = pos.occluded;
        fpos.outside = pos.outside;

        this.draw(this.player.frame, fpos);
    }

    /*
     * Notifies that there was an update to this box.
     */
    this.notifyupdate = function()
    {
        for (var i in this.onupdate)
        {
            this.onupdate[i]();
        }
    }

    this.notifystartupdate = function()
    {
        for (var i in this.onstartupdate)
        {
            this.onstartupdate[i]();
        }
    }

    /*
     * Sets the current position as occluded.
     */
    this.setocclusion = function(value)
    {
        if (value)
        {
            console.log("Marking object as occluded here.");
        }
        else
        {
            console.log("Marking object as not occluded here.");
        }

        var pos = this.estimate(this.player.frame);
        if (pos == null)
        {
            pos = this.pollposition();
        }
        pos = pos.clone();
        pos.occluded = value;
        this.journal.mark(this.player.frame, pos);
        this.journal.artificialright = this.journal.rightmost();
        this.draw(this.player.frame, pos, this.label);
    }

    /*
     * Sets the current position as outside.
     */
    this.setoutside = function(value)
    {
        if (value)
        {
            console.log("Marking object as outside here.");
        }
        else
        {
            console.log("Marking object as not outside here.");
        }

        var pos = this.estimate(this.player.frame);
        if (pos == null)
        {
            pos = this.pollposition();
        }
        pos = pos.clone();
        pos.outside = value;
        this.journal.mark(this.player.frame, pos);
        this.journal.artificialright = this.journal.rightmost();
        this.draw(this.player.frame, pos);
    }

    this.setattribute = function(id, value)
    {
        var journal = this.attributejournals[id];
        journal.mark(this.player.frame, value);
        //journal.artificialright = journal.rightmost();
    }

    this.initattributes = function(attributes)
    {
        for (var i in attributes)
        {
            var journal = new Journal(this.player.job.start,
                                      this.player.job.blowradius);
            journal.mark(this.player.job.start, false);
            //journal.artificialright = journal.rightmost();
            //journal.artificialrightframe = this.player.job.stop;

            this.attributejournals[i] = journal;
        }
    }

    this.estimateattribute = function(id, frame)
    {
        if (this.attributejournals[id] == null)
        {
            return false;
        }

        var bounds = this.attributejournals[id].bounds(frame);
        if (bounds['left'] == null)
        {
            return bounds['right'];
        }

        return bounds['left'];
    }

    /*
     * Changes the text on the bounding box.
     */
    this.settext = function(value)
    {
        if (this.handle != null)
        {
            var t = this.handle.children(".boundingboxtext");
            t.html(value).show();
        }

    }

    /*
     * Changes the lock state
     */
    this.setlock = function(value)
    {
        if (this.deleted)
        {
            return;
        }

        this.locked = value;

        if (value)
        {
            this.handle.draggable("option", "disabled", true);
            this.handle.resizable("option", "disabled", true);
        }
        else
        {
            this.handle.draggable("option", "disabled", !this.candrag);
            this.handle.resizable("option", "disabled", !this.canresize);
        }

        if (value)
        {
            this.handle.addClass("boundingboxlocked");
        }
        else
        {
            this.handle.removeClass("boundingboxlocked");
        }
    }

    /*
     * Draws the current box on the screen.
     */
    this.draw = function(frame, position)
    {

        if (this.handle == null)
        {
            this.handle = $('<div class="boundingbox"><div class="boundingboxtext"></div></div>');
            this.handle.css("border-color", this.color);
            var fill = $('<div class="fill"></div>').appendTo(this.handle);
            fill.css("background-color", this.color);
            this.player.handle.append(this.handle);

            this.handle.children(".boundingboxtext").hide().css({
                "border-color": this.color,
                //"color": this.color
                });

            this.handle.resizable({
                handles: "n,w,s,e",
                autoHide: true,
                ghost: true, /* need to fix this bug soon */
                start: function() {
                    player.pause();
                    me.notifystartupdate();
                    //me.triggerinteract();
                    for (var i in me.onmouseover)
                    {
                        me.onmouseover[i]();
                    }
                },
                stop: function() {
                    var currentFrame = $('#playerslider').slider("option", "value");
                    //var currentFraeme = parseInt($(#))
                    var changedObject = this.outerText;
                    changedObject = changedObject.split(" ")[0] + changedObject.split(" ")[1]; // delete the space

                    if (currentFrame.toString() in doubtFrame){ // if this frame contains suspected objects
                        //console.log(doubtFrame[currentFrame] + doubtFrame[currentFrame].length);
                        for (var i=0; i<doubtFrame[currentFrame].length; i++){
                            if (doubtFrame[currentFrame][i].trim().indexOf(changedObject.trim()) >= 0){
                                revisionRecord[currentFrame][i] = 1;
                                updateTips(currentFrame, doubtFrame);
                            }
                        }
                    }
                    me.fixposition(); //Fixes the position to force box to be inside frame.
                    me.recordposition();
                    me.notifyupdate();
                    eventlog("resizable", "Resize a box");
                    me.highlight(false);
                },
                resize: function() {
                    me.highlight(true);
                }
            });

            this.handle.draggable({
                start: function() {
                    player.pause();
                    me.notifystartupdate();
                    //me.triggerinteract();
                },
                stop: function() {
                    me.fixposition();
                    var currentFrame = $('#playerslider').slider("option", "value");
                    //var currentFraeme = parseInt($(#))
                    var changedObject = this.outerText;
                    changedObject = changedObject.split(" ")[0] + changedObject.split(" ")[1]; // delete the space

                    if (currentFrame.toString() in doubtFrame){ // if this frame contains suspected objects
                        //console.log(doubtFrame[currentFrame] + doubtFrame[currentFrame].length);
                        for (var i=0; i<doubtFrame[currentFrame].length; i++){
                            if (doubtFrame[currentFrame][i].trim().indexOf(changedObject.trim()) >= 0){
                                revisionRecord[currentFrame][i] = 1;
                                updateTips(currentFrame, doubtFrame);
                            }
                        }
                    }
                    console.log(changedObject, currentFrame);
                    console.log(doubtFrame);
                    me.fixposition(); // Fixes the position to force box to be inside frame.
                    me.recordposition();
                    me.notifyupdate();
                    eventlog("draggable", "Drag-n-drop a box");
                },
                cancel: ".boundingboxtext"
            });

            this.handle.mouseover(function() {
                if (!me.locked && !me.drawingnew)
                {
                    for (var i in me.onmouseover)
                    {
                        me.onmouseover[i]();
                    }
                }
            });

            this.handle.mouseout(function() {
                if (!me.locked && !me.drawingnew)
                {
                    for (var i in me.onmouseout)
                    {
                        me.onmouseout[i]();
                    }
                }
            });

            this.handle.click(function() {
                me.triggerinteract();
            });
        }

        if (position == null)
        {
            position = this.estimate(frame);
			//console.log(position);
        }

        if (position.outside)
        {
            this.handle.hide();
            return;
        }

        this.handle.show();

        if (position.occluded)
        {
            this.handle.addClass("boundingboxoccluded");
        }
        else
        {
            this.handle.removeClass("boundingboxoccluded");
        }

        var offset = this.player.handle.offset();

        this.handle.css({
            top: position.ytl + offset.top + "px",
            left: position.xtl + offset.left + "px",
            width: (position.width - this.htmloffset) + "px",
            height: (position.height - this.htmloffset) + "px"
        });
    }

    this.triggerinteract = function()
    {
        if (!this.locked && !this.drawingnew)
        {
            for (var i in this.oninteract)
            {
                this.oninteract[i]();
            }
        }
    }

    this.draggable = function(value)
    {
        if (this.deleted)
        {
            return;
        }

        this.candrag = value;

        if (value && !this.locked && !this.drawingnew)
        {
            this.handle.draggable("option", "disabled", false);
        }
        else
        {
            this.handle.draggable("option", "disabled", true);
        }
    }

    this.resizable = function(value)
    {
        if (this.deleted)
        {
            return;
        }

        this.canresize = value;

        if (value && !this.locked &&!this.drawingnew)
        {
            this.handle.resizable("option", "disabled", false);
        }
        else
        {
            this.handle.resizable("option", "disabled", true);
        }
    }

    this.visible = function(value)
    {
        if (value && !this.pollposition().outside)
        {
            this.handle.show();
        }
        else
        {
            this.handle.hide();
        }
    }

    /*
     * Dims the visibility of the box.
     */
    this.dim = function(value)
    {
        if (value)
        {
            this.handle.addClass("boundingboxdim");
        }
        else
        {
            this.handle.removeClass("boundingboxdim");
        }
    }

    /*
     * Highlights a box.
     */
    this.highlight = function(value)
    {
        if (value)
        {
            this.handle.addClass("boundingboxhighlight");
        }
        else
        {
            this.handle.removeClass("boundingboxhighlight");
        }
    }

    /*
     * Serializes the tracks.
     */
    this.serialize = function()
    {
        if (this.deleted)
        {
            return "";
        }
        var str = "[" + this.label + "," + this.journal.serialize() + ",{";

        var length = 0;
        for (var i in this.attributejournals)
        {
            str += '"' + i + '":' + this.attributejournals[i].serialize() + ",";
            length++;
        }

        if (length > 0)
        {
            str = str.substr(0, str.length - 1);
        }

        return str += "}]";
    }

    /*
     * Removes the box.
     */
    this.remove = function()
    {
        this.handle.remove();
        this.deleted = true;
    }

    /*
     * Estimates the position of the box for visualization purposes.
     * If the frame was annotated, returns that position, otherwise
     * attempts to interpolate or extrapolate.
     */
    this.estimate = function(frame)
    {
        var bounds = this.journal.bounds(frame);
        if (bounds['leftframe'] == bounds['rightframe'])
        {
            return bounds['left'];
        }

        if (bounds['right'] == null || bounds['left'].outside)
        {
            return bounds['left'];
        }

        if (bounds['right'].outside)
        {
            return bounds['right'];
        }

        var fdiff = bounds['rightframe'] - bounds['leftframe'];
        var xtlr = (bounds['right'].xtl - bounds['left'].xtl) / fdiff;
        var ytlr = (bounds['right'].ytl - bounds['left'].ytl) / fdiff;
        var xbrr = (bounds['right'].xbr - bounds['left'].xbr) / fdiff;
        var ybrr = (bounds['right'].ybr - bounds['left'].ybr) / fdiff;

        var off = frame - bounds['leftframe'];
        var xtl = bounds['left'].xtl + xtlr * off;
        var ytl = bounds['left'].ytl + ytlr * off;
        var xbr = bounds['left'].xbr + xbrr * off;
        var ybr = bounds['left'].ybr + ybrr * off;

        var occluded = false;
        var outside = false;

//        if (Math.abs(bounds['rightframe'] - frame) > Math.abs(bounds['leftframe'] - frame))
//        {
//            occluded = bounds['right'].occluded;
//            outside = bounds['right'].outside;
//        }
//        else
//        {
            occluded = bounds['left'].occluded;
            outside = bounds['left'].outside;
//        }

        return new Position(xtl, ytl, xbr, ybr, occluded, outside);
    }


    this.draw(this.player.frame);
}

/*
 * A journal to store a set of positions.
 */
function Journal(start, blowradius)
{
    this.annotations = {};
    this.artificialright = null;
    this.artificialrightframe = null;
    this.blowradius = blowradius;
    this.start = start;

    /*
     * Marks the boxes position.
     */
    this.mark = function(frame, position)
    {
        // Implementation for target doubtPath (0315)
        //console.log(this)

        //console.log("blowradius :" + this.blowradius);
        //console.log("Marking " + frame);
        //console.log(this.annotations);
        var newannotations = {};

        for (var i in this.annotations) // check all positions in all frames
        {
            if (Math.abs(i - frame) >= this.blowradius)
            {
                newannotations[i] = this.annotations[i];
            }
            else if (i == this.start)
            {
                //console.log("Start would blow, so propagating");
                newannotations[i] = position;
            }
            else
            {
                //console.log("Blowing out annotation at " + i); // blow out (not saving to newannotation) because the interval of ket frames(blowradius) < 3
            }
        }

        this.annotations = newannotations;
        this.annotations[frame] = position; // store the operation result in "this.annotations[frame] "
    }

    // Implementation, suspend on 0313
    this.mark0313suspend = function(frame, position)  // for exsiting and new create object
    {
        console.log("blowradius :" + this.blowradius);
        console.log("Marking(Current frame) " + frame);

        console.log("Linear regression before change:");

        //get regression from API
        var coordinateX = [], coordinateY = [];
        for (var i in this.annotations){
            if( i != 0 && i != 299){
                var midx = (parseInt(this.annotations[i].xtl) + parseInt(this.annotations[i].xbr)) / 2.0;
                var midy = (parseInt(this.annotations[i].ytl) + parseInt(this.annotations[i].ybr)) / 2.0;
                var tempX = [i, midx];
                var tempY = [i, midy];
                //console.log(temp);
                coordinateX.push(tempX);
                coordinateY.push(tempY);
            }
        }
        console.log("X array " + coordinateX);
        console.log("Y array " + coordinateY);
        var regressionX = methods.linear(coordinateX, { order: 2, precision: 2, period: null });
        var regressionY = methods.linear(coordinateY, { order: 2, precision: 2, period: null });

        var expectedX = regressionX.points.find(function (item, index, array){ return item.includes(frame)}); // find the expected coordinate in modified frame
        var expectedY = regressionY.points.find(function (item, index, array){ return item.includes(frame)}); // find the expected coordinate in modified frame

        var deviationX = 0;
        var deviationY = 0;

        if (expectedX != null){
            console.log("Expected value :" + expectedX);
            var observeredX = (parseInt(this.annotations[frame].xtl) + parseInt(this.annotations[frame].xbr)) / 2.0;
            var modifiedX = (parseInt(position.xtl) + parseInt(position.xbr)) / 2.0;
            console.log("Observered value X:" + observeredX);
            console.log("Deviation value(before modified) X: " + (observeredX - expectedX[1]));
            console.log("Deviation value(after modified) X: " + (modifiedX - expectedX[1]));

            if (Math.abs(modifiedX - expectedX[1]) > Math.abs(observeredX - expectedX[1])){  // if modified location does not fit the regression
                if((modifiedX - expectedX[1]) * (observeredX - expectedX[1]) > 0){ // same side of the regression line
                    deviationX = modifiedX - observeredX;
                }
                if((modifiedX - expectedX[1]) * (observeredX - expectedX[1]) < 0){ // different side of the regression line
                    deviationX = Math.abs(modifiedX - expectedX[1]) - Math.abs(observeredX - expectedX[1]);
                    if(observeredX > modifiedX){
                        deviationX *= -1;
                    }
                }
            }
            console.log("update deviationX :" + deviationX);
            console.log("-------------------------------------");

            console.log("Expected value :" + expectedY);
            var observeredY = (parseInt(this.annotations[frame].ytl) + parseInt(this.annotations[frame].ybr)) / 2.0;
            var modifiedY = (parseInt(position.ytl) + parseInt(position.ybr)) / 2.0;
            console.log("Observered value Y:" + observeredY);
            console.log("Deviation value(before modified) Y: " + (observeredY - expectedY[1]));
            console.log("Deviation value(after modified) Y: " + (modifiedY - expectedY[1]));

            if (Math.abs(modifiedY - expectedY[1]) > Math.abs(observeredY - expectedY[1])){  // if modified location does not fit the regression
                if((modifiedY - expectedY[1]) * (observeredY - expectedY[1]) > 0){ // same side of the regression line
                    deviationY = modifiedY - observeredY;
                }
                if((modifiedY - expectedY[1]) * (observeredY - expectedY[1]) < 0){ // different side of the regression line
                    deviationY = Math.abs(modifiedY - expectedY[1]) - Math.abs(observeredY - expectedY[1]);
                    if(observeredY > modifiedY){
                        deviationY *= -1;
                    }
                }
            }

            console.log("update deviationY :" + deviationY);

        }
        else{
          console.log("No existing point in this frame!");
        }

        console.log(regressionY);




        // Update to new annotation

        var newannotations = {};

        console.log("coordinateX.length : " + coordinateX.length);
        for (var i in this.annotations) // check all positions in all frames
        {
            if (Math.abs(i - frame) >= this.blowradius)
            {
                if(Math.abs(frame - i) < (coordinateX.length) ){
                    this.annotations[i].xbr += deviationX;
                    this.annotations[i].xtl += deviationX;
                    this.annotations[i].ybr += deviationY;
                    this.annotations[i].ytl += deviationY;
                    console.log("Adjust by the regression deviation at frame [" + i + "]");
                }
                newannotations[i] = this.annotations[i];

            }
            else if (i == this.start)
            {
                console.log("Start would blow, so propagating");
                newannotations[i] = position; //position.xbr, position.xtl, position.ybr, position.ytl
            }
            else
            {
                console.log("Blowing out annotation at " + i); // blow out (not saving to newannotation) because the interval of ket frames(blowradius) < 3
            }
        }

        this.annotations = newannotations;
        this.annotations[frame] = position; // store the operation result in "this.annotations[frame] "

        console.log("After change:")

        for (var i in this.annotations){
            console.log(this.annotations[i]);
        }

        // calculate the linear regression,(implementation) of the path
        /*
        var xa = 0.0; // frame
        var yaX = 0.0; // x axis
        var yaY = 0.0; // y axis
        var ax, bx, ay, by;
        var Lxx = 0.0, LxyX = 0.0, LxyY = 0.0;
        var count = 0.0;

        for (var i in this.annotations){
            if (i != 0){
                var midx = (parseInt(this.annotations[i].xtl) + parseInt(this.annotations[i].xbr)) / 2.0;
                var midy = (parseInt(this.annotations[i].ytl) + parseInt(this.annotations[i].ybr)) / 2.0;
                xa += parseInt(i);
                yaX += midx;
                yaY += midy;
                count ++;
            }
        }

        xa /= count;
        yaX /= count; // minX
        yaY /= count; // minY

        for (var i in this.annotations){
            if( i != 0){
                var midx = (parseInt(this.annotations[i].xtl) + parseInt(this.annotations[i].xbr)) / 2.0;
                var midy = (parseInt(this.annotations[i].ytl) + parseInt(this.annotations[i].ybr)) / 2.0;
                Lxx += (i - xa) * (i - xa);
                LxyX += (i - xa) * (midx - yaX);
                LxyY += (i - xa) * (midy - yaY);
            }
        }

        // Result
        bx = (LxyX / Lxx);
        ax = (yaX - bx * xa);

        by = (LxyY / Lxx);
        ay = (yaY - by * xa);

        console.log("y = x * " + bx + " + " + ax);
        console.log("y = x * " + by + " + " + ay);
        // measurements
        var SSRx = 0, SSRy = 0, SSEx = 0, SSEy = 0, SSTx, SSTy;

        for (var i in this.annotations){
            if( i != 0){
                var midx = (parseInt(this.annotations[i].xtl) + parseInt(this.annotations[i].xbr)) / 2.0;
                var midy = (parseInt(this.annotations[i].ytl) + parseInt(this.annotations[i].ybr)) / 2.0;
                var expX = i * bx + ax; // calculate expected coordinate x with formula
                var expY = i * by + ay; // calculate expected coordinate x with formula

                SSRx += (expX - yaX) * (expX - yaX);
                SSRy += (expY - yaY) * (expY - yaY);
                SSEx += (midx - expX) * (midx - expX);
                SSEy += (midy - expY) * (midy - expY);

                var weight = parseInt(this.annotations[i].xbr) - parseInt(this.annotations[i].xtl);
                var height = parseInt(this.annotations[i].ybr) - parseInt(this.annotations[i].ytl);
                var area = weight * height;

                console.log("Frame " + i + ", Obeserve X: " + midx + ", Expect X: " + expX.toFixed(2));
                console.log("Frame " + i + ", Obeserve Y: " + midy + ", Expect Y: " + expY.toFixed(2));
                console.log("Weight : " + weight + ", height : " + height + ", Area : " + area);
                console.log("-----------------------------");

                if(parseInt(i) == parseInt(frame)){ // current frame information : location and size
                    var updatedArea = (parseInt(position.xbr) - parseInt(position.xtl)) * (parseInt(position.ybr) - parseInt(position.ytl))
                    var positionX = (parseInt(position.xtl) + parseInt(position.xbr)) / 2.0;  // changed coordinate X
                    var positionY = (parseInt(position.ytl) + parseInt(position.ybr)) / 2.0;  // changed coordinate Y

                    console.log("--------------------------Chagned Frame---------------------------- " + frame);
                    console.log("Obeserve X(changed) : " + positionX + ", expect X: " + expX.toFixed(2));
                    console.log("Previous deviation x : [" + (midx - expX).toFixed(2) + "], after update deviation x : [" + (positionX - expX).toFixed(2) + "]");
                    console.log("Obeserve Y(changed) : " + positionY + ", expect Y: " + expY.toFixed(2));
                    console.log("Previous deviation y : [" + (midy - expY).toFixed(2) + "], after update deviation y : [" + (positionY - expY).toFixed(2) + "]");

                    console.log("Previous area : " + area + ", after update area : " + updatedArea + "");
                    console.log("------------------------------------------------------------------- ");
                    console.log();
                }
            }
        }
        SSTx = SSRx + SSEx;
        SSTy = SSRy + SSEy;



        console.log("this.start = " + this.start);
        console.log("x list :"); // ���� this.annotations[i].xtl, this.annotations[i].ytl, this.annotations[i].xbr, this.annotations[i].ybr
        //console.log(midXList);
        */

    }


    this.bounds = function(frame)
    {
        if (this.annotations[frame])
        {
            var item = this.annotations[frame];
            return {'left': item,
                    'leftframe': frame,
                    'right': item,
                    'rightframe': frame};
        }

        var left = null;
        var right = null;
        var lefttime = 0;
        var righttime = 0;

        for (t in this.annotations)
        {
            var item = this.annotations[t];
            itemtime = parseInt(t);

            if (itemtime <= frame)
            {
                if (left == null || itemtime > lefttime)
                {
                    left = item;
                    lefttime = itemtime;;
                }
            }
            else
            {
                if (right == null || itemtime < righttime)
                {
                    right = item;
                    righttime = itemtime;
                }
            }
        }

        return {'left': left,
                'leftframe': lefttime,
                'right': right,
                'rightframe': righttime};
    }

    /*
     * Gets the right most annotation.
     */
    this.rightmost = function()
    {
        var item = null
        var itemtime = null;
        for (var t in this.annotations)
        {
            if (itemtime == null || t > itemtime)
            {
                item = this.annotations[t];
                itemtime = t;
            }
        }
        return item;
    }

    /*
     * Serializes this journal based on position.
     */
    this.serialize = function()
    {
        if (this.annotations.length == 0)
        {
            return "{}";
        }

        str = "{";
        for (var frame in this.annotations)
        {
            var dat = this.annotations[frame];
            if (dat instanceof Object)
            {
                dat = dat.serialize();
            }
            str += "\"" + frame + "\":" + dat + ",";
        }

        if (this.artificialrightframe != null && this.annotations[this.artificialrightframe] == null)
        {
            console.log("Using artificial in serialization");
            var dat = this.artificialright;
            if (dat instanceof Object)
            {
                dat = dat.serialize();
            }
            str += "\"" + this.artificialrightframe + "\":" + dat + ",";
        }
        return str.substr(0, str.length - 1) + "}";
    }
}

/*
 * A structure to store a position.
 * Occlusion and outside is optional.
 */
function Position(xtl, ytl, xbr, ybr, occluded, outside)
{
    this.xtl = xtl;
    this.ytl = ytl;
    this.xbr = xbr;
    this.ybr = ybr;
    this.occluded = occluded ? true : false;
    this.outside = outside ? true : false;
    this.width = xbr - xtl;
    this.height = ybr - ytl;

    if (this.xbr <= this.xtl)
    {
        this.xbr = this.xtl + 1;
    }

    if (this.ybr <= this.ytl)
    {
        this.ybr = this.ytl + 1;
    }
    this.serialize = function()
    {
        return "[" + this.xtl + "," +
                     this.ytl + "," +
                     this.xbr + "," +
                     this.ybr + "," +
                     this.occluded + "," +
                     this.outside + "]";
    }

    this.clone = function()
    {
        return new Position(this.xtl,
                            this.ytl,
                            this.xbr,
                            this.ybr,
                            this.occluded,
                            this.outside)
    }
}
