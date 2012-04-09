/* Category Columns -- Isotop custom layout mode */
// 
// See: http://isotope.metafizzy.co/custom-layout-modes/big-graph.html
// Usage:
//     $container.isotope({
//         itemSelector: '.element',
//         layoutMode: 'categoryCols',
//         categoryCols: {
//             columnWidth: 45, // size of item
//             rowHeight: 45, // size of item
//             maxRows: 11, // max number of items vertically
//             gutterWidth: { // width of gutter, needs to match getSortData names
//                 year: 0,
//                 scale: 0,
//                 program: 35,
//                 status: 80,
//                 title: 0
//             }
//         },
//         sortBy: 'year',
//         getSortData: {
//             year: function( $elem ) {
//                 return $elem.attr('data-year');
//             },
//             scale: function( $elem ) {
//                 return $elem.attr('data-scale');
//             },
//             program: function( $elem ) {
//                 return $elem.attr('data-program');
//             },
//             status: function( $elem ) {
//                 return $elem.attr('data-status');
//             },
//             title: function( $elem ) {
//                 var chara = $elem.find('p').text()[0];
//                 return isNaN( parseInt( chara ) ) ? chara : '0';
//             }
//         }
//     });

$.extend($.Isotope.prototype, {
    
    _categoryColsReset: function() {
        this.categoryCols = {
            x      : 0,
            y      : 0,
            height : 0,
            column : 0,
            row    : 0,
            gutter : 0,
            currentCategory : null
        };
    },
    
    _categoryColsLayout: function($elems) {
        var instance       = this,
            containerWidth = this.element.width(),
            opts           = this.options.categoryCols,
            sortBy         = this.options.sortBy,
            elemsGroup     = {},
            props          = this.categoryCols;
        
        // group item elements into categories based on their sorting data
        $elems.each(function() {
            var category = $.data(this, 'isotope-sort-data')[sortBy];
            elemsGroup[category] = elemsGroup[category] || [];
            elemsGroup[category].push(this);
        });
        
        var group, groupName, groupMaxRows, groupLen,
            gutterWidth = opts.gutterWidth[sortBy],
            x, y;
        // for each group...
        for (groupName in elemsGroup) {
            group = elemsGroup[groupName];
            groupLen = group.length;
            // make groups look nice, by limiting rows, makes for blockier blocks
            groupMaxRows = groupLen / Math.ceil(groupLen / opts.maxRows);
            
            $.each(group, function(i, elem) {
                x = props.column * opts.columnWidth + props.gutter * gutterWidth;
                y = (opts.maxRows - props.row - 1) * opts.rowHeight;
                instance._pushPosition($(elem), x, y);
                
                if (props.row >= groupMaxRows - 1) {
                    // start a new column
                    props.row = 0;
                    props.column++;
                } else {
                    props.row++;
                }
            });
            // start a new group
            if (props.row > 0) {
                props.row = 0;
                props.column++;
            }
            props.gutter++;
        }
        props.gutter--;
        props.width = props.column * opts.columnWidth + props.gutter * gutterWidth;
    },
    
    _categoryColsGetContainerSize: function() {
        opts = this.options.categoryCols;
        this.categoryCols.column++;
        return {
            width: this.categoryCols.width,
            height: opts.maxRows * opts.rowHeight
        };
    },
    
    _categoryColsResizeChanged: function() {
        return false;
    }

});
