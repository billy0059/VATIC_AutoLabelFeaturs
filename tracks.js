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

    /*
     * Updates boxes with the given frame
     */
    this.update = function(frame)
    {
        for (var i in this.tracks)
        {
            this.tracks[i].draw(frame);
        }
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
            console.log("-----------------------------.......................");
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

        console.log("Test..");
        console.log(this.pollposition());
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
                    me.fixposition();
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
                    
                
             
                    console.log(me.label);
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
