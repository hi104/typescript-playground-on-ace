define('AutoCompleteView',  ['require', 'exports', 'module'], (require, exports, module) ->

    selectedClassName = 'ace_autocomplete_selected'

    #
    # TODO mouse scrool
    #
    class AutoCompleteView
        constructor:(@editor, @autoComplete) ->
            @init()

        init:()=>
            @wrap = document.createElement('div')
            @listElement = document.createElement('ul')
            @wrap.className = 'ace_autocomplete'
            @wrap.style.display = 'none'
            @listElement.style.listStyleType = 'none'
            @wrap.style.position = 'fixed' #TODO use position absolute for scroll
            @wrap.style.zIndex = '1000'
            @wrap.appendChild(@listElement)

        show:() ->
            @wrap.style.display = 'block'

        hide:() ->
            @wrap.style.display = 'none'

        #
        # TODO hardcode position value
        #
        setPosition:(coords) ->
            top = coords.pageY + 20
            editorBottom =  $(@editor.container).offset().top + $(@editor.container).height()
            bottom = top + $(@wrap).height()
            if(bottom < editorBottom)
                @wrap.style.top = top + 'px'
                @wrap.style.left = coords.pageX + 'px'
            else
                @wrap.style.top = (top - $(@wrap).height() - 20) + 'px'
                @wrap.style.left = coords.pageX + 'px'

        current:()->
            children = @listElement.childNodes
            for i, child of children
                if(child.className == selectedClassName)
                    return child
            null

        focusNext:()->
            curr = @current()
            focus = curr.nextSibling
            if(focus)
                curr.className = ''
                focus.className = selectedClassName
                @adjustPosition()

        focusPrev:()->
            curr = @current()
            focus = curr.previousSibling
            if(focus)
                curr.className = ''
                focus.className = selectedClassName
                @adjustPosition()

        ensureFocus:()->
            if(!@current())
                if(@listElement.firstChild)
                    @listElement.firstChild.className = selectedClassName
                    @adjustPosition()

        adjustPosition:()->
            elm = @current()
            if(elm)
                newMargin = ''
                wrapHeight = $(@wrap).height();
                elmOuterHeight = $(elm).outerHeight()
                preMargin = $(@listElement).css("margin-top").replace('px', '')
                preMargin = parseInt(preMargin)
                pos = $(elm).position()

                if(pos.top >= (wrapHeight - elmOuterHeight))
                    newMargin = (preMargin - elmOuterHeight) + 'px'
                    $(@listElement).css("margin-top", newMargin)

                if(pos.top < 0)
                    newMargin = (-pos.top + preMargin) + 'px'
                    $(@listElement).css("margin-top", newMargin)

    exports.AutoCompleteView = AutoCompleteView
    return exports
)
