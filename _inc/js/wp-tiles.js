// debounce utility from underscorejs.org
var debounce = function(func, wait, immediate) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      if (immediate && !timeout) func.apply(context, args);
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
};

(function($) {

    $.each ( wptilesdata, function( key, tiledata ) {

        var el = document.getElementById(tiledata.id),
            grid = new Tiles.Grid(el),
            display_opts = tiledata.display_options;;

        grid.resizeColumns = function() {
                return this.template.numCols;
            };

        grid.createTile = function(data) {
            var img     = data.img,
                url     = data.url,
                bylineExtra
                        = data.byline,
                color   = data.color,
                bylineColor
                        = data.bylineColor,
                title   = data.title,
                tile    = new Tiles.Tile(data.id),
                hideByline
                        = data.hideByline;

            var byline = '';
            var bylineBgColor = '';
            if ( ! hideByline ) {
                if ( display_opts.bylineBg && display_opts.bylineBg == 'rand' )
                        bylineBgColor = "background-color: " + bylineColor;
                else bylineBgColor = '';

                if ( img )
                    byline = "<div class='tile-byline' style='" + bylineBgColor + ";'>\n";
                else
                    byline = "<div class='tile-byline tile-text-only'>\n";

                byline += "<div class='title'>" + title + "</div>"

                byline += "<div class='extra category'>" + bylineExtra + "</div>"; // Left category in for backward compat for custom styles

                byline += "</div>";
            }

            var tileClass;
            if ( img )
                tileClass = 'tile-bg';
            else tileClass = 'tile-color';

            if ( hideByline ) tileClass += ' hide-byline';

            if ( img ) {
                tile.$el.append(
                         "<div class='" + tileClass + "' style='background-color: " + color + ";background-image: url(" + img + ");' onclick='window.location=\"" + url + "\"'>"
                            + byline
                        + "</div><!-- end .tile-bg -->"
                );
            } else {
                tile.$el.append(
                         "<div class='" + tileClass + "' style='background-color:" + color + "' onclick='window.location=\"" + url + "\"'>"
                            + byline
                        + "</div><!-- end .tile-bg -->"
                );
            }
            return tile;
        };

        var oldTemplate = false;
        if ( $("#" + tiledata.id ).width() < tiledata.display_options.small_screen_width ) {
            $("div#" + tiledata.id + "-templates").hide();
            grid.template = Tiles.Template.fromJSON(tiledata.rowTemplates['small']);
            oldTemplate = Tiles.Template.fromJSON(tiledata.rowTemplates[0]);
        } else {
            $("div#" + tiledata.id + "-templates").show();
            grid.template = Tiles.Template.fromJSON(tiledata.rowTemplates[0]);
        }

        grid.isDirty = true;
        grid.resize();
        grid.cellPadding = parseInt(display_opts.cellPadding);

        var posts = tiledata.posts;
        grid.updateTiles(posts);
        grid.redraw(true, resizeWpTiles);

        function resizeWpTiles() { // @todo is there a way to make this less hacky?
            var lastEl = $('#' + tiledata.id).children().last();
            var tileOffsetTop = parseInt ( $('#' + tiledata.id).offset().top );
            //var newHeight = parseInt(lastEl.css("height"), 10) + parseInt(lastEl.css("top"), 10) + 10 + "px";
            var newHeight = parseInt(lastEl.css("height"), 10) + parseInt(lastEl.offset().top, 10) - tileOffsetTop + 10 + "px";
            $('.wp-tile-container:has("#'+ tiledata.id +'")').css('height', newHeight );
        }

        // wait until users finishes resizing the browser
        var debouncedResize = debounce(function() {
            if ( $("#" + tiledata.id ).width() < tiledata.display_options.small_screen_width ) {
                $("div#" + tiledata.id + "-templates").hide();
                if ( ! oldTemplate )
                    oldTemplate = grid.template;
                grid.template = Tiles.Template.fromJSON(tiledata.rowTemplates['small']);
                grid.isDirty = true;
            } else if ( oldTemplate ) {
                $("div#" + tiledata.id + "-templates").show();
                grid.template = oldTemplate;
                oldTemplate = false;
                grid.isDirty = true;
            }

            grid.resize();
            grid.redraw(true, resizeWpTiles);
        }, 200);

        // when the window resizes, redraw the grid
        $(window).resize(debouncedResize);

        // Make the grid changable
        var $templateButtons = $('#' + tiledata.id + '-templates li.template').on('click', function(e) {

            // unselect all templates
            $templateButtons.removeClass("selected");

            // select the template we clicked on
            $(e.target).addClass("selected");

            // get the JSON rows for the selection
            var index = $(e.target).index(),
                rows = tiledata.rowTemplates[index];

            // set the new template and resize the grid
            grid.template = Tiles.Template.fromJSON(rows);
            grid.isDirty = true;
            grid.resize();

            grid.redraw(true, resizeWpTiles);
        });
    });
    $(window).trigger('resize');
})(jQuery);