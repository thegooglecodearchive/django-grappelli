// INLINE GROUP 

$.widget('ui.gInlineGroup', {
    _init: function(){
        var ui = this;
        ui.element.find('input[name*="DELETE"]').hide();
        if (ui.options.collapsibleGroups) {
            ui._makeCollapsibleGroups();
        }
        else {
            ui.element.filter('.collapse-closed')
                .removeClass('collapse-closed collapsed')
                .addClass('collapse-op');
        }

        // Prevent fields of inserted rows from triggering errors if un-edited
        ui.element.parents('form').bind('submit.gInlineGroup', function(){
            ui.element.find('.inline-related:not(.has_original):not(.has_modifications) div.order :text').val('');
        });
 
        /// ADD HANDLER
        ui.element.find('a.addhandler').bind('click.gInlineGroup', function(){
            var container = $(this).parents('div.inline-group');
            var lastitem  = container.find('div.inline-related:last');
            var newitem   = lastitem.clone(true).appendTo(container.find('div.items:first'));
            var count     = parseInt(container.find('div.inline-related').length, 10);
            var header    = newitem.find('h3:first');
            
            // update new item's header (inline-stacked only)
            if (header.get(0) && container.hasClass('inline-stacked')) {
                header.html("<b>" + $.trim(header.text()).replace(/(\d+)$/, count) + "</b>");
            }
            else {
                header.remove(); // fix layout bug in inline-tabular
            }
            
            /// set TOTAL_FORMS to number of items
            container.find('input[id*="TOTAL_FORMS"]').val(count);

            ui._initializeItem(newitem, count);

            return false;
        });
        
        /// DELETEHANDLER
        ui.element.find('a.deletelink').bind("click.gInlineGroup", function() {
            var cp = $(this).prev(':checkbox');
            cp.attr('checked', !cp.attr('checked'));
            $(this).parents('div.inline-related').toggleClass('predelete');
            return false;
        });

        // Autodiscover if sortable
        if (ui.element.find('.order').get(0)) {
            ui._makeSortable();
        }

        ui.element.find('.addhandler').bind('click.gInlineGroup', function(){
            ui._refreshOrder();
        });

        ui._refreshOrder();
    },

    _initializeItem: function(el, count){

        /// replace IDs, NAMEs, HREFs & FORs ...
        el.find(':input,span,table,iframe,label').each(function() {
            var $el = $(this);
            $.each(['id', 'name', 'for'], function(i, k){
                if ($el.attr(k)) {
                    $el.attr(k, $el.attr(k).replace(/-\d+-/g, '-'+  (count - 1) +'-'));
                }
            });
        });

        // Destroy and re-initialize datepicker (for some reason .datepicker('destroy') doesn't seem to work..)
        el.find('.vDateField').unbind().removeClass('hasDatepicker')
            .next().remove().end().end()
            .find('.vTimeField').unbind().next().remove().end().end()
            .find('.datetime').gDatetimeField();


       /// remove error-lists and error-classes
        el.find('ul.errorlist').remove().end()
          .find('.errors, .error').removeClass("errors error");

        /// tinymce
        el.find('span.mceEditor').each(function(e) {
            var id = this.id.split('_parent')[0];
            $(this).remove();
            el.find('#' + id).css('display', '');
            tinyMCE.execCommand("mceAddControl", true, id);
        });
        
        el.find(':input').val('').end() // clear all form-fields (within form-cells)
          .find("strong").text('');     // clear related/generic lookups

        // Little trick to prevent validation on un-edited fields
        el.find('input, textarea').bind('keypress.gInlineGroup', function(){
              el.addClass('has_modifications');
          }).end()
          .find('select, :radio, :checkbox').bind('keypress.gInlineGroup', function(){
              el.addClass('has_modifications');
          });

        return el;
    },

    // INLINE GROUPS (STACKED & TABULAR)
    _makeCollapsibleGroups: function() {
        var ui = this;
        ui.element.filter('.collapse-closed').addClass("collapsed").end()
            .find('h2:first-child').addClass("collapse-toggle")
            .bind("click.gInlineGroup", function(){
                $(this).parent()
                    .toggleClass('collapsed')
                    .toggleClass('collapse-closed')
                    .toggleClass('collapse-open');
                });
    },
    
    _makeSortable: function() {
        var ui   = this;
        var grip = $('<span class="ui-icon ui-icon-grip-dotted-vertical" />');
        //ui.element.find('.order').hide();
        if (ui.element.hasClass('inline-stacked')) {
            grip.prependTo(ui.element.find('.items .inline-related h3:first-child'));
        }
        else if (ui.element.hasClass('inline-tabular')) {
            grip.prependTo(ui.element.find('.items div.inline-item-tools'));
        }
        ui.element.find('.items')
            .sortable({
            axis: 'y',
            cursor: 'move',
            forcePlaceholderSize: true,
            helper: 'clone',
            opacity: 0.7,
            items: '.inline-related',
            appendTo: ui.element.find('.items'),
            update: function(e, inst){
                ui._refreshOrder();
            }
        });
        //
    },
    _refreshOrder: function() {
        var index = 1;
        var ui = this;
        ui.element.find('.order input[type=text]').each(function(){
            $(this).val(index);
            index++;
            
            if (!$(this).parents('.inline-related').hasClass('has_original')) {
                var tools = $(this).parents('.module').find('ul.inline-item-tools');
                if (tools.get(0)) {
                    if (!tools.find('.deletelink').get(0)) {
                        $('<li><a title="Delete Item" class="deletelink" href="#"/></li>').appendTo(tools)
                            .find('a').bind('click.grappelli', function(){
                                $(this).parents('.inline-related').remove();
                                return false;
                            });
                    }
                }
            }
        });
    }
});

$.ui.gInlineGroup.defaults = {
    collapsibleInlines: true,
    collapsibleGroups:  true,
};

// INLINE STACKED 

$.widget('ui.gInlineStacked', {
    _init: function(){
        var ui = this;

        if (ui.options.collapsible) {
            ui._makeCollapsible();
        }
        else {
            ui.element.find('.inline-related').removeClass("collapsed")
        }

        // FIELDSETS WITHIN STACKED INLINES
        /* OBSOLETE ?
        ui.element.find('.inline-related').find('fieldset[class*="collapse-closed"]')
            .addClass("collapsed").find('h4:first').addClass("collapse-toggle").end()
            .find('fieldset[class*="collapse-open"] h4:first').addClass("collapse-toggle")
            .bind("click", function(e){
                $(this).parent()
                    .toggleClass('collapsed')
                    .toggleClass('collapse-closed')
                    .toggleClass('collapse-open');
        });
        */
    },
    _makeCollapsible: function() {
        var ui = this;
        
        // BUTTONS (STACKED INLINE)
        ui.element.find('a.closehandler').bind("click", function(){
            $(this).parents('div.inline-stacked')
                .addClass('collapsed collapse-closed')
                .removeClass('collapse-open')
                .find('div.inline-related')
                    .removeClass('collapse-open')
                    .addClass('collapsed collapse-closed');
        });
        ui.element.find('a.openhandler').bind("click", function(){
            $(this).parents('div.inline-stacked')
                .removeClass('collapsed collapse-closed')
                .addClass('collapse-open')
                .find('div.inline-related')
                    .removeClass('collapsed collapse-closed')
                    .addClass('collapse-open');
        });
        
        /// OPEN STACKEDINLINE WITH ERRORS (onload)
        $('.inline-related:has(.errors)').removeClass('collapse-closed collapsed').addClass('collapse-open');

        ui.element.find('.inline-related')
            .addClass("collapsed")
            .find('h3:first-child')
                .addClass('collapse-toggle')
                .bind("click", function(){
                    var p = $(this).parent();
                    if (!p.hasClass('collapsed') && !p.hasClass('collapse-closed')) {
                        p.addClass('collapsed')
                         .addClass('collapse-closed')
                         .removeClass('collapse-open');
                    }
                    else {
                        p.removeClass('collapsed')
                         .removeClass('collapse-closed')
                         .addClass('collapse-open');
                    }
                });
    },
});
$.ui.gInlineStacked.defaults = {
    collapsible: true,
};

// INLINE TABULAR

$.widget('ui.gInlineTabular', {
    _init: function(){
        var ui = this;

        ui.element.find('.inline-related h3:first').remove(); // fix layout bug

        /// add predelete class (only necessary in case of errors)
        ui.element.find('input[name*="DELETE"]:checked').each(function(i) {
            $(this).parents('div.inline-related').addClass('predelete');
        });

        /// OPEN TABULARINLINE WITH ERRORS (onload)
        ui.element.filter('.inline-tabular').find('div[class*="error"]:first').each(function(i) {
            $(this).parents('div.inline-tabular').removeClass("collapsed");
        });
    },
});


